import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Snackbar, Alert } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useConversations } from '../hooks/useConversations';
import { useModels } from '../hooks/useModels';
import { useTemplates } from '../hooks/useTemplates';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ChatAppProvider } from '../contexts/ChatAppContext';
import { ModelProvider } from '../contexts/ModelContext';
import { TemplateProvider } from '../contexts/TemplateContext';
import Layout from './Layout';
import SearchDialog from './common/SearchDialog';
import { ERROR_SNACKBAR_AUTO_HIDE_MS } from '../constants';

import type { User, ConversationId, MessageId, ModelId, TemplateId } from '../types';
import { asModelId } from '../types';
import type { ChatAppContextValue } from '../contexts/ChatAppContext';
import type { ModelContextValue } from '../contexts/ModelContext';
import type { TemplateContextValue } from '../contexts/TemplateContext';

interface ChatAppProps {
  user: User;
  onLogout: () => void;
  onRefreshUser: () => void;
}

export default function ChatApp({ user, onLogout, onRefreshUser }: ChatAppProps) {
  const { t } = useTranslation();
  const { conversations, loading: convsLoading, error: convsError, clearError: clearConvsError, refresh, create, remove, fork } = useConversations();
  const { models, error: modelsError, clearError: clearModelsError } = useModels();
  const { templates, error: templatesError, clearError: clearTemplatesError, refresh: refreshTemplates } = useTemplates();
  const isOnline = useOnlineStatus();

  const [selectedId, setSelectedId] = useState<ConversationId | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelId>(asModelId('openrouter/free'));
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Refs keep handleNewChat stable when only selectedModel/template changes
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  const selectedTemplateRef = useRef(selectedTemplateId);
  useEffect(() => {
    selectedTemplateRef.current = selectedTemplateId;
  }, [selectedTemplateId]);

  // Select conversation and sync template selector to match
  const handleSelectConversation = useCallback((id: ConversationId | null) => {
    setSelectedId(id);
    const conv = id ? conversations.find((c) => c._id === id) : null;
    setSelectedTemplateId(conv?.templateId ?? null);
  }, [conversations]);

  const handleSearchSelect = useCallback((id: ConversationId) => {
    handleSelectConversation(id);
  }, [handleSelectConversation]);

  const error = convsError || modelsError || templatesError || localError;

  const clearError = useCallback(() => {
    setLocalError(null);
    if (convsError) clearConvsError();
    if (modelsError) clearModelsError();
    if (templatesError) clearTemplatesError();
  }, [convsError, modelsError, templatesError, clearConvsError, clearModelsError, clearTemplatesError]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId],
  );

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await create(selectedModelRef.current, selectedTemplateRef.current);
      handleSelectConversation(conv._id);
    } catch {
      setLocalError(t('errors.createConversation'));
    }
  }, [create, handleSelectConversation, t]);

  // Global keyboard shortcuts: Cmd+K (search), Cmd+N (new chat)
  // Cmd+N overrides browser "new window" — matches Slack/Notion convention
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'n') {
        e.preventDefault();
        void handleNewChat();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleNewChat]);

  const handleDelete = useCallback(
    async (id: ConversationId) => {
      try {
        await remove(id);
        if (selectedId === id) {
          handleSelectConversation(null);
        }
      } catch {
        setLocalError(t('errors.deleteConversation'));
      }
    },
    [remove, selectedId, handleSelectConversation, t],
  );

  const handleForkConversation = useCallback(
    async (conversationId: ConversationId, messageId: MessageId) => {
      try {
        const forked = await fork(conversationId, messageId);
        handleSelectConversation(forked._id);
      } catch {
        setLocalError(t('errors.forkConversation'));
      }
    },
    [fork, handleSelectConversation, t],
  );

  const handleConversationUpdate = useCallback(() => {
    void refresh();
    void onRefreshUser();
  }, [refresh, onRefreshUser]);

  const handleOpenSearch = useCallback(() => setSearchOpen(true), []);

  const handleTemplatesChanged = useCallback(() => {
    void refreshTemplates();
  }, [refreshTemplates]);

  const chatContextValue = useMemo<ChatAppContextValue>(
    () => ({
      conversations,
      conversationsLoading: convsLoading,
      selectedConversation,
      userEmail: user.email,
      tokenUsage: user.totalTokensUsed,
      isAdmin: !!user.isAdmin,
      isOnline,
      selectConversation: handleSelectConversation,
      newChat: handleNewChat,
      deleteConversation: handleDelete,
      forkConversation: handleForkConversation,
      onConversationUpdate: handleConversationUpdate,
      onTemplatesChanged: handleTemplatesChanged,
      openSearch: handleOpenSearch,
      logout: onLogout,
    }),
    [
      conversations,
      convsLoading,
      selectedConversation,
      user.email,
      user.totalTokensUsed,
      user.isAdmin,
      isOnline,
      handleSelectConversation,
      handleNewChat,
      handleDelete,
      handleForkConversation,
      handleConversationUpdate,
      handleTemplatesChanged,
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

  const templateContextValue = useMemo<TemplateContextValue>(
    () => ({
      templates,
      selectedTemplateId,
      changeTemplate: setSelectedTemplateId,
    }),
    [templates, selectedTemplateId],
  );

  return (
    <>
      <ChatAppProvider value={chatContextValue}>
        <ModelProvider value={modelContextValue}>
          <TemplateProvider value={templateContextValue}>
            <Layout />
          </TemplateProvider>
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
