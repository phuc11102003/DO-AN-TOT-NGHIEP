import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import Swal from 'sweetalert2';
import ProductCard from '../components/ProductCard';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products?search=${encodeURIComponent(query)}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
      Swal.fire('Lỗi!', 'Không thể tải kết quả tìm kiếm!', 'error');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    } else {
      setLoading(false);
    }
  }, [query, fetchSearchResults]);

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4, minHeight: '60vh' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Kết quả tìm kiếm
      </Typography>
      
      {query && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Tìm thấy {products.length} sản phẩm cho từ khóa: <strong>"{query}"</strong>
        </Typography>
      )}

      {!query ? (
        <Alert severity="info">
          Vui lòng nhập từ khóa tìm kiếm
        </Alert>
      ) : products.length === 0 ? (
        <Alert severity="warning">
          Không tìm thấy sản phẩm nào cho từ khóa "{query}"
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={product._id}
              sx={{ display: 'flex' }}
            >
              <ProductCard product={product} showActions={false} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Search;

