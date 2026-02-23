import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import { asMessageId, asConversationId } from '../types';
import MessageList from '../components/Chat/MessageList';

// Mock Virtuoso to render all items directly (jsdom lacks layout measurements)
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
    components,
  }: {
    data: { _id: string }[];
    itemContent: (index: number, item: { _id: string }) => React.ReactNode;
    components?: { Header?: () => React.ReactNode; Footer?: () => React.ReactNode };
  }) => (
    <div data-testid="virtuoso">
      {components?.Header?.()}
      {data.map((item: { _id: string }, index: number) => (
        <div key={item._id}>{itemContent(index, item)}</div>
      ))}
      {components?.Footer?.()}
    </div>
  ),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const makeMessage = (overrides: Partial<Parameters<typeof MessageList>[0]['messages'][0]> = {}) => ({
  _id: asMessageId('1'),
  conversationId: asConversationId('c1'),
  role: 'user' as const,
  content: 'Hello',
  attachments: [],
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('MessageList', () => {
  it('shows loading spinner when loading', () => {
    renderWithTheme(
      <MessageList messages={[]} loading={true} streaming={false} streamingContent="" />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('virtuoso')).not.toBeInTheDocument();
  });

  it('renders messages in virtualized list', () => {
    const messages = [
      makeMessage({ _id: asMessageId('1'), content: 'Hello' }),
      makeMessage({ _id: asMessageId('2'), role: 'assistant', content: 'Hi there!' }),
    ];
    renderWithTheme(
      <MessageList messages={messages} loading={false} streaming={false} streamingContent="" />,
    );
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows streaming message when streaming with content', () => {
    renderWithTheme(
      <MessageList
        messages={[makeMessage()]}
        loading={false}
        streaming={true}
        streamingContent="Streaming response..."
      />,
    );
    expect(screen.getByText('Streaming response...')).toBeInTheDocument();
  });

  it('shows typing indicator when streaming without content', () => {
    const { container } = renderWithTheme(
      <MessageList messages={[makeMessage()]} loading={false} streaming={true} streamingContent="" />,
    );
    // TypingIndicator renders 3 bouncing dots (Box elements)
    const dots = container.querySelectorAll('[class*="MuiBox-root"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('does not show typing indicator when not streaming', () => {
    renderWithTheme(
      <MessageList
        messages={[makeMessage()]}
        loading={false}
        streaming={false}
        streamingContent=""
      />,
    );
    expect(screen.queryByText('Streaming response...')).not.toBeInTheDocument();
  });
});
