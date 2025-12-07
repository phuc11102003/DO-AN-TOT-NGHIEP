const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// 🎯 Lấy danh sách thông báo của user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
  }
});

// 🎯 Đánh dấu thông báo đã đọc
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }

    if (notification.user.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập thông báo này' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: 'Đã đánh dấu đã đọc', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Lỗi server khi đánh dấu đã đọc' });
  }
});

// 🎯 Đánh dấu tất cả thông báo đã đọc
router.patch('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo đã đọc' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Lỗi server khi đánh dấu tất cả đã đọc' });
  }
});

// 🎯 Lấy số lượng thông báo chưa đọc
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy số lượng thông báo' });
  }
});

module.exports = router;

