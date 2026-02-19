import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import i18n from '../i18n';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: 2,
            p: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" color="error">
            {i18n.t('errors.somethingWrong')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
            {this.state.error?.message || i18n.t('errors.unexpected')}
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            {i18n.t('common.tryAgain')}
          </Button>
          <Button variant="text" onClick={() => window.location.reload()}>
            {i18n.t('common.reloadPage')}
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
