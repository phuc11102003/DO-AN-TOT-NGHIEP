import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Badge,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';

const ProductExchange = () => {
  const [myProducts, setMyProducts] = useState([]);
  const [otherProducts, setOtherProducts] = useState([]);
  const [selectedMyProduct, setSelectedMyProduct] = useState(null);
  const [selectedOtherProduct, setSelectedOtherProduct] = useState(null);
  const [exchangeDialogOpen, setExchangeDialogOpen] = useState(false);
  const [exchangeStep, setExchangeStep] = useState(0);
  const [exchangeMessage, setExchangeMessage] = useState('');
  const [exchangeOffers, setExchangeOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchProducts();
    fetchExchangeOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!user || !token) {
        Swal.fire('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng trao đổi!', 'warning');
        navigate('/login');
        return;
      }

      // Lấy sản phẩm của tôi
      const myRes = await api.get('/products/mine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyProducts(myRes.data);

      // Lấy sản phẩm của người khác có thể trao đổi
      const othersRes = await api.get('/exchanges/available-products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOtherProducts(othersRes.data);

    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      Swal.fire('Lỗi!', 'Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeOffers = async () => {
    try {
      setOffersLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await api.get('/exchanges/my-offers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setExchangeOffers(response.data);
    } catch (error) {
      console.error('Lỗi khi tải đề xuất trao đổi:', error);
      Swal.fire('Lỗi!', 'Không thể tải danh sách đề xuất', 'error');
    } finally {
      setOffersLoading(false);
    }
  };

  const handleProductSelect = (product, isMyProduct = true) => {
    if (isMyProduct) {
      setSelectedMyProduct(product);
    } else {
      setSelectedOtherProduct(product);
    }
  };

  const handleOpenExchangeDialog = () => {
    if (!selectedMyProduct || !selectedOtherProduct) {
      Swal.fire('Thông báo', 'Vui lòng chọn cả sản phẩm của bạn và sản phẩm muốn trao đổi!', 'warning');
      return;
    }
    setExchangeDialogOpen(true);
    setExchangeStep(0);
    setExchangeMessage('');
  };

  const handleSendExchangeOffer = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!selectedMyProduct || !selectedOtherProduct) {
        Swal.fire('Lỗi!', 'Vui lòng chọn sản phẩm để trao đổi', 'error');
        return;
      }

      const exchangeData = {
        fromProductId: selectedMyProduct._id,
        toProductId: selectedOtherProduct._id,
        message: exchangeMessage || `Tôi muốn trao đổi "${selectedMyProduct.title}" lấy "${selectedOtherProduct.title}"`
      };

      // Gửi đề xuất trao đổi
      const response = await api.post('/exchanges/propose', exchangeData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Gửi tin nhắn thật cho người bán
      try {
        const otherSellerId = selectedOtherProduct.seller?._id || selectedOtherProduct.seller;
        
        // Tạo hoặc lấy conversation
        const conversationRes = await api.get(`/messages/conversation/${otherSellerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Gửi tin nhắn
        const messageContent = exchangeMessage || 
          `Xin chào! Tôi muốn trao đổi sản phẩm "${selectedMyProduct.title}" của tôi với sản phẩm "${selectedOtherProduct.title}" của bạn. Bạn có thể xem xét đề xuất trao đổi này không?`;

        await api.post(
          `/messages/conversation/${conversationRes.data._id}/messages`,
          { content: messageContent },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (msgError) {
        console.error('Lỗi khi gửi tin nhắn:', msgError);
        // Không hiển thị lỗi nếu chỉ là lỗi gửi tin nhắn, vì đề xuất đã thành công
      }

      Swal.fire({
        title: 'Thành công!',
        text: response.data.message + ' Tin nhắn đã được gửi cho người bán.',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      setExchangeDialogOpen(false);
      setSelectedMyProduct(null);
      setSelectedOtherProduct(null);
      setExchangeMessage('');
      
      // Cập nhật lại danh sách đề xuất
      fetchExchangeOffers();

    } catch (error) {
      console.error('Lỗi khi gửi đề xuất:', error);
      const errorMessage = error.response?.data?.message || 'Không thể gửi đề xuất trao đổi';
      Swal.fire('Lỗi!', errorMessage, 'error');
    }
  };

  const handleRespondToOffer = async (exchangeId, response, message = '') => {
    try {
      const token = localStorage.getItem('token');

      const responseData = await api.put(`/exchanges/${exchangeId}/respond`, {
        response,
        message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        title: 'Thành công!',
        text: responseData.data.message,
        icon: 'success',
        confirmButtonText: 'OK'
      });

      // Cập nhật lại danh sách
      fetchExchangeOffers();

    } catch (error) {
      console.error('Lỗi khi phản hồi đề xuất:', error);
      const errorMessage = error.response?.data?.message || 'Không thể phản hồi đề xuất';
      Swal.fire('Lỗi!', errorMessage, 'error');
    }
  };

  const calculateMatchScore = (product1, product2) => {
    const priceDiff = Math.abs(product1.price - product2.price);
    const maxPrice = Math.max(product1.price, product2.price);
    const priceScore = 100 - (priceDiff / maxPrice) * 100;
    
    const categoryScore = product1.category === product2.category ? 100 : 50;
    
    return Math.round((priceScore * 0.7 + categoryScore * 0.3) * 10) / 10;
  };

  const getRecommendedExchanges = () => {
    if (!selectedMyProduct) return [];

    return otherProducts
      .map(product => ({
        product,
        matchScore: calculateMatchScore(selectedMyProduct, product),
        priceDiff: product.price - selectedMyProduct.price
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  };

  // 🎯 THÊM COMPONENT EXCHANGE STEPPER Ở ĐÂY
  const ExchangeStepper = () => {
    const steps = [
      'Chọn sản phẩm trao đổi',
      'Xác nhận thông tin',
      'Gửi đề xuất'
    ];

    return (
      <Stepper activeStep={exchangeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    );
  };

  const ProductCard = ({ product, isMyProduct = false, matchScore, showMatch = false }) => {
    const isSelected = isMyProduct 
      ? selectedMyProduct?._id === product._id
      : selectedOtherProduct?._id === product._id;

    return (
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: isSelected ? 6 : 2,
          border: isSelected ? '2px solid #1e88e5' : '1px solid #e0e0e0',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => handleProductSelect(product, isMyProduct)}
      >
        {showMatch && matchScore && (
          <Chip
            label={`${matchScore}% khớp`}
            color={matchScore >= 80 ? 'success' : matchScore >= 60 ? 'warning' : 'error'}
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 2,
              fontWeight: 'bold'
            }}
          />
        )}

        <CardMedia
          component="img"
          height="160"
          image={`http://localhost:5000/uploads/${product.image}`}
          alt={product.title}
          sx={{ objectFit: 'cover' }}
        />

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {product.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {product.description}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" color="primary" fontWeight="bold">
              {product.price.toLocaleString()} ₫
            </Typography>
            <Chip
              label={product.category}
              size="small"
              variant="outlined"
              color="primary"
            />
          </Box>

          {product.seller && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {product.seller.name}
              </Typography>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant={isSelected ? "contained" : "outlined"}
            size="small"
            fullWidth
            startIcon={<SwapIcon />}
          >
            {isSelected ? 'Đã chọn' : 'Chọn trao đổi'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  const ExchangeOfferItem = ({ offer }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const isIncoming = offer.toUser._id === user._id;
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'accepted': return 'success';
        case 'rejected': return 'error';
        case 'pending': return 'warning';
        case 'cancelled': return 'default';
        default: return 'default';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'accepted': return 'Đã chấp nhận';
        case 'rejected': return 'Đã từ chối';
        case 'pending': return 'Đang chờ';
        case 'cancelled': return 'Đã hủy';
        default: return 'Không xác định';
      }
    };

    return (
      <ListItem
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 2,
          bgcolor: 'background.paper'
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <SwapIcon />
          </Avatar>
        </ListItemAvatar>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {offer.fromProduct.title}
              </Typography>
              <SwapIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight="bold">
                {offer.toProduct.title}
              </Typography>
              <Chip
                label={getStatusText(offer.status)}
                color={getStatusColor(offer.status)}
                size="small"
              />
              {isIncoming && offer.status === 'pending' && (
                <Chip label="Đề xuất mới" color="primary" variant="outlined" size="small" />
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {offer.message}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  Từ: {offer.fromUser.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Đến: {offer.toUser.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(offer.createdAt).toLocaleDateString('vi-VN')}
                </Typography>
              </Box>
              {offer.responseMessage && (
                <Typography variant="caption" color="text.secondary">
                  Phản hồi: {offer.responseMessage}
                </Typography>
              )}
            </Box>
          }
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {isIncoming && offer.status === 'pending' && (
            <>
              <IconButton 
                color="success" 
                size="small"
                onClick={() => handleRespondToOffer(offer._id, 'accepted', 'Tôi đồng ý trao đổi!')}
              >
                <ThumbUpIcon />
              </IconButton>
              <IconButton 
                color="error" 
                size="small"
                onClick={() => handleRespondToOffer(offer._id, 'rejected', 'Cảm ơn nhưng tôi không muốn trao đổi')}
              >
                <ThumbDownIcon />
              </IconButton>
            </>
          )}
          {offer.status === 'pending' && !isIncoming && (
            <Button 
              size="small" 
              color="error"
              onClick={() => handleRespondToOffer(offer._id, 'cancelled')}
            >
              Hủy
            </Button>
          )}
        </Box>
      </ListItem>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            fontWeight="bold"
            gutterBottom
            sx={{
              background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🔄 Trao Đổi Sản Phẩm
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
            Tìm sản phẩm phù hợp để trao đổi với cộng đồng
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={4}>
        {/* Sản phẩm của tôi */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              📦 Sản Phẩm Của Tôi
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Chọn sản phẩm bạn muốn trao đổi
            </Typography>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 1 }}>Đang tải sản phẩm...</Typography>
              </Box>
            ) : myProducts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Bạn chưa có sản phẩm nào để trao đổi
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {myProducts.map((product) => (
                  <Grid item xs={12} key={product._id}>
                    <ProductCard product={product} isMyProduct={true} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        {/* Khu vực trao đổi chính */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
              🔍 Sản Phẩm Trao Đổi
            </Typography>
            
            {selectedMyProduct ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Đề xuất trao đổi cho: <strong>{selectedMyProduct.title}</strong>
                </Typography>

                <Grid container spacing={2}>
                  {getRecommendedExchanges().map(({ product, matchScore }) => (
                    <Grid item xs={12} key={product._id}>
                      <ProductCard 
                        product={product} 
                        matchScore={matchScore}
                        showMatch={true}
                      />
                    </Grid>
                  ))}
                </Grid>

                {selectedMyProduct && selectedOtherProduct && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight="bold" gutterBottom>
                      🎉 Đã chọn 2 sản phẩm!
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<SwapIcon />}
                      onClick={handleOpenExchangeDialog}
                      sx={{
                        background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976d2, #0d47a1)',
                        }
                      }}
                    >
                      Đề Xuất Trao Đổi
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info">
                Vui lòng chọn sản phẩm của bạn để xem đề xuất trao đổi
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Lịch sử trao đổi */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Badge badgeContent={exchangeOffers.length} color="primary">
                <Typography variant="h5" fontWeight="bold" color="primary">
                  📋 Đề Xuất Trao Đổi
                </Typography>
              </Badge>
              {offersLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
            </Box>

            {exchangeOffers.length === 0 ? (
              <Alert severity="info">
                {offersLoading ? 'Đang tải...' : 'Chưa có đề xuất trao đổi nào'}
              </Alert>
            ) : (
              <List>
                {exchangeOffers.map((offer) => (
                  <ExchangeOfferItem key={offer._id} offer={offer} />
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog Trao Đổi */}
      <Dialog 
        open={exchangeDialogOpen} 
        onClose={() => setExchangeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" fontWeight="bold">
              🔄 Đề Xuất Trao Đổi
            </Typography>
            <IconButton onClick={() => setExchangeDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <ExchangeStepper />

          {exchangeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Xác nhận thông tin trao đổi
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Sản phẩm của bạn
                    </Typography>
                    <CardMedia
                      component="img"
                      height="120"
                      image={`http://localhost:5000/uploads/${selectedMyProduct?.image}`}
                      alt={selectedMyProduct?.title}
                      sx={{ objectFit: 'cover', mb: 1, borderRadius: 1 }}
                    />
                    <Typography variant="h6">{selectedMyProduct?.title}</Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {selectedMyProduct?.price.toLocaleString()} ₫
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Sản phẩm nhận về
                    </Typography>
                    <CardMedia
                      component="img"
                      height="120"
                      image={`http://localhost:5000/uploads/${selectedOtherProduct?.image}`}
                      alt={selectedOtherProduct?.title}
                      sx={{ objectFit: 'cover', mb: 1, borderRadius: 1 }}
                    />
                    <Typography variant="h6">{selectedOtherProduct?.title}</Typography>
                    <Typography variant="body1" color="primary" fontWeight="bold">
                      {selectedOtherProduct?.price.toLocaleString()} ₫
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  💡 <strong>Lưu ý:</strong> Người bán sẽ xem xét đề xuất của bạn và phản hồi trong thời gian sớm nhất.
                  Bạn có thể theo dõi trạng thái đề xuất trong mục "Đề Xuất Trao Đổi".
                </Typography>
              </Box>
            </Box>
          )}

          {exchangeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Nhắn tin cho người bán
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Lời nhắn trao đổi"
                value={exchangeMessage}
                onChange={(e) => setExchangeMessage(e.target.value)}
                placeholder="Xin chào, tôi muốn trao đổi sản phẩm này với bạn. Chúng ta có thể thỏa thuận thêm về điều kiện trao đổi không?"
                sx={{ mb: 2 }}
              />

              <Alert severity="info">
                Hãy viết lời nhắn thân thiện và rõ ràng để tăng khả năng được chấp nhận!
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2 }}>
          {exchangeStep > 0 && (
            <Button onClick={() => setExchangeStep(step => step - 1)}>
              Quay lại
            </Button>
          )}
          
          {exchangeStep < 1 ? (
            <Button 
              variant="contained" 
              onClick={() => setExchangeStep(step => step + 1)}
            >
              Tiếp theo
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleSendExchangeOffer}
              disabled={!exchangeMessage.trim()}
              startIcon={<SwapIcon />}
            >
              Gửi Đề Xuất
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductExchange;