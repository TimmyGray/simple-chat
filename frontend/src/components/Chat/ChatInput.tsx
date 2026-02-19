import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, TextField, IconButton, Tooltip, Paper, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import type { ModelInfo, Attachment } from '../../types';
import ModelSelector from './ModelSelector';
import FileAttachment from './FileAttachment';
import * as api from '../../api/client';

interface ChatInputProps {
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSend: (content: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export default function ChatInput({
  models,
  selectedModel,
  onModelChange,
  onSend,
  disabled,
}: ChatInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    onSend(text || t('chat.filesAttached'), attachments);
    setInput('');
    setAttachments([]);
  }, [input, attachments, onSend, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAttach = async (files: File[]) => {
    setUploading(true);
    try {
      const uploaded = await api.uploadFiles(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      // Upload errors are visible via missing attachments
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = input.trim().length > 0 || attachments.length > 0;

  return (
    <Box sx={{ p: 2, pb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: focused ? 'primary.main' : 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow: (theme) =>
            focused
              ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`
              : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Textarea */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={8}
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          variant="standard"
          slotProps={{
            input: {
              disableUnderline: true,
              sx: {
                px: 2,
                pt: 1.5,
                pb: 0.5,
                fontSize: '0.95rem',
                lineHeight: 1.5,
              },
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: 'transparent',
            },
          }}
        />

        {/* Attachments row */}
        {attachments.length > 0 && (
          <Box
            sx={{
              px: 2,
              pb: 0.5,
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
            }}
          >
            {attachments.map((att, i) => (
              <Chip
                key={att.filePath}
                label={att.fileName}
                size="small"
                onDelete={() => handleRemoveAttachment(i)}
                sx={{ maxWidth: 180 }}
              />
            ))}
          </Box>
        )}

        {/* Toolbar row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            py: 0.75,
            borderTop: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.04)',
          }}
        >
          {/* Left: model selector + attach button */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ModelSelector
              models={models}
              value={selectedModel}
              onChange={onModelChange}
            />
            <FileAttachment
              onAttach={handleAttach}
              disabled={disabled || uploading}
            />
          </Box>

          {/* Right: send button */}
          <Tooltip title={t('chat.sendTooltip')}>
            <span>
              <IconButton
                onClick={handleSend}
                disabled={disabled || !canSend}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                  width: 36,
                  height: 36,
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Paper>
    </Box>
  );
}
