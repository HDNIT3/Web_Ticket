const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const redisClient = require('../config/redis');
const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const OtpService = require('./OtpService');
const EmailService = require('./EmailService');
const { generateAccessToken,
    generateRefreshToken,
    generateNewTokensFromRefreshToken, checkTokenRevoked } = require('./JwtService');
const user = require('../models/user');
const PENDING_TTL_SECONDS = 10 * 60;

const AuthService = {
    register: async (dto) => {
        const { email, password, username, firstName, lastName, phoneNumber } = dto;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            const err = new Error('Email đã được sử dụng.');
            err.statusCode = 409;
            throw err;
        }

        if (username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                const err = new Error('Username đã được sử dụng.');
                err.statusCode = 409;
                throw err;
            }
        }

        if (phoneNumber) {
            const existingPhone = await User.findOne({ phoneNumber });
            if (existingPhone) {
                const err = new Error('Số điện thoại đã được sử dụng.');
                err.statusCode = 409;
                throw err;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const otp = await OtpService.generateAndStore(email);

        const pendingKey = `pending:register:${email}`;
        const pendingData = JSON.stringify({ username, email, password: hashedPassword, firstName, lastName, phoneNumber });
        await redisClient.set(pendingKey, pendingData, { EX: PENDING_TTL_SECONDS });

        await EmailService.sendRegisterOtp(email, otp);
    },

    verifyOtp: async (dto) => {
        const { email, otp } = dto;

        const isValid = await OtpService.verify(email, otp);
        if (!isValid) {
            const err = new Error('OTP không hợp lệ hoặc đã hết hạn.');
            err.statusCode = 400;
            throw err;
        }

        const pendingKey = `pending:register:${email}`;
        const pendingRaw = await redisClient.get(pendingKey);
        if (!pendingRaw) {
            const err = new Error('Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.');
            err.statusCode = 404;
            throw err;
        }

        const pendingData = JSON.parse(pendingRaw);

        const userData = {
            email: pendingData.email,
            password: pendingData.password,
            role: 'USER',
            status: 'ACTIVE',
        };

        if (pendingData.username) userData.username = pendingData.username;
        if (pendingData.firstName) userData.firstName = pendingData.firstName;
        if (pendingData.lastName) userData.lastName = pendingData.lastName;
        if (pendingData.phoneNumber) userData.phoneNumber = pendingData.phoneNumber;

        await User.create(userData);

        await OtpService.delete(email);
        await redisClient.del(pendingKey);
    },

    resendOtp: async ({ email }) => {
        const pendingKey = `pending:register:${email}`;
        const pendingRaw = await redisClient.get(pendingKey);
        if (!pendingRaw) {
            const err = new Error('Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.');
            err.statusCode = 404;
            throw err;
        }

        const otp = await OtpService.generateAndStore(email);
        await EmailService.sendRegisterOtp(email, otp);
    },

    login: async (dto) => {
        const { email, password } = dto;
        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('Email hoặc mật khẩu không đúng.');
            err.statusCode = 401;
            throw err;
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            const err = new Error('Email hoặc mật khẩu không đúng.');
            err.statusCode = 401;
            throw err;
        }

        const accessToken = await generateAccessToken(user);

        console.log('Generated access token:', accessToken);

        const refreshToken = await generateRefreshToken(user);

        console.log('Generated refresh token:', refreshToken);

        await RefreshToken.create({ RefreshToken: refreshToken, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), revoked: false });
        console.log('Saved refresh token to database');

        // Cập nhật thời gian đăng nhập gần nhất (cho thống kê)
        await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

        return { accessToken: accessToken, refreshToken: refreshToken };
    },

    refreshToken: async (refreshToken) => {
        const isRevoked = await checkTokenRevoked(refreshToken);
        if (isRevoked) {
            const err = new Error('Refresh token không hợp lệ hoặc đã bị thu hồi. Vui lòng đăng nhập lại.');
            err.statusCode = 401;
            throw err;
        }


        await RefreshToken.findOneAndUpdate({ RefreshToken: refreshToken }, { revoked: true });

        const { accessToken, refreshToken: newRefreshToken } = await generateNewTokensFromRefreshToken(refreshToken);

        await RefreshToken.create({ RefreshToken: newRefreshToken, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), revoked: false });

        return { accessToken, refreshToken: newRefreshToken };

    },
    logout: async (refreshToken) => {
        if (refreshToken) {
            await RefreshToken.findOneAndUpdate({ RefreshToken: refreshToken }, { revoked: true });
        }
    },
    forgotPassword: async (dto) => {
        const { email } = dto;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return;
        }

        const otp = await OtpService.generateAndStoreReset(email);
        await EmailService.sendResetOtp(email, otp);
    },

    resetPassword: async (dto) => {
        const { email, otp, newPassword } = dto;

        const lockoutKey = `otp:reset:lockout:${email}`;
        const isLocked = await redisClient.get(lockoutKey);
        if (isLocked) {
            const err = new Error('Bạn đã nhập sai quá số lần quy định, Vui lòng đợi ít phút');
            err.statusCode = 429;
            throw err;
        }

        const isValid = await OtpService.verifyReset(email, otp);
        if (!isValid) {
            const failedKey = `otp:reset:failed:${email}`;
            const attempts = await redisClient.incr(failedKey);
            if (attempts === 1) {
                await redisClient.expire(failedKey, 600);
            }

            if (attempts >= 5) {
                await redisClient.set(lockoutKey, '1', { EX: 120 });
                await redisClient.del(failedKey);
                const err = new Error('Bạn đã nhập sai quá số lần quy định, Vui lòng đợi ít phút');
                err.statusCode = 429;
                throw err;
            }

            const err = new Error(`OTP không hợp lệ hoặc đã hết hạn. Bạn còn ${5 - attempts} lần thử.`);
            err.statusCode = 400;
            throw err;
        }

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            const err = new Error('OTP không hợp lệ hoặc đã hết hạn.');
            err.statusCode = 400;
            throw err;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.updateOne({ _id: existingUser._id }, { password: hashedPassword });
        await OtpService.deleteReset(email);

        const failedKey = `otp:reset:failed:${email}`;
        await redisClient.del(failedKey);
        await redisClient.del(lockoutKey);
    },

    googleLogin: async (dto) => {
        const { token } = dto;
        const googleClientId = process.env.GOOGLE_CLIENT_ID;

        if (!googleClientId) {
            const err = new Error('GOOGLE_CLIENT_ID chưa được cấu hình.');
            err.statusCode = 500;
            throw err;
        }

        const client = new OAuth2Client(googleClientId);
        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: googleClientId,
            });
            payload = ticket.getPayload();
        } catch (error) {
            const err = new Error('Token Google không hợp lệ hoặc đã hết hạn.');
            err.statusCode = 400;
            throw err;
        }

        if (!payload || !payload.email) {
            const err = new Error('Không thể lấy thông tin email từ Google.');
            err.statusCode = 400;
            throw err;
        }

        const email = payload.email.toLowerCase();
        let user = await User.findOne({ email });

        if (!user) {
            // Register a new user
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            // Ensure unique username
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            const userData = {
                email,
                username,
                firstName: payload.given_name || '',
                lastName: payload.family_name || '',
                image: payload.picture || '',
                role: 'USER',
                status: 'ACTIVE',
            };

            user = await User.create(userData);
        } else {
            // Update user state if active/pending
            let updateData = { lastLoginAt: new Date() };
            if (user.status === 'PENDING') {
                updateData.status = 'ACTIVE';
            }
            // Update photo if user has no photo
            if (!user.image && payload.picture) {
                updateData.image = payload.picture;
            }
            await User.updateOne({ _id: user._id }, updateData);
            // Fetch updated user
            user = await User.findById(user._id);
        }

        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        await RefreshToken.create({
            RefreshToken: refreshToken,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            revoked: false
        });

        return { accessToken, refreshToken };
    },
};

module.exports = AuthService;