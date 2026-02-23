import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, CssBaseline, Snackbar, Alert, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { useConversations } from './hooks/useConversations';
import { useModels } from './hooks/useModels';
import { ChatAppProvider } from './contexts/ChatAppContext';
import Layout from './components/Layout';
import AuthPage from './components/Auth/AuthPage';

import type { User } from './types';
import type { ChatAppContextValue } from './contexts/ChatAppContext';

interface ChatAppProps {
  user: User;
  onLogout: () => void;
  onRefreshUser: () => void;
}

function ChatApp({ user, onLogout, onRefreshUser }: ChatAppProps) {
  const { t } = useTranslation();
  const { conversations, loading: convsLoading, error: convsError, clearError: clearConvsError, refresh, create, remove } = useConversations();
  const { models, error: modelsError, clearError: clearModelsError } = useModels();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('openrouter/free');
  const [localError, setLocalError] = useState<string | null>(null);

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
      const conv = await create(selectedModel);
      setSelectedId(conv._id);
    } catch {
      setLocalError(t('errors.createConversation'));
    }
  }, [create, selectedModel, t]);

  const handleDelete = useCallback(
    async (id: string) => {
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
    refresh();
    onRefreshUser();
  }, [refresh, onRefreshUser]);

  const contextValue = useMemo<ChatAppContextValue>(
    () => ({
      conversations,
      conversationsLoading: convsLoading,
      models,
      selectedConversation,
      selectedModel,
      userEmail: user.email,
      tokenUsage: user.totalTokensUsed,
      selectConversation: setSelectedId,
      newChat: handleNewChat,
      deleteConversation: handleDelete,
      changeModel: setSelectedModel,
      onConversationUpdate: handleConversationUpdate,
      logout: onLogout,
    }),
    [
      conversations,
      convsLoading,
      models,
      selectedConversation,
      selectedModel,
      user.email,
      user.totalTokensUsed,
      handleNewChat,
      handleDelete,
      handleConversationUpdate,
      onLogout,
    ],
  );

  return (
    <>
      <ChatAppProvider value={contextValue}>
        <Layout />
      </ChatAppProvider>
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
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

export default function App() {
  const { user, loading: authLoading, error: authError, clearError: clearAuthError, login, register, logout, refreshUser } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleSwitchMode = useCallback(() => {
    clearAuthError();
    setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'));
  }, [clearAuthError]);

  const handleSubmit = useCallback(
    async (email: string, password: string) => {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
    },
    [authMode, login, register],
  );

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {authLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100vh',
              backgroundColor: 'background.default',
            }}
          >
            <CircularProgress />
          </Box>
        ) : user ? (
          <ChatApp user={user} onLogout={logout} onRefreshUser={refreshUser} />
        ) : (
          <AuthPage
            mode={authMode}
            error={authError}
            onSubmit={handleSubmit}
            onSwitchMode={handleSwitchMode}
            onClearError={clearAuthError}
          />
        )}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
