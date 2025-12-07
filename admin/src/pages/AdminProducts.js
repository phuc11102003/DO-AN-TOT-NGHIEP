// admin/src/components/AdminProducts.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Lấy danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products');
      
      setProducts(response.data || []);
      setTotal(response.data?.length || 0);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((response.data || []).map(product => product.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Lọc sản phẩm
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase()) ||
                         product.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus = !statusFilter || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewDialog(true);
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: `Bạn có chắc muốn xóa sản phẩm "${productTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#757575',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/admin/products/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire('Đã xóa!', 'Sản phẩm đã được xóa thành công.', 'success');
        fetchProducts(); // Refresh list
      } catch (error) {
        console.error('Error deleting product:', error);
        Swal.fire('Lỗi!', 'Không thể xóa sản phẩm.', 'error');
      }
    }
  };

  const handleAddProduct = () => {
    navigate('/admin/products/add');
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setFilterAnchor(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📦 Quản lý Sản phẩm
      </Typography>

      {/* Thống kê nhanh */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {total}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng sản phẩm
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 150, textAlign: 'center' }}>
          <Typography variant="h6" color="secondary">
            {categories.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Danh mục
          </Typography>
        </Paper>
      </Box>

      {/* Thanh công cụ */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 250 }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
          >
            Bộ lọc
          </Button>

          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            <MenuItem sx={{ minWidth: 200 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Danh mục</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Danh mục"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem sx={{ minWidth: 200 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  label="Trạng thái"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="pending">
                    <Chip label="Chờ duyệt" size="small" color="warning" />
                  </MenuItem>
                  <MenuItem value="approved">
                    <Chip label="Đã duyệt" size="small" color="success" />
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Chip label="Đã từ chối" size="small" color="error" />
                  </MenuItem>
                  <MenuItem value="pending_deletion">
                    <Chip label="Chờ xóa" size="small" color="default" />
                  </MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem onClick={clearFilters}>
              <Typography color="primary">Xóa bộ lọc</Typography>
            </MenuItem>
          </Menu>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddProduct}
          >
            Thêm sản phẩm
          </Button>
        </Box>

        {/* Hiển thị bộ lọc đang active */}
        {(search || categoryFilter || statusFilter) && (
          <Box mt={1} display="flex" gap={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Bộ lọc:
            </Typography>
            {search && (
              <Chip
                label={`Tìm: "${search}"`}
                size="small"
                onDelete={() => setSearch('')}
              />
            )}
            {categoryFilter && (
              <Chip
                label={`Danh mục: ${categoryFilter}`}
                size="small"
                onDelete={() => setCategoryFilter('')}
              />
            )}
            {statusFilter && (
              <Chip
                label={`Trạng thái: ${
                  statusFilter === 'pending' ? 'Chờ duyệt' :
                  statusFilter === 'approved' ? 'Đã duyệt' :
                  statusFilter === 'rejected' ? 'Đã từ chối' :
                  statusFilter === 'pending_deletion' ? 'Chờ xóa' : statusFilter
                }`}
                size="small"
                onDelete={() => setStatusFilter('')}
                color={
                  statusFilter === 'pending' ? 'warning' :
                  statusFilter === 'approved' ? 'success' :
                  statusFilter === 'rejected' ? 'error' : 'default'
                }
              />
            )}
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Bảng sản phẩm */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Hình ảnh</strong></TableCell>
              <TableCell><strong>Tên sản phẩm</strong></TableCell>
              <TableCell><strong>Giá</strong></TableCell>
              <TableCell><strong>Danh mục</strong></TableCell>
              <TableCell><strong>Trạng thái</strong></TableCell>
              <TableCell><strong>Trạng thái đổi trả</strong></TableCell>
              <TableCell><strong>Người bán</strong></TableCell>
              <TableCell><strong>Ngày tạo</strong></TableCell>
              <TableCell><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    {products.length === 0 ? 'Chưa có sản phẩm nào' : 'Không tìm thấy sản phẩm phù hợp'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product._id} hover>
                  <TableCell>
                    <Box
                      component="img"
                      src={`http://localhost:5000/uploads/${product.image}`}
                      alt={product.title}
                      sx={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                      {product.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(product.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.category} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        product.status === 'pending' ? 'Chờ duyệt' :
                        product.status === 'approved' ? 'Đã duyệt' :
                        product.status === 'rejected' ? 'Đã từ chối' :
                        product.status === 'pending_deletion' ? 'Chờ xóa' : product.status
                      }
                      size="small"
                      color={
                        product.status === 'pending' ? 'warning' :
                        product.status === 'approved' ? 'success' :
                        product.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {product.exchangeStatus === 'in_exchange' && (
                      <Chip 
                        label="Đang trong giao dịch đổi trả" 
                        size="small" 
                        color="warning" 
                      />
                    )}
                    {product.exchangeStatus === 'exchanged' && (
                      <Chip 
                        label="Đã hoàn tất đổi trả" 
                        size="small" 
                        color="success" 
                      />
                    )}
                    {(!product.exchangeStatus || product.exchangeStatus === 'none') && (
                      <Chip 
                        label="Không có giao dịch đổi trả" 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {product.seller?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {product.seller?.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleViewProduct(product)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteProduct(product._id, product.title)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phân trang */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredProducts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số dòng mỗi trang:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} trong tổng ${count}`
        }
      />

      {/* Dialog xem chi tiết */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết sản phẩm
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
              <Box flex={1}>
                <Box
                  component="img"
                  src={`http://localhost:5000/uploads/${selectedProduct.image}`}
                  alt={selectedProduct.title}
                  sx={{
                    width: '100%',
                    maxHeight: 300,
                    objectFit: 'cover',
                    borderRadius: 2
                  }}
                />
              </Box>
              <Box flex={2}>
                <Typography variant="h6" gutterBottom>
                  {selectedProduct.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedProduct.description}
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(selectedProduct.price)}
                </Typography>
                <Chip 
                  label={selectedProduct.category} 
                  color="secondary" 
                  sx={{ mb: 2 }}
                />
                <Box mt={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Người bán: {selectedProduct.seller?.name} ({selectedProduct.seller?.email})
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ngày đăng: {new Date(selectedProduct.createdAt).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminProducts;