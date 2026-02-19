import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';

export default function EmptyState() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        opacity: 0.5,
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: 64 }} />
      <Typography variant="h6">{t('chat.noConversation')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('chat.noConversationHint')}
      </Typography>
    </Box>
  );
}
