import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, CircularProgress,
  IconButton, Snackbar, Alert, TextField, MenuItem,
  InputAdornment, Divider, Tooltip
} from '@mui/material';
import {
  format, parseISO, isSameDay, addDays, isSameMonth,
  startOfWeek, startOfMonth, endOfMonth, endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns }       from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import {
  PlayArrow, CheckCircle, Cancel,
  ChevronLeft, ChevronRight, Edit, Save, Close,
  MedicalServices, Notes, Person, AccessTime,
  CalendarMonth, DragIndicator
} from '@mui/icons-material';
import AppointmentsContext  from '../contexts/AppointmentsContext';
import { PatientsContext }  from '../contexts/PatientsContext';
import { AuthContext }      from '../contexts/AuthContext';
import api from '../services/api';

/* ─── Paleta ─── */
const STATUS_COLORS = {
  agendado:           { dot: '#3B82F6', bg: '#EFF6FF', colBg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
  confirmado:         { dot: '#3B82F6', bg: '#EFF6FF', colBg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
  pendente_pagamento: { dot: '#F59E0B', bg: '#FFFBEB', colBg: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
  em_procedimento:    { dot: '#F97316', bg: '#FFF7ED', colBg: '#FFEDD5', border: '#FED7AA', text: '#9A3412' },
  em_atendimento:     { dot: '#F97316', bg: '#FFF7ED', colBg: '#FFEDD5', border: '#FED7AA', text: '#9A3412' },
  finalizado:         { dot: '#10B981', bg: '#F0FDF4', colBg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' },
  cancelado:          { dot: '#EF4444', bg: '#FFF5F5', colBg: '#FEE2E2', border: '#FECACA', text: '#7F1D1D' },
};
const DEFAULT_C = STATUS_COLORS.agendado;
const getColor  = (a) => STATUS_COLORS[a?.status] || DEFAULT_C;

const STATUS_LABELS = {
  agendado: 'Agendado', confirmado: 'Confirmado',
  pendente_pagamento: 'Aguard. Pagamento', em_procedimento: 'Em Procedimento',
  em_atendimento: 'Em Atendimento', finalizado: 'Finalizado', cancelado: 'Cancelado',
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);
const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const safeParse = (str) => {
  if (!str) return null;
  try { const d = new Date(str); return isNaN(d) ? null : d; } catch { return null; }
};
const safeFmt = (str, fmt) => {
  if (!str) return '';
  try { return format(new Date(str), fmt, { locale: ptBR }); } catch { return ''; }
};

/* ── DnD hook ── */
function useDnD(onCommit) {
  const [ghost, setGhost]   = useState(null);
  const [overZone, setOver] = useState(null);
  const ref = useRef(null);
  const start = useCallback((appt, e) => {
    e.stopPropagation(); ref.current = appt; setGhost(appt);
    const img = document.createElement('div');
    img.style.cssText = `position:fixed;top:-999px;padding:4px 8px;background:${getColor(appt).colBg};border:1px solid ${getColor(appt).dot};border-radius:6px;font-size:12px;font-weight:700;color:${getColor(appt).text}`;
    img.textContent = appt.paciente?.nome || appt.nome || 'Paciente';
    document.body.appendChild(img);
    e.dataTransfer.setDragImage(img, 50, 12);
    setTimeout(() => document.body.removeChild(img), 0);
  }, []);
  const enter = useCallback((id, e) => { e.preventDefault(); setOver(id); }, []);
  const over  = useCallback((e) => e.preventDefault(), []);
  const leave = useCallback(() => setOver(null), []);
  const drop  = useCallback((id, e) => {
    e.preventDefault();
    if (ref.current) onCommit(ref.current, id);
    ref.current = null; setGhost(null); setOver(null);
  }, [onCommit]);
  const end = useCallback(() => { ref.current = null; setGhost(null); setOver(null); }, []);
  return { ghost, overZone, start, enter, over, leave, drop, end };
}

/* ── EventChip ── */
const EventChip = ({ appt, onOpen, dnd }) => {
  const c = getColor(appt);
  const ghost = dnd.ghost?.id === appt.id;
  return (
    <Box draggable onDragStart={(e) => dnd.start(appt, e)} onDragEnd={dnd.end}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpen(appt, e); }}
      sx={{ px:'5px',py:'2px',mb:'2px',borderRadius:'4px',
        bgcolor:ghost?c.colBg:c.bg,border:`1px solid ${ghost?c.dot:c.border}`,
        display:'flex',alignItems:'center',gap:'4px',opacity:ghost?0.4:1,
        cursor:'grab',userSelect:'none',transition:'opacity .1s',
        '&:hover':{borderColor:c.dot,filter:'brightness(0.96)'} }}>
      <Box sx={{width:5,height:5,borderRadius:'50%',bgcolor:c.dot,flexShrink:0}}/>
      <Typography sx={{color:c.text,fontSize:'0.62rem',fontWeight:600,flex:1}} noWrap>
        {safeFmt(appt.data_hora,'HH:mm')} {appt.paciente?.nome||appt.nome||'—'}
      </Typography>
    </Box>
  );
};

/* ── DayCell ── */
const DayCell = ({ day, appointments, isToday, isSel, inMonth, isLastRow, isLastCol, onOpen, onSelect, dnd }) => {
  const zoneId = `day:${format(day,'yyyy-MM-dd')}`;
  const isOver = dnd.overZone === zoneId;
  const dayA = appointments.filter(a => { try { return isSameDay(new Date(a.data_hora),day); } catch { return false; } });
  return (
    <Box onDragOver={dnd.over} onDragEnter={(e)=>dnd.enter(zoneId,e)} onDragLeave={dnd.leave} onDrop={(e)=>dnd.drop(zoneId,e)}
      onClick={()=>onSelect(day)}
      sx={{ p:'5px 6px',borderRight:!isLastCol?'1px solid #E9ECF0':'none',borderBottom:!isLastRow?'1px solid #E9ECF0':'none',
        bgcolor:isOver?'#DBEAFE':isSel?'#EFF6FF':inMonth?'#fff':'#FAFBFC',
        outline:isOver?'2px dashed #3B82F6':'2px dashed transparent',outlineOffset:'-2px',
        cursor:'pointer',overflow:'hidden',display:'flex',flexDirection:'column',transition:'background .1s',
        '&:hover':{bgcolor:isOver?'#DBEAFE':'#F5F7FA'} }}>
      <Box sx={{display:'flex',justifyContent:'flex-end',mb:'3px',flexShrink:0}}>
        <Box sx={{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',bgcolor:isToday?'#2563EB':'transparent'}}>
          <Typography sx={{fontSize:'0.74rem',fontWeight:isToday?700:inMonth?500:400,color:isToday?'#fff':inMonth?'#1E293B':'#C4CAD4',lineHeight:1}}>
            {format(day,'d')}
          </Typography>
        </Box>
      </Box>
      <Box sx={{flex:1,overflow:'hidden'}}>
        {dayA.slice(0,3).map(a=><EventChip key={a.id} appt={a} onOpen={onOpen} dnd={dnd}/>)}
        {dayA.length>3&&<Typography sx={{fontSize:'0.58rem',color:'#64748B',pl:0.3,fontWeight:600}}>+{dayA.length-3} mais</Typography>}
      </Box>
    </Box>
  );
};

/* ── InfoRow ── */
const InfoRow = ({ icon, label, value, c }) => (
  <Box sx={{display:'flex',gap:1.2,alignItems:'flex-start',p:'8px 10px',borderRadius:'8px',bgcolor:'#F8FAFC',border:'1px solid #F1F5F9'}}>
    <Box sx={{width:26,height:26,borderRadius:'6px',bgcolor:c.colBg,color:c.text,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {icon}
    </Box>
    <Box sx={{minWidth:0}}>
      <Typography sx={{fontSize:'0.62rem',color:'#94A3B8',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',lineHeight:1.2,mb:0.2}}>{label}</Typography>
      <Typography sx={{fontSize:'0.82rem',color:'#1E293B',fontWeight:500,lineHeight:1.4,wordBreak:'break-word'}}>{value||'—'}</Typography>
    </Box>
  </Box>
);

/* ── AppointmentDialog ── */
const AppointmentDialog = ({ open, appt, dentistas, onClose, onStatusChange, onSave }) => {
  const { user } = useContext(AuthContext);
  const isDentist = ['dentista','esteticista'].includes((user?.cargo||'').toLowerCase());

  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [editDate,    setEditDate]    = useState(null);
  const [editTime,    setEditTime]    = useState(null);
  const [editDentist, setEditDentist] = useState('');
  const [editObs,     setEditObs]     = useState('');

  useEffect(() => {
    if (!appt) return;
    const d = safeParse(appt.data_hora);
    setEditDate(d||new Date()); setEditTime(d||new Date());
    setEditDentist(String(appt.profissional_id||appt.profissional?.id||''));
    setEditObs(appt.observacoes||appt.observations||'');
    setEditing(false); setSaveError('');
  }, [appt]);

  if (!appt) return null;

  const c         = getColor(appt);
  const nome      = appt.paciente?.nome||appt.nome||appt.name||'—';
  const procNome  = appt.procedimento?.nome||appt.procedimento||appt.procedureType||'—';
  const dentNome  = appt.profissional?.nome||appt.dentist||appt.dentista||appt.profissional_nome||'—';
  const apptDate  = safeParse(appt.data_hora);
  const status    = appt.status||'agendado';
  const isInProc  = ['em_procedimento','em_atendimento'].includes(status);
  const isEnd     = ['finalizado','cancelado'].includes(status);
  const canEdit   = !isEnd;

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      const dt = new Date(editDate);
      dt.setHours(new Date(editTime).getHours(), new Date(editTime).getMinutes(), 0, 0);
      const payload = { data_hora: dt.toISOString(), data_hora_fim: new Date(dt.getTime()+3600000).toISOString(), profissional_id: editDentist||null, observacoes: editObs };
      await api.patch(`/agendamentos/${appt.id}/data`, payload);
      onSave?.({ ...appt, ...payload, data_hora: dt.toISOString() });
      setEditing(false);
    } catch (err) { setSaveError(err.response?.data?.error||'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
        PaperProps={{sx:{borderRadius:'14px',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.2)'}}}>
        <Box sx={{height:4,bgcolor:c.dot}}/>
        <DialogTitle sx={{pb:1.5,pt:2,borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'flex-start',gap:1.5}}>
          <Avatar sx={{bgcolor:c.colBg,color:c.text,border:`2px solid ${c.border}`,fontWeight:800,width:44,height:44,fontSize:'1.1rem',flexShrink:0}}>
            {nome.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{flex:1,minWidth:0}}>
            <Typography fontWeight={800} fontSize="1rem" noWrap>{nome}</Typography>
            <Chip label={STATUS_LABELS[status]||status} size="small"
              sx={{mt:0.4,bgcolor:c.bg,color:c.text,fontWeight:700,border:`1px solid ${c.border}`,fontSize:'0.66rem'}}/>
          </Box>
          {canEdit && (
            <Tooltip title={editing?'Cancelar edição':'Editar agendamento'}>
              <IconButton size="small" onClick={()=>{setEditing(e=>!e);setSaveError('');}}
                sx={{bgcolor:editing?'#FEF2F2':'#F1F5F9',color:editing?'#EF4444':'#64748B','&:hover':{bgcolor:editing?'#FEE2E2':'#E2E8F0'}}}>
                {editing?<Close sx={{fontSize:16}}/>:<Edit sx={{fontSize:16}}/>}
              </IconButton>
            </Tooltip>
          )}
        </DialogTitle>

        <DialogContent sx={{pt:2,pb:1}}>
          {!editing ? (
            <Box sx={{display:'flex',flexDirection:'column',gap:1.2}}>
              <InfoRow c={c} icon={<CalendarMonth sx={{fontSize:15}}/>} label="Data e horário"
                value={apptDate?format(apptDate,"EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm",{locale:ptBR}):'—'}/>
              <InfoRow c={c} icon={<Person sx={{fontSize:15}}/>} label="Profissional" value={dentNome}/>
              <InfoRow c={c} icon={<MedicalServices sx={{fontSize:15}}/>} label="Procedimento" value={procNome}/>
              <InfoRow c={c} icon={<Notes sx={{fontSize:15}}/>} label="Observações" value={appt.observacoes||appt.observations||'—'}/>
              {parseFloat(appt.valor)>0 && (
                <InfoRow c={c} icon={<AccessTime sx={{fontSize:15}}/>} label="Valor"
                  value={new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(parseFloat(appt.valor)||0)}/>
              )}
            </Box>
          ) : (
            <Box sx={{display:'flex',flexDirection:'column',gap:2,pt:0.5}}>
              <Typography variant="caption" sx={{color:'#64748B',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',fontSize:'0.65rem'}}>
                Editar agendamento
              </Typography>
              <DatePicker label="Data" value={editDate} onChange={v=>v&&setEditDate(v)} format="dd/MM/yyyy"
                slotProps={{textField:{size:'small',fullWidth:true}}}/>
              <TimePicker label="Horário" value={editTime} onChange={v=>v&&setEditTime(v)}
                slotProps={{textField:{size:'small',fullWidth:true}}}/>
              <TextField select size="small" fullWidth label="Profissional" value={editDentist} onChange={e=>setEditDentist(e.target.value)}
                InputProps={{startAdornment:<InputAdornment position="start"><Person sx={{fontSize:16,color:'text.disabled'}}/></InputAdornment>}}>
                <MenuItem value="">Sem profissional</MenuItem>
                {dentistas.map(d=><MenuItem key={d.id} value={String(d.id)}>{d.nome}</MenuItem>)}
              </TextField>
              <TextField size="small" fullWidth label="Procedimento" value={procNome} disabled
                helperText="Altere o procedimento diretamente no agendamento"
                InputProps={{startAdornment:<InputAdornment position="start"><MedicalServices sx={{fontSize:16,color:'text.disabled'}}/></InputAdornment>}}/>
              <TextField size="small" fullWidth multiline rows={3} label="Observações" value={editObs} onChange={e=>setEditObs(e.target.value)}
                InputProps={{startAdornment:<InputAdornment position="start" sx={{alignSelf:'flex-start',mt:0.8}}><Notes sx={{fontSize:16,color:'text.disabled'}}/></InputAdornment>}}/>
              {saveError&&<Alert severity="error" sx={{borderRadius:2,py:0.5}}>{saveError}</Alert>}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{p:2,pt:1.5,gap:1,borderTop:'1px solid #F1F5F9',flexWrap:'wrap'}}>
          {editing ? (
            <>
              <Button onClick={()=>{setEditing(false);setSaveError('');}} variant="outlined" size="small" disabled={saving} sx={{fontSize:'0.75rem'}}>Cancelar</Button>
              <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
                startIcon={saving?<CircularProgress size={14} color="inherit"/>:<Save sx={{fontSize:15}}/>}
                sx={{fontSize:'0.75rem',flex:1}}>
                {saving?'Salvando...':'Salvar alterações'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onClose} size="small" variant="outlined" sx={{fontSize:'0.72rem',borderColor:'#E2E8F0',color:'#64748B'}}>Fechar</Button>
              {!isEnd && (
                <Tooltip title="Cancelar agendamento">
                  <IconButton size="small" onClick={()=>onStatusChange('cancelado')}
                    sx={{border:'1px solid #FECACA',color:'#EF4444','&:hover':{bgcolor:'#FEF2F2'}}}>
                    <Cancel sx={{fontSize:16}}/>
                  </IconButton>
                </Tooltip>
              )}
              {isDentist && !isInProc && !isEnd && (
                <Button variant="contained" size="small"
                  startIcon={<PlayArrow sx={{fontSize:16}}/>}
                  onClick={()=>onStatusChange('em_atendimento')}
                  sx={{flex:1,bgcolor:'#0052CC','&:hover':{bgcolor:'#0747A6'},fontSize:'0.78rem',fontWeight:700}}>
                  Iniciar Atendimento
                </Button>
              )}
              {isInProc && (
                <Button variant="contained" color="success" size="small"
                  startIcon={<CheckCircle sx={{fontSize:16}}/>}
                  onClick={()=>{onStatusChange('finalizado');onClose();}}
                  sx={{flex:1,fontSize:'0.78rem',fontWeight:700}}>
                  Finalizar
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

/* ══════════════════════════════ CalendarSaaS ══════════════════════════════ */
const CalendarSaaS = () => {
  const ctx                      = useContext(AppointmentsContext);
  const apiAppointments          = ctx?.appointments           ?? [];
  const loading                  = ctx?.loading                ?? false;
  const fetchAppointmentsByDate  = ctx?.fetchAppointmentsByDate;
  const fetchAppointmentsByMonth = ctx?.fetchAppointmentsByMonth;
  const updateAppointmentStatus  = ctx?.updateAppointmentStatus;
  const updateAppointmentDate    = ctx?.updateAppointmentDate;

  const { patients=[], updatePatientDate, fetchPatients } = useContext(PatientsContext)||{};

  const [dentistas, setDentistas] = useState([]);
  useEffect(()=>{
    api.get('/usuarios').then(res=>{
      setDentistas((res.data||[]).filter(u=>['dentista','esteticista','Dentista','Esteticista'].includes(u.cargo)));
    }).catch(()=>{});
  },[]);

  /* Pacientes → shape de agendamento para o calendário */
  const patientsAsAppts = useMemo(()=>patients
    .filter(p=>p.data_hora)
    .map(p=>({
      id:p.id, data_hora:p.data_hora, status:p.status||'agendado',
      paciente:{nome:p.nome||p.name},
      procedimento:{nome:p.procedimento||p.procedureType||''},
      profissional:{nome:p.dentist||p.dentista||p.profissional_nome||''},
      profissional_id:p.profissional_id,
      dentist:p.dentist||p.dentista||p.profissional_nome||'',
      observacoes:p.observacoes||p.observations||'',
      valor:p.valor||0, _fromContext:true,
    })),[patients]);

  const allAppts = useMemo(()=>apiAppointments.length>0?apiAppointments:patientsAsAppts,[apiAppointments,patientsAsAppts]);

  const [localAppts,   setLocalAppts]   = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view,         setView]         = useState('month');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [openDialog,   setOpenDialog]   = useState(false);
  const [snack,        setSnack]        = useState(null);
  const today = new Date();

  useEffect(()=>setLocalAppts(allAppts),[allAppts]);

  useEffect(()=>{
    if(view==='month') fetchAppointmentsByMonth?.(selectedDate);
  },[view,selectedDate.getFullYear(),selectedDate.getMonth()]); // eslint-disable-line

  useEffect(()=>{
    if(view==='day'){fetchAppointmentsByDate?.(selectedDate);return;}
    if(view==='week'){
      const s=startOfWeek(selectedDate,{weekStartsOn:0});
      Array.from({length:7},(_,i)=>fetchAppointmentsByDate?.(addDays(s,i)));
    }
  },[view,selectedDate.toDateString()]); // eslint-disable-line

  const changePeriod=(delta)=>{
    const d=new Date(selectedDate);
    if(view==='day')d.setDate(d.getDate()+delta);
    if(view==='week')d.setDate(d.getDate()+7*delta);
    if(view==='month')d.setMonth(d.getMonth()+delta);
    setSelectedDate(d);
  };

  const commitDrop=useCallback((appt,zoneId)=>{
    let newDate=null;
    if(zoneId.startsWith('day:')){
      const ds=zoneId.replace('day:','');
      const [y,m,dd]=ds.split('-').map(Number);
      const orig=safeParse(appt.data_hora);
      newDate=new Date(y,m-1,dd,orig?orig.getHours():9,orig?orig.getMinutes():0);
    }else if(zoneId.startsWith('hour:')){
      const h=Number(zoneId.split(':')[1]);
      newDate=new Date(selectedDate); newDate.setHours(h,0,0,0);
    }else if(zoneId.startsWith('week:')){
      const parts=zoneId.split(':');
      const [y,m,dd]=parts[1].split('-').map(Number);
      newDate=new Date(y,m-1,dd,Number(parts[2]),0,0,0);
    }
    if(!newDate||isNaN(newDate))return;
    const nome=appt.paciente?.nome||appt.nome||'Paciente';
    setLocalAppts(prev=>prev.map(a=>a.id===appt.id?{...a,data_hora:newDate.toISOString()}:a));
    if(appt._fromContext) updatePatientDate?.(appt.id,newDate);
    else updateAppointmentDate?.(appt.id,newDate);
    setSnack({msg:`${nome} → ${format(newDate,"dd/MM 'às' HH:mm")}`});
  },[selectedDate,updateAppointmentDate,updatePatientDate]);

  const dnd=useDnD(commitDrop);

  const handleOpen=useCallback((appt, e) => { if (e) { e.stopPropagation(); e.preventDefault(); } setSelectedAppt(appt); setOpenDialog(true); }, []);

  const handleStatusChange=useCallback((status)=>{
    if(!selectedAppt)return;
    updateAppointmentStatus?.(selectedAppt.id,status);
    setLocalAppts(prev=>prev.map(a=>a.id===selectedAppt.id?{...a,status}:a));
    setSelectedAppt(a=>a?{...a,status}:a);
    if(['finalizado','cancelado'].includes(status)){setOpenDialog(false);fetchPatients?.();}
    setSnack({msg:`Status: ${STATUS_LABELS[status]||status}`,severity:'info'});
  },[selectedAppt,updateAppointmentStatus,fetchPatients]);

  const handleSave=useCallback((updated)=>{
    setLocalAppts(prev=>prev.map(a=>a.id===updated.id?{...a,...updated}:a));
    setSelectedAppt(updated); fetchPatients?.();
    setSnack({msg:'Agendamento atualizado!'});
  },[fetchPatients]);

  const apptsByHour=useMemo(()=>{
    const map={};
    localAppts.forEach(a=>{
      const d=safeParse(a.data_hora);
      if(!d||!isSameDay(d,selectedDate))return;
      const h=d.getHours();
      if(!map[h])map[h]=[];
      map[h].push(a);
    });
    return map;
  },[localAppts,selectedDate]);

  const weekDays=useMemo(()=>{
    const s=startOfWeek(selectedDate,{weekStartsOn:0});
    return Array.from({length:7},(_,i)=>addDays(s,i));
  },[selectedDate]);

  const monthDays=useMemo(()=>{
    const s=startOfWeek(startOfMonth(selectedDate),{weekStartsOn:0});
    const e=endOfWeek(endOfMonth(selectedDate),{weekStartsOn:0});
    const days=[];let d=s;
    while(d<=e){days.push(new Date(d));d=addDays(d,1);}
    return days;
  },[selectedDate]);

  const periodLabel=view==='month'
    ?format(selectedDate,'MMMM yyyy',{locale:ptBR})
    :view==='week'
      ?`${format(weekDays[0],'dd MMM',{locale:ptBR})} – ${format(weekDays[6],'dd MMM yyyy',{locale:ptBR})}`
      :format(selectedDate,"EEE, dd 'de' MMMM",{locale:ptBR});

  if(loading)return(<Box sx={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%'}}><CircularProgress/></Box>);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{display:'flex',flexDirection:'column',height:'100%',bgcolor:'#fff'}}>

        {/* Toolbar */}
        <Box sx={{px:2,py:1.2,borderBottom:'1px solid #E2E8F0',display:'flex',alignItems:'center',gap:1,flexWrap:'wrap',bgcolor:'#FAFAFA',flexShrink:0}}>
          <Box sx={{display:'flex',alignItems:'center',gap:0.3}}>
            <IconButton size="small" onClick={()=>changePeriod(-1)} sx={{color:'#64748B'}}><ChevronLeft sx={{fontSize:20}}/></IconButton>
            <IconButton size="small" onClick={()=>changePeriod(1)}  sx={{color:'#64748B'}}><ChevronRight sx={{fontSize:20}}/></IconButton>
          </Box>
          <Typography sx={{fontWeight:700,fontSize:'1rem',color:'#0F172A',textTransform:'capitalize',flex:1}}>{periodLabel}</Typography>
          <Button size="small" variant="outlined" onClick={()=>setSelectedDate(new Date())}
            sx={{fontSize:'0.72rem',px:1.5,borderColor:'#E2E8F0',color:'#475569','&:hover':{borderColor:'#94A3B8'}}}>
            Hoje
          </Button>
          <Box sx={{display:{xs:'none',lg:'flex'},alignItems:'center',gap:1.2}}>
            {[['Agendado','#3B82F6'],['Pagamento','#F59E0B'],['Em Proc.','#F97316'],['Finalizado','#10B981'],['Cancelado','#EF4444']].map(([label,dot])=>(
              <Box key={label} sx={{display:'flex',alignItems:'center',gap:0.5}}>
                <Box sx={{width:7,height:7,borderRadius:'2px',bgcolor:dot}}/>
                <Typography sx={{fontSize:'0.62rem',color:'#64748B'}}>{label}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{display:'flex',border:'1px solid #E2E8F0',borderRadius:'8px',overflow:'hidden'}}>
            {['day','week','month'].map((v,i)=>(
              <Button key={v} size="small" onClick={()=>setView(v)}
                sx={{px:1.4,py:0.4,fontSize:'0.72rem',borderRadius:0,minWidth:0,
                  bgcolor:view===v?'#0052CC':'transparent',color:view===v?'#fff':'#64748B',
                  fontWeight:view===v?700:400,borderRight:i<2?'1px solid #E2E8F0':'none',
                  '&:hover':{bgcolor:view===v?'#0747A6':'#F1F5F9'}}}>
                {v==='day'?'Dia':v==='week'?'Semana':'Mês'}
              </Button>
            ))}
          </Box>
        </Box>

        {/* MÊS */}
        {view==='month'&&(
          <Box sx={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <Box sx={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #E2E8F0',flexShrink:0}}>
              {WEEK_DAYS_SHORT.map(d=>(
                <Box key={d} sx={{py:1,textAlign:'center'}}>
                  <Typography sx={{fontSize:'0.7rem',fontWeight:700,color:'#94A3B8',textTransform:'uppercase'}}>{d}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{flex:1,display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:`repeat(${Math.ceil(monthDays.length/7)},1fr)`,overflow:'hidden'}}>
              {monthDays.map((day,idx)=>(
                <DayCell key={day.toISOString()} day={day} appointments={localAppts}
                  isToday={isSameDay(day,today)} isSel={isSameDay(day,selectedDate)}
                  inMonth={isSameMonth(day,selectedDate)}
                  isLastRow={idx>=monthDays.length-7} isLastCol={(idx+1)%7===0}
                  onOpen={handleOpen} onSelect={(d)=>{setSelectedDate(d);setView('day');}} dnd={dnd}/>
              ))}
            </Box>
          </Box>
        )}

        {/* SEMANA */}
        {view==='week'&&(
          <Box sx={{flex:1,display:'flex',overflow:'hidden'}}>
            <Box sx={{width:46,flexShrink:0,borderRight:'1px solid #F1F5F9',overflowY:'auto','&::-webkit-scrollbar':{width:0}}}>
              <Box sx={{height:44}}/>
              {HOURS.map(h=>(
                <Box key={h} sx={{height:58,display:'flex',alignItems:'flex-start',justifyContent:'flex-end',pr:1,pt:'3px'}}>
                  <Typography sx={{fontSize:'0.6rem',color:'#94A3B8'}}>{String(h).padStart(2,'0')}h</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{flex:1,display:'flex',overflowX:'auto',overflowY:'auto','&::-webkit-scrollbar':{width:4,height:4},'&::-webkit-scrollbar-thumb':{bgcolor:'#E2E8F0',borderRadius:2}}}>
              {weekDays.map((day,di)=>{
                const isToday=isSameDay(day,today);
                const dayA=localAppts.filter(a=>{try{return isSameDay(new Date(a.data_hora),day);}catch{return false;}});
                return(
                  <Box key={day.toISOString()} sx={{flex:1,minWidth:{xs:80,sm:90},borderRight:di<6?'1px solid #F1F5F9':'none'}}>
                    <Box sx={{height:44,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',borderBottom:'1px solid #F1F5F9',position:'sticky',top:0,bgcolor:'#FAFAFA',zIndex:1,cursor:'pointer','&:hover':{bgcolor:'#F1F5F9'}}}
                      onClick={()=>{setSelectedDate(day);setView('day');}}>
                      <Typography sx={{fontSize:'0.58rem',color:'#94A3B8',textTransform:'uppercase',lineHeight:1}}>
                        {format(day,'EEE',{locale:ptBR})}
                      </Typography>
                      <Box sx={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',bgcolor:isToday?'#2563EB':'transparent'}}>
                        <Typography sx={{fontSize:'0.82rem',fontWeight:700,color:isToday?'#fff':'#0F172A',lineHeight:1}}>{format(day,'d')}</Typography>
                      </Box>
                    </Box>
                    {HOURS.map(h=>{
                      const zoneId=`week:${format(day,'yyyy-MM-dd')}:${h}`;
                      const isOver=dnd.overZone===zoneId;
                      const hAppts=dayA.filter(a=>{try{return new Date(a.data_hora).getHours()===h;}catch{return false;}});
                      return(
                        <Box key={h} onDragOver={dnd.over} onDragEnter={(e)=>dnd.enter(zoneId,e)} onDragLeave={dnd.leave} onDrop={(e)=>dnd.drop(zoneId,e)}
                          sx={{height:58,borderBottom:'1px solid #F8FAFC',p:'2px 3px',overflow:'hidden',
                            bgcolor:isOver?'#EFF6FF':'transparent',outline:isOver?'2px dashed #3B82F6':'2px dashed transparent',outlineOffset:'-2px',transition:'background .1s'}}>
                          {hAppts.map(a=>{
                            const c=getColor(a);const ghost=dnd.ghost?.id===a.id;
                            return(
                              <Box key={a.id} draggable onDragStart={(e)=>dnd.start(a,e)} onDragEnd={dnd.end} onClick={()=>handleOpen(a)}
                                sx={{px:'4px',py:'2px',borderRadius:'4px',mb:'2px',bgcolor:ghost?c.colBg:c.bg,borderLeft:`3px solid ${c.dot}`,opacity:ghost?0.4:1,cursor:'grab',userSelect:'none','&:hover':{filter:'brightness(0.95)'}}}>
                                <Typography sx={{color:c.text,fontSize:'0.58rem',fontWeight:700,lineHeight:1.2}} noWrap>{safeFmt(a.data_hora,'HH:mm')}</Typography>
                                <Typography sx={{color:c.text,fontSize:'0.58rem',opacity:0.8}} noWrap>{a.paciente?.nome||a.nome||'—'}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* DIA */}
        {view==='day'&&(
          <Box sx={{flex:1,overflowY:'auto','&::-webkit-scrollbar':{width:4},'&::-webkit-scrollbar-thumb':{bgcolor:'#E2E8F0',borderRadius:2}}}>
            {HOURS.map(hour=>{
              const zoneId=`hour:${hour}`;const isOver=dnd.overZone===zoneId;
              const hAppts=apptsByHour[hour]||[];
              return(
                <Box key={hour} onDragOver={dnd.over} onDragEnter={(e)=>dnd.enter(zoneId,e)} onDragLeave={dnd.leave} onDrop={(e)=>dnd.drop(zoneId,e)}
                  sx={{display:'flex',minHeight:60,bgcolor:isOver?'#EFF6FF':'transparent',borderBottom:'1px solid #F1F5F9',outline:isOver?'2px dashed #3B82F6':'2px dashed transparent',outlineOffset:'-2px',transition:'background .1s'}}>
                  <Box sx={{width:46,flexShrink:0,pt:'6px',pr:1,textAlign:'right'}}>
                    <Typography sx={{fontSize:'0.63rem',color:'#94A3B8'}}>{String(hour).padStart(2,'0')}h</Typography>
                  </Box>
                  <Box sx={{flex:1,borderLeft:'1px solid #F1F5F9',px:1,py:'4px'}}>
                    {hAppts.map(appt=>{
                      const c=getColor(appt);const ghost=dnd.ghost?.id===appt.id;
                      const dNome=appt.profissional?.nome||appt.dentist||appt.profissional_nome||'';
                      const pNome=appt.procedimento?.nome||appt.procedimento||'';
                      return(
                        <Box key={appt.id} draggable onDragStart={(e)=>dnd.start(appt,e)} onDragEnd={dnd.end} onClick={()=>handleOpen(appt)}
                          sx={{mb:'4px',px:1,py:'6px',borderRadius:'6px',bgcolor:ghost?c.colBg:c.bg,border:`1px solid ${ghost?c.dot:c.border}`,borderLeft:`3px solid ${c.dot}`,
                            boxShadow:ghost?'none':'0 1px 3px rgba(0,0,0,0.06)',opacity:ghost?0.4:1,cursor:'pointer',
                            display:'flex',gap:'8px',alignItems:'center',userSelect:'none',transition:'all .1s',
                            '&:hover':{filter:'brightness(0.96)',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}}>
                          <DragIndicator sx={{fontSize:14,color:c.dot,opacity:0.5,flexShrink:0}}/>
                          <Avatar sx={{width:24,height:24,bgcolor:`${c.dot}22`,color:c.text,fontSize:'0.65rem',fontWeight:700,flexShrink:0}}>
                            {(appt.paciente?.nome||appt.nome||'?').charAt(0)}
                          </Avatar>
                          <Box sx={{minWidth:0,flex:1}}>
                            <Typography sx={{color:c.text,fontSize:'0.78rem',fontWeight:700,lineHeight:1.2}} noWrap>
                              {appt.paciente?.nome||appt.nome||'—'}
                            </Typography>
                            <Typography sx={{color:c.text,fontSize:'0.62rem',opacity:0.75,lineHeight:1.2}} noWrap>
                              {[pNome,dNome].filter(Boolean).join(' · ')}
                            </Typography>
                          </Box>
                          <Box sx={{textAlign:'right',flexShrink:0}}>
                            <Typography sx={{color:c.text,fontSize:'0.65rem',fontWeight:700}}>{safeFmt(appt.data_hora,'HH:mm')}</Typography>
                            <Chip label={STATUS_LABELS[appt.status]||appt.status} size="small"
                              sx={{fontSize:'0.5rem',height:14,bgcolor:`${c.dot}18`,color:c.text,fontWeight:700,border:`1px solid ${c.border}`}}/>
                          </Box>
                        </Box>
                      );
                    })}
                    {hAppts.length===0&&isOver&&dnd.ghost&&(
                      <Box sx={{height:46,border:'1px dashed #3B82F6',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',bgcolor:'#EFF6FF'}}>
                        <Typography sx={{fontSize:'0.65rem',color:'#3B82F6',fontWeight:700}}>Soltar às {String(hour).padStart(2,'0')}:00</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        <AppointmentDialog open={openDialog} appt={selectedAppt} dentistas={dentistas}
          onClose={()=>setOpenDialog(false)} onStatusChange={handleStatusChange} onSave={handleSave}/>

        <Snackbar open={!!snack} autoHideDuration={3000} onClose={()=>setSnack(null)} anchorOrigin={{vertical:'bottom',horizontal:'center'}}>
          <Alert severity={snack?.severity||'success'} variant="filled" onClose={()=>setSnack(null)} sx={{fontSize:'0.78rem'}}>
            {snack?.msg}
          </Alert>
        </Snackbar>

      </Box>
    </LocalizationProvider>
  );
};

export default CalendarSaaS;