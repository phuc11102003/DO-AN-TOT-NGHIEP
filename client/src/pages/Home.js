import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  Box,
  InputAdornment,
  MenuItem,
  Chip,
  IconButton,
  Pagination,
  Tabs,
  Tab,
  Rating,
  Fab,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  NewReleases as NewReleasesIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  Whatshot as WhatshotIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const productsPerPage = 12;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, search, category, priceRange, sortBy, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      Swal.fire('Lỗi!', 'Không thể tải danh sách sản phẩm', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // 🚨 QUAN TRỌNG: Lọc bỏ sản phẩm của chính mình và sản phẩm hết hàng
    if (currentUser) {
      filtered = filtered.filter(product => {
        // Kiểm tra cả seller là object và string ID
        const sellerId = product.seller?._id || product.seller;
        return sellerId !== currentUser._id;
      });
    }

    // Lọc bỏ sản phẩm hết hàng
    filtered = filtered.filter(product => {
      return product.quantity && product.quantity > 0;
    });

    // Lọc theo tab
    if (activeTab === 1) {
      // Sản phẩm mới nhất - sắp xếp theo thời gian đăng
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (activeTab === 2) {
      // Sản phẩm hot - dựa trên lượt mua và trao đổi
      filtered.sort((a, b) => {
        const scoreA = (a.purchaseCount || 0) + (a.exchangeCount || 0);
        const scoreB = (b.purchaseCount || 0) + (b.exchangeCount || 0);
        return scoreB - scoreA;
      });
      // Chỉ lấy top sản phẩm hot
      filtered = filtered.filter(p => {
        const score = (p.purchaseCount || 0) + (p.exchangeCount || 0);
        return score > 0;
      });
    }

    // Lọc theo search
    if (search) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Lọc theo category
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    // Lọc theo price range
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(p => {
        const price = p.discount ? p.price * (1 - p.discount / 100) : p.price;
        return price >= min && (!max || price <= max);
      });
    }

    // Sắp xếp (chỉ áp dụng khi không ở tab Mới nhất hoặc Hot)
    if (activeTab !== 1 && activeTab !== 2) {
      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        default: // newest
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, search, category, priceRange, sortBy, activeTab, currentUser]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  // 🛒 Hàm thêm vào giỏ hàng - ĐÃ SỬA
  const addToCart = (product) => {
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

    // 🚨 KIỂM TRA: Không cho mua sản phẩm của chính mình
    const sellerId = product.seller?._id || product.seller;
    if (sellerId === user._id) {
      Swal.fire({
        title: 'Không thể thêm',
        text: 'Bạn không thể mua sản phẩm của chính mình!',
        icon: 'error',
        confirmButtonText: 'OK'
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

  // 🎯 Hàm kiểm tra sản phẩm của bản thân
  const isMyProduct = (product) => {
    if (!currentUser) return false;
    const sellerId = product.seller?._id || product.seller;
    return sellerId === currentUser._id;
  };

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const shareProduct = (product) => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: `${window.location.origin}/product/${product._id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${product._id}`);
      Swal.fire('Đã copy!', 'Link sản phẩm đã được copy', 'success');
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const priceRanges = [
    { label: 'Dưới 500k', value: '0-500000' },
    { label: '500k - 1 triệu', value: '500000-1000000' },
    { label: '1 - 2 triệu', value: '1000000-2000000' },
    { label: '2 - 5 triệu', value: '2000000-5000000' },
    { label: 'Trên 5 triệu', value: '5000000-' },
  ];

  const sortOptions = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Giá thấp đến cao', value: 'price-low' },
    { label: 'Giá cao đến thấp', value: 'price-high' },
    { label: 'Đánh giá cao', value: 'rating' },
  ];

  const tabs = [
    { label: 'Tất cả', icon: <FilterListIcon /> },
    { label: 'Mới nhất', icon: <NewReleasesIcon /> },
    { label: 'Hot', icon: <WhatshotIcon /> },
  ];

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const getProductPrice = (product) => {
    if (product.discount) {
      const discountedPrice = product.price * (1 - product.discount / 100);
      return {
        original: product.price,
        discounted: discountedPrice,
        hasDiscount: true
      };
    }
    return {
      original: product.price,
      discounted: product.price,
      hasDiscount: false
    };
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* 🌄 Hero Banner - Giữ nguyên */}
      <Box
        sx={{
          height: { xs: '300px', md: '500px' },
          background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: { md: 'fixed' },
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography 
            variant={isMobile ? "h4" : "h2"} 
            fontWeight="bold" 
            gutterBottom
            sx={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            🛒 Trao Đổi Đồ Cũ
          </Typography>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ mb: 4, maxWidth: '600px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            Nền tảng mua bán đồ cũ uy tín - Tiết kiệm - Bảo vệ môi trường
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => navigate('/add')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 3
              }}
            >
              🚀 Đăng bán ngay
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="large"
              onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              🔍 Khám phá ngay
            </Button>
          </Box>
        </motion.div>

        {/* Stats */}
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            py: 3
          }}
        >
          <Container>
            <Grid container spacing={3} justifyContent="center">
              <Grid item>
                <Typography variant="h4" fontWeight="bold" align="center">
                  {products.length}+
                </Typography>
                <Typography variant="body2">Sản phẩm</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h4" fontWeight="bold" align="center">
                  {categories.length}+
                </Typography>
                <Typography variant="body2">Danh mục</Typography>
              </Grid>
              <Grid item>
                <Typography variant="h4" fontWeight="bold" align="center">
                  99%
                </Typography>
                <Typography variant="body2">Hài lòng</Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      <Container id="products-section" sx={{ py: 6 }}>
        {/* Search and Filter Section - Giữ nguyên */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box sx={{ mb: 6 }}>
            <Typography
              variant="h3"
              align="center"
              fontWeight="bold"
              gutterBottom
              color="primary"
              sx={{ mb: 4 }}
            >
              🛍️ Khám Phá Sản Phẩm
            </Typography>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons="auto"
              >
                {tabs.map((tab, index) => (
                  <Tab 
                    key={index}
                    label={tab.label} 
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{ fontSize: isMobile ? '0.8rem' : '1rem' }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Search and Filter Row - Giữ nguyên */}
            <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Danh mục"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white'
                    }
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Khoảng giá"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white'
                    }
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {priceRanges.map((range) => (
                    <MenuItem key={range.value} value={range.value}>
                      {range.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  select
                  label="Sắp xếp"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'white'
                    }
                  }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearch('');
                    setCategory('');
                    setPriceRange('');
                    setSortBy('newest');
                    setActiveTab(0);
                  }}
                  sx={{ 
                    borderRadius: 3, 
                    py: 1.5,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 }
                  }}
                >
                  Xóa lọc
                </Button>
              </Grid>
            </Grid>

            {/* Results Info */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                {currentUser && (
                  <Chip 
                    label="Đã ẩn sản phẩm của bạn" 
                    size="small" 
                    color="info" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>
              <Chip 
                label={`Trang ${currentPage} / ${totalPages}`} 
                variant="outlined" 
                color="primary" 
              />
            </Box>
          </Box>
        </motion.div>

        {/* Products Grid - ĐÃ SỬA */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <AnimatePresence>
            <Grid container spacing={3}>
              {currentProducts.length > 0 ? (
                currentProducts.map((product, index) => {
                  const priceInfo = getProductPrice(product);
                  const myProduct = isMyProduct(product);

                  return (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      md={4} 
                      lg={3} 
                      key={product._id}
                      sx={{ display: 'flex' }}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                        style={{ width: '100%', display: 'flex' }}
                      >
                        <Card
                          sx={{
                            borderRadius: 3,
                            boxShadow: 3,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: 6,
                            },
                            height: '580px', // Chiều cao cố định
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden', // Đổi từ 'visible' sang 'hidden'
                            // 🎨 Highlight sản phẩm của mình (nếu hiển thị)
                            border: myProduct ? '2px solid #ff9800' : 'none'
                          }}
                        >
                          {/* My Product Badge */}
                          {myProduct && (
                            <Chip
                              label="Sản phẩm của tôi"
                              color="warning"
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

                          {/* Favorite Button */}
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              '&:hover': {
                                backgroundColor: 'white'
                              },
                              zIndex: 2
                            }}
                            onClick={() => toggleFavorite(product._id)}
                          >
                            {favorites.has(product._id) ? (
                              <FavoriteIcon color="error" />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </IconButton>

                          {/* Share Button */}
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 48,
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              '&:hover': {
                                backgroundColor: 'white'
                              },
                              zIndex: 2
                            }}
                            onClick={() => shareProduct(product)}
                          >
                            <ShareIcon />
                          </IconButton>

                          {/* Discount Badge */}
                          {priceInfo.hasDiscount && (
                            <Chip
                              label={`-${product.discount}%`}
                              color="error"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: myProduct ? 40 : 8,
                                left: 8,
                                zIndex: 2,
                                fontWeight: 'bold'
                              }}
                            />
                          )}

                          <Box
                            sx={{
                              width: '100%',
                              height: '200px', // Chiều cao cố định
                              overflow: 'hidden',
                              flexShrink: 0
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={`http://localhost:5000/uploads/${product.image}`}
                              alt={product.title}
                              sx={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', // Cover để fill đầy
                                objectPosition: 'center', // Căn giữa
                                cursor: 'pointer'
                              }}
                              onClick={() => navigate(`/product/${product._id}`)}
                            />
                          </Box>

                          <CardContent 
                            sx={{ 
                              flexGrow: 1, 
                              p: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              minHeight: '280px',
                              maxHeight: '280px',
                              overflow: 'hidden'
                            }}
                          >
                            <Typography 
                              variant="h6" 
                              fontWeight="bold" 
                              sx={{ 
                                mb: 1,
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main' },
                                height: '3.5em', // Chiều cao cố định
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                lineHeight: '1.75em',
                                flexShrink: 0
                              }}
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
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
                                overflow: 'hidden',
                                height: '2.5em', // Chiều cao cố định
                                lineHeight: '1.25em',
                                flexShrink: 0
                              }}
                            >
                              {product.description}
                            </Typography>

                            {/* Rating */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Rating 
                                value={product.rating || 0} 
                                readOnly 
                                size="small" 
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                ({product.reviewCount || 0})
                              </Typography>
                            </Box>

                            {/* Price */}
                            <Box sx={{ mb: 1 }}>
                              {priceInfo.hasDiscount ? (
                                <>
                                  <Typography 
                                    variant="h6" 
                                    color="primary" 
                                    fontWeight="bold"
                                    sx={{ display: 'inline', mr: 1 }}
                                  >
                                    {priceInfo.discounted.toLocaleString()} ₫
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'inline',
                                      textDecoration: 'line-through'
                                    }}
                                  >
                                    {priceInfo.original.toLocaleString()} ₫
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="h6" color="primary" fontWeight="bold">
                                  {priceInfo.original.toLocaleString()} ₫
                                </Typography>
                              )}
                            </Box>

                            {/* Category, Quantity and Seller Info */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip
                                  label={product.category}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                                {product.quantity !== undefined && (
                                  <Chip
                                    label={product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}
                                    size="small"
                                    color={product.quantity > 0 ? 'success' : 'error'}
                                  />
                                )}
                              </Box>
                              {product.seller && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {product.seller.name}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>

                          <CardActions 
                            sx={{ 
                              p: 2, 
                              pt: 0,
                              height: '60px', // Chiều cao cố định
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Button
                              variant="outlined"
                              size="small"
                              fullWidth
                              onClick={() => navigate(`/product/${product._id}`)}
                              sx={{ mr: 1, borderRadius: 2 }}
                            >
                              Chi tiết
                            </Button>
                            
                            {/* 🚨 QUAN TRỌNG: Ẩn nút "Thêm giỏ" nếu là sản phẩm của mình */}
                            {!myProduct ? (
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                onClick={() => addToCart(product)}
                                sx={{ 
                                  borderRadius: 2,
                                  background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #1976d2, #0d47a1)',
                                  }
                                }}
                              >
                                Thêm giỏ
                              </Button>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                disabled
                                sx={{ borderRadius: 2 }}
                              >
                                Sản phẩm của tôi
                              </Button>
                            )}
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })
              ) : (
                <Grid item xs={12}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      textAlign: 'center',
                      '& .MuiAlert-message': { width: '100%' }
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {currentUser ? '🎉 Bạn đã xem hết sản phẩm!' : '😢 Không tìm thấy sản phẩm nào'}
                    </Typography>
                    <Typography variant="body2">
                      {currentUser 
                        ? 'Tất cả sản phẩm hiển thị đều từ người dùng khác. Hãy đăng sản phẩm mới!'
                        : 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm'
                      }
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => setCurrentPage(page)}
                  color="primary"
                  size={isMobile ? "small" : "large"}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </AnimatePresence>
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add product"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
        }}
        onClick={() => navigate('/add')}
      >
        <TrendingUpIcon />
      </Fab>
    </Box>
  );
};

export default Home;