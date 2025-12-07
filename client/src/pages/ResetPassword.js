import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Lock as LockIcon,
  LockReset as LockResetIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      Swal.fire('Lỗi!', 'Token không hợp lệ', 'error');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      Swal.fire('Lỗi!', 'Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }

    if (password.length < 6) {
      Swal.fire('Lỗi!', 'Mật khẩu phải có ít nhất 6 ký tự', 'error');
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire('Lỗi!', 'Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        password
      });

      Swal.fire({
        title: 'Thành công!',
        text: 'Mật khẩu đã được đặt lại thành công',
        icon: 'success',
        confirmButtonText: 'Đăng nhập'
      }).then(() => {
        navigate('/login');
      });
    } catch (error) {
      Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể đặt lại mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockResetIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Đặt lại mật khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhập mật khẩu mới của bạn
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Mật khẩu phải có ít nhất 6 ký tự
          </Alert>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Mật khẩu mới"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Xác nhận mật khẩu"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Quay lại đăng nhập
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPassword;

