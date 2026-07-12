const ChatbotService = require('../services/ChatbotService');

const ChatbotController = {
    handleMessage: async (req, res) => {
        try {
            const { messages } = req.body;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu dữ liệu tin nhắn.',
                });
            }

            const sanitizedMessages = messages.map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: String(m.content || '').substring(0, 1000),
            }));

            const token = req.cookies?.accessToken;
            let currentUser = null;
            if (token) {
                try {
                    const Jwt = require('../services/JwtService');
                    const payload = Jwt.verifyToken(token);
                    if (payload) {
                        currentUser = { id: payload.id, role: payload.role };
                    }
                } catch (jwtErr) {
                    console.log('[ChatbotController] Optional JWT check failed:', jwtErr.message);
                }
            }

            const result = await ChatbotService.handleMessage(sanitizedMessages, currentUser);

            return res.status(200).json({
                success: true,
                message: 'Phản hồi chatbot thành công!',
                data: result,
            });
        } catch (error) {
            console.error('[ChatbotController] Lỗi:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi. Vui lòng thử lại.',
            });
        }
    },
};

module.exports = ChatbotController;
