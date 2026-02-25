import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, ConversationId } from '../types';

export interface ChatAppContextValue {
  conversations: Conversation[];
  conversationsLoading: boolean;
  selectedConversation: Conversation | null;
  userEmail: string | undefined;
  tokenUsage: number | undefined;
  isOnline: boolean;
  selectConversation: (id: ConversationId) => void;
  newChat: () => void;
  deleteConversation: (id: ConversationId) => void;
  onConversationUpdate: () => void;
  openSearch: () => void;
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
