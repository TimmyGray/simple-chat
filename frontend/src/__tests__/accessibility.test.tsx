import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { axe } from 'vitest-axe';
import theme from '../theme';
import { asConversationId, asMessageId, asModelId } from '../types';
import type { Message, ModelInfo, Conversation } from '../types';
import { ChatAppProvider } from '../contexts/ChatAppContext';
import type { ChatAppContextValue } from '../contexts/ChatAppContext';
import { ThemeModeProvider } from '../contexts/ThemeContext';
import AuthPage from '../components/Auth/AuthPage';
import ChatInput from '../components/Chat/ChatInput';
import MessageBubble from '../components/Chat/MessageBubble';
import ModelSelector from '../components/Chat/ModelSelector';
import TypingIndicator from '../components/Chat/TypingIndicator';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Sidebar from '../components/Sidebar/Sidebar';

// --- Shared test data ---

const mockModels: ModelInfo[] = [
  {
    id: asModelId('openrouter/free'),
    name: 'Free Models Router',
    description: 'Fast',
    free: true,
    contextLength: 1000000,
    supportsVision: true,
  },
];

const mockConversations: Conversation[] = [
  {
    _id: asConversationId('c1'),
    title: 'First Chat',
    model: asModelId('openrouter/free'),
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T12:00:00Z',
  },
];

const userMessage: Message = {
  _id: asMessageId('m1'),
  conversationId: asConversationId('c1'),
  role: 'user',
  content: 'Hello, world!',
  attachments: [],
  createdAt: '2026-01-01T00:00:00Z',
};

const assistantMessage: Message = {
  _id: asMessageId('m2'),
  conversationId: asConversationId('c1'),
  role: 'assistant',
  content: 'Hi there!',
  model: asModelId('openrouter/free'),
  attachments: [],
  createdAt: '2026-01-01T00:01:00Z',
};

const defaultChatContext: ChatAppContextValue = {
  conversations: mockConversations,
  conversationsLoading: false,
  selectedConversation: null,
  userEmail: 'user@example.com',
  tokenUsage: 1500,
  isAdmin: false,
  isOnline: true,
  selectConversation: vi.fn(),
  newChat: vi.fn(),
  deleteConversation: vi.fn(),
  onConversationUpdate: vi.fn(),
  onTemplatesChanged: vi.fn(),
  openSearch: vi.fn(),
  logout: vi.fn(),
};

// --- Helpers ---

const mockThemeModeValue = { mode: 'dark' as const, setMode: vi.fn() };

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <ThemeModeProvider value={mockThemeModeValue}>
        {ui}
      </ThemeModeProvider>
    </ThemeProvider>,
  );
}

function renderWithChatContext(
  ui: React.ReactElement,
  overrides?: Partial<ChatAppContextValue>,
) {
  const value = { ...defaultChatContext, ...overrides };
  return render(
    <ThemeProvider theme={theme}>
      <ThemeModeProvider value={mockThemeModeValue}>
        <ChatAppProvider value={value}>{ui}</ChatAppProvider>
      </ThemeModeProvider>
    </ThemeProvider>,
  );
}

// --- Accessibility tests ---

describe('Accessibility (axe-core)', () => {
  describe('AuthPage', () => {
    it('login form has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <AuthPage
          mode="login"
          error={null}
          onSubmit={vi.fn()}
          onSwitchMode={vi.fn()}
          onClearError={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('register form has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <AuthPage
          mode="register"
          error={null}
          onSubmit={vi.fn()}
          onSwitchMode={vi.fn()}
          onClearError={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('login form with error has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <AuthPage
          mode="login"
          error="Invalid email or password"
          onSubmit={vi.fn()}
          onSwitchMode={vi.fn()}
          onClearError={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ChatInput', () => {
    it('has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <ChatInput
          models={mockModels}
          selectedModel={asModelId('openrouter/free')}
          onModelChange={vi.fn()}
          templates={[]}
          selectedTemplateId={null}
          onTemplateChange={vi.fn()}
          onSend={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('disabled state has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <ChatInput
          models={mockModels}
          selectedModel={asModelId('openrouter/free')}
          onModelChange={vi.fn()}
          templates={[]}
          selectedTemplateId={null}
          onTemplateChange={vi.fn()}
          onSend={vi.fn()}
          disabled
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('MessageBubble', () => {
    it('user message has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <MessageBubble message={userMessage} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('assistant message has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <MessageBubble message={assistantMessage} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('message with attachments has no a11y violations', async () => {
      const msgWithAttachments: Message = {
        ...userMessage,
        attachments: [
          {
            fileName: 'test.pdf',
            fileType: 'application/pdf',
            filePath: '/uploads/test.pdf',
            fileSize: 1024,
          },
        ],
      };
      const { container } = renderWithTheme(
        <MessageBubble message={msgWithAttachments} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ModelSelector', () => {
    it('has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <ModelSelector
          models={mockModels}
          value={asModelId('openrouter/free')}
          onChange={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('TypingIndicator', () => {
    it('has no a11y violations', async () => {
      const { container } = renderWithTheme(<TypingIndicator />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('EmptyState', () => {
    it('has no a11y violations', async () => {
      const { container } = renderWithTheme(<EmptyState />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ConfirmDialog', () => {
    it('open dialog has no a11y violations', async () => {
      const { container } = renderWithTheme(
        <ConfirmDialog
          open={true}
          title="Delete conversation?"
          message="This action cannot be undone."
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      // axe needs to scan the portal-mounted dialog, which lives in document.body
      const results = await axe(container.ownerDocument.body);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Sidebar', () => {
    it('with conversations has no a11y violations', async () => {
      const { container } = renderWithChatContext(<Sidebar />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('empty state has no a11y violations', async () => {
      const { container } = renderWithChatContext(<Sidebar />, {
        conversations: [],
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('loading state has no a11y violations', async () => {
      const { container } = renderWithChatContext(<Sidebar />, {
        conversations: [],
        conversationsLoading: true,
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
