import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar, Alert } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useConversations } from '../hooks/useConversations';
import { useModels } from '../hooks/useModels';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ChatAppProvider } from '../contexts/ChatAppContext';
import { ModelProvider } from '../contexts/ModelContext';
import Layout from './Layout';
import SearchDialog from './common/SearchDialog';
import { ERROR_SNACKBAR_AUTO_HIDE_MS } from '../constants';

import type { User, ConversationId, ModelId } from '../types';
import { asModelId } from '../types';
import type { ChatAppContextValue } from '../contexts/ChatAppContext';
import type { ModelContextValue } from '../contexts/ModelContext';

interface ChatAppProps {
  user: User;
  onLogout: () => void;
  onRefreshUser: () => void;
}

export default function ChatApp({ user, onLogout, onRefreshUser }: ChatAppProps) {
  const { t } = useTranslation();
  const { conversations, loading: convsLoading, error: convsError, clearError: clearConvsError, refresh, create, remove } = useConversations();
  const { models, error: modelsError, clearError: clearModelsError } = useModels();
  const isOnline = useOnlineStatus();

  const [selectedId, setSelectedId] = useState<ConversationId | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(asModelId('openrouter/free'));
  const [localError, setLocalError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Ref keeps handleNewChat stable when only selectedModel changes
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // Cmd+K / Ctrl+K keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSearchSelect = useCallback((id: ConversationId) => {
    setSelectedId(id);
  }, []);

  const error = convsError || modelsError || localError;

  const clearError = useCallback(() => {
    setLocalError(null);
    if (convsError) clearConvsError();
    if (modelsError) clearModelsError();
  }, [convsError, modelsError, clearConvsError, clearModelsError]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId],
  );

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await create(selectedModelRef.current);
      setSelectedId(conv._id);
    } catch {
      setLocalError(t('errors.createConversation'));
    }
  }, [create, t]);

  const handleDelete = useCallback(
    async (id: ConversationId) => {
      try {
        await remove(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
      } catch {
        setLocalError(t('errors.deleteConversation'));
      }
    },
    [remove, selectedId, t],
  );

  const handleConversationUpdate = useCallback(() => {
    void refresh();
    void onRefreshUser();
  }, [refresh, onRefreshUser]);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);

  const chatContextValue = useMemo<ChatAppContextValue>(
    () => ({
      conversations,
      conversationsLoading: convsLoading,
      selectedConversation,
      userEmail: user.email,
      tokenUsage: user.totalTokensUsed,
      isOnline,
      selectConversation: setSelectedId,
      newChat: handleNewChat,
      deleteConversation: handleDelete,
      onConversationUpdate: handleConversationUpdate,
      openSearch: handleOpenSearch,
      logout: onLogout,
    }),
    [
      conversations,
      convsLoading,
      selectedConversation,
      user.email,
      user.totalTokensUsed,
      isOnline,
      handleNewChat,
      handleDelete,
      handleConversationUpdate,
      handleOpenSearch,
      onLogout,
    ],
  );

  const modelContextValue = useMemo<ModelContextValue>(
    () => ({
      models,
      selectedModel,
      changeModel: setSelectedModel,
    }),
    [models, selectedModel],
  );

  return (
    <>
      <ChatAppProvider value={chatContextValue}>
        <ModelProvider value={modelContextValue}>
          <Layout />
        </ModelProvider>
      </ChatAppProvider>
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" icon={<WifiOffIcon fontSize="inherit" />} variant="filled">
          {t('network.offline')}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={ERROR_SNACKBAR_AUTO_HIDE_MS}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
