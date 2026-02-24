import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sidebar from './Sidebar/Sidebar';
import ChatArea from './Chat/ChatArea';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_TABLET, MOBILE_MENU_OFFSET } from '../constants';

export default function Layout() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileDrawer = useCallback(() => {
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const sidebarContent = <Sidebar onMobileClose={closeMobileDrawer} />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile menu button — hidden when drawer is open */}
      {isMobile && !mobileOpen && (
        <IconButton
          aria-label={t('sidebar.openMenu')}
          onClick={() => setMobileOpen(true)}
          sx={{
            position: 'fixed',
            top: MOBILE_MENU_OFFSET,
            left: MOBILE_MENU_OFFSET,
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
            width: { md: SIDEBAR_WIDTH_TABLET, lg: SIDEBAR_WIDTH },
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
      <Box component="main" sx={{ flex: 1, overflow: 'hidden' }}>
        <ChatArea />
      </Box>
    </Box>
  );
}
