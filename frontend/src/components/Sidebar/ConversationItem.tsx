import { useTranslation } from 'react-i18next';
import {
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function ConversationItem({
  conversation,
  selected,
  onClick,
  onDelete,
}: ConversationItemProps) {
  const { i18n } = useTranslation();
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: 'rgba(124, 77, 255, 0.12)',
          '&:hover': {
            backgroundColor: 'rgba(124, 77, 255, 0.18)',
          },
        },
        '& .delete-btn': { opacity: 0 },
        '&:hover .delete-btn': { opacity: 1 },
      }}
    >
      <ListItemText
        primary={
          <Typography noWrap variant="body2" fontWeight={selected ? 600 : 400}>
            {conversation.title}
          </Typography>
        }
        secondary={
          <Typography variant="caption" color="text.secondary" noWrap>
            {new Date(conversation.updatedAt).toLocaleDateString(i18n.language)}
          </Typography>
        }
      />
      <Box className="delete-btn" sx={{ transition: 'opacity 0.2s' }}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    </ListItemButton>
  );
}
