import { memo, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Collapse, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import type { ToolCallEntry } from '../../types';
import {
  TOOL_CALL_ICON_SIZE,
  TOOL_CALL_SPINNER_SIZE,
  TOOL_RESULT_MAX_HEIGHT,
} from '../../constants';

interface ToolCallDisplayProps {
  toolCalls: ToolCallEntry[];
}

function ToolCallItem({ entry }: { entry: ToolCallEntry }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLoading = !entry.result;
  const isError = entry.result?.isError ?? false;

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: '1px solid',
        borderColor: (theme) =>
          isError
            ? alpha(theme.palette.error.main, 0.3)
            : alpha(theme.palette.text.primary, 0.1),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.5,
          py: 0.75,
          cursor: entry.result ? 'pointer' : 'default',
          backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.03),
          '&:hover': entry.result
            ? { backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.06) }
            : {},
        }}
        onClick={entry.result ? toggleExpanded : undefined}
      >
        {isLoading ? (
          <CircularProgress size={TOOL_CALL_SPINNER_SIZE} />
        ) : isError ? (
          <ErrorIcon sx={{ fontSize: TOOL_CALL_ICON_SIZE, color: 'error.main' }} />
        ) : (
          <CheckCircleIcon sx={{ fontSize: TOOL_CALL_ICON_SIZE, color: 'success.main' }} />
        )}
        <BuildIcon sx={{ fontSize: TOOL_CALL_ICON_SIZE, opacity: 0.6 }} />
        <Typography variant="caption" sx={{ fontWeight: 600, flex: 1 }}>
          {isLoading
            ? t('tools.calling', { name: entry.name })
            : isError
              ? t('tools.error', { name: entry.name })
              : t('tools.completed', { name: entry.name })}
        </Typography>
        {entry.result && (
          <IconButton size="small" sx={{ p: 0.25 }} aria-label={expanded ? t('tools.hideDetails') : t('tools.showDetails')}>
            <ExpandMoreIcon
              sx={{
                fontSize: TOOL_CALL_ICON_SIZE,
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderTop: '1px solid',
            borderColor: (theme) => alpha(theme.palette.text.primary, 0.08),
          }}
        >
          {entry.arguments && (
            <Box sx={{ mb: entry.result ? 1 : 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('tools.arguments')}
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.5,
                  p: 1,
                  borderRadius: 0.5,
                  backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.05),
                  fontSize: '0.75rem',
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  overflow: 'auto',
                  maxHeight: TOOL_RESULT_MAX_HEIGHT,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {formatJson(entry.arguments)}
              </Box>
            </Box>
          )}
          {entry.result && (
            <Box>
              <Typography
                variant="caption"
                color={isError ? 'error.main' : 'text.secondary'}
                sx={{ fontWeight: 600 }}
              >
                {t('tools.result')}
              </Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  mt: 0.5,
                  p: 1,
                  borderRadius: 0.5,
                  backgroundColor: (theme) =>
                    isError
                      ? alpha(theme.palette.error.main, 0.05)
                      : alpha(theme.palette.text.primary, 0.05),
                  fontSize: '0.75rem',
                  fontFamily: '"Fira Code", "Consolas", monospace',
                  overflow: 'auto',
                  maxHeight: TOOL_RESULT_MAX_HEIGHT,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {entry.result.content}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

function formatJson(jsonString: string): string {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
}

function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  if (toolCalls.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
      {toolCalls.map((entry, index) => (
        <ToolCallItem key={`${entry.name}-${index}`} entry={entry} />
      ))}
    </Box>
  );
}

export default memo(ToolCallDisplay);
