// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/emailService');

// Tạo mã đơn hàng ngẫu nhiên
const generateOrderNumber = () => {
  const timestamp = new Date().getTime().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `DH${timestamp}${random}`;
};

// 🟢 Tạo đơn hàng mới
exports.createOrder = async (req, res) => {
  try {
    const {
      customer,
      shippingAddress,
      items,
      paymentMethod,
      note,
      subTotal,
      shippingFee,
      totalAmount
    } = req.body;

    // Kiểm tra số lượng sản phẩm và trừ số lượng
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm ${item.title} không tồn tại`
        });
      }

      // Kiểm tra số lượng còn lại
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.title}" chỉ còn ${product.quantity} sản phẩm. Bạn đã chọn ${item.quantity} sản phẩm.`
        });
      }

      // Kiểm tra sản phẩm còn hàng
      if (product.quantity === 0) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.title}" đã hết hàng`
        });
      }
    }

    const orderData = {
      orderNumber: generateOrderNumber(),
      customer: {
        userId: req.user._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      shippingAddress,
      items,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      note,
      subTotal,
      shippingFee,
      totalAmount
    };

    const order = new Order(orderData);
    await order.save();

    // Trừ số lượng sản phẩm và tăng purchaseCount trong một lần update
    for (let item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: { 
            quantity: -item.quantity,
            purchaseCount: item.quantity
          }
        },
        { new: true }
      );
    }

    // Populate thông tin sản phẩm
    await order.populate('items.product', 'title image price');

    // Gửi email xác nhận đơn hàng
    sendEmail(
      customer.email,
      'orderConfirmation',
      [
        customer.name,
        order.orderNumber,
        {
          items: items.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: totalAmount
        }
      ]
    ).catch(err => {
      console.error('Lỗi gửi email xác nhận đơn hàng:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Đơn hàng đã được tạo thành công',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đơn hàng',
      error: error.message
    });
  }
};

// 🟢 Lấy đơn hàng của user
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 'customer.userId': req.user._id })
      .populate('items.product', 'title image price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng'
    });
  }
};

// 🟢 Lấy chi tiết đơn hàng
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'title image price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền truy cập (user chỉ xem được đơn hàng của mình, admin xem được tất cả)
    if (req.user.role !== 'admin' && order.customer.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập đơn hàng này'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đơn hàng'
    });
  }
};