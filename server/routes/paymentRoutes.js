// server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const vnpay = require('../utils/vnpay');
const Order = require('../models/Order');

// POST /api/payments/create - Tạo URL thanh toán VNPay
router.post('/create', auth, async (req, res) => {
  try {
    const { orderId, amount, orderDescription } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin đơn hàng'
      });
    }

    // Kiểm tra đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Đơn hàng không tồn tại'
      });
    }

    // Kiểm tra quyền (chỉ chủ đơn hàng mới được thanh toán)
    if (order.customer.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thanh toán đơn hàng này'
      });
    }

    // Kiểm tra đơn hàng đã thanh toán chưa
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Lấy IP address
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1';

    // Tạo URL thanh toán
    const paymentUrl = vnpay.createPaymentUrl({
      orderId: order.orderNumber || order._id.toString(),
      amount: amount || order.totalAmount,
      orderDescription: orderDescription || `Thanh toan don hang ${order.orderNumber}`,
      ipAddr: ipAddr.split(',')[0].trim()
    });

    res.json({
      success: true,
      paymentUrl
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thanh toán'
    });
  }
});

// GET /api/payments/return - Xử lý kết quả thanh toán từ VNPay
router.get('/return', async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    // Xác thực chữ ký
    const isValid = vnpay.verifyReturnUrl(vnp_Params);
    
    if (!isValid) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail?message=Invalid signature`);
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];
    const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

    // Tìm đơn hàng theo orderNumber hoặc _id
    let order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail?message=Order not found`);
    }

    // Kiểm tra response code
    // 00 = Thành công
    if (responseCode === '00') {
      // Cập nhật trạng thái thanh toán
      order.paymentStatus = 'paid';
      order.paymentMethod = 'vnpay';
      order.paymentTransactionNo = transactionNo;
      order.paidAt = new Date();
      await order.save();

      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`);
    } else {
      // Thanh toán thất bại
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail?orderId=${order._id}&code=${responseCode}`);
    }
  } catch (error) {
    console.error('Payment return error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/payment/fail?message=Server error`);
  }
});

// POST /api/payments/ipn - Webhook từ VNPay (IPN - Instant Payment Notification)
router.post('/ipn', async (req, res) => {
  try {
    const vnp_Params = req.query;
    
    // Xác thực chữ ký
    const isValid = vnpay.verifyReturnUrl(vnp_Params);
    
    if (!isValid) {
      return res.status(400).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];

    // Tìm đơn hàng
    let order = await Order.findOne({ orderNumber: orderId });
    if (!order) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      return res.status(404).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Kiểm tra đơn hàng đã được xử lý chưa
    if (order.paymentStatus === 'paid' && order.paymentTransactionNo === transactionNo) {
      return res.json({ RspCode: '00', Message: 'Order already processed' });
    }

    // Xử lý thanh toán thành công
    if (responseCode === '00') {
      order.paymentStatus = 'paid';
      order.paymentMethod = 'vnpay';
      order.paymentTransactionNo = transactionNo;
      order.paidAt = new Date();
      await order.save();

      return res.json({ RspCode: '00', Message: 'Success' });
    } else {
      return res.json({ RspCode: responseCode, Message: 'Payment failed' });
    }
  } catch (error) {
    console.error('IPN error:', error);
    return res.status(500).json({ RspCode: '99', Message: 'Server error' });
  }
});

module.exports = router;

