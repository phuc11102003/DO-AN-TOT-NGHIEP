// server/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// GET /api/reviews/product/:productId - Lấy reviews của sản phẩm
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ product: productId });

    // Tính rating trung bình
    const avgRating = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      averageRating: avgRating[0]?.avgRating || 0,
      totalReviews: avgRating[0]?.count || 0
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/reviews - Tạo review mới
router.post('/', auth, async (req, res) => {
  try {
    const { productId, orderId, rating, comment, images } = req.body;
    const userId = req.user.id;

    // Validation
    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating phải từ 1 đến 5' });
    }

    // Kiểm tra đã review chưa
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    // Kiểm tra xem user có mua sản phẩm này không (nếu có orderId)
    let isVerified = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        'customer.userId': userId,
        'items.product': productId,
        status: 'completed'
      });
      isVerified = !!order;
    }

    // Tạo review
    const review = new Review({
      product: productId,
      user: userId,
      order: orderId || null,
      rating,
      comment: comment || '',
      images: images || [],
      isVerified
    });

    await review.save();
    await review.populate('user', 'name email avatar');

    // Cập nhật rating trung bình của sản phẩm
    await updateProductRating(productId);

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// PUT /api/reviews/:id - Cập nhật review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review không tồn tại' });
    }

    // Kiểm tra quyền
    if (review.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa review này' });
    }

    // Cập nhật
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images) review.images = images;
    review.updatedAt = Date.now();

    await review.save();
    await review.populate('user', 'name email avatar');

    // Cập nhật rating trung bình
    await updateProductRating(review.product);

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// DELETE /api/reviews/:id - Xóa review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review không tồn tại' });
    }

    // Kiểm tra quyền (user chỉ xóa được review của mình, admin xóa được tất cả)
    if (review.user.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa review này' });
    }

    const productId = review.product;
    await review.deleteOne();

    // Cập nhật rating trung bình
    await updateProductRating(productId);

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/reviews/:id/helpful - Đánh dấu review hữu ích
router.post('/:id/helpful', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review không tồn tại' });
    }

    // Kiểm tra đã đánh dấu chưa
    const isHelpful = review.helpfulUsers.includes(userId);
    if (isHelpful) {
      // Bỏ đánh dấu
      review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId);
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      // Đánh dấu
      review.helpfulUsers.push(userId);
      review.helpful += 1;
    }

    await review.save();

    res.json({
      success: true,
      helpful: review.helpful,
      isHelpful: !isHelpful
    });
  } catch (error) {
    console.error('Toggle helpful error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Hàm cập nhật rating trung bình của sản phẩm
async function updateProductRating(productId) {
  try {
    const result = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(result[0].avgRating * 10) / 10, // Làm tròn 1 chữ số
        reviewCount: result[0].count
      });
    }
  } catch (error) {
    console.error('Update product rating error:', error);
  }
}

module.exports = router;

