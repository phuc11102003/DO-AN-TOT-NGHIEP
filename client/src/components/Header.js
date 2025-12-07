import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Divider,
  Button,
  AppBar,
  Toolbar,
  Container,
  InputBase,
  alpha,
  styled,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ShoppingBag from '@mui/icons-material/ShoppingBag';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ExitToApp from '@mui/icons-material/ExitToApp';
import AddIcon from '@mui/icons-material/Add';
import Inventory from '@mui/icons-material/Inventory';
import Notifications from '@mui/icons-material/Notifications';
import Message from '@mui/icons-material/Message';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../services/api';
import Messenger from './Messenger';

// Styled components - ĐÃ SỬA LỖI ...
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(0.75, 1, 0.75, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    fontSize: '0.875rem',
  },
}));

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Effect để theo dõi thay đổi giỏ hàng
  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const total = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    };

    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  // Effect để lấy thông báo và tin nhắn
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchMessageCount();
      // Polling mỗi 30 giây để cập nhật thông báo và tin nhắn
      const interval = setInterval(() => {
        fetchNotifications();
        fetchMessageCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchMessageCount = async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setMessageCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      setNotifications(response.data.notifications || []);
      setNotificationCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleNotificationItemClick = async (notification) => {
    // Đánh dấu đã đọc
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        fetchNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate đến trang liên quan
    if (notification.relatedType === 'product' && notification.relatedId) {
      navigate(`/product/${notification.relatedId}`);
    } else if (notification.relatedType === 'exchange' && notification.relatedId) {
      navigate('/exchange');
    }

    handleNotificationClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'product_approved':
        return <CheckCircleIcon color="success" />;
      case 'product_rejected':
        return <CancelIcon color="error" />;
      case 'exchange_request':
      case 'exchange_accepted':
      case 'exchange_rejected':
        return <SwapHorizIcon color="primary" />;
      default:
        return <Notifications />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    setAnchorEl(null);
    navigate('/');
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  const menuId = 'primary-search-account-menu';
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      sx={{ mt: 1 }}
    >
      <MenuItem onClick={handleMenuClose}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
          <Avatar 
            sx={{ 
              bgcolor: '#1e88e5',
              width: 40,
              height: 40
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
        <AccountCircle sx={{ mr: 2 }} />
        Hồ sơ của tôi
      </MenuItem>
      
      <MenuItem onClick={() => { navigate('/my-products'); handleMenuClose(); }}>
        <Inventory sx={{ mr: 2 }} />
        Sản phẩm của tôi
      </MenuItem>
      
      <MenuItem onClick={() => { navigate('/my-orders'); handleMenuClose(); }}>
        <ShoppingBag sx={{ mr: 2 }} />
        Đơn hàng của tôi
      </MenuItem>
      
      <MenuItem onClick={() => { navigate('/add'); handleMenuClose(); }}>
        <AddIcon sx={{ mr: 2 }} />
        Đăng sản phẩm
      </MenuItem>
      
      <Divider />
      
      <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
        <ExitToApp sx={{ mr: 2 }} />
        Đăng xuất
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1e88e5', boxShadow: 3 }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ gap: { xs: 1, md: 1.5 }, py: 1, flexWrap: { xs: 'wrap', lg: 'nowrap' }, alignItems: 'center' }}>
          {/* Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 'fit-content'
            }}
            component={Link}
            to="/"
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              🛒 AUX
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, minWidth: { md: '200px', lg: '250px' }, maxWidth: { md: '250px', lg: '300px' } }}>
            <Search sx={{ width: '100%' }}>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
              />
            </Search>
          </Box>

          {/* Navigation Links - Desktop */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 0.5, alignItems: 'center', whiteSpace: 'nowrap' }}>
            <Button
              color="inherit"
              component={Link}
              to="/"
              sx={{
                fontWeight: isActiveLink('/') ? 'bold' : 'normal',
                fontSize: '0.813rem',
                px: 1,
                py: 0.5,
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Trang chủ
            </Button>
            {user && (
              <Button
                color="inherit"
                component={Link}
                to="/my-products"
                sx={{
                  fontWeight: isActiveLink('/my-products') ? 'bold' : 'normal',
                  fontSize: '0.813rem',
                  px: 1,
                  py: 0.5,
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Sản phẩm của tôi
              </Button>
            )}
            <Button
              color="inherit"
              component={Link}
              to="/"
              sx={{
                fontWeight: isActiveLink('/trending') ? 'bold' : 'normal',
                fontSize: '0.813rem',
                px: 1,
                py: 0.5,
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Sản phẩm Hot
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/exchange"
              sx={{
                fontWeight: isActiveLink('/exchange') ? 'bold' : 'normal',
                fontSize: '0.813rem',
                px: 1,
                py: 0.5,
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Trao đổi
            </Button>
            {user && (
              <Button
                color="inherit"
                component={Link}
                to="/add"
                startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
                sx={{
                  fontWeight: isActiveLink('/add') ? 'bold' : 'normal',
                  fontSize: '0.813rem',
                  px: 1,
                  py: 0.5,
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Đăng bán
              </Button>
            )}
          </Box>

          {/* Navigation Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            {/* Mobile Search Icon */}
            <IconButton 
              size="medium" 
              color="inherit"
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <SearchIcon />
            </IconButton>

            {/* Cart Icon */}
            <IconButton 
              size="large" 
              color="inherit"
              component={Link}
              to="/cart"
              sx={{
                position: 'relative',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {/* Notifications Icon */}
            {user && (
              <IconButton 
                size="large" 
                color="inherit"
                onClick={handleNotificationClick}
                sx={{
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            )}

            {/* Notification Menu */}
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationClose}
              PaperProps={{
                sx: {
                  width: 400,
                  maxHeight: 500,
                  mt: 1.5
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="bold">
                  Thông báo
                </Typography>
              </Box>
              {notifications.length === 0 ? (
                <MenuItem disabled>
                  <Typography color="text.secondary">Không có thông báo mới</Typography>
                </MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem
                    key={notification._id}
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      borderLeft: notification.isRead ? 'none' : '3px solid #1e88e5'
                    }}
                  >
                    <ListItemIcon>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.title}
                      secondary={notification.message}
                      primaryTypographyProps={{
                        fontWeight: notification.isRead ? 'normal' : 'bold'
                      }}
                    />
                  </MenuItem>
                ))
              )}
              <Divider />
              <MenuItem onClick={() => { navigate('/notifications'); handleNotificationClose(); }}>
                <Typography color="primary" textAlign="center" sx={{ width: '100%' }}>
                  Xem tất cả thông báo
                </Typography>
              </MenuItem>
            </Menu>

            {/* Messages Icon */}
            {user && (
              <IconButton 
                size="large" 
                color="inherit"
                onClick={() => setMessengerOpen(true)}
                sx={{
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <Badge badgeContent={messageCount} color="error">
                  <Message />
                </Badge>
              </IconButton>
            )}

            {user ? (
              <>
                {/* User Avatar & Menu */}
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={menuId}
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                  sx={{
                    ml: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: '#1565c0',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              /* Login/Register Buttons */
              <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                <Button
                  color="inherit"
                  component={Link}
                  to="/login"
                  sx={{
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  to="/register"
                  sx={{
                    backgroundColor: '#ffd54f',
                    color: '#1e88e5',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#ffca28'
                    }
                  }}
                >
                  Đăng ký
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* User Menu */}
      {renderMenu}

      {/* Messenger */}
      {messengerOpen && (
        <Messenger
          open={messengerOpen}
          onClose={() => setMessengerOpen(false)}
        />
      )}
    </AppBar>
  );
};

export default Header;