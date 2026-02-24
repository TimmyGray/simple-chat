import { useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import ChatApp from './components/ChatApp';
import AuthPage from './components/Auth/AuthPage';

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
