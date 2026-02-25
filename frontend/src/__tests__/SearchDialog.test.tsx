import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { asConversationId, asModelId } from '../types';
import type { Conversation } from '../types';
import SearchDialog from '../components/common/SearchDialog';

vi.mock('../api/client', () => ({
  searchConversations: vi.fn(),
}));

import * as api from '../api/client';

const mockResults: Conversation[] = [
  {
    _id: asConversationId('c1'),
    title: 'JavaScript questions',
    model: asModelId('openrouter/free'),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T12:00:00Z',
  },
  {
    _id: asConversationId('c2'),
    title: 'Python tutorial',
    model: asModelId('openrouter/free'),
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
];

function renderSearchDialog(overrides?: { open?: boolean; onClose?: () => void; onSelect?: (id: string) => void }) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    ...overrides,
  };
  return { ...render(
    <ThemeProvider theme={theme}>
      <SearchDialog {...defaultProps} />
    </ThemeProvider>,
  ), ...defaultProps };
}

describe('SearchDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    renderSearchDialog();
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('shows hint text when query is empty', () => {
    renderSearchDialog();
    expect(screen.getByText('Search by title or message content')).toBeInTheDocument();
  });

  it('shows no results message when search returns empty', async () => {
    vi.mocked(api.searchConversations).mockResolvedValue([]);
    const user = userEvent.setup();

    renderSearchDialog();

    const input = screen.getByPlaceholderText('Search conversations...');
    await user.type(input, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No conversations found')).toBeInTheDocument();
    });
  });

  it('displays search results', async () => {
    vi.mocked(api.searchConversations).mockResolvedValue(mockResults);
    const user = userEvent.setup();

    renderSearchDialog();

    const input = screen.getByPlaceholderText('Search conversations...');
    await user.type(input, 'Java');

    await waitFor(() => {
      expect(screen.getByText('JavaScript questions')).toBeInTheDocument();
      expect(screen.getByText('Python tutorial')).toBeInTheDocument();
    });
  });

  it('calls onSelect and onClose when result is clicked', async () => {
    vi.mocked(api.searchConversations).mockResolvedValue(mockResults);
    const user = userEvent.setup();

    const { onSelect, onClose } = renderSearchDialog();

    const input = screen.getByPlaceholderText('Search conversations...');
    await user.type(input, 'Java');

    await waitFor(() => {
      expect(screen.getByText('JavaScript questions')).toBeInTheDocument();
    });

    await user.click(screen.getByText('JavaScript questions'));
    expect(onSelect).toHaveBeenCalledWith(asConversationId('c1'));
    expect(onClose).toHaveBeenCalled();
  });

  it('selects result with Enter key', async () => {
    vi.mocked(api.searchConversations).mockResolvedValue(mockResults);
    const user = userEvent.setup();

    const { onSelect } = renderSearchDialog();

    const input = screen.getByPlaceholderText('Search conversations...');
    await user.type(input, 'Java');

    await waitFor(() => {
      expect(screen.getByText('JavaScript questions')).toBeInTheDocument();
    });

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(asConversationId('c1'));
  });

  it('navigates results with arrow keys', async () => {
    vi.mocked(api.searchConversations).mockResolvedValue(mockResults);
    const user = userEvent.setup();

    const { onSelect } = renderSearchDialog();

    const input = screen.getByPlaceholderText('Search conversations...');
    await user.type(input, 'Java');

    await waitFor(() => {
      expect(screen.getByText('JavaScript questions')).toBeInTheDocument();
    });

    // Arrow down to select second item
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(asConversationId('c2'));
  });

  it('does not render when open is false', () => {
    renderSearchDialog({ open: false });
    expect(screen.queryByPlaceholderText('Search conversations...')).not.toBeInTheDocument();
  });
});
