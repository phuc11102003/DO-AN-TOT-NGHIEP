import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api'; // Thêm import API

const Checkout = () => {
  const navigate = useNavigate();
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const user = JSON.parse(localStorage.getItem('user'));
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
    paymentMethod: 'cod'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm tạo mã đơn hàng ngẫu nhiên
  const generateOrderNumber = () => {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `DH${timestamp}${random}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      Swal.fire('Thông báo', 'Vui lòng đăng nhập để thanh toán!', 'warning');
      navigate('/login');
      return;
    }

    // Kiểm tra thông tin giao hàng
    if (!formData.fullName || !formData.phone || !formData.address) {
      Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin giao hàng!', 'error');
      return;
    }

    if (cartItems.length === 0) {
      Swal.fire('Lỗi', 'Giỏ hàng trống!', 'error');
      return;
    }

    setLoading(true);

    try {
      // Kiểm tra số lượng sản phẩm trước khi tạo đơn hàng
      for (const item of cartItems) {
        try {
          const response = await api.get(`/products/${item._id}`);
          const product = response.data;

          if (product.quantity < item.quantity) {
            Swal.fire({
              title: 'Không đủ hàng',
              text: `Sản phẩm "${item.title}" chỉ còn ${product.quantity} sản phẩm. Bạn đã chọn ${item.quantity} sản phẩm.`,
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            setLoading(false);
            return;
          }

          if (product.quantity === 0) {
            Swal.fire({
              title: 'Hết hàng',
              text: `Sản phẩm "${item.title}" đã hết hàng!`,
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            // Xóa sản phẩm hết hàng khỏi giỏ
            const updatedCart = cartItems.filter(i => i._id !== item._id);
            localStorage.setItem('cart', JSON.stringify(updatedCart));
            window.dispatchEvent(new Event('cartUpdated'));
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error checking product quantity:', error);
        }
      }

      // Tính toán tổng tiền
      const subTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const shippingFee = 0; // Có thể tính phí vận chuyển dựa trên địa chỉ
      const totalAmount = subTotal + shippingFee;

      // Tạo đơn hàng object
      const orderData = {
        orderNumber: generateOrderNumber(),
        customer: {
          userId: user._id,
          name: formData.fullName,
          email: user.email,
          phone: formData.phone
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          district: formData.district,
          ward: formData.ward
        },
        items: cartItems.map(item => ({
          product: item._id,
          title: item.title,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'paid',
        status: 'pending', // pending, confirmed, shipping, completed, cancelled
        subTotal: subTotal,
        shippingFee: shippingFee,
        totalAmount: totalAmount,
        note: formData.note
      };

      // Gửi request tạo đơn hàng đến backend
      const response = await api.post('/orders', orderData);

      // Xóa giỏ hàng
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));

      // Thông báo thành công
      Swal.fire({
        title: '🎉 Đặt hàng thành công!',
        html: `
          <div>
            <p>Cảm ơn bạn đã mua sắm tại cửa hàng chúng tôi!</p>
            <p><strong>Mã đơn hàng:</strong> ${response.data.order.orderNumber}</p>
            <p><strong>Tổng tiền:</strong> ${totalAmount.toLocaleString()} ₫</p>
            <p>Chúng tôi sẽ liên hệ với bạn sớm để xác nhận đơn hàng.</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Theo dõi đơn hàng'
      }).then(() => {
        navigate('/orders'); // Chuyển hướng đến trang đơn hàng của user
      });

    } catch (error) {
      console.error('❌ Lỗi khi tạo đơn hàng:', error);
      
      let errorMessage = 'Không thể đặt hàng. Vui lòng thử lại!';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Vui lòng đăng nhập lại!';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }

      Swal.fire({
        title: 'Lỗi!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          🛒 Không có sản phẩm để thanh toán
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Quay lại mua sắm
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        💳 Thanh toán
      </Typography>

      {!user && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vui lòng đăng nhập để thanh toán!
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Thông tin giao hàng */}
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                📦 Thông tin giao hàng
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Họ và tên *"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số điện thoại *"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Địa chỉ *"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    placeholder="Số nhà, tên đường, phường/xã..."
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Thành phố/Tỉnh"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Hà Nội, TP.HCM..."
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Quận/Huyện"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Quận 1, Cầu Giấy..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phường/Xã"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú đơn hàng"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder="Ghi chú về đơn hàng, thời gian giao hàng..."
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Phương thức thanh toán */}
            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h5" gutterBottom>
                💰 Phương thức thanh toán
              </Typography>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body1" fontWeight="bold" gutterBottom>
                  💵 Thanh toán khi nhận hàng (COD)
                </Typography>
                <Typography variant="body2">
                  Bạn sẽ thanh toán khi nhận được hàng. Không cần chuyển khoản trước.
                </Typography>
              </Alert>
            </Paper>
          </Grid>

          {/* Đơn hàng */}
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 100 }}>
              <Typography variant="h5" gutterBottom>
                🛍️ Đơn hàng của bạn
              </Typography>

              <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                {cartItems.map((item) => (
                  <Card key={item._id} sx={{ mb: 2, p: 1 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={3}>
                        <CardMedia
                          component="img"
                          height="60"
                          image={`http://localhost:5000/uploads/${item.image}`}
                          alt={item.title}
                          sx={{ objectFit: 'cover', borderRadius: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <CardContent sx={{ p: 1 }}>
                          <Typography variant="body2" noWrap fontWeight="medium">
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Số lượng: {item.quantity}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.price.toLocaleString()} ₫
                          </Typography>
                        </CardContent>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" fontWeight="bold" textAlign="right">
                          {(item.price * item.quantity).toLocaleString()} ₫
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tạm tính:</Typography>
                <Typography>{totalAmount.toLocaleString()} ₫</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Phí vận chuyển:</Typography>
                <Typography>0 ₫</Typography>
              </Box>

              {formData.paymentMethod === 'cod' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Phí thu hộ (COD):</Typography>
                  <Typography>0 ₫</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6" color="primary">
                  {totalAmount.toLocaleString()} ₫
                </Typography>
              </Box>

              <Button 
                type="submit"
                variant="contained" 
                fullWidth 
                size="large"
                disabled={loading || !user}
                sx={{ mt: 2 }}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Đang xử lý...' : 'Đặt hàng'}
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Bằng cách đặt hàng, bạn đồng ý với Điều khoản dịch vụ của chúng tôi
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default Checkout;