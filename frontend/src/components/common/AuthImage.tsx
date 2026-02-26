import { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import { alpha } from '@mui/material/styles';
import { getStoredToken } from '../../api/client';
import { IMAGE_THUMB_SIZE } from '../../constants';

interface AuthImageProps {
  src: string;
  alt: string;
  maxHeight?: number;
  maxWidth?: number | string;
  borderRadius?: number;
  onClick?: () => void;
}

export default function AuthImage({
  src,
  alt,
  maxHeight = 200,
  maxWidth = '100%',
  borderRadius = 8,
  onClick,
}: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked = false;
    const token = getStoredToken();

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!revoked) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      revoked = true;
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [src]);

  if (loading) {
    return (
      <Box
        sx={{
          width: IMAGE_THUMB_SIZE,
          height: IMAGE_THUMB_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${borderRadius}px`,
          backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.05),
        }}
      >
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error || !objectUrl) {
    return (
      <Box
        sx={{
          width: IMAGE_THUMB_SIZE,
          height: IMAGE_THUMB_SIZE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: `${borderRadius}px`,
          backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.05),
        }}
      >
        <BrokenImageIcon sx={{ color: 'text.secondary', fontSize: 24 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={objectUrl}
      alt={alt}
      onClick={onClick}
      sx={{
        maxHeight,
        maxWidth,
        borderRadius: `${borderRadius}px`,
        objectFit: 'contain',
        cursor: onClick ? 'pointer' : 'default',
        display: 'block',
      }}
    />
  );
}
