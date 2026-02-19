import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import AuthPage from '../components/Auth/AuthPage';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('AuthPage', () => {
  it('renders login form by default', () => {
    renderWithTheme(
      <AuthPage
        mode="login"
        error={null}
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders register form', () => {
    renderWithTheme(
      <AuthPage
        mode="register"
        error={null}
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );
    expect(screen.getByText('Create account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('calls onSubmit with email and password', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(
      <AuthPage
        mode="login"
        error={null}
        onSubmit={onSubmit}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error alert when error prop is set', () => {
    renderWithTheme(
      <AuthPage
        mode="login"
        error="Invalid email or password"
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('calls onSwitchMode when link is clicked', async () => {
    const user = userEvent.setup();
    const onSwitchMode = vi.fn();

    renderWithTheme(
      <AuthPage
        mode="login"
        error={null}
        onSubmit={vi.fn()}
        onSwitchMode={onSwitchMode}
        onClearError={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Sign up'));
    expect(onSwitchMode).toHaveBeenCalled();
  });

  it('disables submit button when fields are empty', () => {
    renderWithTheme(
      <AuthPage
        mode="login"
        error={null}
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
  });

  it('shows the app logo and name', () => {
    renderWithTheme(
      <AuthPage
        mode="login"
        error={null}
        onSubmit={vi.fn()}
        onSwitchMode={vi.fn()}
        onClearError={vi.fn()}
      />,
    );
    expect(screen.getByText('Simple Chat')).toBeInTheDocument();
  });
});
