const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// 🎯 Lấy danh sách conversations của user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    // Tính unread count cho mỗi conversation
    const conversationsWithUnread = conversations.map(conv => {
      const unread = conv.unreadCount?.get(userId.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount: unread
      };
    });

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách cuộc trò chuyện' });
  }
});

// 🎯 Lấy hoặc tạo conversation giữa 2 users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Không thể tạo cuộc trò chuyện với chính mình' });
    }

    const conversation = await Conversation.findOrCreate(currentUserId, otherUserId);
    await conversation.populate('participants', 'name email');

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy cuộc trò chuyện' });
  }
});

// 🎯 Lấy messages của một conversation
router.get('/conversation/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    // Kiểm tra user có trong conversation không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Đánh dấu messages là đã đọc
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.json(messages.reverse()); // Đảo ngược để hiển thị từ cũ đến mới
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn' });
  }
});

// 🎯 Gửi message
router.post('/conversation/:conversationId/messages', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
    }

    // Kiểm tra user có trong conversation không
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(userId)) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    // Tạo message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'name email');

    // Cập nhật conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();

    // Tăng unread count cho người nhận
    const otherParticipant = conversation.participants.find(
      p => p.toString() !== userId
    );
    if (otherParticipant) {
      const currentUnread = conversation.unreadCount.get(otherParticipant.toString()) || 0;
      conversation.unreadCount.set(otherParticipant.toString(), currentUnread + 1);
    }

    await conversation.save();

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi tin nhắn' });
  }
});

// 🎯 Lấy số lượng tin nhắn chưa đọc
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.unreadCount?.get(userId.toString()) || 0;
    });

    res.json({ count: totalUnread });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy số lượng tin nhắn chưa đọc' });
  }
});

module.exports = router;

