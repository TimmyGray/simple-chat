import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { ChatAppProvider } from '../contexts/ChatAppContext';
import type { ChatAppContextValue } from '../contexts/ChatAppContext';
import Sidebar from '../components/Sidebar/Sidebar';

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

const defaultContext: ChatAppContextValue = {
  conversations: mockConversations,
  conversationsLoading: false,
  models: [],
  selectedConversation: null,
  selectedModel: 'openrouter/free',
  userEmail: undefined,
  tokenUsage: undefined,
  isOnline: true,
  selectConversation: vi.fn(),
  newChat: vi.fn(),
  deleteConversation: vi.fn(),
  changeModel: vi.fn(),
  onConversationUpdate: vi.fn(),
  logout: vi.fn(),
};

function renderSidebar(overrides?: Partial<ChatAppContextValue>) {
  const value = { ...defaultContext, ...overrides };
  return render(
    <ThemeProvider theme={theme}>
      <ChatAppProvider value={value}>
        <Sidebar />
      </ChatAppProvider>
    </ThemeProvider>,
  );
}

describe('Sidebar', () => {
  it('renders conversation list', () => {
    renderSidebar();
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    renderSidebar({ conversations: [], conversationsLoading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    renderSidebar({ conversations: [] });
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('calls newChat when New Chat button is clicked', async () => {
    const user = userEvent.setup();
    const newChat = vi.fn();

    renderSidebar({ newChat });

    await user.click(screen.getByText('New Chat'));
    expect(newChat).toHaveBeenCalled();
  });

  it('calls selectConversation when conversation is clicked', async () => {
    const user = userEvent.setup();
    const selectConversation = vi.fn();

    renderSidebar({ selectConversation });

    await user.click(screen.getByText('First Chat'));
    expect(selectConversation).toHaveBeenCalledWith('c1');
  });

  it('highlights selected conversation', () => {
    renderSidebar({
      selectedConversation: mockConversations[0],
    });
    const firstChat = screen.getByText('First Chat');
    expect(firstChat).toHaveStyle({ fontWeight: 600 });
  });

  it('renders the app title', () => {
    renderSidebar({ conversations: [] });
    expect(screen.getByText('Simple Chat')).toBeInTheDocument();
  });
});
