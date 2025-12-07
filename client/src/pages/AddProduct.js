import React, { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../services/api';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardMedia,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Title as TitleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    quantity: 1,
    category: '',
    condition: 'like_new',
    location: '',
    phone: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Danh mục sản phẩm
  const categories = [
    'Điện tử & Công nghệ',
    'Nội thất & Gia dụng',
    'Thời trang & Phụ kiện',
    'Sách & Văn phòng phẩm',
    'Thể thao & Giải trí',
    'Đồ gia dụng',
    'Mẹ & Bé',
    'Xe cộ & Phụ tùng',
    'Nhà cửa & Đời sống',
    'Khác'
  ];

  const conditions = [
    { value: 'like_new', label: 'Như mới', color: 'success' },
    { value: 'good', label: 'Tốt', color: 'primary' },
    { value: 'fair', label: 'Khá', color: 'warning' },
    { value: 'poor', label: 'Cần sửa chữa', color: 'error' }
  ];

  const steps = ['Thông tin cơ bản', 'Hình ảnh & Mô tả', 'Xác nhận'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Xóa lỗi khi người dùng bắt đầu nhập
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra kích thước file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Lỗi', 'Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
      }

      // Kiểm tra định dạng file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire('Lỗi', 'Chỉ chấp nhận file ảnh (JPEG, JPG, PNG, WebP)', 'error');
        return;
      }

      setImage(file);
      
      // Tạo preview ảnh
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tên sản phẩm';
      if (!formData.category) newErrors.category = 'Vui lòng chọn danh mục';
      if (!formData.price || formData.price <= 0) newErrors.price = 'Vui lòng nhập giá hợp lệ';
      if (!formData.condition) newErrors.condition = 'Vui lòng chọn tình trạng';
    }

    if (step === 1) {
      if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả sản phẩm';
      if (!image) newErrors.image = 'Vui lòng tải lên ít nhất một ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      Swal.fire('Thông báo', 'Bạn cần đăng nhập trước khi đăng sản phẩm!', 'warning');
      setLoading(false);
      return;
    }

    if (!validateStep(2)) {
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, value);
    });
    submitData.append('image', image);

    try {
      await api.post('/products/add', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire({
        title: '🎉 Thành công!',
        text: 'Sản phẩm của bạn đã được đăng thành công!',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1e88e5'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        quantity: 1,
        category: '',
        condition: 'like_new',
        location: '',
        phone: ''
      });
      setImage(null);
      setImagePreview(null);
      setActiveStep(0);
      setErrors({});

    } catch (error) {
      Swal.fire({
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể đăng sản phẩm!',
        icon: 'error',
        confirmButtonText: 'Thử lại'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Tên sản phẩm"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.title}
              helperText={errors.title}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TitleIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Ví dụ: iPhone 13 Pro Max 128GB"
            />

            <FormControl fullWidth error={!!errors.category}>
              <InputLabel>Danh mục</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Danh mục"
                startAdornment={
                  <InputAdornment position="start">
                    <CategoryIcon color="action" />
                  </InputAdornment>
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
            </FormControl>

            <TextField
              label="Giá (VNĐ)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.price}
              helperText={errors.price}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoneyIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">₫</InputAdornment>,
              }}
              placeholder="0"
            />

            <TextField
              label="Số lượng"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.quantity}
              helperText={errors.quantity || 'Số lượng sản phẩm có sẵn'}
              inputProps={{ min: 1 }}
              placeholder="1"
            />

            <FormControl fullWidth error={!!errors.condition}>
              <InputLabel>Tình trạng</InputLabel>
              <Select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                label="Tình trạng"
              >
                {conditions.map((condition) => (
                  <MenuItem key={condition.value} value={condition.value}>
                    <Chip 
                      label={condition.label} 
                      size="small" 
                      color={condition.color}
                      variant="outlined"
                    />
                  </MenuItem>
                ))}
              </Select>
              {errors.condition && <FormHelperText>{errors.condition}</FormHelperText>}
            </FormControl>

            <TextField
              label="Địa điểm"
              name="location"
              value={formData.location}
              onChange={handleChange}
              fullWidth
              placeholder="Ví dụ: Hà Nội, TP.HCM, ..."
            />

            <TextField
              label="Số điện thoại liên hệ"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              placeholder="Ví dụ: 0912345678"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Upload ảnh */}
            <Box>
              <InputLabel sx={{ mb: 2 }}>Hình ảnh sản phẩm *</InputLabel>
              
              {imagePreview ? (
                <Card sx={{ maxWidth: 300, position: 'relative', mb: 2 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={imagePreview}
                    alt="Preview"
                    sx={{ objectFit: 'cover' }}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)'
                      }
                    }}
                    onClick={removeImage}
                    size="small"
                  >
                    <DeleteIcon color="error" />
                  </IconButton>
                </Card>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{
                    py: 3,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: errors.image ? 'error.main' : 'grey.300',
                    '&:hover': {
                      borderColor: errors.image ? 'error.main' : 'primary.main',
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  Tải ảnh lên
                  <input 
                    type="file" 
                    hidden 
                    onChange={handleImageChange}
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                  />
                </Button>
              )}
              
              {errors.image && (
                <FormHelperText error sx={{ mt: 1 }}>
                  {errors.image}
                </FormHelperText>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                📷 Hỗ trợ: JPEG, JPG, PNG, WebP (Tối đa 5MB)
              </Typography>
            </Box>

            {/* Mô tả */}
            <TextField
              label="Mô tả chi tiết"
              name="description"
              multiline
              rows={6}
              value={formData.description}
              onChange={handleChange}
              required
              fullWidth
              error={!!errors.description}
              helperText={errors.description || "Mô tả chi tiết về sản phẩm sẽ giúp thu hút người mua hơn"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <DescriptionIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Mô tả chi tiết về tình trạng, tính năng, lý do bán, ..."
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Vui lòng kiểm tra kỹ thông tin trước khi đăng sản phẩm
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom color="primary">
                  Thông tin sản phẩm
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tên sản phẩm:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.title}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Danh mục:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formData.category}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Giá:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="primary.main">
                    {formData.price ? `${parseInt(formData.price).toLocaleString()} ₫` : 'Chưa có'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tình trạng:
                  </Typography>
                  <Chip 
                    label={conditions.find(c => c.value === formData.condition)?.label || 'Chưa chọn'}
                    size="small"
                    color={conditions.find(c => c.value === formData.condition)?.color || 'default'}
                    variant="outlined"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                {imagePreview && (
                  <>
                    <Typography variant="h6" gutterBottom color="primary">
                      Hình ảnh
                    </Typography>
                    <Card sx={{ maxWidth: 200 }}>
                      <CardMedia
                        component="img"
                        height="150"
                        image={imagePreview}
                        alt="Preview"
                        sx={{ objectFit: 'cover' }}
                      />
                    </Card>
                  </>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Mô tả:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1, backgroundColor: 'grey.50' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {formData.description || 'Chưa có mô tả'}
                </Typography>
              </Paper>
            </Box>
          </Box>
        );

      default:
        return 'Bước không xác định';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={4} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            gutterBottom
            sx={{
              background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🚀 Đăng sản phẩm mới
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bán hàng nhanh chóng, an toàn và hiệu quả
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box component="form" onSubmit={handleSubmit}>
          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
            >
              Quay lại
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  sx={{
                    px: 4,
                    background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976d2, #0d47a1)',
                    }
                  }}
                >
                  {loading ? 'Đang đăng...' : 'Đăng sản phẩm'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  endIcon={<CheckCircleIcon />}
                >
                  Tiếp theo
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddProduct;