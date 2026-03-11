import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
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

/* ─── Tabela de procedimentos com preços ─── */
const PROCEDURES = {
  'Consulta Odontológica': 150,
  'Limpeza Dental':        200,
  'Clareamento':           800,
  'Extração':              350,
  'Canal':                 1200,
  'Microcirurgia':         2500,
  'Aplicação de Botox':    600,
  'Preenchimento':         1200,
  'Lipoaspiração':         5000,
  'Rinoplastia':           8000,
  'Blefaroplastia':        4000,
  'Outros':                300,
};

const blankNew = () => ({
  nome:'', telefone:'', email:'', cpf:'',
  procedimento:'Consulta Odontológica',
  profissional_id:'',
  observations:'',
  scheduleDate: new Date(),
  scheduleTime: new Date(),
});

const SectionTitle = ({ children }) => (
  <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:2,mt:1 }}>
    <Box sx={{ flex:1,height:1,bgcolor:'divider' }}/>
    <Typography variant="caption" sx={{ color:'text.disabled',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',px:1,whiteSpace:'nowrap' }}>
      {children}
    </Typography>
    <Box sx={{ flex:1,height:1,bgcolor:'divider' }}/>
  </Box>
);

const ProcSelect = ({ value, onChange, required }) => (
  <TextField select fullWidth required={required} label="Procedimento" value={value} onChange={e=>onChange(e.target.value)}
    InputProps={{ startAdornment:<InputAdornment position="start"><MedicalServices sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}>
    {Object.entries(PROCEDURES).map(([k,v])=>(
      <MenuItem key={k} value={k}>
        <Box sx={{ display:'flex',justifyContent:'space-between',width:'100%',gap:2 }}>
          <span>{k}</span>
          <Typography variant="caption" color="success.main" fontWeight={700}>R$ {v.toLocaleString('pt-BR')}</Typography>
        </Box>
      </MenuItem>
    ))}
  </TextField>
);

const PatientForm = ({ onNavigateToCashier }) => {
  const { patients, fetchPatients } = useContext(PatientsContext);

  const [tab,         setTab]         = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [dentistas,   setDentistas]   = useState([]);
  const [loadingDent, setLoadingDent] = useState(false);

  /* Formulário novo paciente */
  const [form, setForm] = useState(blankNew());
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  /* Formulário agendamento rápido */
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [quick,    setQuick]    = useState({
    procedimento:'Consulta Odontológica', profissional_id:'',
    scheduleDate:new Date(), scheduleTime:new Date(), observations:''
  });
  const sq = (k,v) => setQuick(f=>({...f,[k]:v}));

  const [snack, setSnack] = useState({ open:false, msg:'', severity:'success' });
  const show = (msg, severity='success') => setSnack({ open:true, msg, severity });

  /* Carrega dentistas */
  useEffect(() => {
    setLoadingDent(true);
    api.get('/usuarios').then(res=>{
      const prof = (res.data||[]).filter(u=>['dentista','esteticista','Dentista','Esteticista'].includes(u.cargo));
      setDentistas(prof);
      if (prof.length>0) {
        sf('profissional_id', String(prof[0].id));
        sq('profissional_id', String(prof[0].id));
      }
    }).catch(()=>{}).finally(()=>setLoadingDent(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const combineDT = (date, time) => {
    const d = new Date(date); const t = new Date(time);
    d.setHours(t.getHours(), t.getMinutes(), 0, 0); return d;
  };

  const DentistaSelect = ({ value, onChange }) => (
    <TextField select fullWidth label="Dentista / Profissional" value={value}
      onChange={e=>onChange(e.target.value)} disabled={loadingDent}
      InputProps={{ startAdornment:<InputAdornment position="start"><Person sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}>
      {loadingDent
        ? <MenuItem disabled value="">Carregando...</MenuItem>
        : dentistas.length>0
          ? dentistas.map(d=>(
              <MenuItem key={d.id} value={String(d.id)}>
                {d.nome}
                {d.especialidade && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml:1 }}>· {d.especialidade}</Typography>}
              </MenuItem>
            ))
          : <MenuItem value="">Nenhum profissional</MenuItem>
      }
    </TextField>
  );

  /* ── Novo paciente (CORRIGIDO) ── */
  const handleNew = async (e) => {
    e.preventDefault();
    if (!form.nome||!form.telefone) { show('Preencha Nome e Telefone','error'); return; }
    setLoading(true);
    try {
      const dt    = combineDT(form.scheduleDate, form.scheduleTime);
      const valor = PROCEDURES[form.procedimento] || 150;

      const { data: paciente } = await api.post('/pacientes', {
        nome: form.nome, telefone: form.telefone,
        email: form.email||null, cpf: form.cpf||null,
        observacoes: form.observations||null,
      });

      const { data: agendamento } = await api.post('/agendamentos', {
        paciente_id:     paciente.id,
        profissional_id: form.profissional_id || null,
        data_hora:       dt.toISOString(),
        data_hora_fim:   new Date(dt.getTime()+3600000).toISOString(),
        valor,
        observacoes: form.observations||null,
        status: 'pendente_pagamento',
      });

      // ✅ CORREÇÃO: Buscar dados completos do agendamento com JOIN
      const { data: agendamentoCompleto } = await api.get(`/agendamentos/${agendamento.id}`);

      await fetchPatients();

      // Passa dados completos para o caixa
      onNavigateToCashier?.({
        paciente,
        agendamentos: [{
          id:                     agendamento.id,
          procedimento:           agendamentoCompleto.procedimento || { nome: form.procedimento },
          procedimento_nome:      form.procedimento,
          procedimento_descricao: form.observations || '',
          valor,
        }],
      });

      show('Paciente cadastrado!');
      setForm(blankNew());
    } catch (err) {
      show(err.response?.data?.error || err.message || 'Erro ao cadastrar','error');
    } finally { setLoading(false); }
  };

  /* ── Agendamento rápido (CORRIGIDO) ── */
  const handleQuick = async (e) => {
    e.preventDefault();
    if (!selected) { show('Selecione um paciente','error'); return; }
    setLoading(true);
    try {
      const dt    = combineDT(quick.scheduleDate, quick.scheduleTime);
      const valor = PROCEDURES[quick.procedimento] || 150;

      const { data: agendamento } = await api.post('/agendamentos', {
        paciente_id:     selected.paciente_id || selected.id,
        profissional_id: quick.profissional_id || null,
        data_hora:       dt.toISOString(),
        data_hora_fim:   new Date(dt.getTime()+3600000).toISOString(),
        valor,
        observacoes: quick.observations||null,
        status: 'pendente_pagamento',
      });

      // ✅ CORREÇÃO: Buscar dados completos do agendamento com JOIN
      const { data: agendamentoCompleto } = await api.get(`/agendamentos/${agendamento.id}`);

      await fetchPatients();

      onNavigateToCashier?.({
        paciente: { id: selected.paciente_id || selected.id, nome: selected.nome||selected.name, telefone: selected.telefone||selected.phone },
        agendamentos: [{
          id:                     agendamento.id,
          procedimento:           agendamentoCompleto.procedimento || { nome: quick.procedimento },
          procedimento_nome:      quick.procedimento,
          procedimento_descricao: quick.observations || '',
          valor,
        }],
      });

      show('Agendamento criado!');
      setSelected(null); setSearch('');
    } catch (err) {
      show(err.response?.data?.error || err.message || 'Erro ao agendar','error');
    } finally { setLoading(false); }
  };

  /* Pacientes únicos para busca (remove duplicatas por nome+telefone) */
  const uniquePatients = useMemo(() => {
    const seen = new Set();
    return patients.filter(p => {
      const key = `${p.paciente?.id||p.id}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map(p => ({
      ...p,
      id:       p.paciente?.id   || p.id,
      nome:     p.paciente?.nome || p.nome || p.name || '',
      telefone: p.paciente?.telefone || p.telefone || p.phone || '',
      paciente_id: p.paciente?.id || p.id,
    }));
  }, [patients]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ maxWidth:860,mx:'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Cadastro</Typography>
        <Typography variant="body2" color="text.secondary" mb={2.5}>
          Agende para paciente existente ou cadastre um novo
        </Typography>

        <Paper sx={{ mb:3,borderRadius:2 }}>
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ px:1 }}>
            <Tab icon={<EventNote sx={{fontSize:18}}/>} iconPosition="start" label="Agendamento Rápido" sx={{ minHeight:52,fontSize:'0.85rem' }}/>
            <Tab icon={<PersonAdd sx={{fontSize:18}}/>} iconPosition="start" label="Novo Paciente"      sx={{ minHeight:52,fontSize:'0.85rem' }}/>
          </Tabs>
        </Paper>

        {/* ── ABA 0: Agendamento Rápido ── */}
        {tab===0 && (
          <form onSubmit={handleQuick}>
            <Paper sx={{ p:{xs:2,sm:3},borderRadius:3 }}>
              <SectionTitle>Selecionar Paciente</SectionTitle>
              <Autocomplete
                options={uniquePatients}
                getOptionLabel={o=>`${o.nome||o.name||''} — ${o.telefone||o.phone||''}`}
                inputValue={search}
                onInputChange={(_,v)=>setSearch(v)}
                onChange={(_,v)=>setSelected(v)}
                noOptionsText="Nenhum paciente encontrado"
                renderInput={p=>(
                  <TextField {...p} label="Buscar por nome ou telefone" fullWidth
                    InputProps={{ ...p.InputProps, startAdornment:<><Search sx={{ color:'text.disabled',mr:0.5,fontSize:20 }}/>{p.InputProps.startAdornment}</> }}/>
                )}
                renderOption={(props, o) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Box sx={{ display:'flex',gap:1.5,alignItems:'center' }}>
                        <Avatar sx={{ width:32,height:32,bgcolor:'primary.main',fontSize:'0.85rem',fontWeight:700 }}>
                          {(o.nome||o.name||'?').charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{o.nome||o.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{o.telefone||o.phone}</Typography>
                        </Box>
                      </Box>
                    </li>
                  );
                }}
              />
              {selected && (
                <Box sx={{ mt:1.5,p:1.5,bgcolor:'#F0FDF4',borderRadius:2,display:'flex',gap:1.5,alignItems:'center',border:'1px solid #BBF7D0' }}>
                  <Avatar sx={{ bgcolor:'success.main',width:36,height:36,fontWeight:700 }}>
                    {(selected.nome||selected.name||'?').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex:1 }}>
                    <Typography variant="body2" fontWeight={700} color="success.dark">{selected.nome||selected.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.telefone||selected.phone}</Typography>
                  </Box>
                  <Chip label="Selecionado" size="small" color="success" variant="outlined"/>
                </Box>
              )}

              <SectionTitle>Detalhes do Agendamento</SectionTitle>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><ProcSelect value={quick.procedimento} onChange={v=>sq('procedimento',v)}/></Grid>
                <Grid item xs={12} sm={6}><DentistaSelect value={quick.profissional_id} onChange={v=>sq('profissional_id',v)}/></Grid>
                <Grid item xs={12} sm={6}><DatePicker label="Data" value={quick.scheduleDate} onChange={v=>sq('scheduleDate',v)} minDate={new Date()} format="dd/MM/yyyy" slotProps={{ textField:{ fullWidth:true } }}/></Grid>
                <Grid item xs={12} sm={6}><TimePicker label="Horário" value={quick.scheduleTime} onChange={v=>sq('scheduleTime',v)} slotProps={{ textField:{ fullWidth:true } }}/></Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={2} label="Observações (opcional)" value={quick.observations} onChange={e=>sq('observations',e.target.value)}
                    InputProps={{ startAdornment:<InputAdornment position="start" sx={{ alignSelf:'flex-start',mt:1 }}><Notes sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
              </Grid>

              <Box sx={{ mt:3,p:2,bgcolor:'#F8FAFC',borderRadius:2,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Valor do procedimento</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    R$ {(PROCEDURES[quick.procedimento]||0).toLocaleString('pt-BR')}
                  </Typography>
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={!selected||loading}
                  startIcon={loading?<CircularProgress size={18} color="inherit"/>:<AttachMoney/>} sx={{ px:4,height:48 }}>
                  {loading?'Salvando...':'Agendar e ir para Caixa'}
                </Button>
              </Box>
            </Paper>
          </form>
        )}

        {/* ── ABA 1: Novo Paciente ── */}
        {tab===1 && (
          <form onSubmit={handleNew}>
            <Paper sx={{ p:{xs:2,sm:3},borderRadius:3 }}>
              <SectionTitle>Dados Pessoais</SectionTitle>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Nome Completo *" value={form.nome} onChange={e=>sf('nome',e.target.value)}
                    InputProps={{ startAdornment:<InputAdornment position="start"><Person sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth required label="Telefone *" value={form.telefone} onChange={e=>sf('telefone',e.target.value)} placeholder="(00) 00000-0000"
                    InputProps={{ startAdornment:<InputAdornment position="start"><Phone sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="E-mail" type="email" value={form.email} onChange={e=>sf('email',e.target.value)}
                    InputProps={{ startAdornment:<InputAdornment position="start"><Email sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="CPF" value={form.cpf} onChange={e=>sf('cpf',e.target.value)} placeholder="000.000.000-00"
                    InputProps={{ startAdornment:<InputAdornment position="start"><Badge sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
              </Grid>

              <SectionTitle>Agendamento</SectionTitle>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><ProcSelect value={form.procedimento} onChange={v=>sf('procedimento',v)} required/></Grid>
                <Grid item xs={12} sm={6}><DentistaSelect value={form.profissional_id} onChange={v=>sf('profissional_id',v)}/></Grid>
                <Grid item xs={12} sm={6}><DatePicker label="Data" value={form.scheduleDate} onChange={v=>sf('scheduleDate',v)} minDate={new Date()} format="dd/MM/yyyy" slotProps={{ textField:{ fullWidth:true } }}/></Grid>
                <Grid item xs={12} sm={6}><TimePicker label="Horário" value={form.scheduleTime} onChange={v=>sf('scheduleTime',v)} slotProps={{ textField:{ fullWidth:true } }}/></Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Observações" value={form.observations} onChange={e=>sf('observations',e.target.value)}
                    InputProps={{ startAdornment:<InputAdornment position="start" sx={{ alignSelf:'flex-start',mt:1 }}><Notes sx={{ color:'text.disabled',fontSize:20 }}/></InputAdornment> }}/>
                </Grid>
              </Grid>

              <Box sx={{ mt:3,p:2,bgcolor:'#F8FAFC',borderRadius:2,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Valor do procedimento</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    R$ {(PROCEDURES[form.procedimento]||0).toLocaleString('pt-BR')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Cobrado no caixa após cadastro</Typography>
                </Box>
                <Button type="submit" variant="contained" size="large" disabled={loading}
                  startIcon={loading?<CircularProgress size={18} color="inherit"/>:<PersonAdd/>} sx={{ px:4,height:48 }}>
                  {loading?'Salvando...':'Cadastrar e ir para Caixa'}
                </Button>
              </Box>
            </Paper>
          </form>
        )}
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={()=>setSnack(s=>({...s,open:false}))} anchorOrigin={{ vertical:'bottom',horizontal:'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius:2 }}>{snack.msg}</Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default PatientForm;