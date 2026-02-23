import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradients: {
      primary: string;
      primaryHover: string;
      accent: string;
    };
  }
  interface PaletteOptions {
    gradients?: {
      primary?: string;
      primaryHover?: string;
      accent?: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    secondary: {
      main: '#00e5ff',
    },
    background: {
      default: '#0a0a0f',
      paper: '#12121a',
    },
    text: {
      primary: '#e8e8ed',
      secondary: '#9090a0',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    gradients: {
      primary: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
      primaryHover: 'linear-gradient(135deg, #651fff 0%, #2979ff 100%)',
      accent: 'linear-gradient(135deg, #00e5ff 0%, #1de9b6 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme: t }) => ({
          borderRight: `1px solid ${t.palette.divider}`,
        }),
      },
    },
  },
});

export default theme;
