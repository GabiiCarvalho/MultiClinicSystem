import { Chip } from '@mui/material';

const STATUS_MAP = {
  pendente_pagamento: { bg: '#FFF3D0', color: '#B5742E', label: '💰 Aguardando Pgto' },
  agendado:           { bg: '#D0E8FF', color: '#2E6BB5', label: '📅 Agendado' },
  confirmado:         { bg: '#D0F5E8', color: '#2E855E', label: '✅ Confirmado' },
  em_procedimento:    { bg: '#FFE0D0', color: '#B53E2E', label: '⚕️ Em Procedimento' },
  finalizado:         { bg: '#D0F5E8', color: '#2E855E', label: '✨ Finalizado' },
  cancelado:          { bg: '#F0F0F0', color: '#666', label: '❌ Cancelado' },
};

export const StatusBadge = ({ status, size = 'small' }) => {
  const s = STATUS_MAP[status] || { bg: '#F0F0F0', color: '#666', label: status };
  return (
    <Chip
      label={s.label}
      size={size}
      sx={{
        bgcolor: s.bg, color: s.color, fontWeight: 600,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        borderRadius: 2, border: 'none',
      }}
    />
  );
};