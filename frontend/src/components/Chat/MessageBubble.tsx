import { lazy, memo, Suspense } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import type { Message } from '../../types';
import {
  AVATAR_SIZE,
  AVATAR_ICON_SIZE,
  MESSAGE_MAX_WIDTH,
  USER_BUBBLE_RADIUS,
  ASSISTANT_BUBBLE_RADIUS,
  MODEL_TAG_OPACITY,
  BLOCKQUOTE_OPACITY,
  CODE_FONT_SIZE,
} from '../../constants';

const LazyMarkdownRenderer = lazy(() => import('./MarkdownRenderer'));

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

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
          <PersonIcon sx={{ fontSize: AVATAR_ICON_SIZE, color: 'common.white' }} />
        ) : (
          <SmartToyIcon sx={{ fontSize: AVATAR_ICON_SIZE, color: 'common.black' }} />
        )}
      </Box>

      {/* Bubble */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          maxWidth: MESSAGE_MAX_WIDTH,
          borderRadius: isUser
            ? USER_BUBBLE_RADIUS
            : ASSISTANT_BUBBLE_RADIUS,
          backgroundColor: (theme) =>
            isUser
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.common.white, 0.05),
          border: '1px solid',
          borderColor: (theme) =>
            isUser
              ? alpha(theme.palette.primary.main, 0.2)
              : theme.palette.divider,
        }}
      >
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ mb: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {message.attachments.map((att) => (
              <Chip
                key={att.filePath}
                label={att.fileName}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Content */}
        {isUser ? (
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
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.1),
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
                border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
                px: 1.5,
                py: 0.75,
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.08),
                fontWeight: 600,
              },
              '& tr:nth-of-type(even)': {
                backgroundColor: (theme) => alpha(theme.palette.common.white, 0.03),
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
  );
}

export default memo(MessageBubble);
