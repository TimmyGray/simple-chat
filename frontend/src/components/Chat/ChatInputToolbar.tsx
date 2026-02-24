import { useTranslation } from 'react-i18next';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import type { ModelInfo, ModelId } from '../../types';
import ModelSelector from './ModelSelector';
import FileAttachment from './FileAttachment';
import { SEND_BUTTON_SIZE } from '../../constants';

interface ChatInputToolbarProps {
  models: ModelInfo[];
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  onAttach: (files: File[]) => Promise<void>;
  onAttachError: (message: string) => void;
  onSend: () => void;
  disabled?: boolean;
  uploading?: boolean;
  canSend: boolean;
}

export default function ChatInputToolbar({
  models,
  selectedModel,
  onModelChange,
  onAttach,
  onAttachError,
  onSend,
  disabled,
  uploading,
  canSend,
}: ChatInputToolbarProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 1,
        py: 0.75,
        borderTop: '1px solid',
        borderColor: (theme) => alpha(theme.palette.text.primary, 0.04),
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
          onAttach={onAttach}
          onError={onAttachError}
          disabled={disabled || uploading}
        />
      </Box>

      {/* Right: send button */}
      <Tooltip title={t('chat.sendTooltip')}>
        <span>
          <IconButton
            aria-label={t('chat.sendTooltip')}
            onClick={onSend}
            disabled={disabled || !canSend}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
              width: SEND_BUTTON_SIZE,
              height: SEND_BUTTON_SIZE,
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
