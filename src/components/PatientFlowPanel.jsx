import { useState, useContext, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Avatar, Chip,
  IconButton, Button, Stepper, Step, StepLabel, Tabs, Tab,
  Badge, Divider, Tooltip, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import {
  PlayArrow, CheckCircle, Cancel, ArrowBack, ArrowForward,
  WhatsApp, Phone, Schedule, AttachMoney, Refresh
} from '@mui/icons-material';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import { StatusBadge } from '../components/UI/StatusBadge';

const TABS = [
  { key: 'pendentes',      label: 'Aguard. Pagamento', color: '#D97706' },
  { key: 'aguardando',     label: 'Aguardando',         color: '#2563EB' },
  { key: 'em_procedimento',label: 'Em Procedimento',    color: '#DC2626' },
  { key: 'finalizado',     label: 'Finalizados',        color: '#059669' },
  { key: 'cancelado',      label: 'Cancelados',         color: '#64748B' },
];

const STEPS_MAP = {
  cirurgia: ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'],
  consulta: ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'],
  default:  ['Preparação', 'Procedimento', 'Finalização'],
};

const getSteps = (type) => {
  if (!type) return STEPS_MAP.default;
  const t = type.toLowerCase();
  if (t.includes('cirurgia') || t.includes('micro')) return STEPS_MAP.cirurgia;
  if (t.includes('consulta')) return STEPS_MAP.consulta;
  return STEPS_MAP.default;
};

const PatientCard = ({ patient, onUpdateStatus, onUpdateProgress, userCargo }) => {
  const steps = getSteps(patient.procedimento || patient.procedureType);
  const cur = patient.procedureProgress || 0;
  const isPendente = patient.status === 'pendente_pagamento';
  const isProc = patient.status === 'em_procedimento';
  const canAct = ['gestor', 'proprietario', 'dentista'].includes(userCargo);

  const phone = (patient.telefone || patient.phone || '').replace(/\D/g, '');

  return (
    <Card sx={{ height: '100%', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', minWidth: 0 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700, flexShrink: 0 }}>
              {(patient.nome || patient.name || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{patient.nome || patient.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{patient.telefone || patient.phone || '—'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {phone && (
              <Tooltip title="WhatsApp">
                <IconButton size="small" component="a" href={`https://wa.me/55${phone}`} target="_blank" sx={{ color: '#25D366' }}>
                  <WhatsApp sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {phone && (
              <Tooltip title="Ligar">
                <IconButton size="small" component="a" href={`tel:${phone}`} sx={{ color: '#2563EB' }}>
                  <Phone sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary">Procedimento</Typography>
          <Typography variant="body2" fontWeight={600}>{patient.procedimento || patient.procedureType || '—'}</Typography>
        </Box>
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Dentista</Typography>
            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.8rem' }}>{patient.dentist || patient.dentista || '—'}</Typography>
          </Box>
          {patient.valor && (
            <Chip label={`R$ ${Number(patient.valor).toFixed(0)}`} size="small" sx={{ bgcolor: '#F0FDF4', color: '#059669', fontWeight: 700 }} />
          )}
        </Box>

        <StatusBadge status={patient.status} />

        {/* Stepper for in-progress */}
        {isProc && (
          <Box sx={{ mt: 1.5 }}>
            <Stepper activeStep={cur} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.65rem' }, '& .MuiStepIcon-root': { fontSize: '1rem' } }}>
              {steps.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
            </Stepper>
          </Box>
        )}

        {/* Actions */}
        {canAct && (
          <Box sx={{ mt: 1.5 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {patient.status === 'agendado' && patient.pago && (
                <Button size="small" variant="contained" startIcon={<PlayArrow />}
                  onClick={() => onUpdateStatus(patient.id, 'em_procedimento')}
                  sx={{ flex: 1, fontSize: '0.75rem', minWidth: 0 }}>
                  Iniciar
                </Button>
              )}
              {isProc && (
                <>
                  <IconButton size="small" onClick={() => onUpdateProgress(patient.id, Math.max(0, cur - 1))}
                    disabled={cur === 0} sx={{ border: '1px solid #E2E8F0' }}>
                    <ArrowBack sx={{ fontSize: 14 }} />
                  </IconButton>
                  <Button size="small" variant="outlined" onClick={() => {
                    const next = cur + 1;
                    if (next >= steps.length) onUpdateStatus(patient.id, 'finalizado');
                    else onUpdateProgress(patient.id, next);
                  }} sx={{ flex: 1, fontSize: '0.75rem', minWidth: 0 }}>
                    {cur >= steps.length - 1 ? 'Finalizar' : 'Avançar'}
                  </Button>
                </>
              )}
              {patient.status === 'finalizado' && (
                <Button size="small" variant="outlined" startIcon={<Refresh />}
                  onClick={() => onUpdateStatus(patient.id, 'agendado')}
                  sx={{ fontSize: '0.75rem' }}>
                  Reabrir
                </Button>
              )}
              {(patient.status === 'agendado' || isProc) && (
                <Tooltip title="Cancelar">
                  <IconButton size="small" onClick={() => onUpdateStatus(patient.id, 'cancelado')}
                    sx={{ border: '1px solid #FEE2E2', color: '#DC2626' }}>
                    <Cancel sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const PatientFlowPanel = () => {
  const { patients, updatePatientStatus, updatePatientProgress, getPatientsByStatus, loading } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState(1);

  const byStatus = getPatientsByStatus();
  const currentList = byStatus[TABS[tab].key] || [];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>Fluxo de Pacientes</Typography>

      {/* Tabs — scrollable on mobile */}
      <Paper sx={{ mb: 2.5, borderRadius: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ '& .MuiTabs-indicator': { height: 3, borderRadius: 2 } }}
        >
          {TABS.map((t, i) => {
            const count = (byStatus[t.key] || []).length;
            return (
              <Tab
                key={t.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span style={{ fontSize: '0.82rem' }}>{t.label}</span>
                    {count > 0 && (
                      <Chip label={count} size="small" sx={{ height: 18, minWidth: 22, fontSize: '0.68rem', bgcolor: `${t.color}15`, color: t.color, fontWeight: 700 }} />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {currentList.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">Nenhum paciente nesta categoria</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {currentList.map((p) => (
            <Grid item xs={12} sm={6} lg={4} key={p.id}>
              <PatientCard
                patient={p}
                onUpdateStatus={updatePatientStatus}
                onUpdateProgress={updatePatientProgress}
                userCargo={user?.cargo}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PatientFlowPanel;