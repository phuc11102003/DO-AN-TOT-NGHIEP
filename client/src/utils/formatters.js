// Utility functions for formatting

/**
 * Format số tiền thành định dạng VNĐ
 * @param {number} amount - Số tiền cần format
 * @returns {string} - Chuỗi đã format (ví dụ: "1.000.000 ₫")
 */
export const formatPrice = (amount) => {
  if (amount === null || amount === undefined) return '0 ₫';
  return `${Number(amount).toLocaleString('vi-VN')} ₫`;
};

/**
 * Format ngày tháng
 * @param {Date|string} date - Ngày cần format
 * @param {object} options - Options cho toLocaleDateString
 * @returns {string} - Chuỗi ngày đã format
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  });
};

/**
 * Format ngày giờ đầy đủ
 * @param {Date|string} date - Ngày cần format
 * @returns {string} - Chuỗi ngày giờ đã format
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format thời gian tương đối (ví dụ: "2 giờ trước")
 * @param {Date|string} date - Ngày cần format
 * @returns {string} - Chuỗi thời gian tương đối
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  
  return formatDate(dateObj);
};

