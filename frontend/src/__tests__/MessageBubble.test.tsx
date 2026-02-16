import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import MessageBubble from '../components/Chat/MessageBubble';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('MessageBubble', () => {
  it('renders user message', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: '1',
          conversationId: 'c1',
          role: 'user',
          content: 'Hello AI!',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('Hello AI!')).toBeInTheDocument();
  });

  it('renders assistant message with markdown', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: '2',
          conversationId: 'c1',
          role: 'assistant',
          content: '**Bold text** and `inline code`',
          model: 'openrouter/free',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('inline code')).toBeInTheDocument();
  });

  it('shows model name for assistant messages', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: '3',
          conversationId: 'c1',
          role: 'assistant',
          content: 'Response',
          model: 'openrouter/free',
          attachments: [],
          createdAt: new Date().toISOString(),
        }}
      />,
    );
    expect(screen.getByText('openrouter/free')).toBeInTheDocument();
  });

  it('renders attachments as chips', () => {
    renderWithTheme(
      <MessageBubble
        message={{
          _id: '4',
          conversationId: 'c1',
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
