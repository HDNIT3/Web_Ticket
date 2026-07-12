const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');

// POST /chatbot/message - Gửi tin nhắn tới chatbot AI
router.post('/message', ChatbotController.handleMessage);

module.exports = router;
