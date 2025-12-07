const Notification = require('../models/Notification');

/**
 * Tạo thông báo cho người dùng
 * @param {String} userId - ID người dùng nhận thông báo
 * @param {String} type - Loại thông báo
 * @param {String} title - Tiêu đề thông báo
 * @param {String} message - Nội dung thông báo
 * @param {String} relatedId - ID đối tượng liên quan (product, exchange)
 * @param {String} relatedType - Loại đối tượng liên quan ('product' hoặc 'exchange')
 */
const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      relatedId,
      relatedType
    });

    await notification.save();
    console.log(`✅ Notification created for user ${userId}: ${title}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = { createNotification };

