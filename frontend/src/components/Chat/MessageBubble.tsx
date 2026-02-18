import { Box, Typography, Paper, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        mb: 2,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: isUser
            ? 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)'
            : 'linear-gradient(135deg, #00e5ff 0%, #1de9b6 100%)',
        }}
      >
        {isUser ? (
          <PersonIcon sx={{ fontSize: 18, color: '#fff' }} />
        ) : (
          <SmartToyIcon sx={{ fontSize: 18, color: '#000' }} />
        )}
      </Box>

      {/* Bubble */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          maxWidth: '75%',
          borderRadius: isUser
            ? '16px 16px 4px 16px'
            : '16px 16px 16px 4px',
          backgroundColor: isUser
            ? 'rgba(124, 77, 255, 0.12)'
            : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid',
          borderColor: isUser
            ? 'rgba(124, 77, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.08)',
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
                fontSize: '0.85rem',
              },
              '& p code': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                px: 0.5,
                borderRadius: 0.5,
              },
              '& a': { color: 'primary.light' },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                mb: 1,
                fontSize: '0.85rem',
              },
              '& th, & td': {
                border: '1px solid rgba(255, 255, 255, 0.15)',
                px: 1.5,
                py: 0.75,
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                fontWeight: 600,
              },
              '& tr:nth-of-type(even)': {
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
              },
              '& ul, & ol': { pl: 2, mb: 1 },
              '& blockquote': {
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                pl: 1.5,
                ml: 0,
                opacity: 0.8,
              },
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  const inline = !match;
                  return !inline ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        borderRadius: 8,
                        fontSize: '0.85rem',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </Box>
        )}

        {/* Model tag for assistant */}
        {!isUser && message.model && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5, opacity: 0.6 }}
          >
            {message.model}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
