import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import type { ToolCallEntry } from '../types';
import ToolCallDisplay from '../components/Chat/ToolCallDisplay';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ToolCallDisplay', () => {
  it('renders nothing when toolCalls is empty', () => {
    const { container } = renderWithTheme(<ToolCallDisplay toolCalls={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a loading tool call with spinner', () => {
    const calls: ToolCallEntry[] = [
      { name: 'web_search', arguments: '{"query":"test"}' },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);
    expect(screen.getByText(/web_search/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a completed tool call with check icon', () => {
    const calls: ToolCallEntry[] = [
      {
        name: 'web_search',
        arguments: '{"query":"test"}',
        result: { content: 'Search results here', isError: false },
      },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);
    expect(screen.getByText(/web_search/)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    // Check icon is rendered (CheckCircleIcon uses data-testid by default)
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
  });

  it('renders an error tool call with error icon', () => {
    const calls: ToolCallEntry[] = [
      {
        name: 'file_read',
        arguments: '{"path":"/tmp/test"}',
        result: { content: 'File not found', isError: true },
      },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);
    expect(screen.getByText(/file_read/)).toBeInTheDocument();
    expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
  });

  it('expands to show arguments and result on click', async () => {
    const user = userEvent.setup();
    const calls: ToolCallEntry[] = [
      {
        name: 'calculator',
        arguments: '{"expression":"2+2"}',
        result: { content: '4', isError: false },
      },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);

    // Arguments and result should not be visible initially
    expect(screen.queryByText('Arguments')).not.toBeVisible();

    // Click on the tool call header to expand
    await user.click(screen.getByText(/calculator/));

    // Now arguments and result should be visible
    expect(screen.getByText('Arguments')).toBeVisible();
    expect(screen.getByText('Result')).toBeVisible();
    expect(screen.getByText('"expression": "2+2"', { exact: false })).toBeVisible();
    expect(screen.getByText('4')).toBeVisible();
  });

  it('renders multiple tool calls', () => {
    const calls: ToolCallEntry[] = [
      {
        name: 'web_search',
        arguments: '{"query":"weather"}',
        result: { content: 'Sunny 25C', isError: false },
      },
      { name: 'calculator', arguments: '{"expr":"1+1"}' },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);
    expect(screen.getByText(/web_search/)).toBeInTheDocument();
    expect(screen.getByText(/calculator/)).toBeInTheDocument();
  });

  it('does not show expand button for loading tool call', () => {
    const calls: ToolCallEntry[] = [
      { name: 'web_search', arguments: '{"query":"test"}' },
    ];
    renderWithTheme(<ToolCallDisplay toolCalls={calls} />);

    // Loading tool calls have no expand button
    expect(screen.queryByLabelText('Show details')).not.toBeInTheDocument();
  });
});
