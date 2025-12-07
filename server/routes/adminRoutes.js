// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order'); // THÊM IMPORT ORDER
const Exchange = require('../models/Exchange');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { createNotification } = require('../utils/notificationHelper');

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, WebP)'));
    }
  }
});

// ==================== DASHBOARD ROUTES ====================

// 📊 Lấy thống kê tổng quan
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments(); // THÊM THỐNG KÊ ORDER
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    // Thống kê order theo trạng thái
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    
    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      activeUsers,
      adminUsers,
      inactiveUsers: totalUsers - activeUsers,
      pendingOrders,
      completedOrders
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê' });
  }
});

// ==================== ORDER ROUTES ====================

// 📦 LẤY DANH SÁCH ĐƠN HÀNG
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Xây dựng query
    let query = {};
    
    // Tìm kiếm theo mã đơn hàng, tên KH, email, phone
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo trạng thái
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customer.userId', 'name email')
      .populate('items.product', 'title image price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy danh sách đơn hàng' 
    });
  }
});

// 📦 LẤY THỐNG KÊ ĐƠN HÀNG
router.get('/orders/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
    const shippingOrders = await Order.countDocuments({ status: 'shipping' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // Tính tổng doanh thu từ các đơn hàng đã hoàn thành
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipping: shippingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('❌ Get order stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê đơn hàng' 
    });
  }
});

// 📦 LẤY CHI TIẾT ĐƠN HÀNG
router.get('/orders/:id', auth, adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer.userId', 'name email phone')
      .populate('items.product', 'title image price category');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Đơn hàng không tồn tại' 
      });
    }

    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('❌ Get order detail error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin đơn hàng' 
    });
  }
});

// 📦 CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
router.patch('/orders/:id/status', auth, adminAuth, async (req, res) => {
  try {
    
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng cung cấp trạng thái mới' 
      });
    }

    const validStatuses = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Trạng thái không hợp lệ' 
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Đơn hàng không tồn tại' 
      });
    }

    // Populate order để lấy thông tin đầy đủ
    await order.populate('customer.userId', 'name email');
    await order.populate('items.product', 'title image price seller');

    // Cập nhật trạng thái và thời gian nếu cần
    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      
      // Tăng purchaseCount cho các sản phẩm trong đơn hàng
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { purchaseCount: item.quantity || 1 } }
          );
        }
      }
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date();
      
      // Hoàn trả số lượng sản phẩm nếu hủy đơn
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity || 1 } }
          );
        }
      }
    } else if (status === 'confirmed') {
      // Khi admin xác nhận đơn hàng
      // Tạo thông báo cho người đặt đơn
      await createNotification(
        order.customer.userId._id || order.customer.userId,
        'order_confirmed',
        'Đơn hàng đã được xác nhận',
        `Đơn hàng #${order.orderNumber} đã được xác nhận và đang giao đến tay bạn.`,
        order._id,
        'order'
      );

      // Tạo thông báo cho người đăng sản phẩm (cho mỗi sản phẩm trong đơn)
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const product = await Product.findById(item.product).populate('seller', 'name email');
          if (product && product.seller) {
            // Đánh dấu sản phẩm là pending_deletion nếu số lượng = 0
            if (product.quantity === 0) {
              await Product.findByIdAndUpdate(item.product, {
                status: 'pending_deletion'
              });
            }

            await createNotification(
              product.seller._id || product.seller,
              'product_sold',
              'Sản phẩm đã được bán',
              `Sản phẩm "${product.title}" của bạn đã được bán. Bạn có muốn xóa sản phẩm này không?`,
              product._id,
              'product'
            );
          }
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('customer.userId', 'name email')
    .populate('items.product', 'title image price');

    
    res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order: updatedOrder
    });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật trạng thái đơn hàng' 
    });
  }
});

// ==================== PRODUCT ROUTES ====================

// 📦 LẤY THỐNG KÊ SẢN PHẨM
router.get('/products/stats', auth, adminAuth, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const pendingProducts = await Product.countDocuments({ status: 'pending' });
    const approvedProducts = await Product.countDocuments({ status: 'approved' });
    const rejectedProducts = await Product.countDocuments({ status: 'rejected' });

    res.json({
      totalProducts,
      pendingProducts,
      approvedProducts,
      rejectedProducts
    });
  } catch (error) {
    console.error('❌ Get product stats error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê sản phẩm' });
  }
});

// 📦 LẤY DANH SÁCH SẢN PHẨM CHỜ DUYỆT
router.get('/products/pending', auth, adminAuth, async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = { status: 'pending' };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    
    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('❌ Get pending products error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm chờ duyệt' });
  }
});

// 📦 LẤY DANH SÁCH SẢN PHẨM (admin)
router.get('/products', auth, adminAuth, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });


    // Tính trạng thái đổi trả cho từng sản phẩm
    const productIds = products.map((p) => p._id);

    // Lấy các giao dịch đổi trả liên quan đến các sản phẩm này
    const exchanges = await Exchange.find({
      status: { $in: ['pending', 'accepted'] }, // chỉ quan tâm giao dịch còn hiệu lực / đã chấp nhận
      $or: [
        { fromProduct: { $in: productIds } },
        { toProduct: { $in: productIds } }
      ]
    }).select('fromProduct toProduct status');

    // Map productId -> exchangeStatus
    const exchangeStatusMap = new Map();

    exchanges.forEach((ex) => {
      ['fromProduct', 'toProduct'].forEach((field) => {
        const productId = ex[field]?.toString();
        if (!productId) return;

        const currentStatus = exchangeStatusMap.get(productId);

        // Nếu có pending thì ưu tiên "đang đổi trả"
        if (ex.status === 'pending') {
          exchangeStatusMap.set(productId, 'in_exchange'); // đang có giao dịch đổi trả
        } else if (!currentStatus) {
          // Nếu chưa có gì và là accepted thì đánh dấu "đã đổi trả"
          exchangeStatusMap.set(productId, 'exchanged');
        }
      });
    });

    const productsWithExchangeStatus = products.map((p) => {
      const status = exchangeStatusMap.get(p._id.toString()) || 'none';
      return {
        ...p.toObject(),
        exchangeStatus: status
      };
    });

    res.json(productsWithExchangeStatus);
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm' });
  }
});

