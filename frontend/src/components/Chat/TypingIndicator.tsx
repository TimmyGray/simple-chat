import { useTranslation } from 'react-i18next';
import { Box, keyframes } from '@mui/material';
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
            width: TYPING_DOT_SIZE,
            height: TYPING_DOT_SIZE,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: `${bounce} ${TYPING_ANIMATION_DURATION} infinite`,
            animationDelay: `${i * TYPING_DOT_DELAY_STEP}s`,
          }}
        />
      ))}
    </Box>
  );
}
