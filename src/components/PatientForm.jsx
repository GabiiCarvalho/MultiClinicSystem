import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Box, Grid, TextField, Button, Typography, MenuItem, Paper,
  Tabs, Tab, Autocomplete, Alert, Snackbar, Chip, Avatar,
  InputAdornment, CircularProgress
} from '@mui/material';
import {
  PersonAdd, EventNote, Person, Phone, Email, Badge,
  MedicalServices, Notes, AttachMoney, Search
} from '@mui/icons-material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { PatientsContext } from '../contexts/PatientsContext';

/* ─── Preços padrão — idealmente viria de GET /procedimentos ─── */
const PROCEDURES = {
  'Consulta Odontológica':  150,
  'Limpeza Dental':         200,
  'Clareamento':            800,
  'Extração':               350,
  'Canal':                  1200,
  'Microcirurgia':          2500,
  'Aplicação de Botox':     600,
  'Preenchimento':          1200,
  'Lipoaspiração':          5000,
  'Rinoplastia':            8000,
  'Blefaroplastia':         4000,
  'Outros':                 300,
};

const defaultNew = () => ({
  nome: '', telefone: '', email: '', cpf: '',
  procedimento: 'Consulta Odontológica',
  profissional_id: '',
  observations: '',
  scheduleDate: new Date(),
  scheduleTime: new Date(),
});

const IconField = ({ icon, ...props }) => (
  <TextField
    {...props}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <Box sx={{ color: 'text.disabled', display: 'flex', fontSize: 18 }}>{icon}</Box>
        </InputAdornment>
      ),
      ...props.InputProps,
    }}
  />
);

const SectionTitle = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 1 }}>
    <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
    <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', px: 1, whiteSpace: 'nowrap' }}>
      {children}
    </Typography>
    <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
  </Box>
);

