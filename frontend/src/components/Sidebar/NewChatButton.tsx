import { useTranslation } from 'react-i18next';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

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
    </Button>
  );
}
