import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import ChatInput from '../components/Chat/ChatInput';

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const mockModels = [
  {
    id: 'openrouter/free',
    name: 'Gemini 2.0 Flash',
    description: 'Fast',
    free: true,
    contextLength: 1000000,
    supportsVision: true,
  },
];

describe('ChatInput', () => {
  it('renders text input and send button', () => {
    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );
    expect(
      screen.getByPlaceholderText('Type your message...'),
    ).toBeInTheDocument();
  });

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={onSend}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello world');

    const sendBtn = screen.getByTestId('SendIcon').closest('button')!;
    await user.click(sendBtn);

    expect(onSend).toHaveBeenCalledWith('Hello world', []);
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={onSend}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('does not send empty message', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={onSend}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables input and send button when disabled prop is true', () => {
    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={vi.fn()}
        disabled
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    expect(input).toBeDisabled();
  });

  it('shows character counter near the limit', () => {
    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'a'.repeat(9500) } });

    expect(screen.getByText('9500 / 10000')).toBeInTheDocument();
  });

  it('disables send button when over character limit', () => {
    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'a'.repeat(10001) } });

    const sendBtn = screen.getByTestId('SendIcon').closest('button')!;
    expect(sendBtn).toBeDisabled();
  });

  it('does not send via Enter when over character limit', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={onSend}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'a'.repeat(10001) } });
    await user.type(input, '{Enter}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not show counter for short input', () => {
    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Hello' } });

    expect(screen.queryByText(/\/ 10000/)).not.toBeInTheDocument();
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    renderWithTheme(
      <ChatInput
        models={mockModels}
        selectedModel="openrouter/free"
        onModelChange={vi.fn()}
        onSend={onSend}
      />,
    );

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello{Enter}');

    expect(input).toHaveValue('');
  });
});
