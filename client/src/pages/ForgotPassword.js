import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      
      Swal.fire({
        title: 'Đã gửi email!',
        text: 'Vui lòng kiểm tra email để đặt lại mật khẩu.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      
      navigate('/login');
    } catch (error) {
      Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'white'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: 3
              }}
            >
              <LockResetIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Quên Mật Khẩu
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nhập email của bạn để nhận link đặt lại mật khẩu
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Nhập email đăng ký"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                }
              }}
            >
              {loading ? 'Đang gửi...' : 'Gửi Email Đặt Lại Mật Khẩu'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/login"
                startIcon={<ArrowBackIcon />}
                sx={{ textTransform: 'none' }}
              >
                Quay lại đăng nhập
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ForgotPassword;

