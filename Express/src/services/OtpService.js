const crypto = require('crypto');
const redisClient = require('../config/redis');

const OTP_TTL_SECONDS = 5 * 60;

const OtpService = {
    generateAndStore: async (email) => {
        const otp = crypto.randomInt(100000, 999999).toString();
        const key = `otp:register:${email}`;
        await redisClient.set(key, otp, { EX: OTP_TTL_SECONDS });
        return otp;
    },

    verify: async (email, otp) => {
        const key = `otp:register:${email}`;
        const stored = await redisClient.get(key);
        if (!stored) return false;
        return stored === otp.trim();
    },

    delete: async (email) => {
        const key = `otp:register:${email}`;
        await redisClient.del(key);
    },
    generateAndStoreReset: async (email) => {
        const otp = crypto.randomInt(100000, 999999).toString();
        const key = `otp:reset:${email}`;
        await redisClient.set(key, otp, { EX: OTP_TTL_SECONDS });
        return otp;
    },

    verifyReset: async (email, otp) => {
        const key = `otp:reset:${email}`;
        const stored = await redisClient.get(key);
        if (!stored) return false;
        return stored === otp.trim();
    },

    deleteReset: async (email) => {
        const key = `otp:reset:${email}`;
        await redisClient.del(key);
    }
};

module.exports = OtpService;