import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  AccountBalance as BankIcon,
  Save as SaveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    bankAccount: {
      accountNumber: '',
      bankName: '',
      accountHolder: ''
    },
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Lấy thông tin user từ API hoặc từ localStorage
      const response = await api.get('/auth/me');
      const userData = response.data.user || currentUser;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        district: userData.district || '',
        ward: userData.ward || '',
        bankAccount: {
          accountNumber: userData.bankAccount?.accountNumber || '',
          bankName: userData.bankAccount?.bankName || '',
          accountHolder: userData.bankAccount?.accountHolder || ''
        },
        bio: userData.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback to localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          name: currentUser.name || '',
          email: currentUser.email || '',
          phone: '',
          address: '',
          city: '',
          district: '',
          ward: '',
          bankAccount: {
            accountNumber: '',
            bankName: '',
            accountHolder: ''
          },
          bio: ''
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put('/auth/profile', formData);
      
      // Cập nhật localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      
      Swal.fire('Thành công!', 'Đã cập nhật thông tin cá nhân!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire('Lỗi!', error.response?.data?.message || 'Không thể cập nhật thông tin!', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="error">Không thể tải thông tin người dùng</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Hồ sơ của tôi
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Avatar và thông tin cơ bản */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: '#1e88e5',
                fontSize: '3rem'
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <EmailIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {user.email}
            </Typography>
            {!editing && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ mt: 2 }}
              >
                Chỉnh sửa
              </Button>
            )}
          </Paper>
        </Grid>

        {/* Form thông tin */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Thông tin cá nhân */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Thông tin cá nhân
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Họ và tên"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!editing}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số điện thoại"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Giới thiệu bản thân"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    multiline
                    rows={3}
                    placeholder="Viết vài dòng giới thiệu về bản thân..."
                  />
                </Grid>

                {/* Địa chỉ */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <HomeIcon sx={{ mr: 1 }} />
                    Địa chỉ
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Địa chỉ"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Số nhà, tên đường..."
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Thành phố/Tỉnh"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Quận/Huyện"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Phường/Xã"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </Grid>

                {/* Thông tin ngân hàng */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <BankIcon sx={{ mr: 1 }} />
                    Thông tin tài khoản ngân hàng
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Thông tin này sẽ được sử dụng để nhận tiền khi bán sản phẩm
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Số tài khoản"
                    name="bankAccount.accountNumber"
                    value={formData.bankAccount.accountNumber}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="1234567890"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tên ngân hàng"
                    name="bankAccount.bankName"
                    value={formData.bankAccount.bankName}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Vietcombank, Techcombank..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Chủ tài khoản"
                    name="bankAccount.accountHolder"
                    value={formData.bankAccount.accountHolder}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Tên chủ tài khoản"
                  />
                </Grid>

                {/* Buttons */}
                {editing && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditing(false);
                          fetchProfile(); // Reset form
                        }}
                        disabled={saving}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={saving}
                      >
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;

