import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const Messenger = ({ open, onClose, initialUserId = null }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      const response = await api.get(`/messages/conversation/${selectedConversation._id}/messages`);
      setMessages(response.data);
      // Cập nhật conversations để refresh unread count
      fetchConversations();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleStartConversation = async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/conversation/${userId}`);
      setSelectedConversation(response.data);
      await fetchMessages();
    } catch (error) {
      console.error('Error starting conversation:', error);
      Swal.fire('Lỗi!', 'Không thể tạo cuộc trò chuyện!', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchConversations();
      if (initialUserId) {
        handleStartConversation(initialUserId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, initialUserId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Polling mỗi 3 giây
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      const response = await api.post(
        `/messages/conversation/${selectedConversation._id}/messages`,
        { content: messageInput.trim() }
      );
      setMessages(prev => [...prev, response.data]);
      setMessageInput('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      Swal.fire('Lỗi!', 'Không thể gửi tin nhắn!', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = (conversation) => {
    if (!conversation.participants) return null;
    return conversation.participants.find(p => p._id !== user?._id);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherParticipant(conv);
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 24,
        width: 400,
        height: 600,
        maxHeight: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 8,
        zIndex: 1300,
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden'
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
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Messenger
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {!selectedConversation ? (
        /* Conversations List */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Conversations */}
          <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <MessageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
                </Typography>
              </Box>
            ) : (
              filteredConversations.map((conversation) => {
                const other = getOtherParticipant(conversation);
                const unread = conversation.unreadCount || 0;

                return (
                  <ListItem
                    key={conversation._id}
                    button
                    onClick={() => setSelectedConversation(conversation)}
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderLeft: selectedConversation?._id === conversation._id ? '3px solid #1e88e5' : 'none'
                    }}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={unread} color="error" invisible={unread === 0}>
                        <Avatar sx={{ bgcolor: '#1e88e5' }}>
                          {other?.name?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight={unread > 0 ? 'bold' : 'normal'}>
                            {other?.name || 'Người dùng'}
                          </Typography>
                          {conversation.lastMessageAt && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: unread > 0 ? 'bold' : 'normal'
                          }}
                        >
                          {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })
            )}
          </List>
        </Box>
      ) : (
        /* Chat Window */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              backgroundColor: 'white'
            }}
          >
            <IconButton size="small" onClick={() => setSelectedConversation(null)}>
              <CloseIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: '#1e88e5' }}>
              {getOtherParticipant(selectedConversation)?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {getOtherParticipant(selectedConversation)?.name || 'Người dùng'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trực tuyến
              </Typography>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#f0f2f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </Typography>
              </Box>
            ) : (
              messages.map((message) => {
                const isOwn = message.sender._id === user._id;

                return (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      gap: 1
                    }}
                  >
                    {!isOwn && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#1e88e5' }}>
                        {message.sender.name?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        backgroundColor: isOwn ? '#1e88e5' : 'white',
                        color: isOwn ? 'white' : 'text.primary',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          fontSize: '0.7rem'
                        }}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Paper>
                    {isOwn && (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#4caf50' }}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                    )}
                  </Box>
                );
              })
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
              placeholder="Nhập tin nhắn..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default Messenger;

