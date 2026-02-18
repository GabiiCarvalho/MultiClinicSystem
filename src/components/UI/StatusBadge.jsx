import { Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

const statusStyles = {
  agendado: {
    bg: '#FFF0D9',
    color: '#B87C4A',
    label: '📅 Agendado',
  },
  confirmado: {
    bg: '#D4E6F1',
    color: '#4A7B8C',
    label: '✅ Confirmado',
  },
  em_andamento: {
    bg: '#F9D7D7',
    color: '#A65D5D',
    label: '⏳ Em Andamento',
  },
  em_procedimento: {
    bg: '#F9D7D7',
    color: '#A65D5D',
    label: '⚕️ Em Procedimento',
  },
  concluido: {
    bg: '#C5E0C5',
    color: '#4F7A4F',
    label: '🎉 Concluído',
  },
  finalizado: {
    bg: '#C5E0C5',
    color: '#4F7A4F',
    label: '✨ Finalizado',
  },
  cancelado: {
    bg: '#FFC9C9',
    color: '#A65D5D',
    label: '❌ Cancelado',
  },
};

const StyledChip = styled(Chip)(({ bgcolor, textcolor }) => ({
  backgroundColor: bgcolor,
  color: textcolor,
  fontWeight: 500,
  borderRadius: 30,
  padding: '4px 8px',
  fontSize: '0.85rem',
  '& .MuiChip-label': {
    padding: '0 8px',
  },
  '& .MuiChip-icon': {
    color: textcolor,
    fontSize: '1.1rem',
    marginLeft: 8,
  },
}));

export const StatusBadge = ({ status }) => {
  const style = statusStyles[status] || statusStyles.agendado;
  
  return (
    <StyledChip
      bgcolor={style.bg}
      textcolor={style.color}
      label={style.label}
      size="small"
    />
  );
};