import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import ExportMenu from '../components/Chat/ExportMenu';
import { asConversationId } from '../types';

vi.mock('../api/client', () => ({
  exportConversation: vi.fn(),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ExportMenu', () => {
  const conversationId = asConversationId('test-conv-id');
  const onError = vi.fn();

  it('renders the export button', () => {
    renderWithTheme(
      <ExportMenu conversationId={conversationId} onError={onError} />,
    );
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('opens menu with 3 format options on click', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <ExportMenu conversationId={conversationId} onError={onError} />,
    );

    await user.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText(/markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/json/i)).toBeInTheDocument();
  });

  it('calls exportConversation when a format is selected', async () => {
    const user = userEvent.setup();
    const { exportConversation } = await import('../api/client');
    const mockExport = vi.mocked(exportConversation);
    mockExport.mockResolvedValue(new Blob(['test']));

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis.URL, 'createObjectURL', { value: createObjectURL });
    Object.defineProperty(globalThis.URL, 'revokeObjectURL', { value: revokeObjectURL });

    renderWithTheme(
      <ExportMenu conversationId={conversationId} onError={onError} />,
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByText(/json/i));

    expect(mockExport).toHaveBeenCalledWith(conversationId, 'json');
  });

  it('calls onError when export fails', async () => {
    const user = userEvent.setup();
    const errorFn = vi.fn();
    const { exportConversation } = await import('../api/client');
    const mockExport = vi.mocked(exportConversation);
    mockExport.mockRejectedValue(new Error('Network error'));

    renderWithTheme(
      <ExportMenu conversationId={conversationId} onError={errorFn} />,
    );

    await user.click(screen.getByRole('button', { name: /export/i }));
    await user.click(screen.getByText(/markdown/i));

    // Wait for the async error handling
    await vi.waitFor(() => {
      expect(errorFn).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });
  });
});
