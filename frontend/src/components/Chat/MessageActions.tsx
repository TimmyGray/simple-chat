import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ForkRightOutlined from '@mui/icons-material/ForkRightOutlined';
import { useTranslation } from 'react-i18next';
import {
  MESSAGE_ACTION_ICON_SIZE,
  MESSAGE_ACTION_BUTTON_SIZE,
  COPIED_FEEDBACK_MS,
} from '../../constants';

interface MessageActionsProps {
  isUser: boolean;
  isStreaming?: boolean;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  onCopy?: () => void;
  onFork?: () => void;
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

function MessageActions({
  isUser,
  isStreaming,
  onEdit,
  onRegenerate,
  onStop,
  onCopy,
  onFork,
}: MessageActionsProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(() => {
    onCopy?.();
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, [onCopy]);

  if (isStreaming) {
    return (
      <Box
        className="message-actions"
        sx={{
          position: 'absolute',
          top: -4,
          right: -4,
          opacity: 1,
          zIndex: 1,
          display: 'flex',
          gap: 0.25,
        }}
      >
        {onStop && (
          <IconButton
            size="small"
            onClick={onStop}
            aria-label={t('chat.stopGenerating')}
            sx={actionButtonSx}
          >
            <StopOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
          </IconButton>
        )}
      </Box>
    );
  }

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
      {onFork && (
        <IconButton
          size="small"
          onClick={onFork}
          aria-label={t('chat.forkConversation')}
          sx={actionButtonSx}
        >
          <ForkRightOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
        </IconButton>
      )}
      {onCopy && (
        <IconButton
          size="small"
          onClick={handleCopy}
          aria-label={copied ? t('chat.copied') : t('chat.copyMessage')}
          sx={actionButtonSx}
        >
          {copied ? (
            <CheckOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE, color: 'success.main' }} />
          ) : (
            <ContentCopyOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
          )}
        </IconButton>
      )}
    </Box>
  );
}

export default MessageActions;
