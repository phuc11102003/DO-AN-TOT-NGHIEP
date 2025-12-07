const Product = require('../models/Product');

// Thêm sản phẩm mới
exports.addProduct = async (req, res) => {
  try {
    const { title, description, price, quantity, category } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!image) {
      return res.status(400).json({ message: 'Vui lòng chọn hình ảnh!' });
    }

    const newProduct = new Product({
      title,
      description,
      price,
      quantity: quantity || 1,
      category,
      image,
      seller: req.user._id,
      status: 'pending'
    });

    await newProduct.save();
    
    res.status(201).json({ 
      message: 'Đăng sản phẩm thành công! Sản phẩm đang chờ duyệt.', 
      product: newProduct 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Lấy danh sách sản phẩm đã duyệt
exports.getAllProducts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { 
      status: { $in: ['approved'] },
      quantity: { $gt: 0 }
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('seller', 'name email');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Không thể lấy danh sách sản phẩm', error });
  }
};

// Lấy chi tiết sản phẩm
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};

// Lấy danh sách sản phẩm của người dùng hiện tại
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .populate('seller', 'name email');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải sản phẩm của bạn.' });
  }
};

// Xác nhận xóa sản phẩm (cho người đăng sản phẩm)
exports.confirmDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    if (product.seller.toString() !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này' });
    }

    if (product.status !== 'pending_deletion') {
      return res.status(400).json({ message: 'Sản phẩm này không ở trạng thái chờ xóa' });
    }

    await Product.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: 'Sản phẩm đã được xóa thành công' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
  }
};
