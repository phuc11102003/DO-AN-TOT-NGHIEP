import React, { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

const LazyImage = ({ src, alt, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Box sx={{ position: 'relative', width: '100%', ...props.sx }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100'
          }}
        >
          <CircularProgress size={40} />
        </Box>
      )}
      <img
        src={src}
        alt={alt}
        {...props}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{
          ...props.style,
          display: loading ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        loading="lazy"
      />
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.100',
            color: 'text.secondary'
          }}
        >
          Không thể tải ảnh
        </Box>
      )}
    </Box>
  );
};

export default LazyImage;

