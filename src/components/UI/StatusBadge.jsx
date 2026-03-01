import { Chip } from "@mui/material";

const STATUS_CONFIG = {
  pendente_pagamento: { label: "Aguard. Pagamento", bg: "#FEF3C7", color: "#D97706" },
  agendado:           { label: "Agendado",           bg: "#DBEAFE", color: "#2563EB" },
  confirmado:         { label: "Confirmado",         bg: "#D1FAE5", color: "#059669" },
  em_procedimento:    { label: "Em Procedimento",    bg: "#FEE2E2", color: "#DC2626" },
  finalizado:         { label: "Finalizado",         bg: "#D1FAE5", color: "#059669" },
  cancelado:          { label: "Cancelado",          bg: "#F1F5F9", color: "#64748B" },
};

export const StatusBadge = ({ status, size = "small" }) => {
  const cfg = STATUS_CONFIG[status] || { label: status || "—", bg: "#F1F5F9", color: "#64748B" };
  return (
    <Chip
      label={cfg.label}
      size={size}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 700,
        fontSize: size === "small" ? "0.72rem" : "0.8rem",
        height: size === "small" ? 22 : 28,
        border: `1px solid ${cfg.color}30`,
      }}
    />
  );
};

export default StatusBadge;