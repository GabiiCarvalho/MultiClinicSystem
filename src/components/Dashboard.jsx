import { useContext, useMemo } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, LinearProgress,
  Chip, List, ListItem, ListItemAvatar, ListItemText, Divider, Paper, Stack,
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HealingRoundedIcon from '@mui/icons-material/HealingRounded';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import { StatusBadge } from '../components/UI/StatusBadge';

const KPICard = ({ title, value, sub, icon, color, gradient }) => (
  <Card sx={{ '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' } }}>
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: 3, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ color: 'white', display: 'flex' }}>{icon}</Box>
        </Box>
        {sub && (
          <Chip icon={<TrendingUpRoundedIcon sx={{ fontSize: '14px !important' }} />} label={sub} size="small"
            sx={{ bgcolor: 'rgba(107,191,139,0.12)', color: '#3D8F5F', fontWeight: 700, fontSize: '0.72rem' }} />
        )}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.5 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
    </CardContent>
  </Card>
);

const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatTime = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
};

const PROCEDURE_STEPS = {
  default: ['Preparação', 'Procedimento', 'Finalização'],
  consulta: ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'],
  cirurgia: ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'],
};

const getSteps = (type) => {
  if (!type) return PROCEDURE_STEPS.default;
  const t = type.toLowerCase();
  if (t.includes('cirurgia') || t.includes('microcirurgia')) return PROCEDURE_STEPS.cirurgia;
  if (t.includes('consulta')) return PROCEDURE_STEPS.consulta;
  return PROCEDURE_STEPS.default;
};

const AVATAR_COLORS = ['#4F86C6','#E8A0BF','#6BBF8B','#F4A44A','#64B0D5','#9B8ED4'];

export default function Dashboard() {
  const { patients } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const stats = useMemo(() => {
    const today = new Date();
    const todayPts = patients.filter(p => {
      if (!p.scheduleDate) return false;
      const d = new Date(p.scheduleDate);
      return d.toDateString() === today.toDateString();
    });
    return {
      total: patients.length,
      today: todayPts.length,
      inProcedure: patients.filter(p => p.status === 'em_procedimento').length,
      waiting: patients.filter(p => p.status === 'agendado' && p.pago).length,
      pending: patients.filter(p => p.status === 'pendente_pagamento').length,
      done: patients.filter(p => p.status === 'finalizado').length,
      revenue: patients.filter(p => p.pago).reduce((s, p) => s + (p.valor || 0), 0),
      todayRevenue: todayPts.filter(p => p.pago).reduce((s, p) => s + (p.valor || 0), 0),
    };
  }, [patients]);

  const recent = useMemo(() => [...patients].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 6), [patients]);
  const inProc = patients.filter(p => p.status === 'em_procedimento');

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <Box>
      {/* Greeting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
          {greet()}, {user?.nome?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        <Grid item xs={6} lg={3}>
          <KPICard title="Total Pacientes" value={stats.total} sub="+12%" icon={<PeopleRoundedIcon />} color="#4F86C6" gradient="linear-gradient(135deg,#4F86C6,#7BA7D8)" />
        </Grid>
        <Grid item xs={6} lg={3}>
          <KPICard title="Agendados Hoje" value={stats.today} icon={<AccessTimeRoundedIcon />} color="#F4A44A" gradient="linear-gradient(135deg,#F4A44A,#F7BF7C)" />
        </Grid>
        <Grid item xs={6} lg={3}>
          <KPICard title="Em Atendimento" value={stats.inProcedure} icon={<HealingRoundedIcon />} color="#E07070" gradient="linear-gradient(135deg,#E07070,#EB9898)" />
        </Grid>
        <Grid item xs={6} lg={3}>
          <KPICard title="Faturamento Hoje" value={formatCurrency(stats.todayRevenue)} sub="+8%" icon={<PaymentsRoundedIcon />} color="#6BBF8B" gradient="linear-gradient(135deg,#6BBF8B,#9AD4AE)" />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        {/* Resumo do Dia */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2.5 }}>Resumo do Dia</Typography>
              <Stack spacing={2}>
                {[
                  { label: 'Aguardando pagamento', count: stats.pending, total: stats.total, color: '#F4A44A' },
                  { label: 'Aguardando atendimento', count: stats.waiting, total: stats.total, color: '#4F86C6' },
                  { label: 'Em procedimento', count: stats.inProcedure, total: stats.total, color: '#E07070' },
                  { label: 'Finalizados', count: stats.done, total: stats.total, color: '#6BBF8B' },
                ].map(({ label, count, total, color }) => (
                  <Box key={label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="subtitle2" sx={{ color }}>{count}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={total > 0 ? (count / total) * 100 : 0}
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Em Procedimento Agora */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Em Procedimento Agora</Typography>
                {inProc.length > 0 && <Chip label={`${inProc.length} ativos`} size="small" sx={{ bgcolor: '#FFE0D0', color: '#B53E2E', fontWeight: 700 }} />}
              </Box>
              {inProc.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HealingRoundedIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.12)', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Nenhum paciente em procedimento</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {inProc.map((p, i) => {
                    const steps = getSteps(p.procedureType);
                    const progress = ((p.procedureProgress || 0) / steps.length) * 100;
                    return (
                      <Paper key={p.id} elevation={0} sx={{ p: 2, bgcolor: 'rgba(244,164,74,0.06)', border: '1px solid rgba(244,164,74,0.2)', borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: '0.9rem', fontWeight: 700 }}>
                            {(p.name || p.nome || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>{p.name || p.nome}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>{p.procedureType} · {p.dentist}</Typography>
                          </Box>
                          <Chip label={`Passo ${(p.procedureProgress || 0) + 1}/${steps.length}`} size="small"
                            sx={{ bgcolor: '#FFE0D0', color: '#B53E2E', fontWeight: 700, fontSize: '0.7rem' }} />
                        </Box>
                        <LinearProgress variant="determinate" value={progress}
                          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#F4A44A', borderRadius: 3 } }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {steps[p.procedureProgress || 0] || steps[steps.length - 1]}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pacientes Recentes */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Pacientes Recentes</Typography>
              <List disablePadding>
                {recent.map((p, i) => (
                  <Box key={p.id}>
                    <ListItem disablePadding sx={{ py: 1, gap: 1 }}>
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: '0.875rem', fontWeight: 700 }}>
                          {(p.name || p.nome || '?').charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2" noWrap>{p.name || p.nome}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary" noWrap>{p.procedureType} · {p.dentist}</Typography>}
                        sx={{ my: 0 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        {p.scheduleDate && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            {formatTime(p.scheduleDate)}
                          </Typography>
                        )}
                        <StatusBadge status={p.status} />
                        {p.valor && (
                          <Typography variant="caption" fontWeight={700} color={p.pago ? 'success.dark' : 'warning.dark'} sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap' }}>
                            {formatCurrency(p.valor)}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                    {i < recent.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}