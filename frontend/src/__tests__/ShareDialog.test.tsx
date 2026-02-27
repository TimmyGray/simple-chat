import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { asConversationId } from '../types';
import ShareDialog from '../components/Chat/ShareDialog';

const mockFetchParticipants = vi.fn();
const mockInvite = vi.fn();
const mockRevoke = vi.fn();
const mockClearError = vi.fn();

vi.mock('../hooks/useSharing', () => ({
  useSharing: () => ({
    participants: mockParticipants,
    loading: mockLoading,
    inviting: mockInviting,
    error: mockError,
    clearError: mockClearError,
    fetchParticipants: mockFetchParticipants,
    invite: mockInvite,
    revoke: mockRevoke,
  }),
}));

let mockParticipants = [
  { userId: 'u1', email: 'alice@example.com', role: 'editor' as const, addedAt: '2026-01-01T00:00:00Z' },
  { userId: 'u2', email: 'bob@example.com', role: 'viewer' as const, addedAt: '2026-01-02T00:00:00Z' },
];
let mockLoading = false;
let mockInviting = false;
let mockError: string | null = null;

function renderShareDialog(overrides?: { currentUserId?: string; open?: boolean }) {
  return render(
    <ThemeProvider theme={theme}>
      <ShareDialog
        open={overrides?.open ?? true}
        conversationId={asConversationId('conv1')}
        currentUserId={overrides?.currentUserId ?? 'u1'}
        onClose={vi.fn()}
      />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockParticipants = [
    { userId: 'u1', email: 'alice@example.com', role: 'editor' as const, addedAt: '2026-01-01T00:00:00Z' },
    { userId: 'u2', email: 'bob@example.com', role: 'viewer' as const, addedAt: '2026-01-02T00:00:00Z' },
  ];
  mockLoading = false;
  mockInviting = false;
  mockError = null;
});

describe('ShareDialog', () => {
  it('fetches participants when opened', () => {
    renderShareDialog();
    expect(mockFetchParticipants).toHaveBeenCalledWith(asConversationId('conv1'));
  });

  it('renders participant list with emails', () => {
    renderShareDialog();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
  });

  it('shows role chips for participants', () => {
    renderShareDialog();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    // "Viewer" appears both in the role selector and in a participant chip
    const viewers = screen.getAllByText('Viewer');
    expect(viewers.length).toBeGreaterThanOrEqual(2);
  });

  it('shows "(you)" label for current user', () => {
    renderShareDialog({ currentUserId: 'u1' });
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('hides remove button for current user', () => {
    renderShareDialog({ currentUserId: 'u1' });
    const removeButtons = screen.getAllByLabelText('Remove participant');
    expect(removeButtons).toHaveLength(1);
  });

  it('shows remove button for other participants', () => {
    renderShareDialog({ currentUserId: 'u1' });
    const removeButtons = screen.getAllByLabelText('Remove participant');
    expect(removeButtons).toHaveLength(1);
  });

  it('calls invite with email and role on button click', async () => {
    mockInvite.mockResolvedValue(true);
    const user = userEvent.setup();
    renderShareDialog();

    const emailInput = screen.getByPlaceholderText('Enter email address');
    await user.type(emailInput, 'charlie@example.com');
    await user.click(screen.getByText('Invite'));

    expect(mockInvite).toHaveBeenCalledWith(asConversationId('conv1'), 'charlie@example.com', 'viewer');
  });

  it('disables invite button when email is empty', () => {
    renderShareDialog();
    const inviteButton = screen.getByText('Invite').closest('button');
    expect(inviteButton).toBeDisabled();
  });

  it('calls revoke when remove button is clicked', async () => {
    const user = userEvent.setup();
    renderShareDialog({ currentUserId: 'u1' });

    const removeButton = screen.getByLabelText('Remove participant');
    await user.click(removeButton);

    expect(mockRevoke).toHaveBeenCalledWith(asConversationId('conv1'), 'u2');
  });

  it('shows loading spinner when loading participants', () => {
    mockLoading = true;
    mockParticipants = [];
    renderShareDialog();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows empty state when no participants', () => {
    mockParticipants = [];
    renderShareDialog();
    expect(screen.getByText('No participants yet')).toBeInTheDocument();
  });

  it('shows dialog title', () => {
    renderShareDialog();
    expect(screen.getByText('Share conversation')).toBeInTheDocument();
  });

  it('invites on Enter key press', async () => {
    mockInvite.mockResolvedValue(true);
    const user = userEvent.setup();
    renderShareDialog();

    const emailInput = screen.getByPlaceholderText('Enter email address');
    await user.type(emailInput, 'dave@example.com{Enter}');

    expect(mockInvite).toHaveBeenCalledWith(asConversationId('conv1'), 'dave@example.com', 'viewer');
  });
});
