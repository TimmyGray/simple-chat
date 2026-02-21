import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, List, Typography, Divider, CircularProgress, IconButton, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import type { Conversation } from '../../types';
import NewChatButton from './NewChatButton';
import ConversationItem from './ConversationItem';
import ConfirmDialog from '../common/ConfirmDialog';
import LanguageSwitcher from '../common/LanguageSwitcher';

function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return String(tokens);
}

interface SidebarProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  userEmail?: string;
  tokenUsage?: number;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  conversations,
  loading,
  selectedId,
  userEmail,
  tokenUsage,
  onSelect,
  onNewChat,
  onDelete,
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation();
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
        {t('sidebar.title')}
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
            {t('sidebar.noConversations')}
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

      <Divider sx={{ my: 1 }} />
      <LanguageSwitcher />

      {userEmail && onLogout && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  mr: 1,
                }}
              >
                {userEmail}
              </Typography>
              <Tooltip title={t('auth.logout')}>
                <IconButton size="small" onClick={onLogout}>
                  <LogoutIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            {tokenUsage != null && tokenUsage > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {t('sidebar.tokensUsed', { tokens: formatTokenCount(tokenUsage) })}
              </Typography>
            )}
          </Box>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('dialog.deleteTitle')}
        message={t('dialog.deleteMessage')}
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
