import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, List, Typography, Divider, CircularProgress, IconButton, Tooltip, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import type { ConversationId } from '../../types';
import { useChatApp } from '../../contexts/ChatAppContext';
import NewChatButton from './NewChatButton';
import ConversationItem from './ConversationItem';
import ConfirmDialog from '../common/ConfirmDialog';
import AdminTemplatePanel from '../Admin/AdminTemplatePanel';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ThemeToggle from '../common/ThemeToggle';
import { ICON_SIZE_SM, LOADING_SPINNER_SM } from '../../constants';

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
  onMobileClose?: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const {
    conversations,
    conversationsLoading,
    selectedConversation,
    userEmail,
    tokenUsage,
    isAdmin,
    selectConversation,
    newChat,
    deleteConversation,
    onTemplatesChanged,
    openSearch,
    logout,
  } = useChatApp();

  const [deleteTarget, setDeleteTarget] = useState<ConversationId | null>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const selectedId = selectedConversation?._id ?? null;

  const handleSelect = useCallback(
    (id: ConversationId) => {
      selectConversation(id);
      onMobileClose?.();
    },
    [selectConversation, onMobileClose],
  );

  const handleNewChat = useCallback(() => {
    newChat();
    onMobileClose?.();
  }, [newChat, onMobileClose]);

  return (
    <Box
      component="nav"
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

      <NewChatButton onClick={handleNewChat} />

      <Button
        fullWidth
        variant="outlined"
        startIcon={<SearchIcon />}
        onClick={openSearch}
        sx={{
          mt: 1,
          justifyContent: 'flex-start',
          color: 'text.secondary',
          borderColor: 'divider',
          textTransform: 'none',
          fontWeight: 400,
          fontSize: '0.85rem',
          '&:hover': {
            borderColor: 'text.secondary',
          },
        }}
      >
        {t('search.shortcut')}
        <Typography
          component="span"
          variant="caption"
          sx={{
            ml: 'auto',
            color: 'text.secondary',
            opacity: 0.7,
            fontSize: '0.7rem',
          }}
        >
          {/Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '\u2318K' : 'Ctrl+K'}
        </Typography>
      </Button>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {conversationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
            <CircularProgress size={LOADING_SPINNER_SM} aria-label={t('sidebar.loading')} />
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
                onClick={() => handleSelect(conv._id)}
                onDelete={() => setDeleteTarget(conv._id)}
              />
            ))}
          </List>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />
      <ThemeToggle />
      {isAdmin && (
        <>
          <Divider sx={{ my: 1 }} />
          <Button
            fullWidth
            variant="outlined"
            startIcon={<SettingsOutlinedIcon />}
            onClick={() => setAdminPanelOpen(true)}
            sx={{
              justifyContent: 'flex-start',
              color: 'text.secondary',
              borderColor: 'divider',
              textTransform: 'none',
              fontWeight: 400,
              fontSize: '0.85rem',
              '&:hover': {
                borderColor: 'text.secondary',
              },
            }}
          >
            {t('templates.adminButton')}
          </Button>
        </>
      )}
      <Divider sx={{ my: 1 }} />
      <LanguageSwitcher />

      {userEmail && (
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
                <IconButton size="small" aria-label={t('auth.logout')} onClick={logout}>
                  <LogoutIcon sx={{ fontSize: ICON_SIZE_SM }} />
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
            deleteConversation(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {isAdmin && (
        <AdminTemplatePanel
          open={adminPanelOpen}
          onClose={() => setAdminPanelOpen(false)}
          onTemplatesChanged={onTemplatesChanged}
        />
      )}
    </Box>
  );
}
