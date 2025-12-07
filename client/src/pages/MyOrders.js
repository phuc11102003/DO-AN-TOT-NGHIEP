import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Pending,
  Cancel,
  Visibility,
  ShoppingBag
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/my-orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Swal.fire('Lỗi!', 'Không thể tải danh sách đơn hàng!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'confirmed':
        return 'info';
      case 'shipping':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'shipping':
        return 'Đang giao hàng';
      case 'completed':
        return 'Đã hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'confirmed':
      case 'shipping':
        return <LocalShipping />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <Pending />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          <ShoppingBag sx={{ mr: 1, verticalAlign: 'middle' }} />
          Đơn hàng của tôi
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Theo dõi tình trạng đơn hàng của bạn
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingBag sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bạn chưa có đơn hàng nào
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Mua sắm ngay
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Mã đơn hàng</strong></TableCell>
                <TableCell><strong>Sản phẩm</strong></TableCell>
                <TableCell><strong>Tổng tiền</strong></TableCell>
                <TableCell><strong>Trạng thái</strong></TableCell>
                <TableCell><strong>Ngày đặt</strong></TableCell>
                <TableCell><strong>Thao tác</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      #{order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {order.items?.slice(0, 2).map((item, idx) => (
                        <Typography key={idx} variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.title} x{item.quantity}
                        </Typography>
                      ))}
                      {order.items?.length > 2 && (
                        <Typography variant="caption" color="text.secondary">
                          +{order.items.length - 2} sản phẩm khác
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {order.totalAmount?.toLocaleString()} ₫
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={getStatusLabel(order.status)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyOrders;

