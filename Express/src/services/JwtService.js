const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken');
const User = require('../models/user');

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            username: user.username || user.email,
            role: user.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: '15m'}
    );
}

const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email,
            username: user.username || user.email,
            role: user.role
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: '7d'}
    );
}

const generateNewTokensFromRefreshToken = async (refreshToken) => {
    const payload = verifyTokenRevoked(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (!payload) {
        throw new Error('Refresh token không hợp lệ.');
    }
    const user = await User.findById(payload.id);
    if (!user) {
        throw new Error('Người dùng không tồn tại.');
    }
    const accessToken = generateAccessToken(user);
    const refreshToken1 = generateRefreshToken(user);
    return { accessToken, refreshToken: refreshToken1 };
};

const verifyTokenRevoked = (token, secret) => {
    try {
        const decoded = jwt.verify(token, secret);
        return {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role
        };
    } catch (error) {
        return null;
     }
}

const verifyToken = (
    token,
    secret = process.env.ACCESS_TOKEN_SECRET
) => {
    try {

        const decoded = jwt.verify(token, secret);

        return {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role
        };

    } catch (error) {
        return null;
    }
};

const checkTokenRevoked = async (token) => {
    const storedToken = await RefreshToken.findOne({ RefreshToken: token });
    return !storedToken || storedToken.revoked || storedToken.expires < new Date();
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    checkTokenRevoked,
    generateNewTokensFromRefreshToken
};