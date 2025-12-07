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
  InputAdornment,
  IconButton,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.password) {
        Swal.fire('Lỗi!', 'Vui lòng điền đầy đủ thông tin!', 'error');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        Swal.fire('Lỗi!', 'Mật khẩu phải có ít nhất 6 ký tự!', 'error');
        setLoading(false);
        return;
      }

      await api.post('/auth/register', formData);
      
      Swal.fire({
        title: 'Thành công!',
        text: 'Đăng ký thành công, hãy đăng nhập!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Không thể đăng ký!';
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối!';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Swal.fire('Lỗi!', errorMessage, 'error');
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
              <PersonAddIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Đăng Ký
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tạo tài khoản mới để bắt đầu
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Họ và tên"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Nhập họ và tên của bạn"
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Nhập email của bạn"
            />

            <TextField
              fullWidth
              label="Mật khẩu"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              placeholder="Tối thiểu 6 ký tự"
              helperText="Mật khẩu phải có ít nhất 6 ký tự"
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
                mt: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                }
              }}
            >
              {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
            </Button>

            <Divider sx={{ my: 3 }}>HOẶC</Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Đã có tài khoản?{' '}
                <Button
                  component={Link}
                  to="/login"
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Đăng nhập ngay
                </Button>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
