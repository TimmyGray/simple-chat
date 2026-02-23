import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, ModelInfo } from '../types';

export interface ChatAppContextValue {
  conversations: Conversation[];
  conversationsLoading: boolean;
  models: ModelInfo[];
  selectedConversation: Conversation | null;
  selectedModel: string;
  userEmail: string | undefined;
  tokenUsage: number | undefined;
  isOnline: boolean;
  selectConversation: (id: string) => void;
  newChat: () => void;
  deleteConversation: (id: string) => void;
  changeModel: (model: string) => void;
  onConversationUpdate: () => void;
  logout: () => void;
}

const ChatAppContext = createContext<ChatAppContextValue | null>(null);

export function ChatAppProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ChatAppContextValue;
}) {
  return (
    <ChatAppContext.Provider value={value}>{children}</ChatAppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-located hook is standard for context files
export function useChatApp(): ChatAppContextValue {
  const ctx = useContext(ChatAppContext);
  if (!ctx) {
    throw new Error('useChatApp must be used within a ChatAppProvider');
  }
  return ctx;
}
