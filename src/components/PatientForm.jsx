import { useState, useContext } from 'react';
import {
  Box, Grid, TextField, Button, Typography, MenuItem, Paper,
  Tabs, Tab, Autocomplete, Alert, Snackbar, Chip
} from '@mui/material';
import { PersonAdd, EventNote } from '@mui/icons-material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { PatientsContext } from '../contexts/PatientsContext';

const PROCEDURES = {
  'Consulta Odontológica': 150,
  'Limpeza Dental': 200,
  'Clareamento': 800,
  'Extração': 350,
  'Canal': 1200,
  'Microcirurgia': 2500,
  'Aplicação de Botox': 600,
  'Preenchimento': 1200,
  'Lipoaspiração': 5000,
  'Rinoplastia': 8000,
  'Blefaroplastia': 4000,
  'Outros': 300,
};

const DENTISTS = ['Dra. Ana Silva', 'Dr. Carlos Santos', 'Dra. Mariana Oliveira', 'Dr. Rafael Mendes', 'Dra. Juliana Costa'];

const defaultNewForm = () => ({
  nome: '', telefone: '', email: '', cpf: '',
  procedimento: 'Consulta Odontológica',
  dentist: DENTISTS[0],
  observations: '',
  scheduleDate: new Date(),
  scheduleTime: new Date(),
});

const PatientForm = ({ onNavigateToCashier }) => {
  const { patients, addPatient } = useContext(PatientsContext);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(defaultNewForm());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quickForm, setQuickForm] = useState({
    procedimento: 'Consulta Odontológica',
    dentist: DENTISTS[0],
    scheduleDate: new Date(),
    scheduleTime: new Date(),
    observations: '',
  });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const show = (msg, severity = 'success') => setSnack({ open: true, msg, severity });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setQ = (k, v) => setQuickForm((p) => ({ ...p, [k]: v }));

  const combinedDateTime = (date, time) => {
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return d;
  };

  const handleNewSubmit = (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) { show('Preencha Nome e Telefone', 'error'); return; }
    const dt = combinedDateTime(form.scheduleDate, form.scheduleTime);
    const patient = addPatient({
      nome: form.nome, name: form.nome,
      telefone: form.telefone, phone: form.telefone,
      email: form.email, cpf: form.cpf,
      procedimento: form.procedimento, procedureType: form.procedimento,
      dentist: form.dentist,
      observations: form.observations,
      data_hora: dt.toISOString(),
      scheduleDate: dt,
      valor: PROCEDURES[form.procedimento] || 150,
      status: 'pendente_pagamento',
      pago: false,
    });
    localStorage.setItem('pendingPayment', JSON.stringify({ patient, procedure: form.procedimento, valor: PROCEDURES[form.procedimento] }));
    show('Paciente cadastrado! Redirecionando para caixa...');
    setForm(defaultNewForm());
    setTimeout(() => onNavigateToCashier?.(), 1800);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!selected) { show('Selecione um paciente', 'error'); return; }
    const dt = combinedDateTime(quickForm.scheduleDate, quickForm.scheduleTime);
    const patient = addPatient({
      ...selected,
      procedimento: quickForm.procedimento, procedureType: quickForm.procedimento,
      dentist: quickForm.dentist,
      observations: quickForm.observations,
      data_hora: dt.toISOString(),
      scheduleDate: dt,
      valor: PROCEDURES[quickForm.procedimento] || 150,
      status: 'pendente_pagamento',
      pago: false,
      id: undefined,
    });
    localStorage.setItem('pendingPayment', JSON.stringify({ patient, procedure: quickForm.procedimento, valor: PROCEDURES[quickForm.procedimento] }));
    show('Agendamento criado! Redirecionando para caixa...');
    setSelected(null); setSearch('');
    setTimeout(() => onNavigateToCashier?.(), 1800);
  };

  const filteredPatients = patients.filter((p) =>
    (p.nome || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone || p.phone || '').includes(search)
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2.5 }}>Cadastro de Pacientes</Typography>

        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab icon={<EventNote />} iconPosition="start" label="Agendamento Rápido" sx={{ minHeight: 48 }} />
            <Tab icon={<PersonAdd />} iconPosition="start" label="Novo Paciente" sx={{ minHeight: 48 }} />
          </Tabs>
        </Paper>

        {tab === 0 && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Agendar para paciente existente</Typography>
            <form onSubmit={handleQuickSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={filteredPatients}
                    getOptionLabel={(o) => `${o.nome || o.name} — ${o.telefone || o.phone}`}
                    inputValue={search}
                    onInputChange={(_, v) => setSearch(v)}
                    onChange={(_, v) => setSelected(v)}
                    renderInput={(params) => <TextField {...params} label="Buscar paciente" fullWidth />}
                  />
                </Grid>
                {selected && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip label={selected.nome || selected.name} sx={{ fontWeight: 600 }} />
                      <Chip label={selected.telefone || selected.phone} variant="outlined" />
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Procedimento" value={quickForm.procedimento} onChange={(e) => setQ('procedimento', e.target.value)}>
                    {Object.entries(PROCEDURES).map(([k, v]) => <MenuItem key={k} value={k}>{k} — R$ {v}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Dentista" value={quickForm.dentist} onChange={(e) => setQ('dentist', e.target.value)}>
                    {DENTISTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Data" value={quickForm.scheduleDate} onChange={(v) => setQ('scheduleDate', v)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} minDate={new Date()} format="dd/MM/yyyy" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker label="Horário" value={quickForm.scheduleTime} onChange={(v) => setQ('scheduleTime', v)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Observações" value={quickForm.observations} onChange={(e) => setQ('observations', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" fullWidth disabled={!selected}>
                    Agendar Procedimento — R$ {PROCEDURES[quickForm.procedimento]}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}

        {tab === 1 && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Cadastrar novo paciente</Typography>
            <form onSubmit={handleNewSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Nome Completo *" value={form.nome} onChange={(e) => set('nome', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Telefone *" value={form.telefone} onChange={(e) => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CPF" value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Procedimento" value={form.procedimento} onChange={(e) => set('procedimento', e.target.value)}>
                    {Object.entries(PROCEDURES).map(([k, v]) => <MenuItem key={k} value={k}>{k} — R$ {v}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Dentista" value={form.dentist} onChange={(e) => set('dentist', e.target.value)}>
                    {DENTISTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Data" value={form.scheduleDate} onChange={(v) => set('scheduleDate', v)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} minDate={new Date()} format="dd/MM/yyyy" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker label="Horário" value={form.scheduleTime} onChange={(v) => set('scheduleTime', v)} slotProps={{ textField: { fullWidth: true, size: 'small' } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Observações" value={form.observations} onChange={(e) => set('observations', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" fullWidth>
                    Cadastrar — R$ {PROCEDURES[form.procedimento]}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default PatientForm;