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
        background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #651fff 0%, #2979ff 100%)',
        },
      }}
    >
      {t('sidebar.newChat')}
    </Button>
  );
}
