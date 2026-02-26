import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, TextField, Paper, Chip, Typography, Snackbar, Alert, IconButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import type { ModelInfo, Attachment, ModelId, Template, TemplateId } from '../../types';
import ChatInputToolbar from './ChatInputToolbar';
import * as api from '../../api/client';
import AuthImage from '../common/AuthImage';
import { ATTACHMENT_CHIP_MAX_WIDTH, SNACKBAR_AUTO_HIDE_MS, INPUT_FONT_SIZE, IMAGE_THUMB_SIZE } from '../../constants';

const MAX_MESSAGE_LENGTH = 10_000;

interface ChatInputProps {
  models: ModelInfo[];
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  templates: Template[];
  selectedTemplateId: TemplateId | null;
  onTemplateChange: (templateId: TemplateId | null) => void;
  onSend: (content: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export default function ChatInput({
  models,
  selectedModel,
  onModelChange,
  templates,
  selectedTemplateId,
  onTemplateChange,
  onSend,
  disabled,
}: ChatInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const overLimit = input.length > MAX_MESSAGE_LENGTH;

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || overLimit) return;

    onSend(text || t('chat.filesAttached'), attachments);
    setInput('');
    setAttachments([]);
    inputRef.current?.focus();
  }, [input, attachments, onSend, t, overLimit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const handleFileError = useCallback((message: string) => {
    setUploadError(message);
  }, []);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const handleAttach = async (files: File[]) => {
    setUploading(true);
    setUploadError(null);
    try {
      const uploaded = await api.uploadFiles(files);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch {
      setUploadError(t('errors.filesNotAttached'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const showCounter = input.length >= MAX_MESSAGE_LENGTH * 0.9;
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !overLimit;

  return (
    <Box sx={{ p: 2, pb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: focused ? 'primary.main' : 'divider',
          backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.03),
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
          inputRef={inputRef}
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
                fontSize: INPUT_FONT_SIZE,
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

        {/* Image attachment previews */}
        {attachments.some(api.isImageAttachment) && (
          <Box sx={{ px: 2, pb: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {attachments.map((att, i) =>
              api.isImageAttachment(att) ? (
                <Box key={att.filePath} sx={{ position: 'relative' }}>
                  <AuthImage
                    src={api.getUploadUrl(att.filePath)}
                    alt={att.fileName}
                    maxHeight={IMAGE_THUMB_SIZE}
                    maxWidth={IMAGE_THUMB_SIZE}
                    borderRadius={6}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttachment(i)}
                    aria-label={t('common.delete')}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      backgroundColor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ) : null,
            )}
          </Box>
        )}
        {/* Non-image attachment chips */}
        {attachments.some((a) => !api.isImageAttachment(a)) && (
          <Box sx={{ px: 2, pb: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {attachments.map((att, i) =>
              !api.isImageAttachment(att) ? (
                <Chip
                  key={att.filePath}
                  label={att.fileName}
                  size="small"
                  onDelete={() => handleRemoveAttachment(i)}
                  sx={{ maxWidth: ATTACHMENT_CHIP_MAX_WIDTH }}
                />
              ) : null,
            )}
          </Box>
        )}

        {/* Character counter */}
        {showCounter && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              pb: 0.5,
              textAlign: 'right',
              color: overLimit ? 'error.main' : 'text.secondary',
            }}
          >
            {t('chat.charCount', { current: input.length, max: MAX_MESSAGE_LENGTH })}
          </Typography>
        )}

        {/* Toolbar row */}
        <ChatInputToolbar
          models={models}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onTemplateChange={onTemplateChange}
          onAttach={handleAttach}
          onAttachError={handleFileError}
          onSend={handleSend}
          disabled={disabled}
          uploading={uploading}
          canSend={canSend}
        />
      </Paper>
      <Snackbar
        open={!!uploadError}
        autoHideDuration={SNACKBAR_AUTO_HIDE_MS}
        onClose={clearUploadError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearUploadError}>
          {uploadError}
        </Alert>
      </Snackbar>
    </Box>
  );
}
