// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Không có token, truy cập bị từ chối' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Token không hợp lệ: thiếu user ID' 
      });
    }

    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Người dùng không tồn tại!' 
      });
    }
    
    if (user.isActive === false) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị vô hiệu hóa' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token không hợp lệ' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token đã hết hạn' 
      });
    }
    
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ 
      message: 'Xác thực thất bại!', 
      error: error.message 
    });
  }
};

module.exports = auth;