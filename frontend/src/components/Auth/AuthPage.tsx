import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LanguageSwitcher from '../common/LanguageSwitcher';

interface AuthPageProps {
  mode: 'login' | 'register';
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchMode: () => void;
  onClearError: () => void;
}

export default function AuthPage({
  mode,
  error,
  onSubmit,
  onSwitchMode,
  onClearError,
}: AuthPageProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPassword('');
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await onSubmit(email.trim().toLowerCase(), password);
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = mode === 'login';
  const title = isLogin ? t('auth.loginTitle') : t('auth.registerTitle');
  const submitLabel = isLogin ? t('auth.login') : t('auth.register');
  const switchText = isLogin ? t('auth.noAccount') : t('auth.hasAccount');
  const switchLabel = isLogin ? t('auth.register') : t('auth.login');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <ChatBubbleOutlineIcon sx={{ color: 'common.white', fontSize: 28 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('sidebar.title')}
        </Typography>
      </Box>

      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
          {title}
        </Typography>

        {error && (
          <Alert severity="error" onClose={onClearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            slotProps={{ htmlInput: { minLength: isLogin ? undefined : 8 } }}
            helperText={!isLogin ? t('auth.passwordHint') : undefined}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={submitting || !email.trim() || !password}
            sx={{
              py: 1.2,
              background: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #651fff 0%, #2979ff 100%)',
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={22} sx={{ color: 'common.white' }} />
            ) : (
              submitLabel
            )}
          </Button>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: 'center' }}
        >
          {switchText}{' '}
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onSwitchMode}
            sx={{ color: 'primary.light', cursor: 'pointer' }}
          >
            {switchLabel}
          </Link>
        </Typography>
      </Card>

      <Box sx={{ mt: 3 }}>
        <LanguageSwitcher />
      </Box>
    </Box>
  );
}
