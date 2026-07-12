const AuthService = require('../services/AuthService');
const RegisterResponseDto = require('../dtos/response/RegisterResponseDto');
const VerifyOtpResponseDto = require('../dtos/response/VerifyOtpResponseDto');
const LoginResponseDto = require('../dtos/response/LoginResponseDto');
const ForgotPasswordResponseDto = require('../dtos/response/ForgotPasswordResponseDto');
const ResetPasswordResponseDto = require('../dtos/response/ResetPasswordResponseDto');
const Jwt = require('../services/JwtService');

const attachProfileUrl = (data) => {
    if (!data) {
        return data;
    }

    if (data.role == 'ADMIN') {
        data.url = '/admin/profile';
    }
    if (data.role == 'USER') {
        data.url = '/user/profile';
    }

    return data;
};

const AuthController = {
    register: async (req, res) => {
        try {
            await AuthService.register(req.dto);
            return res.status(201).json(RegisterResponseDto.ok());
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                RegisterResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    verifyOtp: async (req, res) => {
        try {
            await AuthService.verifyOtp(req.dto);
            return res.status(200).json(VerifyOtpResponseDto.ok());
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                VerifyOtpResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    resendOtp: async (req, res) => {
        try {
            await AuthService.resendOtp(req.dto);
            return res.status(200).json({ success: true, message: 'Mã OTP mới đã được gửi tới email của bạn.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Đã xảy ra lỗi.' });
        }
    },

    login: async (req, res) => {
        try {
            const { accessToken, refreshToken } = await AuthService.login(req.dto);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const data = await Jwt.verifyToken(accessToken);

            if (!data) {
                return res.status(401).json(LoginResponseDto.fail('Token không hợp lệ. Vui lòng đăng nhập lại.'));
            }

            attachProfileUrl(data);

            return res.status(200).json(LoginResponseDto.ok(data));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                LoginResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    refreshToken: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ success: false, message: 'Không tìm thấy refresh token. Vui lòng đăng nhập lại.' });
            }

            const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshToken);


            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const data = await Jwt.verifyToken(accessToken);

            if (!data) {
                return res.status(401).json(LoginResponseDto.fail('Token không hợp lệ. Vui lòng đăng nhập lại.'));
            }

            attachProfileUrl(data);

            return res.status(200).json(LoginResponseDto.ok(data));


        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
        }
    },

    session: async (req, res) => {
        try {
            const accessToken = req.cookies?.accessToken;
            const refreshToken = req.cookies?.refreshToken;

            if (accessToken) {
                const data = await Jwt.verifyToken(accessToken);
                if (data) {
                    return res.status(200).json(LoginResponseDto.ok(attachProfileUrl(data)));
                }
            }

            if (!refreshToken) {
                return res.status(401).json(LoginResponseDto.fail('Không tìm thấy phiên đăng nhập.'));
            }

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshToken);

            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const data = await Jwt.verifyToken(newAccessToken);
            if (!data) {
                return res.status(401).json(LoginResponseDto.fail('Token không hợp lệ. Vui lòng đăng nhập lại.'));
            }

            return res.status(200).json(LoginResponseDto.ok(attachProfileUrl(data)));
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
        }
    },

    logout: async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;

            await AuthService.logout(refreshToken);

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                expires: new Date(0)
            };

            res.clearCookie('accessToken', cookieOptions);
            res.clearCookie('refreshToken', cookieOptions);

            return res.status(200).json({ success: true, message: 'Đăng xuất thành công!' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.' });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            await AuthService.forgotPassword(req.dto);
            return res.status(200).json(ForgotPasswordResponseDto.ok());
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ForgotPasswordResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    resetPassword: async (req, res) => {
        try {
            await AuthService.resetPassword(req.dto);
            return res.status(200).json(ResetPasswordResponseDto.ok());
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                ResetPasswordResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },

    googleLogin: async (req, res) => {
        try {
            const { accessToken, refreshToken } = await AuthService.googleLogin(req.dto);

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 15 * 60 * 1000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const data = await Jwt.verifyToken(accessToken);

            if (!data) {
                return res.status(401).json(LoginResponseDto.fail('Token không hợp lệ. Vui lòng đăng nhập lại.'));
            }

            attachProfileUrl(data);

            return res.status(200).json(LoginResponseDto.ok(data));
        } catch (error) {
            return res.status(error.statusCode || 500).json(
                LoginResponseDto.fail(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
            );
        }
    },
};

module.exports = AuthController;