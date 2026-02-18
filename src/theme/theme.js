import { createTheme } from '@mui/material/styles';

export const pastelTheme = createTheme({
  palette: {
    primary: {
      main: '#A7C7E7', // Azul pastel suave
      light: '#C9E0F2',
      dark: '#7AA5C7',
      contrastText: '#4A5568',
    },
    secondary: {
      main: '#F9D7D7', // Rosa pastel suave
      light: '#FFE9E9',
      dark: '#E5B7B7',
      contrastText: '#4A5568',
    },
    success: {
      main: '#C5E0C5', // Verde pastel
      light: '#E0F0E0',
      dark: '#9FB89F',
    },
    warning: {
      main: '#FFE5B4', // Pêssego pastel
      light: '#FFF0D9',
      dark: '#E5C699',
    },
    error: {
      main: '#FFC9C9', // Vermelho pastel suave
      light: '#FFE0E0',
      dark: '#E5A9A9',
    },
    info: {
      main: '#D4E6F1', // Azul claro pastel
      light: '#E8F0F7',
      dark: '#B0C2D9',
    },
    background: {
      default: '#FAF9F8', // Branco suave com toque quente
      paper: '#FFFFFF',
    },
    text: {
      primary: '#4A5568',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
      color: '#4A5568',
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 500,
      color: '#4A5568',
    },
    h6: {
      fontWeight: 600,
      color: '#4A5568',
    },
    body1: {
      color: '#4A5568',
    },
    body2: {
      color: '#718096',
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
          borderRadius: 20,
          padding: '8px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.02)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#F0F4F8',
          color: '#4A5568',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#4A5568',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          borderBottom: '1px solid #F0F0F0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          minHeight: 48,
          color: '#718096',
          '&.Mui-selected': {
            color: '#4A5568',
            fontWeight: 600,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 24px 48px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#F9FAFB',
            '&:hover': {
              backgroundColor: '#FFFFFF',
            },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#A7C7E7',
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
  },
});