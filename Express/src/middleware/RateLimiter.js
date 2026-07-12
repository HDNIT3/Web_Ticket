const redisClient = require('../config/redis');

const REGISTER_LIMIT = {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 15 * 60
};

const VERIFY_OTP_LIMIT = {
    MAX_ATTEMPTS: 10,
    WINDOW_SECONDS: 15 * 60
};

const LOGIN_LIMIT = {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 5 * 60
};

const FORGOT_PASSWORD_LIMIT = {
    MAX_ATTEMPTS: 5,
    WINDOW_SECONDS: 5 * 60
};

const createRateLimiter = (prefix, maxAttempts, windowSeconds, getIdentifier = null) => {
    return async (req, res, next) => {
        try {
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            const email = (req.body?.email || '').toLowerCase().trim();
            const identifier = getIdentifier ? getIdentifier(req) : `${ip}:${email}`;
            const key = `${prefix}:${identifier}`;

            const current = await redisClient.incr(key);

            if (current === 1) {
                await redisClient.expire(key, windowSeconds);
            }

            if (current > maxAttempts) {
                const ttl = await redisClient.ttl(key);
                return res.status(429).json({
                    success: false,
                    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
                    retryAfterSeconds: ttl > 0 ? ttl : windowSeconds
                });
            }

            res.setHeader('X-RateLimit-Limit', maxAttempts);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - current));
            next();
        } catch (error) {
            console.error('[RateLimiter] Redis error:', error.message);
            next();
        }
    };
};

const registerRateLimiter = createRateLimiter(
    'register',
    REGISTER_LIMIT.MAX_ATTEMPTS,
    REGISTER_LIMIT.WINDOW_SECONDS
);

const verifyOtpRateLimiter = createRateLimiter(
    'verify-otp',
    VERIFY_OTP_LIMIT.MAX_ATTEMPTS,
    VERIFY_OTP_LIMIT.WINDOW_SECONDS
);

const loginRateLimiter = createRateLimiter(
    'login',
    LOGIN_LIMIT.MAX_ATTEMPTS,
    LOGIN_LIMIT.WINDOW_SECONDS
);

const forgotPasswordRateLimiter = createRateLimiter(
    'forgot',
    FORGOT_PASSWORD_LIMIT.MAX_ATTEMPTS,
    FORGOT_PASSWORD_LIMIT.WINDOW_SECONDS
);

module.exports = { registerRateLimiter, verifyOtpRateLimiter, loginRateLimiter, forgotPasswordRateLimiter };