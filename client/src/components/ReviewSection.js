import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Paper,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';
import api from '../services/api';
import Swal from 'sweetalert2';

const ReviewSection = ({ productId, user, orderId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reviews/product/${productId}?page=1&limit=10`);
      setReviews(response.data.reviews || []);
      setAverageRating(response.data.averageRating || 0);
      setTotalReviews(response.data.totalReviews || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async () => {
    if (!user) {
      Swal.fire('Thông báo', 'Vui lòng đăng nhập để đánh giá', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/reviews', {
        productId,
        orderId,
        rating,
        comment
      });
      
      Swal.fire('Thành công!', 'Đánh giá của bạn đã được gửi', 'success');
      setOpenDialog(false);
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể gửi đánh giá', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/helpful`);
      // Cập nhật review trong state
      setReviews(reviews.map(r => 
        r._id === reviewId 
          ? { ...r, helpful: response.data.helpful, isHelpful: response.data.isHelpful }
          : r
      ));
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Đánh giá sản phẩm
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Rating value={averageRating} readOnly precision={0.1} size="large" />
            <Typography variant="h6">
              {averageRating.toFixed(1)} ({totalReviews} đánh giá)
            </Typography>
          </Box>
        </Box>
        {user && (
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
          >
            Viết đánh giá
          </Button>
        )}
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : reviews.length === 0 ? (
        <Alert severity="info">Chưa có đánh giá nào cho sản phẩm này</Alert>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Paper key={review._id} sx={{ p: 3, mb: 2 }}>
              <Box display="flex" gap={2}>
                <Avatar>
                  {review.user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {review.user?.name || 'Người dùng'}
                        {review.isVerified && (
                          <Chip
                            icon={<VerifiedIcon />}
                            label="Đã mua hàng"
                            size="small"
                            color="success"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                      {review.comment}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      size="small"
                      startIcon={<ThumbUpIcon />}
                      onClick={() => handleHelpful(review._id)}
                      color={review.isHelpful ? 'primary' : 'default'}
                    >
                      Hữu ích ({review.helpful || 0})
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog viết đánh giá */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Viết đánh giá</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Đánh giá của bạn:</Typography>
            <Rating
              value={rating}
              onChange={(e, newValue) => setRating(newValue)}
              size="large"
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Nhận xét"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Gửi đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewSection;

