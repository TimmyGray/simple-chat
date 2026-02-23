import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
