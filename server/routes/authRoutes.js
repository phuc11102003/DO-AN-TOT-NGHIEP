// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email không tồn tại' });
    }

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo JWT token - DÙNG 'id' NHƯ FILE CŨ
    const token = jwt.sign(
      { 
        id: user._id,  // 👈 QUAN TRỌNG: Dùng 'id' không phải 'userId'
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự!' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ!' });
    }

    // Kiểm tra email đã tồn tại
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới
    user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    // Gửi email chào mừng
    sendEmail(user.email, 'welcome', [user.name]).catch(err => {
      console.error('Lỗi gửi email chào mừng:', err);
    });

    // Tạo token cho register - CŨNG DÙNG 'id'
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    
    res.status(500).json({ 
      message: 'Lỗi server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT /api/auth/profile - Cập nhật profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      city,
      district,
      ward,
      bankAccount,
      bio
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (city) updateData.city = city.trim();
    if (district) updateData.district = district.trim();
    if (ward) updateData.ward = ward.trim();
    if (bankAccount) updateData.bankAccount = bankAccount;
    if (bio !== undefined) updateData.bio = bio.trim();
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({
      message: 'Cập nhật profile thành công',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Vui lòng nhập email' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return res.json({ 
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu' 
      });
    }

    // Tạo reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 giờ
    await user.save();

    // Gửi email reset password
    await sendEmail(user.email, 'resetPassword', [user.name, resetToken]);

    res.json({ 
      message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập token và mật khẩu mới' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const crypto = require('crypto');
    // Hash token để so sánh
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Cập nhật mật khẩu
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;