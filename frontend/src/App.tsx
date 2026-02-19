import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { useConversations } from './hooks/useConversations';
import { useModels } from './hooks/useModels';
import Layout from './components/Layout';

export default function App() {
  const { t } = useTranslation();
  const { conversations, loading: convsLoading, error: convsError, refresh, create, remove } = useConversations();
  const { models, error: modelsError } = useModels();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('openrouter/free');
  const [localError, setLocalError] = useState<string | null>(null);

  // Derive displayed error from hook errors or local errors
  const error = convsError || modelsError || localError;

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId],
  );

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await create(selectedModel);
      setSelectedId(conv._id);
    } catch (err) {
      setLocalError(t('errors.createConversation'));
      console.error(err);
    }
  }, [create, selectedModel, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
      } catch (err) {
        setLocalError(t('errors.deleteConversation'));
        console.error(err);
      }
    },
    [remove, selectedId, t],
  );

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout
          conversations={conversations}
          conversationsLoading={convsLoading}
          models={models}
          selectedConversation={selectedConversation}
          selectedModel={selectedModel}
          onSelectConversation={setSelectedId}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDelete}
          onModelChange={setSelectedModel}
          onConversationUpdate={refresh}
        />
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setLocalError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setLocalError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
