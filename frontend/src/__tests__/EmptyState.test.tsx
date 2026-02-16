import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import EmptyState from '../components/common/EmptyState';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    render(
      <ThemeProvider theme={theme}>
        <EmptyState />
      </ThemeProvider>,
    );
    expect(screen.getByText('No conversation selected')).toBeInTheDocument();
    expect(
      screen.getByText('Start a new chat or select an existing one'),
    ).toBeInTheDocument();
  });
});
