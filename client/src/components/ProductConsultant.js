import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Fade,
  Collapse,
  CircularProgress,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as BotIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../services/api';
import Swal from 'sweetalert2';
import { formatPrice } from '../utils/formatters';

const ProductConsultant = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI thông minh của website Thu Mua Đồ Cũ. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về giá cả, hướng dẫn trao đổi sản phẩm, hoặc hỗ trợ về các chức năng khác của website. Bạn cần hỗ trợ gì?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load lịch sử chat khi mở
  useEffect(() => {
    if (open && user && token) {
      loadChatHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, token]);

  const loadChatHistory = async () => {
    try {
      const response = await api.get('/ai/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.history.length > 0) {
        // Chuyển đổi lịch sử từ API thành format của component
        const formattedMessages = response.data.history.map(msg => ({
          type: msg.role === 'user' ? 'user' : 'bot',
          content: msg.content,
          products: msg.products || null
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Không hiển thị lỗi nếu không load được lịch sử
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Gọi AI API
      const endpoint = user && token ? '/ai/chat' : '/ai/chat/guest';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await api.post(
        endpoint,
        { message: currentInput },
        { headers }
      );

      if (response.data.success) {
        const botResponse = {
          type: 'bot',
          content: response.data.response,
          products: response.data.products || null
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error(response.data.message || 'Lỗi khi gửi tin nhắn');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse = {
        type: 'bot',
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn có muốn xóa toàn bộ lịch sử chat không?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        if (user && token) {
          await api.post(
            '/ai/chat',
            { clearChat: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        
        setMessages([
          {
            type: 'bot',
            content: 'Xin chào! Tôi là trợ lý AI thông minh của website Thu Mua Đồ Cũ. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về giá cả, hướng dẫn trao đổi sản phẩm, hoặc hỗ trợ về các chức năng khác của website. Bạn cần hỗ trợ gì?'
          }
        ]);
      } catch (error) {
        console.error('Error clearing chat:', error);
        // Vẫn xóa local messages dù API lỗi
        setMessages([
          {
            type: 'bot',
            content: 'Xin chào! Tôi là trợ lý AI thông minh của website Thu Mua Đồ Cũ. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn về giá cả, hướng dẫn trao đổi sản phẩm, hoặc hỗ trợ về các chức năng khác của website. Bạn cần hỗ trợ gì?'
          }
        ]);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!open && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300
          }}
        >
          <Fade in={!open}>
            <IconButton
              onClick={() => setOpen(true)}
              sx={{
                width: 64,
                height: 64,
                backgroundColor: '#1e88e5',
                color: 'white',
                boxShadow: 4,
                '&:hover': {
                  backgroundColor: '#1565c0',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s'
              }}
            >
              <BotIcon sx={{ fontSize: 32 }} />
            </IconButton>
          </Fade>
        </Box>
      )}

      {/* Chat Window */}
      <Collapse in={open} orientation="horizontal">
        <Paper
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            height: 600,
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 8,
            zIndex: 1300,
            borderRadius: 2,
            overflow: 'hidden',
            mt: 0
          }}
        >
          {/* Header */}
          <Box
            sx={{
              backgroundColor: '#1e88e5',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Avatar sx={{ bgcolor: 'white', color: '#1e88e5' }}>
              <BotIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Trợ lý AI
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {loading ? 'Đang suy nghĩ...' : 'Trực tuyến'}
              </Typography>
            </Box>
            <Tooltip title="Xóa lịch sử chat">
              <IconButton
                size="small"
                onClick={handleClearChat}
                sx={{ color: 'white' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => setOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {messages.map((msg, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                    gap: 1,
                    mb: msg.products ? 2 : 0
                  }}
                >
                  {msg.type === 'bot' && (
                    <Avatar sx={{ bgcolor: '#1e88e5', width: 32, height: 32 }}>
                      <BotIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: '75%',
                      backgroundColor: msg.type === 'user' ? '#1e88e5' : 'white',
                      color: msg.type === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                  {msg.type === 'user' && (
                    <Avatar sx={{ bgcolor: '#4caf50', width: 32, height: 32 }}>
                      {user?.name?.charAt(0).toUpperCase() || msg.content.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Box>
                
                {/* Hiển thị sản phẩm nếu có */}
                {msg.products && msg.products.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1,
                      ml: 5
                    }}
                  >
                    {msg.products.map((product) => (
                      <Card
                        key={product._id}
                        sx={{
                          maxWidth: 300,
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s'
                          }
                        }}
                        onClick={() => {
                          navigate(`/product/${product._id}`);
                          setOpen(false);
                        }}
                      >
                        <CardActionArea>
                          <CardMedia
                            component="img"
                            height="120"
                            image={`http://localhost:5000/uploads/${product.image}`}
                            alt={product.title}
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ p: 1.5 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                mb: 0.5
                              }}
                            >
                              {product.title}
                            </Typography>
                            <Typography
                              variant="h6"
                              color="primary"
                              fontWeight="bold"
                              sx={{ mb: 0.5 }}
                            >
                              {formatPrice(product.price)}
                            </Typography>
                            <Chip
                              label={product.category}
                              size="small"
                              color="secondary"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            ))}
            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  gap: 1
                }}
              >
                <Avatar sx={{ bgcolor: '#1e88e5', width: 32, height: 32 }}>
                  <BotIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Paper
                  sx={{
                    p: 1.5,
                    backgroundColor: 'white',
                    borderRadius: 2
                  }}
                >
                  <CircularProgress size={16} />
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              backgroundColor: 'white',
              display: 'flex',
              gap: 1
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              {loading ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default ProductConsultant;

