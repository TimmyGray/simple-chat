import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { asMessageId, asConversationId, asModelId } from '../types';
// Pre-load lazy MarkdownRenderer so React.lazy resolves from module cache in tests
import '../components/Chat/MarkdownRenderer';
import MessageBubble from '../components/Chat/MessageBubble';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('MessageBubble', () => {
  it('renders user message', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('1'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Hello AI!',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('Hello AI!')).toBeInTheDocument();
  });

  it('renders assistant message with markdown', async () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('2'),
          conversationId: asConversationId('c1'),
          role: 'assistant',
          content: '**Bold text** and `inline code`',
          model: asModelId('openrouter/free'),
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(await screen.findByText('Bold text', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
  });

  it('shows model name for assistant messages', async () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('3'),
          conversationId: asConversationId('c1'),
          role: 'assistant',
          content: 'Response',
          model: asModelId('openrouter/free'),
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(await screen.findByText('Response', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('openrouter/free')).toBeInTheDocument();
  });

  it('renders attachments as chips', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('4'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Check this file',
          attachments: [
            {
              fileName: 'document.pdf',
              fileType: 'application/pdf',
              filePath: '/uploads/doc.pdf',
              fileSize: 1024,
            },
          ],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('shows edit button on hover for user messages', async () => {
    const onEdit = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('5'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Editable message',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onEdit={onEdit}
      />,
    );
    expect(screen.getByLabelText('Edit message')).toBeInTheDocument();
  });

  it('enters edit mode and saves on click', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('6'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Original content',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByLabelText('Edit message'));
    const textField = screen.getByDisplayValue('Original content');
    expect(textField).toBeInTheDocument();
    await user.clear(textField);
    await user.type(textField, 'Updated content');
    await user.click(screen.getByLabelText('Save'));
    expect(onEdit).toHaveBeenCalledWith(asMessageId('6'), 'Updated content');
  });

  it('cancels edit and restores original content', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('7'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Keep this content',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onEdit={onEdit}
      />,
    );
    await user.click(screen.getByLabelText('Edit message'));
    expect(screen.getByDisplayValue('Keep this content')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Cancel'));
    expect(screen.queryByDisplayValue('Keep this content')).not.toBeInTheDocument();
    expect(screen.getByText('Keep this content')).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('shows edited indicator for edited messages', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('8'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Edited message',
          isEdited: true,
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows regenerate button for assistant messages', () => {
    const onRegenerate = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('9'),
          conversationId: asConversationId('c1'),
          role: 'assistant',
          content: 'AI response',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onRegenerate={onRegenerate}
      />,
    );
    expect(screen.getByLabelText('Regenerate response')).toBeInTheDocument();
  });

  it('calls onRegenerate when regenerate button is clicked', async () => {
    const user = userEvent.setup();
    const onRegenerate = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('10'),
          conversationId: asConversationId('c1'),
          role: 'assistant',
          content: 'Regenerate me',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onRegenerate={onRegenerate}
      />,
    );
    await user.click(screen.getByLabelText('Regenerate response'));
    expect(onRegenerate).toHaveBeenCalledWith(asMessageId('10'));
  });

  it('hides action buttons when streaming', () => {
    const onEdit = vi.fn();
    renderWithTheme(
      <MessageBubble
        message={{
          _id: asMessageId('11'),
          conversationId: asConversationId('c1'),
          role: 'user',
          content: 'Streaming message',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
        onEdit={onEdit}
        isStreaming
      />,
    );
    expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument();
  });
});
