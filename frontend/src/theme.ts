import { createTheme } from '@mui/material/styles';
import type { PaletteMode, Theme } from '@mui/material';

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

const sharedPalette = {
  primary: {
    main: '#7c4dff',
    light: '#b47cff',
    dark: '#3f1dcb',
  },
  secondary: {
    main: '#00e5ff',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #7c4dff 0%, #448aff 100%)',
    primaryHover: 'linear-gradient(135deg, #651fff 0%, #2979ff 100%)',
    accent: 'linear-gradient(135deg, #00e5ff 0%, #1de9b6 100%)',
  },
};

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h6: {
    fontWeight: 600,
  },
};

const sharedShape = {
  borderRadius: 12,
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none' as const,
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
      paper: ({ theme: t }: { theme: Theme }) => ({
        borderRight: `1px solid ${t.palette.divider}`,
      }),
    },
  },
};

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      ...sharedPalette,
      ...(mode === 'dark'
        ? {
            background: {
              default: '#0a0a0f',
              paper: '#12121a',
            },
            text: {
              primary: '#e8e8ed',
              secondary: '#9090a0',
            },
            divider: 'rgba(255, 255, 255, 0.08)',
          }
        : {
            background: {
              default: '#f5f5f8',
              paper: '#ffffff',
            },
            text: {
              primary: '#1a1a2e',
              secondary: '#6b6b80',
            },
            divider: 'rgba(0, 0, 0, 0.12)',
          }),
    },
    typography: sharedTypography,
    shape: sharedShape,
    components: sharedComponents,
  });
}

const theme = createAppTheme('dark');

export default theme;
