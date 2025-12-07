import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Rating
} from '@mui/material';
import { formatPrice } from '../utils/formatters';

const ProductCard = ({ product, showActions = true, onAddToCart }) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: showActions ? '520px' : '480px', // Chiều cao cố định
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6,
        },
        cursor: 'pointer',
        overflow: 'hidden' // Đảm bảo không bị tràn
      }}
      onClick={() => navigate(`/product/${product._id}`)}
    >
      {/* Hình ảnh - Chiều cao cố định tuyệt đối */}
      <Box
        sx={{
          width: '100%',
          height: '200px', // Chiều cao cố định
          overflow: 'hidden',
          flexShrink: 0 // Không cho phép co lại
        }}
      >
        <CardMedia
          component="img"
          image={`http://localhost:5000/uploads/${product.image}`}
          alt={product.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Cover để fill đầy, không bị méo
            objectPosition: 'center' // Căn giữa hình ảnh
          }}
        />
      </Box>

      {/* Nội dung - Chiều cao cố định */}
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: showActions ? '240px' : '200px', // Chiều cao tối thiểu
          maxHeight: showActions ? '240px' : '200px', // Chiều cao tối đa
          overflow: 'hidden'
        }}
      >
        {/* Tên sản phẩm - Giới hạn 2 dòng, chiều cao cố định */}
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            height: '3.5em', // Chiều cao cố định
            lineHeight: '1.75em',
            flexShrink: 0
          }}
        >
          {product.title}
        </Typography>

        {/* Mô tả - Giới hạn 2 dòng, chiều cao cố định */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            height: '2.5em', // Chiều cao cố định
            lineHeight: '1.25em',
            flexShrink: 0
          }}
        >
          {product.description}
        </Typography>

        {/* Rating - Nếu có */}
        {product.rating > 0 && (
          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Rating value={product.rating} readOnly size="small" precision={0.1} />
            <Typography variant="caption" color="text.secondary">
              ({product.reviewCount || 0})
            </Typography>
          </Box>
        )}

        {/* Giá - Chiều cao cố định */}
        <Typography
          variant="h6"
          color="primary"
          fontWeight="bold"
          sx={{ 
            mb: 1.5,
            height: '2em', // Chiều cao cố định
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          {formatPrice(product.price)}
        </Typography>

        {/* Danh mục và số lượng - Chiều cao cố định */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 1,
            mt: 'auto', // Đẩy xuống dưới cùng
            flexShrink: 0
          }}
        >
          <Chip
            label={product.category}
            size="small"
            variant="outlined"
            color="primary"
          />
          {product.quantity !== undefined && (
            <Chip
              label={product.quantity > 0 ? `Còn ${product.quantity}` : 'Hết hàng'}
              size="small"
              color={product.quantity > 0 ? 'success' : 'error'}
            />
          )}
        </Box>
      </CardContent>

      {/* Actions - Nếu có, chiều cao cố định */}
      {showActions && (
        <CardActions 
          sx={{ 
            p: 2, 
            pt: 0,
            height: '60px', // Chiều cao cố định
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product._id}`);
            }}
            sx={{ mr: 1, borderRadius: 2 }}
          >
            Chi tiết
          </Button>
          {onAddToCart && (
            <Button
              variant="contained"
              size="small"
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(45deg, #1e88e5, #0d47a1)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2, #0d47a1)',
                }
              }}
            >
              Thêm giỏ
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default ProductCard;
