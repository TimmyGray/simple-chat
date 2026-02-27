import { lazy, memo, Suspense, useState, useCallback } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useTranslation } from 'react-i18next';
import type { Message, MessageId } from '../../types';
import {
  ICON_SIZE_SM,
  AVATAR_SIZE,
  MESSAGE_MAX_WIDTH,
  MESSAGE_MAX_WIDTH_TABLET,
  USER_BUBBLE_RADIUS,
  ASSISTANT_BUBBLE_RADIUS,
  MODEL_TAG_OPACITY,
  BLOCKQUOTE_OPACITY,
  CODE_FONT_SIZE,
  IMAGE_PREVIEW_MAX_HEIGHT,
} from '../../constants';
import { getUploadUrl, isImageAttachment } from '../../api/client';
import AuthImage from '../common/AuthImage';
import MessageActions from './MessageActions';
import MessageEditForm from './MessageEditForm';
import ToolCallDisplay from './ToolCallDisplay';

const LazyMarkdownRenderer = lazy(() => import('./MarkdownRenderer'));

interface MessageBubbleProps {
  message: Message;
  onEdit?: (messageId: MessageId, content: string) => void;
  onRegenerate?: (messageId: MessageId) => void;
  onFork?: (messageId: MessageId) => void;
  onStop?: () => void;
  isStreaming?: boolean;
}

function MessageBubble({ message, onEdit, onRegenerate, onFork, onStop, isStreaming }: MessageBubbleProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const handleStartEdit = useCallback(() => {
    setEditContent(message.content);
    setEditing(true);
  }, [message.content]);

  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    setEditContent('');
  }, []);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      handleCancelEdit();
      return;
    }
    onEdit?.(message._id, trimmed);
    setEditing(false);
    setEditContent('');
  }, [editContent, message.content, message._id, onEdit, handleCancelEdit]);

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(message._id);
  }, [message._id, onRegenerate]);

  const handleFork = useCallback(() => {
    onFork?.(message._id);
  }, [message._id, onFork]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(message.content).catch(() => { /* non-secure context */ });
  }, [message.content]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit],
  );

  const showIdleActions = !isStreaming && !editing;

  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        gap: 1.5,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: (theme) =>
            isUser
              ? theme.palette.gradients.primary
              : theme.palette.gradients.accent,
        }}
      >
        {isUser ? (
          <PersonIcon sx={{ fontSize: ICON_SIZE_SM, color: 'common.white' }} />
        ) : (
          <SmartToyIcon sx={{ fontSize: ICON_SIZE_SM, color: 'common.black' }} />
        )}
      </Box>

      {/* Bubble + actions wrapper */}
      <Box
        sx={{
          position: 'relative',
          maxWidth: { xs: MESSAGE_MAX_WIDTH_TABLET, lg: MESSAGE_MAX_WIDTH },
          '&:hover .message-actions': { opacity: 1 },
        }}
      >
        {/* Stop button during streaming (always visible) */}
        {isStreaming && (
          <MessageActions
            isUser={isUser}
            isStreaming
            onStop={onStop}
          />
        )}
        {/* Idle action buttons (hover overlay) */}
        {showIdleActions && (
          <MessageActions
            isUser={isUser}
            onEdit={onEdit ? handleStartEdit : undefined}
            onRegenerate={onRegenerate ? handleRegenerate : undefined}
            onFork={onFork ? handleFork : undefined}
            onCopy={handleCopy}
          />
        )}

        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: isUser
              ? USER_BUBBLE_RADIUS
              : ASSISTANT_BUBBLE_RADIUS,
            backgroundColor: (theme) =>
              isUser
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.text.primary, 0.05),
            border: '1px solid',
            borderColor: (theme) =>
              isUser
                ? alpha(theme.palette.primary.main, 0.2)
                : theme.palette.divider,
          }}
        >
          {/* Image attachments */}
          {message.attachments?.some(isImageAttachment) && (
            <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {message.attachments.filter(isImageAttachment).map((att) => (
                <AuthImage
                  key={att.filePath}
                  src={getUploadUrl(att.filePath)}
                  alt={att.fileName}
                  maxHeight={IMAGE_PREVIEW_MAX_HEIGHT}
                />
              ))}
            </Box>
          )}
          {/* Non-image attachments */}
          {message.attachments?.some((a) => !isImageAttachment(a)) && (
            <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {message.attachments.filter((a) => !isImageAttachment(a)).map((att) => (
                <Chip
                  key={att.filePath}
                  label={att.fileName}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          {/* Tool calls (assistant messages only) */}
          {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
            <ToolCallDisplay toolCalls={message.toolCalls} />
          )}

          {/* Content */}
          {editing ? (
            <MessageEditForm
              editContent={editContent}
              onEditContentChange={setEditContent}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onKeyDown={handleEditKeyDown}
            />
          ) : isUser ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          ) : (
            <Box
              sx={{
                '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                '& pre': { m: 0, mb: 1 },
                '& code': {
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  fontSize: CODE_FONT_SIZE,
                },
                '& p code': {
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.1),
                  px: 0.5,
                  borderRadius: 0.5,
                },
                '& a': { color: 'primary.light' },
                '& table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  mb: 1,
                  fontSize: CODE_FONT_SIZE,
                },
                '& th, & td': {
                  border: (theme) => `1px solid ${alpha(theme.palette.text.primary, 0.15)}`,
                  px: 1.5,
                  py: 0.75,
                  textAlign: 'left',
                },
                '& th': {
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08),
                  fontWeight: 600,
                },
                '& tr:nth-of-type(even)': {
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.03),
                },
                '& ul, & ol': { pl: 2, mb: 1 },
                '& blockquote': {
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  pl: 1.5,
                  ml: 0,
                  opacity: BLOCKQUOTE_OPACITY,
                },
              }}
            >
              <Suspense
                fallback={
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                }
              >
                <LazyMarkdownRenderer content={message.content} />
              </Suspense>
            </Box>
          )}

          {/* Edited indicator */}
          {isUser && message.isEdited && !editing && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, opacity: MODEL_TAG_OPACITY }}
            >
              {t('chat.edited')}
            </Typography>
          )}

          {/* Model tag for assistant */}
          {!isUser && message.model && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5, opacity: MODEL_TAG_OPACITY }}
            >
              {message.model}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default memo(MessageBubble);
