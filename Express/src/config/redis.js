require('dotenv').config();
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDISURL || 'redis://localhost:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('[Redis] Không thể kết nối sau 10 lần thử. Dừng reconnect.');
                return new Error('Redis max retries reached');
            }
            const delay = Math.min(retries * 500, 3000);
            console.log(`[Redis] Đang thử kết nối lại lần ${retries}... (sau ${delay}ms)`);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    if (!redisClient._errorLogged) {
        console.error('[Redis] Lỗi kết nối:', err.message);
        redisClient._errorLogged = true;
    }
});

redisClient.on('connect', () => {
    redisClient._errorLogged = false;
    console.log('[Redis] Kết nối thành công');
});

redisClient.on('reconnecting', () => {
    console.log('[Redis] Đang kết nối lại...');
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('[Redis] Không thể kết nối Redis:', err.message);
        console.error('[Redis] Vui lòng chạy: docker run -d --name redis-server -p 6379:6379 redis');
    }
})();

module.exports = redisClient;