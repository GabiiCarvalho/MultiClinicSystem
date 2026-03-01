import { useContext, useMemo } from "react";
import {
  Box, Typography, Grid, Paper, Chip, Avatar, LinearProgress,
  Card, CardContent, Divider
} from "@mui/material";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const STEP_LABELS = ["Preparação", "Andamento", "Finalização", "Concluído"];

const statusColor = {
  pendente_pagamento: "#D97706",
  agendado: "#2563EB",
  em_procedimento: "#DC2626",
  finalizado: "#059669",
  cancelado: "#64748B",
};

const statusLabel = {
  pendente_pagamento: "Pend. Pagamento",
  agendado: "Aguardando",
  em_procedimento: "Em Procedimento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const KpiCard = ({ icon, label, value, sub, color, gradient }) => (
  <Card sx={{ height: "100%" }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: color || "text.primary", lineHeight: 1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {sub}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: gradient || `${color}18` || "#F1F5F9", width: 48, height: 48 }}>
          <Box sx={{ color: color || "text.secondary", display: "flex" }}>{icon}</Box>
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Home = () => {
  const { patients } = useContext(PatientsContext);
  const { user, clinicName } = useContext(AuthContext);

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";

  const stats = useMemo(() => {
    const pendentes = patients.filter((p) => p.status === "pendente_pagamento");
    const aguardando = patients.filter((p) => p.status === "agendado" && p.pago);
    const emProc = patients.filter((p) => p.status === "em_procedimento");
    const finalizados = patients.filter((p) => p.status === "finalizado");
    const faturamento = patients
      .filter((p) => p.status === "finalizado" && p.pago)
      .reduce((s, p) => s + (Number(p.valor) || 0), 0);

    return { pendentes, aguardando, emProc, finalizados, faturamento };
  }, [patients]);

  const recentPatients = useMemo(
    () => [...patients].sort((a, b) => new Date(b.data_hora || 0) - new Date(a.data_hora || 0)).slice(0, 6),
    [patients]
  );

  const totalAtivos = stats.aguardando.length + stats.emProc.length;
  const progressoPct = totalAtivos === 0 ? 0 : Math.round((stats.emProc.length / Math.max(totalAtivos, 1)) * 100);

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      {/* Saudação */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "text.primary" }}>
          {greeting}, {user?.nome?.split(" ")[0] || "usuário"}! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {clinicName} — {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <KpiCard
            icon={<PeopleIcon />}
            label="Total de Pacientes"
            value={patients.length}
            sub={`${stats.pendentes.length} aguardando pagamento`}
            color="#2563EB"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KpiCard
            icon={<HourglassEmptyIcon />}
            label="Aguardando Hoje"
            value={stats.aguardando.length}
            sub="prontos para iniciar"
            color="#D97706"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KpiCard
            icon={<MedicalServicesIcon />}
            label="Em Atendimento"
            value={stats.emProc.length}
            sub="procedimentos ativos"
            color="#DC2626"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <KpiCard
            icon={<AttachMoneyIcon />}
            label="Faturamento"
            value={`R$ ${stats.faturamento.toLocaleString("pt-BR")}`}
            sub={`${stats.finalizados.length} finalizados`}
            color="#059669"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Resumo do Dia */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, height: "100%", borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Resumo do Dia
            </Typography>

            {[
              { label: "Aguard. Pagamento", count: stats.pendentes.length, color: "#D97706", bg: "#FEF3C7" },
              { label: "Aguardando", count: stats.aguardando.length, color: "#2563EB", bg: "#DBEAFE" },
              { label: "Em Procedimento", count: stats.emProc.length, color: "#DC2626", bg: "#FEE2E2" },
              { label: "Finalizados", count: stats.finalizados.length, color: "#059669", bg: "#D1FAE5" },
            ].map(({ label, count, color, bg }) => (
              <Box key={label} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color }}>{count}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={patients.length ? (count / patients.length) * 100 : 0}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: bg,
                    "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
                  }}
                />
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 18, color: "#059669" }} />
              <Typography variant="body2" color="text.secondary">
                <b style={{ color: "#059669" }}>{progressoPct}%</b> dos ativos em procedimento
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Em Procedimento Agora */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, height: "100%", borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Em Procedimento Agora
            </Typography>

            {stats.emProc.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <MedicalServicesIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Nenhum procedimento ativo</Typography>
              </Box>
            ) : (
              stats.emProc.map((p) => {
                const prog = p.procedureProgress || 0;
                const pct = Math.min((prog / 3) * 100, 100);
                return (
                  <Box key={p.id} sx={{ mb: 2, p: 1.5, bgcolor: "#FEF2F2", borderRadius: 2, border: "1px solid #FECACA" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#DC2626", fontSize: "0.85rem" }}>
                        {(p.nome || p.name || "?").charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{p.nome || p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{p.procedimento || p.procedureType}</Typography>
                      </Box>
                      <Chip
                        label={`Passo ${prog + 1}/4`}
                        size="small"
                        sx={{ bgcolor: "#DC2626", color: "#fff", fontWeight: 700, fontSize: "0.68rem" }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: "#FECACA",
                        "& .MuiLinearProgress-bar": { bgcolor: "#DC2626" },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      {STEP_LABELS.map((s, i) => (
                        <Typography
                          key={s}
                          variant="caption"
                          sx={{ fontSize: "0.6rem", color: i <= prog ? "#DC2626" : "text.disabled", fontWeight: i === prog ? 700 : 400 }}
                        >
                          {s}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>

        {/* Pacientes Recentes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, height: "100%", borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Pacientes Recentes
            </Typography>

            {recentPatients.map((p, idx) => {
              const color = statusColor[p.status] || "#64748B";
              return (
                <Box key={p.id}>
                  {idx > 0 && <Divider sx={{ my: 1 }} />}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        bgcolor: `${color}20`,
                        color,
                      }}
                    >
                      {(p.nome || p.name || "?").charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{p.nome || p.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {p.procedimento || p.procedureType || "—"}
                      </Typography>
                    </Box>
                    <Chip
                      label={statusLabel[p.status] || p.status}
                      size="small"
                      sx={{
                        bgcolor: `${color}15`,
                        color,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}

            {recentPatients.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <PeopleIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Nenhum paciente cadastrado</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;