import React, { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  People,
  Store,
  TrendingUp,
  Block,
  ShoppingCart,
  AttachMoney,
  PendingActions,
  CheckCircle
} from '@mui/icons-material';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [orderStats, setOrderStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, orderStatsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/orders/stats')
        ]);
        setStats(statsRes.data);
        setOrderStats(orderStatsRes.data?.stats || orderStatsRes.data || {});
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
      </Box>
    );
  }

  const statCards = [
    { 
      title: 'Tổng Users', 
      value: stats.totalUsers || 0, 
      icon: <People />, 
      color: '#1976d2',
      subtitle: `${stats.activeUsers || 0} đang hoạt động`
    },
    { 
      title: 'Tổng Sản phẩm', 
      value: stats.totalProducts || 0, 
      icon: <Store />, 
      color: '#2e7d32',
      subtitle: `${stats.pendingProducts || 0} chờ duyệt`
    },
    { 
      title: 'Tổng Đơn hàng', 
      value: orderStats.totalOrders || stats.totalOrders || 0, 
      icon: <ShoppingCart />, 
      color: '#9c27b0',
      subtitle: `${orderStats.completed || 0} đã hoàn thành`
    },
    { 
      title: 'Doanh thu', 
      value: orderStats.totalRevenue 
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderStats.totalRevenue)
        : '0 ₫', 
      icon: <AttachMoney />, 
      color: '#f57c00',
      subtitle: 'Từ đơn hàng đã hoàn thành'
    },
  ];

  const orderStatusCards = [
    {
      title: 'Chờ xác nhận',
      value: orderStats.pending || 0,
      icon: <PendingActions />,
      color: '#ff9800'
    },
    {
      title: 'Đã xác nhận',
      value: orderStats.confirmed || 0,
      icon: <CheckCircle />,
      color: '#2196f3'
    },
    {
      title: 'Đang giao hàng',
      value: orderStats.shipping || 0,
      icon: <TrendingUp />,
      color: '#3f51b5'
    },
    {
      title: 'Đã hoàn thành',
      value: orderStats.completed || 0,
      icon: <CheckCircle />,
      color: '#4caf50'
    },
    {
      title: 'Đã hủy',
      value: orderStats.cancelled || 0,
      icon: <Block />,
      color: '#f44336'
    }
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Dashboard
      </Typography>

      {/* Thống kê tổng quan */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ background: card.color, color: 'white', height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" mt={1} fontWeight="bold">
                      {card.value}
                    </Typography>
                    {card.subtitle && (
                      <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                        {card.subtitle}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ fontSize: 48, opacity: 0.8 }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Thống kê đơn hàng */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          📦 Thống kê Đơn hàng
        </Typography>
        <Grid container spacing={2}>
          {orderStatusCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Card sx={{ bgcolor: card.color, color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {card.value}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                        {card.title}
                      </Typography>
                    </Box>
                    <Box sx={{ fontSize: 32, opacity: 0.8 }}>
                      {card.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Thống kê sản phẩm */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          🛍️ Thống kê Sản phẩm
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalProducts || 0}
                </Typography>
                <Typography variant="body2">Tổng sản phẩm</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.pendingProducts || 0}
                </Typography>
                <Typography variant="body2">Chờ duyệt</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold">
                  {stats.approvedProducts || 0}
                </Typography>
                <Typography variant="body2">Đã duyệt</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;