// 📦 LẤY CHI TIẾT SẢN PHẨM (admin)
router.get('/products/:id', auth, adminAuth, async (req, res) => {
  try {
    
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name email');
    
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    res.json(product);
  } catch (error) {
    console.error('❌ Get product detail error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin sản phẩm' });
  }
});

// 📦 DUYỆT SẢN PHẨM
router.patch('/products/:id/approve', auth, adminAuth, async (req, res) => {
  try {
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Sản phẩm không ở trạng thái chờ duyệt' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user._id
      },
      { new: true }
    ).populate('seller', 'name email')
     .populate('approvedBy', 'name');

    
    // Tạo thông báo cho người bán
    await createNotification(
      updatedProduct.seller._id,
      'product_approved',
      'Sản phẩm đã được duyệt',
      `Sản phẩm "${updatedProduct.title}" của bạn đã được duyệt thành công và đã được hiển thị trên trang web.`,
      updatedProduct._id,
      'product'
    );
    
    res.json({ 
      message: 'Đã duyệt sản phẩm thành công',
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Approve product error:', error);
    res.status(500).json({ message: 'Lỗi khi duyệt sản phẩm' });
  }
});

// 📦 TỪ CHỐI SẢN PHẨM
router.patch('/products/:id/reject', auth, adminAuth, async (req, res) => {
  try {
    
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối' });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (product.status !== 'pending') {
      return res.status(400).json({ message: 'Sản phẩm không ở trạng thái chờ duyệt' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        approvedBy: req.user._id
      },
      { new: true }
    ).populate('seller', 'name email')
     .populate('approvedBy', 'name');

    
    // Tạo thông báo cho người bán
    await createNotification(
      updatedProduct.seller._id,
      'product_rejected',
      'Sản phẩm bị từ chối',
      `Sản phẩm "${updatedProduct.title}" của bạn đã bị từ chối. Lý do: ${rejectionReason.trim()}`,
      updatedProduct._id,
      'product'
    );
    
    res.json({ 
      message: 'Đã từ chối sản phẩm',
      product: updatedProduct
    });
  } catch (error) {
    console.error('❌ Reject product error:', error);
    res.status(500).json({ message: 'Lỗi khi từ chối sản phẩm' });
  }
});

// 📦 CẬP NHẬT SẢN PHẨM (admin)
router.put('/products/:id', auth, adminAuth, upload.single('image'), async (req, res) => {
  try {

    // Lấy dữ liệu từ form data
    const { title, description, price, category } = req.body;
    
    // Kiểm tra dữ liệu bắt buộc
    if (!title || !description || !price || !category) {
      return res.status(400).json({ 
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc' 
      });
    }

    // Tạo object update
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim()
    };

    // Nếu có ảnh mới, thêm vào update data
    if (req.file) {
      updateData.image = req.file.filename;
    }


    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    res.json({ 
      message: 'Cập nhật sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('❌ Update product error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Dữ liệu không hợp lệ',
        errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Sản phẩm đã tồn tại' });
    }
    
    res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm' });
  }
});

// 📦 XÓA SẢN PHẨM (admin)
router.delete('/products/:id', auth, adminAuth, async (req, res) => {
  try {
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // Xóa sản phẩm
    await Product.findByIdAndDelete(req.params.id);
    
    
    res.json({ 
      message: 'Đã xóa sản phẩm thành công',
      deletedProduct: {
        id: product._id,
        title: product.title
      }
    });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm' });
  }
});

// ==================== USER ROUTES ====================

// 👥 Lấy danh sách users với tìm kiếm và lọc
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    // Xây dựng query
    let query = {};
    
    // Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo role
    if (role) {
      query.role = role;
    }
    
    // Lọc theo trạng thái
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách users' });
  }
});

// 👤 Lấy chi tiết user
router.get('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Lấy thông tin sản phẩm của user
    const userProducts = await Product.find({ seller: req.params.id })
      .select('title price category createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user,
      products: userProducts,
      totalProducts: await Product.countDocuments({ seller: req.params.id })
    });
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin user' });
  }
});

// ➕ THÊM user mới (admin tạo user)
router.post('/users', auth, adminAuth, async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Tạo user mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      isActive: isActive !== undefined ? isActive : true
    });

    await newUser.save();

    // Trả về user không bao gồm password
    const userResponse = await User.findById(newUser._id).select('-password');
    
    res.status(201).json({
      message: 'Đã tạo user thành công',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo user' });
  }
});

// ✏️ CẬP NHẬT user
router.put('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    
    const updateData = { name, email, role, isActive };
    
    // Nếu có password mới, mã hóa nó
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ 
      message: 'Cập nhật user thành công', 
      user 
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    
    res.status(500).json({ message: 'Lỗi khi cập nhật user' });
  }
});

// 🗑️ XÓA user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    // Không cho xóa chính mình
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
    }

    // Xóa user và tất cả sản phẩm của user
    await User.findByIdAndDelete(req.params.id);
    await Product.deleteMany({ seller: req.params.id });

    res.json({ 
      message: 'Đã xóa user và tất cả sản phẩm liên quan',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Lỗi khi xóa user' });
  }
});

module.exports = router;