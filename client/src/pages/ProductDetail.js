import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import Messenger from '../components/Messenger';
import ReviewSection from '../components/ReviewSection';

import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Chip,
  Divider 
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import Swal from 'sweetalert2';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [sellerId, setSellerId] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        console.error(error);
        Swal.fire('Lỗi!', 'Không thể tải sản phẩm!', 'error');
        navigate('/');
      }
    };
    fetchProduct();
  }, [id, navigate]);

  // 🛒 Hàm thêm vào giỏ hàng
  const addToCart = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      Swal.fire({
        title: 'Thông báo',
        text: 'Vui lòng đăng nhập để thêm vào giỏ hàng!',
        icon: 'warning',
        confirmButtonText: 'Đăng nhập',
        cancelButtonText: 'Hủy',
        showCancelButton: true
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    // 🚨 KIỂM TRA: Sản phẩm còn hàng
    if (!product.quantity || product.quantity === 0) {
      Swal.fire({
        title: 'Hết hàng',
        text: 'Sản phẩm này đã hết hàng!',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
      // Kiểm tra số lượng tổng không vượt quá số lượng sản phẩm
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.quantity) {
        Swal.fire({
          title: 'Không đủ hàng',
          text: `Sản phẩm này chỉ còn ${product.quantity} sản phẩm!`,
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.push({ 
        ...product, 
        quantity: 1,
        availableQuantity: product.quantity,
        seller: product.seller || { name: 'Ẩn danh', email: '' }
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    Swal.fire({
      title: 'Thành công!',
      text: 'Đã thêm vào giỏ hàng!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6">Đang tải sản phẩm...</Typography>
      </Box>
    );
  }

  const imgURL = `http://localhost:5000/uploads/${product.image}`;

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Box sx={styles.content}>
          {/* Hình ảnh sản phẩm */}
          <Box sx={styles.imageBox}>
            <img 
              src={imgURL} 
              alt={product.title} 
              style={styles.image} 
            />
          </Box>

          {/* Thông tin sản phẩm */}
          <Box sx={styles.info}>
            <Chip 
              label={product.category} 
              color="primary" 
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="h4" gutterBottom fontWeight="bold">
              {product.title}
            </Typography>
            
            <Typography variant="h3" color="#e53935" fontWeight="bold" gutterBottom>
              {product.price.toLocaleString()} ₫
            </Typography>

            {/* Số lượng sản phẩm */}
            {product.quantity !== undefined && (
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'} 
                  color={product.quantity > 0 ? 'success' : 'error'} 
                  sx={{ fontSize: '1rem', py: 2.5, px: 1 }}
                />
              </Box>
            )}
            
            <Typography variant="body1" sx={styles.desc}>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Thông tin người bán */}
            <Box sx={styles.sellerInfo}>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Thông tin người bán
              </Typography>
              <Typography variant="body1">
                <strong>Tên:</strong> {product.seller?.name || 'Ẩn danh'}
              </Typography>
              <Typography variant="body1">
                <EmailIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 18 }} />
                <strong>Email:</strong> {product.seller?.email || 'Chưa cung cấp'}
              </Typography>
            </Box>

            {/* Nút hành động */}
            <Box sx={styles.actionButtons}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<ShoppingCartIcon />}
                onClick={addToCart}
                sx={{ flex: 1, mr: 2 }}
              >
                Thêm vào giỏ hàng
              </Button>
              
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<MessageIcon />}
                onClick={() => {
                  const user = JSON.parse(localStorage.getItem('user'));
                  if (!user) {
                    Swal.fire({
                      title: 'Thông báo',
                      text: 'Vui lòng đăng nhập để liên hệ người bán!',
                      icon: 'warning',
                      confirmButtonText: 'Đăng nhập',
                      cancelButtonText: 'Hủy',
                      showCancelButton: true
                    }).then((result) => {
                      if (result.isConfirmed) {
                        navigate('/login');
                      }
                    });
                    return;
                  }
                  if (product.seller?._id) {
                    setSellerId(product.seller._id);
                    setMessengerOpen(true);
                  }
                }}
                disabled={!product.seller?._id}
              >
                Liên hệ người bán
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Review Section */}
      {product && (
        <ReviewSection 
          productId={product._id} 
          user={JSON.parse(localStorage.getItem('user') || 'null')}
        />
      )}

      {/* Messenger */}
      {messengerOpen && (
        <Messenger
          open={messengerOpen}
          onClose={() => {
            setMessengerOpen(false);
            setSellerId(null);
          }}
          initialUserId={sellerId}
        />
      )}
    </Box>
  );
};

const styles = {
  container: { 
    padding: '20px',
    minHeight: '80vh'
  },
  paper: {
    borderRadius: '12px',
    overflow: 'hidden'
  },
  content: { 
    display: 'flex', 
    gap: '40px', 
    padding: '40px',
    flexWrap: 'wrap' 
  },
  imageBox: { 
    flex: 1, 
    minWidth: '300px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  image: { 
    width: '100%', 
    maxWidth: '500px',
    borderRadius: '12px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    objectFit: 'cover'
  },
  info: { 
    flex: 1, 
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  desc: { 
    marginTop: '15px',
    lineHeight: '1.6',
    fontSize: '1.1rem'
  },
  sellerInfo: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
    flexWrap: 'wrap'
  }
};

export default ProductDetail;