import { useState } from 'react';
import { Box, List, Typography, Divider, CircularProgress } from '@mui/material';
import type { Conversation } from '../../types';
import NewChatButton from './NewChatButton';
import ConversationItem from './ConversationItem';
import ConfirmDialog from '../common/ConfirmDialog';

interface SidebarProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  loading,
  selectedId,
  onSelect,
  onNewChat,
  onDelete,
}: SidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: 2,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, px: 1 }}>
        Simple Chat
      </Typography>

      <NewChatButton onClick={onNewChat} />

      <Divider sx={{ my: 1 }} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : conversations.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', pt: 4 }}
          >
            No conversations yet
          </Typography>
        ) : (
          <List dense disablePadding>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                selected={conv._id === selectedId}
                onClick={() => onSelect(conv._id)}
                onDelete={() => setDeleteTarget(conv._id)}
              />
            ))}
          </List>
        )}
      </Box>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation"
        message="This will permanently delete this conversation and all its messages."
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
