import { useTranslation } from 'react-i18next';
import { Box, Typography, keyframes } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import {
  TYPING_DOT_SIZE,
  TYPING_BOUNCE_OFFSET,
  TYPING_ANIMATION_DURATION,
  TYPING_DOT_DELAY_STEP,
} from '../../constants';

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(${TYPING_BOUNCE_OFFSET}px); }
`;

interface TypingIndicatorProps {
  remoteUsers?: string[];
}

export default function TypingIndicator({ remoteUsers }: TypingIndicatorProps) {
  const { t } = useTranslation();

  const label = remoteUsers && remoteUsers.length > 0
    ? t('websocket.typingUsers', { users: remoteUsers.join(', ') })
    : t('chat.typing');

  return (
    <Box role="status" aria-live="polite" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: 1, pl: 2 }}>
      <Box component="span" sx={visuallyHidden}>
        {label}
      </Box>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: TYPING_DOT_SIZE,
            height: TYPING_DOT_SIZE,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: `${bounce} ${TYPING_ANIMATION_DURATION} infinite`,
            animationDelay: `${i * TYPING_DOT_DELAY_STEP}s`,
          }}
        />
      ))}
      {remoteUsers && remoteUsers.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          {t('websocket.typingUsers', { users: remoteUsers.join(', ') })}
        </Typography>
      )}
    </Box>
  );
}
