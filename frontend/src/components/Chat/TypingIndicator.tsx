import { useTranslation } from 'react-i18next';
import { Box, keyframes } from '@mui/material';
import { visuallyHidden } from '@mui/utils';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
`;

export default function TypingIndicator() {
  const { t } = useTranslation();

  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', gap: 0.5, p: 1, pl: 2 }}>
      <Box component="span" sx={visuallyHidden}>
        {t('chat.typing')}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: `${bounce} 1.2s infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </Box>
  );
}
