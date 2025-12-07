import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SwapHoriz as SwapHorizIcon,
  Notifications as NotificationsIcon,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      Swal.fire('Thông báo', 'Vui lòng đăng nhập để xem thông báo!', 'warning');
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=50');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Swal.fire('Lỗi!', 'Không thể tải thông báo!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
      Swal.fire('Thành công!', 'Đã đánh dấu tất cả thông báo đã đọc!', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Swal.fire('Lỗi!', 'Không thể đánh dấu tất cả đã đọc!', 'error');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate đến trang liên quan
    if (notification.relatedType === 'product' && notification.relatedId) {
      navigate(`/product/${notification.relatedId}`);
    } else if (notification.relatedType === 'exchange' && notification.relatedId) {
      navigate('/exchange');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'product_approved':
        return <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />;
      case 'product_rejected':
        return <CancelIcon color="error" sx={{ fontSize: 32 }} />;
      case 'exchange_request':
      case 'exchange_accepted':
      case 'exchange_rejected':
        return <SwapHorizIcon color="primary" sx={{ fontSize: 32 }} />;
      default:
        return <NotificationsIcon color="action" sx={{ fontSize: 32 }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'product_approved':
      case 'exchange_accepted':
        return 'success';
      case 'product_rejected':
      case 'exchange_rejected':
        return 'error';
      case 'exchange_request':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Thông báo
        </Typography>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<CheckCircleOutlineIcon />}
            onClick={handleMarkAllAsRead}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </Box>

      {unreadCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Bạn có {unreadCount} thông báo chưa đọc
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Không có thông báo
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderLeft: notification.isRead ? 'none' : '4px solid #1e88e5',
                backgroundColor: notification.isRead ? 'background.paper' : 'action.hover',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)'
                }
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={notification.isRead ? 'normal' : 'bold'}
                        sx={{ flexGrow: 1 }}
                      >
                        {notification.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={notification.type === 'product_approved' ? 'Đã duyệt' :
                                 notification.type === 'product_rejected' ? 'Từ chối' :
                                 notification.type === 'exchange_request' ? 'Yêu cầu trao đổi' :
                                 notification.type === 'exchange_accepted' ? 'Đã chấp nhận' :
                                 notification.type === 'exchange_rejected' ? 'Đã từ chối' : 'Thông báo'}
                          color={getNotificationColor(notification.type)}
                          size="small"
                        />
                        {!notification.isRead && (
                          <Chip label="Mới" color="primary" size="small" />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {notification.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(notification.createdAt)}
                      </Typography>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          sx={{ ml: 'auto' }}
                        >
                          <CheckCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Notifications;

