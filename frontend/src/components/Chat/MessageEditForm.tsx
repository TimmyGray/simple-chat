import { Box, IconButton, TextField } from '@mui/material';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { useTranslation } from 'react-i18next';
import {
  MESSAGE_ACTION_ICON_SIZE,
  MESSAGE_ACTION_BUTTON_SIZE,
} from '../../constants';

interface MessageEditFormProps {
  editContent: string;
  onEditContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

function MessageEditForm({
  editContent,
  onEditContentChange,
  onSave,
  onCancel,
  onKeyDown,
}: MessageEditFormProps) {
  const { t } = useTranslation();

  return (
    <Box>
      <TextField
        multiline
        fullWidth
        size="small"
        value={editContent}
        onChange={(e) => onEditContentChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        sx={{
          '& .MuiInputBase-root': {
            fontSize: '0.875rem',
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, justifyContent: 'flex-end' }}>
        <IconButton
          size="small"
          onClick={onCancel}
          aria-label={t('chat.cancelEdit')}
          sx={{
            width: MESSAGE_ACTION_BUTTON_SIZE,
            height: MESSAGE_ACTION_BUTTON_SIZE,
          }}
        >
          <CloseOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={onSave}
          aria-label={t('chat.saveEdit')}
          color="primary"
          sx={{
            width: MESSAGE_ACTION_BUTTON_SIZE,
            height: MESSAGE_ACTION_BUTTON_SIZE,
          }}
        >
          <CheckOutlined sx={{ fontSize: MESSAGE_ACTION_ICON_SIZE }} />
        </IconButton>
      </Box>
    </Box>
  );
}

export default MessageEditForm;
