import { useTranslation } from 'react-i18next';
import { Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { IS_MAC_PLATFORM, SHORTCUT_HINT_FONT_SIZE, SHORTCUT_HINT_OPACITY } from '../../constants';

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
        {IS_MAC_PLATFORM ? '\u2318N' : 'Ctrl+N'}
      </Typography>
    </Button>
  );
}