const PatientForm = ({ onNavigateToCashier }) => {
  const { patients, addPatient, fetchPatients } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const [tab,         setTab]         = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [dentistas,   setDentistas]   = useState([]);  // profissionais reais da clínica
  const [loadingDent, setLoadingDent] = useState(false);

  // Novo paciente
  const [form, setForm] = useState(defaultNew());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Agendamento rápido
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [quick,    setQuick]    = useState({
    procedimento: 'Consulta Odontológica',
    profissional_id: '',
    scheduleDate: new Date(),
    scheduleTime: new Date(),
    observations: '',
  });
  const setQ = (k, v) => setQuick(f => ({ ...f, [k]: v }));

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const show = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // Busca profissionais reais da clínica (dentistas + esteticistas)
  useEffect(() => {
    const fetchDentistas = async () => {
      setLoadingDent(true);
      try {
        const res = await api.get('/usuarios');
        const profissionais = (res.data || []).filter(u =>
          ['dentista', 'esteticista', 'Dentista', 'Esteticista'].includes(u.cargo)
        );
        setDentistas(profissionais);
        // Pré-seleciona o primeiro
        if (profissionais.length > 0) {
          set('profissional_id', profissionais[0].id);
          setQ('profissional_id', profissionais[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar profissionais:', err);
        // Fallback vazio — usuário escolhe manualmente
      } finally {
        setLoadingDent(false);
      }
    };
    fetchDentistas();
  }, []);

  const combineDT = (date, time) => {
    const d = new Date(date);
    const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0);
    return d;
  };

  const handleNewSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) { show('Preencha Nome e Telefone', 'error'); return; }
    if (!form.profissional_id)        { show('Selecione um profissional', 'error'); return; }

    setLoading(true);
    try {
      const dt  = combineDT(form.scheduleDate, form.scheduleTime);
      const dtFim = new Date(dt.getTime() + 60 * 60000);

      // addPatient agora é async e chama a API
      const patient = await addPatient({
        nome:            form.nome,
        telefone:        form.telefone,
        email:           form.email,
        cpf:             form.cpf,
        observacoes:     form.observations,
        // Dados do agendamento (addPatient cria ambos)
        profissional_id: form.profissional_id,
        data_hora:       dt.toISOString(),
        data_hora_fim:   dtFim.toISOString(),
        valor:           PROCEDURES[form.procedimento] || 150,
      });

      show('Paciente cadastrado! Redirecionando para caixa...');
      setForm(defaultNew());
      setTimeout(() => onNavigateToCashier?.(), 1800);
    } catch (err) {
      show(err.message || 'Erro ao cadastrar paciente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!selected)                { show('Selecione um paciente', 'error'); return; }
    if (!quick.profissional_id)   { show('Selecione um profissional', 'error'); return; }

    setLoading(true);
    try {
      const dt    = combineDT(quick.scheduleDate, quick.scheduleTime);
      const dtFim = new Date(dt.getTime() + 60 * 60000);

      // Cria só o agendamento para paciente já existente
      await api.post('/agendamentos', {
        paciente_id:      selected.id,
        profissional_id:  quick.profissional_id,
        data_hora:        dt.toISOString(),
        data_hora_fim:    dtFim.toISOString(),
        valor:            PROCEDURES[quick.procedimento] || 150,
        observacoes:      quick.observations,
      });

      await fetchPatients(); // atualiza lista
      show('Agendamento criado! Redirecionando para caixa...');
      setSelected(null);
      setSearch('');
      setTimeout(() => onNavigateToCashier?.(), 1800);
    } catch (err) {
      show(err.response?.data?.error || err.message || 'Erro ao agendar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = patients.filter(p =>
    (p.nome || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone || p.phone || '').includes(search)
  );

  const procPrice   = PROCEDURES[form.procedimento]  || 0;
  const quickPrice  = PROCEDURES[quick.procedimento] || 0;

  const DentistaSelect = ({ value, onChange, label = 'Dentista / Profissional' }) => (
    <TextField
      select
      fullWidth
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loadingDent}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Person sx={{ color: 'text.disabled', fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
    >
      {loadingDent
        ? <MenuItem disabled>Carregando...</MenuItem>
        : dentistas.length > 0
          ? dentistas.map(d => (
              <MenuItem key={d.id} value={d.id}>
                {d.nome}
                {d.especialidade && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    · {d.especialidade}
                  </Typography>
                )}
              </MenuItem>
            ))
          : <MenuItem disabled>Nenhum profissional cadastrado</MenuItem>
      }
    </TextField>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ maxWidth: 860, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Cadastro</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Agende para paciente existente ou cadastre um novo
        </Typography>

        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1 }}>
            <Tab icon={<EventNote sx={{ fontSize: 18 }} />} iconPosition="start"
              label="Agendamento Rápido" sx={{ minHeight: 52, fontSize: '0.85rem' }} />
            <Tab icon={<PersonAdd sx={{ fontSize: 18 }} />} iconPosition="start"
              label="Novo Paciente" sx={{ minHeight: 52, fontSize: '0.85rem' }} />
          </Tabs>
        </Paper>

        {/* ── ABA 0: AGENDAMENTO RÁPIDO ── */}
        {tab === 0 && (
          <form onSubmit={handleQuickSubmit}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <SectionTitle>Selecionar Paciente</SectionTitle>

              <Autocomplete
                options={filtered}
                getOptionLabel={o => `${o.nome || o.name} — ${o.telefone || o.phone}`}
                inputValue={search}
                onInputChange={(_, v) => setSearch(v)}
                onChange={(_, v) => setSelected(v)}
                noOptionsText="Nenhum paciente encontrado"
                renderInput={params => (
                  <TextField {...params} label="Buscar por nome ou telefone" fullWidth
                    InputProps={{ ...params.InputProps, startAdornment: <><Search sx={{ color: 'text.disabled', mr: 0.5, fontSize: 20 }} />{params.InputProps.startAdornment}</> }} />
                )}
                renderOption={(props, o) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                        {(o.nome || o.name || '?').charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{o.nome || o.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{o.telefone || o.phone}</Typography>
                      </Box>
                    </Box>
                  </li>
                )}
              />

              {selected && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#F0FDF4', borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'center', border: '1px solid #BBF7D0' }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36, fontWeight: 700 }}>
                    {(selected.nome || selected.name || '?').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700} color="success.dark">{selected.nome || selected.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.telefone || selected.phone}</Typography>
                  </Box>
                  <Chip label="Selecionado" size="small" color="success" variant="outlined" />
                </Box>
              )}

              <SectionTitle>Detalhes do Agendamento</SectionTitle>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Procedimento" value={quick.procedimento}
                    onChange={e => setQ('procedimento', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServices sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }}>
                    {Object.entries(PROCEDURES).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <span>{k}</span>
                          <Typography variant="caption" color="success.main" fontWeight={700}>R$ {v}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DentistaSelect value={quick.profissional_id} onChange={v => setQ('profissional_id', v)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Data do agendamento" value={quick.scheduleDate}
                    onChange={v => setQ('scheduleDate', v)} minDate={new Date()} format="dd/MM/yyyy"
                    slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker label="Horário" value={quick.scheduleTime}
                    onChange={v => setQ('scheduleTime', v)} slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Observações (opcional)"
                    value={quick.observations} onChange={e => setQ('observations', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><Notes sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Valor do procedimento</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    R$ {quickPrice.toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={!selected || loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AttachMoney />}
                  sx={{ px: 4, height: 48, fontSize: '0.95rem' }}>
                  {loading ? 'Salvando...' : 'Agendar e ir para Caixa'}
                </Button>
              </Box>
            </Paper>
          </form>
        )}

        {/* ── ABA 1: NOVO PACIENTE ── */}
        {tab === 1 && (
          <form onSubmit={handleNewSubmit}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
              <SectionTitle>Dados Pessoais</SectionTitle>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <IconField fullWidth required label="Nome Completo *" value={form.nome}
                    onChange={e => set('nome', e.target.value)} icon={<Person sx={{ fontSize: 20 }} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <IconField fullWidth required label="Telefone / WhatsApp *" value={form.telefone}
                    onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000"
                    icon={<Phone sx={{ fontSize: 20 }} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <IconField fullWidth label="E-mail" type="email" value={form.email}
                    onChange={e => set('email', e.target.value)} icon={<Email sx={{ fontSize: 20 }} />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <IconField fullWidth label="CPF" value={form.cpf}
                    onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00"
                    icon={<Badge sx={{ fontSize: 20 }} />} />
                </Grid>
              </Grid>

              <SectionTitle>Agendamento</SectionTitle>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth label="Procedimento" value={form.procedimento}
                    onChange={e => set('procedimento', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><MedicalServices sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }}>
                    {Object.entries(PROCEDURES).map(([k, v]) => (
                      <MenuItem key={k} value={k}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 2 }}>
                          <span>{k}</span>
                          <Typography variant="caption" color="success.main" fontWeight={700}>R$ {v}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DentistaSelect value={form.profissional_id} onChange={v => set('profissional_id', v)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker label="Data do agendamento" value={form.scheduleDate}
                    onChange={v => set('scheduleDate', v)} minDate={new Date()} format="dd/MM/yyyy"
                    slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TimePicker label="Horário" value={form.scheduleTime}
                    onChange={v => set('scheduleTime', v)} slotProps={{ textField: { fullWidth: true } }} />
                </Grid>
                <Grid item xs={12}>
                  <IconField fullWidth multiline rows={3} label="Observações (opcional)"
                    value={form.observations} onChange={e => set('observations', e.target.value)}
                    icon={<Notes sx={{ fontSize: 20 }} />}
                    InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><Notes sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }} />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Valor do procedimento</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    R$ {procPrice.toLocaleString('pt-BR')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Será cobrado no caixa após cadastro
                  </Typography>
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <PersonAdd />}
                  sx={{ px: 4, height: 48, fontSize: '0.95rem' }}>
                  {loading ? 'Salvando...' : 'Cadastrar e ir para Caixa'}
                </Button>
              </Box>
            </Paper>
          </form>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default PatientForm;