import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import Sidebar from '../components/Sidebar/Sidebar';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockConversations = [
  {
    _id: 'c1',
    title: 'First Chat',
    model: 'openrouter/free',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T12:00:00Z',
  },
  {
    _id: 'c2',
    title: 'Second Chat',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T12:00:00Z',
  },
];

describe('Sidebar', () => {
  it('renders conversation list', () => {
    renderWithTheme(
      <Sidebar
        conversations={mockConversations}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    renderWithTheme(
      <Sidebar
        conversations={[]}
        loading={true}
        selectedId={null}
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    renderWithTheme(
      <Sidebar
        conversations={[]}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('calls onNewChat when New Chat button is clicked', async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();

    renderWithTheme(
      <Sidebar
        conversations={mockConversations}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
        onNewChat={onNewChat}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText('New Chat'));
    expect(onNewChat).toHaveBeenCalled();
  });

  it('calls onSelect when conversation is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithTheme(
      <Sidebar
        conversations={mockConversations}
        loading={false}
        selectedId={null}
        onSelect={onSelect}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByText('First Chat'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('highlights selected conversation', () => {
    renderWithTheme(
      <Sidebar
        conversations={mockConversations}
        loading={false}
        selectedId="c1"
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    // Check that the title "First Chat" has fontWeight 600 (selected)
    const firstChat = screen.getByText('First Chat');
    expect(firstChat).toHaveStyle({ fontWeight: 600 });
  });

  it('renders the app title', () => {
    renderWithTheme(
      <Sidebar
        conversations={[]}
        loading={false}
        selectedId={null}
        onSelect={vi.fn()}
        onNewChat={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Simple Chat')).toBeInTheDocument();
  });
});
