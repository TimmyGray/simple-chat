import { useState, useCallback, useMemo, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { useConversations } from './hooks/useConversations';
import { useModels } from './hooks/useModels';
import Layout from './components/Layout';

export default function App() {
  const { conversations, loading: convsLoading, error: convsError, refresh, create, remove } = useConversations();
  const { models, error: modelsError } = useModels();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('openrouter/free');
  const [error, setError] = useState<string | null>(null);

  // Surface hook errors to the Snackbar
  useEffect(() => {
    const hookError = convsError || modelsError;
    if (hookError) setError(hookError);
  }, [convsError, modelsError]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId],
  );

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await create(selectedModel);
      setSelectedId(conv._id);
    } catch (err) {
      setError('Failed to create conversation');
      console.error(err);
    }
  }, [create, selectedModel]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await remove(id);
        if (selectedId === id) {
          setSelectedId(null);
        }
      } catch (err) {
        setError('Failed to delete conversation');
        console.error(err);
      }
    },
    [remove, selectedId],
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
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
