import { useState, useContext, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Button, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Grid,
  Avatar, Tooltip, Divider, CircularProgress
} from '@mui/material';
import {
  Search, WhatsApp, Phone, CheckCircle, Cancel, Edit,
  Add, EventNote, FilterList
} from '@mui/icons-material';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import { StatusBadge } from './UI/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente_pagamento', label: 'Aguard. Pagamento' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_procedimento', label: 'Em Procedimento' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const AppointmentManagement = () => {
  const { patients, updatePatientStatus, loading } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [cancelDialog, setCancelDialog] = useState({ open: false, patient: null, reason: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, patient: null });

  const canManage = ['gestor', 'proprietario', 'atendente'].includes(user?.cargo);

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const nome = (p.nome || p.name || '').toLowerCase();
      const tel = p.telefone || p.phone || '';
      const matchSearch = !search || nome.includes(search.toLowerCase()) || tel.includes(search);
      const matchStatus = filterStatus === 'todos' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [patients, search, filterStatus]);

  const handleConfirm = (patient) => {
    updatePatientStatus(patient.id, 'agendado');
    setConfirmDialog({ open: false, patient: null });
  };

  const handleCancel = () => {
    if (cancelDialog.patient) {
      updatePatientStatus(cancelDialog.patient.id, 'cancelado', cancelDialog.reason);
    }
    setCancelDialog({ open: false, patient: null, reason: '' });
  };

  const openWhatsApp = (patient) => {
    const phone = (patient.telefone || patient.phone || '').replace(/\D/g, '');
    if (!phone) return;
    const msg = encodeURIComponent(
      `Olá ${patient.nome || patient.name}! Confirmamos seu agendamento para ${patient.procedimento || patient.procedureType || 'procedimento'} com ${patient.dentist || 'nosso profissional'}. Até breve!`
    );
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>
        Agendamentos
      </Typography>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled' }} /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              select fullWidth label="Filtrar por status"
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><FilterList sx={{ color: 'text.disabled' }} /></InputAdornment> }}
            >
              {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              <b>{filtered.length}</b> agendamento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700 }}>Paciente</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Procedimento</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Dentista</TableCell>
                <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Valor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                {canManage && <TableCell sx={{ fontWeight: 700 }} align="right">Ações</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <EventNote sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhum agendamento encontrado</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700, fontSize: '0.9rem' }}>
                        {(p.nome || p.name || '?').charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.nome || p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.telefone || p.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2">{p.procedimento || p.procedureType || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">{p.dentist || p.dentista || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {p.valor ? (
                      <Chip label={`R$ ${Number(p.valor).toFixed(0)}`} size="small"
                        sx={{ bgcolor: '#F0FDF4', color: '#059669', fontWeight: 700 }} />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="WhatsApp">
                          <IconButton size="small" onClick={() => openWhatsApp(p)} sx={{ color: '#25D366' }}>
                            <WhatsApp sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        {p.status === 'pendente_pagamento' && (
                          <Tooltip title="Confirmar como agendado">
                            <IconButton size="small" onClick={() => setConfirmDialog({ open: true, patient: p })}
                              sx={{ color: '#059669' }}>
                              <CheckCircle sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {['agendado', 'pendente_pagamento'].includes(p.status) && (
                          <Tooltip title="Cancelar">
                            <IconButton size="small"
                              onClick={() => setCancelDialog({ open: true, patient: p, reason: '' })}
                              sx={{ color: '#DC2626' }}>
                              <Cancel sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog confirmar */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, patient: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Confirmar Agendamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Confirmar o agendamento de <b>{confirmDialog.patient?.nome || confirmDialog.patient?.name}</b>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog({ open: false, patient: null })} variant="outlined">Cancelar</Button>
          <Button onClick={() => handleConfirm(confirmDialog.patient)} variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog cancelar */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, patient: null, reason: '' })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'error.main' }}>Cancelar Agendamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Cancelar agendamento de <b>{cancelDialog.patient?.nome || cancelDialog.patient?.name}</b>?
          </Typography>
          <TextField
            fullWidth multiline rows={2}
            label="Motivo do cancelamento (opcional)"
            value={cancelDialog.reason}
            onChange={e => setCancelDialog(d => ({ ...d, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialog({ open: false, patient: null, reason: '' })} variant="outlined">Voltar</Button>
          <Button onClick={handleCancel} variant="contained" color="error">Cancelar Agendamento</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentManagement;