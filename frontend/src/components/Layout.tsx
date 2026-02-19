import { useState, useCallback } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import type { Conversation, ModelInfo } from '../types';
import Sidebar from './Sidebar/Sidebar';
import ChatArea from './Chat/ChatArea';

const SIDEBAR_WIDTH = 280;

interface LayoutProps {
  conversations: Conversation[];
  conversationsLoading: boolean;
  models: ModelInfo[];
  selectedConversation: Conversation | null;
  selectedModel: string;
  userEmail?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onModelChange: (model: string) => void;
  onConversationUpdate: () => void;
  onLogout?: () => void;
}

export default function Layout({
  conversations,
  conversationsLoading,
  models,
  selectedConversation,
  selectedModel,
  userEmail,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onModelChange,
  onConversationUpdate,
  onLogout,
}: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectConversation = useCallback(
    (id: string) => {
      onSelectConversation(id);
      if (isMobile) setMobileOpen(false);
    },
    [onSelectConversation, isMobile],
  );

  const handleNewChat = useCallback(() => {
    onNewChat();
    if (isMobile) setMobileOpen(false);
  }, [onNewChat, isMobile]);

  const sidebarContent = (
    <Sidebar
      conversations={conversations}
      loading={conversationsLoading}
      selectedId={selectedConversation?._id || null}
      userEmail={userEmail}
      onSelect={handleSelectConversation}
      onNewChat={handleNewChat}
      onDelete={onDeleteConversation}
      onLogout={onLogout}
    />
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile menu button — hidden when drawer is open */}
      {isMobile && !mobileOpen && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: (theme) => theme.zIndex.modal + 1,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: SIDEBAR_WIDTH,
              backgroundColor: 'background.paper',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* Chat area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <ChatArea
          conversation={selectedConversation}
          models={models}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onConversationUpdate={onConversationUpdate}
        />
      </Box>
    </Box>
  );
}
