const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const authMiddleware = require('../middleware/auth');
const { addProduct, getAllProducts, getProductById, getMyProducts, confirmDeleteProduct } = require('../controllers/productController');

// 🟢 Route đăng sản phẩm
router.post('/add', authMiddleware, upload.single('image'), addProduct);
router.get('/mine', authMiddleware, getMyProducts);
// 🟢 Route lấy tất cả sản phẩm
router.get('/', getAllProducts);

// 🟢 Route xác nhận xóa sản phẩm (cho người đăng)
router.delete('/:id/confirm-delete', authMiddleware, confirmDeleteProduct);

// 🟢 Route lấy chi tiết sản phẩm theo ID
router.get('/:id', getProductById);



module.exports = router;
