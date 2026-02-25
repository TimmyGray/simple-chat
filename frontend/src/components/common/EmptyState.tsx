import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTranslation } from 'react-i18next';
import { EMPTY_STATE_ICON_SIZE, EMPTY_STATE_OPACITY, MODIFIER_KEY } from '../../constants';

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
        opacity: EMPTY_STATE_OPACITY,
      }}
    >
      <ChatBubbleOutlineIcon sx={{ fontSize: EMPTY_STATE_ICON_SIZE }} />
      <Typography variant="h6">{t('chat.noConversation')}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t('chat.noConversationHint')}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t('shortcuts.newChatHint', { shortcut: `${MODIFIER_KEY}N` })}
        {' · '}
        {t('shortcuts.searchHint', { shortcut: `${MODIFIER_KEY}K` })}
      </Typography>
    </Box>
  );
}
