import { useTranslation } from 'react-i18next';
import { Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { SHORTCUT_HINT_FONT_SIZE, SHORTCUT_HINT_OPACITY } from '../../constants';

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

interface NewChatButtonProps {
  onClick: () => void;
}

export default function NewChatButton({ onClick }: NewChatButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      fullWidth
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onClick}
      sx={{
        py: 1.2,
        mb: 1,
        background: (theme) => theme.palette.gradients.primary,
        '&:hover': {
          background: (theme) => theme.palette.gradients.primaryHover,
        },
      }}
    >
      {t('sidebar.newChat')}
      <Typography
        component="span"
        variant="caption"
        sx={{
          ml: 'auto',
          opacity: SHORTCUT_HINT_OPACITY,
          fontSize: SHORTCUT_HINT_FONT_SIZE,
        }}
      >
        {isMac ? '\u2318N' : 'Ctrl+N'}
      </Typography>
    </Button>
  );
}
