const Jwt = require('../services/JwtService');

const jwtAuth = (req, res, next) => {
    const token = req.cookies?.accessToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy access token. Vui lòng đăng nhập lại.',
            data: null
        });
    }

    const payload = Jwt.verifyToken(token);
    if (!payload) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ. Vui lòng đăng nhập lại.',
            data: null
        });
    }

    req.user = { id: payload.id, role: payload.role };
    next();
};

module.exports = jwtAuth;