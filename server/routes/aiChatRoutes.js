const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { chatWithAI, getChatHistory } = require('../controllers/aiChatController');

// Chat với AI (có auth - lưu lịch sử theo user)
router.post('/chat', auth, chatWithAI);

// Lấy lịch sử chat (cần auth)
router.get('/history', auth, getChatHistory);

// Chat không cần auth (cho khách - không lưu lịch sử)
router.post('/chat/guest', (req, res, next) => {
  // Không cần auth, nhưng vẫn gọi controller
  req.user = null;
  next();
}, chatWithAI);

module.exports = router;

