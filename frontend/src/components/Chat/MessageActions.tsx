import { Box, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { useTranslation } from 'react-i18next';
import {
  MESSAGE_ACTION_ICON_SIZE,
  MESSAGE_ACTION_BUTTON_SIZE,
} from '../../constants';

interface MessageActionsProps {
  isUser: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

const actionButtonSx = {
  width: MESSAGE_ACTION_BUTTON_SIZE,
  height: MESSAGE_ACTION_BUTTON_SIZE,
  backgroundColor: (theme: import('@mui/material/styles').Theme) =>
    alpha(theme.palette.background.paper, 0.9),
  backdropFilter: 'blur(4px)',
  border: '1px solid',
  borderColor: 'divider',
  '&:hover': {
    backgroundColor: 'action.hover',
  },
} as const;

function MessageActions({ isUser, onEdit, onRegenerate }: MessageActionsProps) {
  const { t } = useTranslation();

  return (
    <Box
      className="message-actions"
      sx={{
        position: 'absolute',
        top: -4,
        [isUser ? 'left' : 'right']: -4,
        opacity: 0,
        transition: 'opacity 0.2s',
        zIndex: 1,
        display: 'flex',
        gap: 0.25,
      }}
    >
      {isUser && onEdit && (
        <IconButton
          size="small"
          onClick={onEdit}
          aria-label={t('chat.editMessage')}
          sx={actionButtonSx}
        >
          <EditOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
        </IconButton>
      )}
      {!isUser && onRegenerate && (
        <IconButton
          size="small"
          onClick={onRegenerate}
          aria-label={t('chat.regenerate')}
          sx={actionButtonSx}
        >
          <RefreshOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
        </IconButton>
      )}
    </Box>
  );
}

export default MessageActions;
