import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PastelCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.02)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 16px 48px rgba(167,199,231,0.15)',
    borderColor: '#A7C7E7',
    maxWidth: '100%',
overflow: 'hidden',
  },
}));