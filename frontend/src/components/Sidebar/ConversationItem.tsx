import { useTranslation } from 'react-i18next';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ForkRightIcon from '@mui/icons-material/ForkRight';
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
  const { t, i18n } = useTranslation();
  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          size="small"
          aria-label={t('common.delete')}
          onClick={onDelete}
          className="delete-btn"
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'error.main' },
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      }
      sx={{
        mb: 0.5,
        '&:hover .delete-btn': { opacity: 1 },
      }}
    >
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          borderRadius: 2,
          '&.Mui-selected': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
            '&:hover': {
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
            },
          },
        }}
      >
        <ListItemText
          primary={
            <Typography noWrap variant="body2" fontWeight={selected ? 600 : 400} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {conversation.forkedFrom && (
                <ForkRightIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
              )}
              {conversation.title}
            </Typography>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" noWrap>
              {new Date(conversation.updatedAt).toLocaleDateString(i18n.language)}
            </Typography>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}
