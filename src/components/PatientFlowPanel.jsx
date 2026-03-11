import { useContext, useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Avatar, IconButton, Tooltip,
  Button, CircularProgress, ToggleButton, ToggleButtonGroup,
  Snackbar, Alert, Chip
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  WhatsApp, PlayArrow, ArrowBack, Cancel, Refresh, AttachMoney,
  MedicalServices, ChevronLeft, ChevronRight, ViewWeek, Today,
  AccessTime, Person, CheckCircle
} from '@mui/icons-material';
import { format, isSameDay, isSameWeek, addDays, startOfWeek, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext }     from '../contexts/AuthContext';

/* ─── Colunas Kanban ─── */
const COLS = [
  { key:'pendentes',       label:'Aguard. Pagamento', status:'pendente_pagamento', dot:'#F59E0B', bg:'#FFFBEB', colBg:'#FEF3C7', pill:'#FDE68A', pillText:'#92400E' },
  { key:'aguardando',      label:'Aguardando',         status:'agendado',           dot:'#3B82F6', bg:'#EFF6FF', colBg:'#DBEAFE', pill:'#BFDBFE', pillText:'#1E40AF' },
  { key:'em_procedimento', label:'Em Procedimento',    status:'em_procedimento',    dot:'#df8510', bg:'#FFF8F0', colBg:'#FDECC8', pill:'#FCD5A0', pillText:'#ad5803' },
  { key:'finalizado',      label:'Finalizados',        status:'finalizado',         dot:'#10B981', bg:'#F0FDF4', colBg:'#D1FAE5', pill:'#A7F3D0', pillText:'#065F46' },
  { key:'cancelado',       label:'Cancelados',         status:'cancelado',          dot:'#f14e4e', bg:'#F9FAFB', colBg:'#F3F4F6', pill:'#E5E7EB', pillText:'#cf0404' },
];
const STATUS_FROM_COL = Object.fromEntries(COLS.map(c=>[c.key,c.status]));

/* ─── Steps de procedimento ─── */
const STEPS_MAP = {
  cirurgia: ['Preparação','Anestesia','Procedimento','Recuperação'],
  consulta: ['Anamnese','Exame','Diagnóstico','Finalização'],
  default:  ['Preparação','Procedimento','Finalização'],
};
const getSteps = (t='') => {
  const tl = t.toLowerCase();
  if (tl.includes('cirurgia')||tl.includes('micro')) return STEPS_MAP.cirurgia;
  if (tl.includes('consulta')) return STEPS_MAP.consulta;
  return STEPS_MAP.default;
};

const pd = (s) => {
  if (!s) return null;
  try { const d = s instanceof Date ? s : parseISO(String(s)); return isValid(d)?d:null; }
  catch { return null; }
};

/* ════════════════════
   CARD DO PACIENTE
   ════════════════════ */
const PatientCard = ({ patient, index, col, onUpdateStatus, onUpdateProgress, userCargo }) => {
  const steps   = getSteps(patient.procedimento || patient.procedureType || '');
  const cur     = patient.procedureProgress || 0;
  const isProc  = patient.status === 'em_procedimento';
  const isFin   = patient.status === 'finalizado';
  const phone   = (patient.telefone || patient.phone || '').replace(/\D/g,'');
  const nome    = patient.paciente?.nome || patient.nome || patient.name || '?';
  const proc    = patient.procedimento?.nome || patient.procedimento || patient.procedureType || '—';
  const dent    = patient.profissional?.nome || patient.dentist || patient.dentista || '—';
  const apptDt  = pd(patient.data_hora);
  const valor   = parseFloat(patient.valor) || 0;
  const obs     = patient.observacoes || patient.observations || '';

  const isDentista = ['dentista','esteticista'].includes(userCargo);
  const isGestor   = ['gestor','proprietario','atendente'].includes(userCargo);

  const canConfirmPag = isGestor && patient.status === 'pendente_pagamento';
  const canInitiate   = (isGestor || isDentista) && patient.status === 'agendado';
  const canAdvance    = (isDentista || isGestor) && isProc;
  const canReopen     = isGestor && isFin;
  const canCancel     = isGestor && !['finalizado','cancelado'].includes(patient.status);

  return (
    <Draggable draggableId={String(patient.id)} index={index}>
      {(prov, snap) => (
        <Box ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
          sx={{ mb:1.5,bgcolor:'#fff',borderRadius:'10px',overflow:'hidden',
            border:`1px solid ${snap.isDragging?col.dot:'#DFE1E6'}`,
            boxShadow:snap.isDragging?`0 12px 32px rgba(0,0,0,0.18),0 0 0 2px ${col.dot}44`:'0 1px 3px rgba(9,30,66,0.08)',
            cursor:'grab',transition:'box-shadow .12s,border-color .12s',
            '&:hover':{ boxShadow:'0 4px 14px rgba(9,30,66,0.14)',borderColor:'#B3BAC5' } }}>
          {/* Barra de status */}
          <Box sx={{ height:3,bgcolor:col.dot }}/>
          <Box sx={{ p:'10px 12px 12px' }}>

            {/* Nome */}
            <Typography sx={{ color:'#172B4D',fontWeight:700,fontSize:'0.88rem',lineHeight:1.3,mb:0.5 }}>
              {nome}
            </Typography>

            {/* Data e horário */}
            {apptDt && (
              <Box sx={{ display:'flex',alignItems:'center',gap:0.5,mb:0.6,
                bgcolor:col.bg,border:`1px solid ${col.pill}`,borderRadius:'4px',
                px:'6px',py:'3px',width:'fit-content' }}>
                <AccessTime sx={{ fontSize:10,color:col.pillText }}/>
                <Typography sx={{ fontSize:'0.65rem',fontWeight:700,color:col.pillText }}>
                  {format(apptDt,"EEE dd/MM",{locale:ptBR})} · {format(apptDt,'HH:mm')}
                </Typography>
              </Box>
            )}

            {/* Procedimento */}
            <Box sx={{ mb:0.5 }}>
              <Box sx={{ display:'inline-flex',alignItems:'center',gap:'3px',
                bgcolor:col.pill,color:col.pillText,borderRadius:'4px',px:'6px',py:'2px',maxWidth:'100%' }}>
                <MedicalServices sx={{fontSize:9}}/>
                <Typography component="span" sx={{ fontSize:'0.63rem',fontWeight:700 }} noWrap>{proc}</Typography>
              </Box>
            </Box>

            {/* Dentista */}
            <Box sx={{ display:'flex',alignItems:'center',gap:0.4,mb:obs?0.5:0.8 }}>
              <Person sx={{ fontSize:11,color:'#94A3B8' }}/>
              <Typography sx={{ color:'#5E6C84',fontSize:'0.70rem',fontWeight:500 }} noWrap>
                {dent}
              </Typography>
            </Box>

            {/* Observações */}
            {obs && (
              <Box sx={{ mb:0.8,px:'6px',py:'4px',bgcolor:'#F8FAFC',borderRadius:'4px',borderLeft:`2px solid ${col.dot}` }}>
                <Typography sx={{ fontSize:'0.62rem',color:'#64748B',lineHeight:1.4 }} noWrap>{obs}</Typography>
              </Box>
            )}

            {/* Stepper */}
            {isProc && (
              <Box sx={{ mb:1 }}>
                <Box sx={{ display:'flex',gap:'3px',mb:0.5 }}>
                  {steps.map((s,i)=>(
                    <Box key={s} sx={{ flex:1,py:'3px',textAlign:'center',borderRadius:'3px',
                      bgcolor:i<=cur?col.dot:'#F4F5F7',transition:'background 0.15s' }}>
                      <Typography sx={{ color:i<=cur?'#fff':'#97A0AF',fontSize:'0.5rem',fontWeight:700 }}>
                        {s.length>6?s.slice(0,6)+'.':s}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Typography sx={{ fontSize:'0.58rem',color:col.pillText,fontWeight:600,textAlign:'center' }}>
                  {steps[cur]||steps[steps.length-1]} ({cur+1}/{steps.length})
                </Typography>
              </Box>
            )}

            {isFin && (
              <Box sx={{ display:'flex',alignItems:'center',gap:0.5,mb:0.8 }}>
                <CheckCircle sx={{ fontSize:13,color:'#10B981' }}/>
                <Typography sx={{ fontSize:'0.65rem',color:'#065F46',fontWeight:600 }}>Procedimento concluído</Typography>
              </Box>
            )}

            {/* Rodapé */}
            <Box sx={{ display:'flex',alignItems:'center',justifyContent:'space-between',mb:1,pt:0.5,borderTop:'1px solid #F4F5F7' }}>
              {valor>0 ? (
                <Typography sx={{ color:'#059669',fontSize:'0.68rem',fontWeight:800,
                  bgcolor:'#F0FDF4',px:'6px',py:'2px',borderRadius:'4px',border:'1px solid #BBF7D0' }}>
                  {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(valor)}
                </Typography>
              ) : <Box/>}
              <Box sx={{ display:'flex',alignItems:'center',gap:0.4 }}>
                {phone && (
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" component="a" href={`https://wa.me/55${phone}`} target="_blank"
                      sx={{ color:'#22C55E',p:'3px','&:hover':{bgcolor:'#F0FDF4'} }}>
                      <WhatsApp sx={{fontSize:13}}/>
                    </IconButton>
                  </Tooltip>
                )}
                <Avatar sx={{ width:24,height:24,fontSize:'0.68rem',fontWeight:700,
                  bgcolor:col.colBg,color:col.pillText,border:`1.5px solid ${col.dot}55` }}>
                  {nome.charAt(0).toUpperCase()}
                </Avatar>
              </Box>
            </Box>

            {/* Ações */}
            <Box sx={{ display:'flex',gap:0.5,flexWrap:'wrap' }}>
              {canConfirmPag && (
                <Button size="small" fullWidth onClick={()=>onUpdateStatus(patient.id,'agendado')}
                  sx={{ fontSize:'0.62rem',py:0.4,minHeight:28,color:'#92400E',bgcolor:'#FEF3C7',border:'1px solid #FDE68A','&:hover':{bgcolor:'#FDE68A'} }}>
                  <AttachMoney sx={{fontSize:12,mr:0.3}}/> Confirmar Pagamento
                </Button>
              )}
              {canInitiate && (
                <Button size="small" fullWidth onClick={()=>onUpdateStatus(patient.id,'em_procedimento')}
                  sx={{ fontSize:'0.62rem',py:0.4,minHeight:28,bgcolor:'#0052CC',color:'#fff','&:hover':{bgcolor:'#0747A6'} }}>
                  <PlayArrow sx={{fontSize:12,mr:0.3}}/> Iniciar Atendimento
                </Button>
              )}
              {canAdvance && (
                <Box sx={{ display:'flex',gap:0.5,width:'100%' }}>
                  <IconButton size="small" disabled={cur===0}
                    onClick={()=>onUpdateProgress(patient.id,Math.max(0,cur-1))}
                    sx={{ border:'1px solid #DFE1E6',color:'#97A0AF',p:'4px','&:not(:disabled):hover':{color:'#172B4D'} }}>
                    <ArrowBack sx={{fontSize:11}}/>
                  </IconButton>
                  <Button size="small" sx={{ flex:1,fontSize:'0.62rem',py:0.4,minHeight:28,
                    color:col.pillText,border:`1px solid ${col.dot}77`,bgcolor:col.bg,'&:hover':{bgcolor:col.colBg} }}
                    onClick={()=>{
                      const next = cur+1;
                      if (next>=steps.length) onUpdateStatus(patient.id,'finalizado');
                      else onUpdateProgress(patient.id,next);
                    }}>
                    {cur>=steps.length-1?'✓ Finalizar':'Avançar →'}
                  </Button>
                  {isGestor && (
                    <Tooltip title="Cancelar">
                      <IconButton size="small" onClick={()=>onUpdateStatus(patient.id,'cancelado')}
                        sx={{ border:'1px solid #FFBDAD',color:'#DE350B',p:'4px','&:hover':{bgcolor:'#FFEBE6'} }}>
                        <Cancel sx={{fontSize:11}}/>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
              {canReopen && (
                <Button size="small" fullWidth onClick={()=>onUpdateStatus(patient.id,'agendado')}
                  sx={{ fontSize:'0.62rem',py:0.4,minHeight:28,color:'#5E6C84',border:'1px solid #DFE1E6','&:hover':{bgcolor:'#F4F5F7'} }}>
                  <Refresh sx={{fontSize:12,mr:0.3}}/> Reabrir
                </Button>
              )}
              {canCancel && !isProc && patient.status!=='pendente_pagamento' && (
                <Tooltip title="Cancelar agendamento">
                  <IconButton size="small" onClick={()=>onUpdateStatus(patient.id,'cancelado')}
                    sx={{ border:'1px solid #FFBDAD',color:'#DE350B',p:'4px','&:hover':{bgcolor:'#FFEBE6'} }}>
                    <Cancel sx={{fontSize:11}}/>
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Draggable>
  );
};

/* ─── Coluna ─── */
const KanbanCol = ({ col, patients, onUpdateStatus, onUpdateProgress, userCargo }) => (
  <Box sx={{ width:'100%',display:'flex',flexDirection:'column',bgcolor:'#F4F5F7',borderRadius:'8px',p:'10px',minHeight:120 }}>
    <Box sx={{ display:'flex',alignItems:'center',gap:1,mb:1.2 }}>
      <Box sx={{ width:8,height:8,borderRadius:'2px',bgcolor:col.dot,flexShrink:0 }}/>
      <Typography sx={{ color:'#5E6C84',fontWeight:700,fontSize:'0.72rem',textTransform:'uppercase',letterSpacing:'0.06em',flex:1 }}>
        {col.label}
      </Typography>
      <Box sx={{ bgcolor:'#DFE1E6',color:'#5E6C84',borderRadius:'10px',px:'7px',py:'1px',fontSize:'0.68rem',fontWeight:700 }}>
        {patients.length}
      </Box>
    </Box>
    <Droppable droppableId={col.key}>
      {(prov,snap)=>(
        <Box ref={prov.innerRef} {...prov.droppableProps}
          sx={{ flex:1,minHeight:50,borderRadius:'6px',
            p:snap.isDraggingOver?'6px':0,
            bgcolor:snap.isDraggingOver?col.colBg:'transparent',
            border:snap.isDraggingOver?`2px dashed ${col.dot}`:'2px dashed transparent',
            transition:'all .12s' }}>
          {patients.length===0 && !snap.isDraggingOver && (
            <Box sx={{ py:3,textAlign:'center',border:'2px dashed #DFE1E6',borderRadius:'6px',bgcolor:'#fff' }}>
              <Typography sx={{ color:'#C1C7D0',fontSize:'0.68rem' }}>Sem itens</Typography>
            </Box>
          )}
          {patients.map((p,i)=>(
            <PatientCard key={p.id} patient={p} index={i} col={col}
              onUpdateStatus={onUpdateStatus} onUpdateProgress={onUpdateProgress}
              userCargo={userCargo}/>
          ))}
          {prov.placeholder}
        </Box>
      )}
    </Droppable>
  </Box>
);

/* ════════════════════
   BOARD PRINCIPAL - CORRIGIDO
   ════════════════════ */
const PatientFlowPanel = () => {
  const { patients, updatePatientStatus, updatePatientProgress, getPatientsByStatus, loading, fetchPatients } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  // ✅ useEffect para forçar carregamento quando usuário mudar
  useEffect(() => {
    if (user?.clinica_id) {
      fetchPatients();
    }
  }, [user?.clinica_id, fetchPatients]);

  const [filterMode,   setFilterMode]   = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [remSnack,     setRemSnack]     = useState(null);

  const isDentista = ['dentista','esteticista'].includes(user?.cargo);
  const today      = new Date();

  /* Detecta remarcações do CalendarSaaS */
  const prevRef = useRef({});
  useEffect(() => {
    patients.forEach(p => {
      const prev = prevRef.current[p.id];
      if (prev && prev !== p.data_hora && p.data_hora) {
        try {
          const d = pd(p.data_hora);
          if (d) setRemSnack(`${p.paciente?.nome||p.nome} → ${format(d,"EEE dd/MM 'às' HH:mm",{locale:ptBR})}`);
        } catch {}
      }
      prevRef.current[p.id] = p.data_hora;
    });
  }, [patients]);

  const navigate = (delta) => {
    const d = new Date(selectedDate);
    if (filterMode==='day')  d.setDate(d.getDate()+delta);
    if (filterMode==='week') d.setDate(d.getDate()+7*delta);
    setSelectedDate(d);
  };

  const periodLabel = useMemo(() => {
    if (filterMode==='all') return 'Todos os pacientes';
    if (filterMode==='day') return format(selectedDate,"EEEE, dd 'de' MMMM",{locale:ptBR});
    const s = startOfWeek(selectedDate,{weekStartsOn:0});
    return `${format(s,'dd/MM',{locale:ptBR})} – ${format(addDays(s,6),'dd/MM/yyyy',{locale:ptBR})}`;
  }, [filterMode, selectedDate]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(selectedDate,{weekStartsOn:0});
    return Array.from({length:7},(_,i)=>addDays(s,i));
  }, [selectedDate]);

  const filterP = (p) => {
    if (filterMode==='all') return true;
    const d = pd(p.data_hora);
    if (!d) return false;
    if (filterMode==='day')  return isSameDay(d,selectedDate);
    if (filterMode==='week') return isSameWeek(d,selectedDate,{weekStartsOn:0});
    return true;
  };

  const byStatus = getPatientsByStatus();

  // ✅ CORRIGIDO: Filtro por dentista com verificação de profissional_id e nome
  const filteredByStatus = useMemo(() => {
    const r = {};
    Object.keys(byStatus).forEach(k => {
      let list = byStatus[k].filter(filterP);
      
      // Se for dentista, filtrar apenas seus agendamentos
      if (isDentista && user?.id) {
        list = list.filter(p => {
          // Verificar por ID do profissional (prioridade)
          const pid = p.profissional_id || p.profissional?.id;
          if (pid) {
            return String(pid) === String(user.id);
          }
          
          // Fallback: verificar por nome do dentista
          const dentistaNome = p.dentist || p.dentista || p.profissional_nome;
          if (dentistaNome && user?.nome) {
            // Comparação case-insensitive e removendo espaços extras
            const nomeDentista = String(dentistaNome).trim().toLowerCase();
            const nomeUser = String(user.nome).trim().toLowerCase();
            return nomeDentista === nomeUser;
          }
          
          return false; // Se não tem profissional, não aparece para dentista
        });
      }
      r[k] = list;
    });
    return r;
  }, [byStatus, filterMode, selectedDate, isDentista, user?.id, user?.nome]);

  const totalFiltered = Object.values(filteredByStatus).reduce((a,b)=>a+b.length, 0);

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId===destination.droppableId && source.index===destination.index) return;
    const newStatus = STATUS_FROM_COL[destination.droppableId];
    if (!newStatus) return;
    // Dentista só pode mover dentro do fluxo: aguardando → em_proc → finalizado
    if (isDentista) {
      const allowed = ['em_procedimento','finalizado'];
      if (!allowed.includes(newStatus)) return;
    }
    updatePatientStatus(Number(draggableId), newStatus);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const visCols = isDentista
    ? COLS.filter(c=>['aguardando','em_procedimento','finalizado'].includes(c.key))
    : COLS;

  return (
    <Box sx={{ display:'flex', flexDirection:'column', height:'100%', bgcolor:'#F4F5F7' }}>

      {/* ── Header ── */}
      <Box sx={{ px:2.5, pt:1.8, pb:1.2, bgcolor:'#fff', borderBottom:'1px solid #DFE1E6', flexShrink:0 }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1.2 }}>
          <Box sx={{ width:30, height:30, borderRadius:'6px', bgcolor:'#0052CC', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MedicalServices sx={{ color:'#fff', fontSize:16 }}/>
          </Box>
          <Box>
            <Typography sx={{ color:'#172B4D', fontWeight:800, fontSize:'1.05rem', lineHeight:1 }}>Fluxo de Pacientes</Typography>
            <Typography sx={{ color:'#5E6C84', fontSize:'0.7rem' }}>
              {isDentista ? `Meus agendamentos · ${totalFiltered} total` : `Board · ${patients.length} total`}
            </Typography>
          </Box>
          <Box sx={{ ml:'auto', display:'flex', gap:1.5, flexWrap:'wrap' }}>
            {visCols.map(c=>(
              <Box key={c.key} sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
                <Box sx={{ width:8, height:8, borderRadius:'2px', bgcolor:c.dot }}/>
                <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:'#172B4D' }}>
                  {(filteredByStatus[c.key]||[]).length}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Filtro de período */}
        <Box sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
          <ToggleButtonGroup value={filterMode} exclusive size="small"
            onChange={(_,v)=>{ if(v) setFilterMode(v); }}
            sx={{ '& .MuiToggleButton-root':{ px:1.2, py:0.3, fontSize:'0.68rem', fontWeight:600, border:'1px solid #DFE1E6', color:'#5E6C84',
              '&.Mui-selected':{ bgcolor:'#0052CC', color:'#fff', borderColor:'#0052CC' } } }}>
            <ToggleButton value="day"><Today sx={{fontSize:13,mr:0.4}}/>Dia</ToggleButton>
            <ToggleButton value="week"><ViewWeek sx={{fontSize:13,mr:0.4}}/>Semana</ToggleButton>
            <ToggleButton value="all">Todos</ToggleButton>
          </ToggleButtonGroup>
          {filterMode!=='all' && (
            <>
              <IconButton size="small" onClick={()=>navigate(-1)} sx={{ border:'1px solid #DFE1E6', p:'3px', color:'#5E6C84' }}>
                <ChevronLeft sx={{fontSize:16}}/>
              </IconButton>
              <IconButton size="small" onClick={()=>navigate(1)} sx={{ border:'1px solid #DFE1E6', p:'3px', color:'#5E6C84' }}>
                <ChevronRight sx={{fontSize:16}}/>
              </IconButton>
              <Typography sx={{ color:'#172B4D', fontSize:'0.78rem', fontWeight:700, textTransform:'capitalize', flex:1 }}>
                {periodLabel}
              </Typography>
              <Button size="small" variant="outlined" onClick={()=>setSelectedDate(new Date())}
                sx={{ fontSize:'0.68rem', px:1.2, py:0.3, borderColor:'#DFE1E6', color:'#5E6C84', minHeight:26 }}>
                Hoje
              </Button>
            </>
          )}
          <Box sx={{ bgcolor:totalFiltered>0?'#EFF6FF':'#F4F5F7', border:`1px solid ${totalFiltered>0?'#BFDBFE':'#DFE1E6'}`, borderRadius:'10px', px:1, py:'2px' }}>
            <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color:totalFiltered>0?'#1E40AF':'#5E6C84' }}>
              {totalFiltered} {totalFiltered===1?'paciente':'pacientes'}
            </Typography>
          </Box>
        </Box>

        {/* Mini seletor semanal */}
        {filterMode==='week' && (
          <Box sx={{ display:'flex', gap:0.5, mt:1.2, flexWrap:'wrap' }}>
            {weekDays.map(day=>{
              const isT = isSameDay(day,today);
              const isS = isSameDay(day,selectedDate);
              const cnt = patients.filter(p=>{ const d=pd(p.data_hora); return d&&isSameDay(d,day); }).length;
              return (
                <Box key={day.toISOString()}
                  onClick={()=>{ setSelectedDate(day); setFilterMode('day'); }}
                  sx={{ flex:1, minWidth:36, textAlign:'center', py:'4px', borderRadius:'6px', cursor:'pointer',
                    bgcolor:isT?'#0052CC':isS?'#EFF6FF':'#F4F5F7',
                    border:`1px solid ${isT?'#0052CC':isS?'#BFDBFE':'#DFE1E6'}`,
                    '&:hover':{ bgcolor:isT?'#0747A6':'#EFF6FF' }, transition:'all 0.1s' }}>
                  <Typography sx={{ fontSize:'0.58rem', fontWeight:600, color:isT?'#93C5FD':'#97A0AF', textTransform:'uppercase', lineHeight:1 }}>
                    {format(day,'EEE',{locale:ptBR})}
                  </Typography>
                  <Typography sx={{ fontSize:'0.8rem', fontWeight:700, color:isT?'#fff':isS?'#1E40AF':'#172B4D', lineHeight:1.4 }}>
                    {format(day,'d')}
                  </Typography>
                  {cnt>0 && <Box sx={{ width:5, height:5, borderRadius:'50%', bgcolor:isT?'#fff':'#3B82F6', mx:'auto', mt:'2px' }}/>}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── Board ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ flex:1, overflowX:'auto', overflowY:'hidden', py:2,
          display:'flex', justifyContent:'center',
          '&::-webkit-scrollbar':{ height:6 },
          '&::-webkit-scrollbar-thumb':{ bgcolor:'#C1C7D0', borderRadius:3 } }}>
          <Box sx={{ display:'flex', gap:2, alignItems:'flex-start', px:3, width:'100%', maxWidth:1200 }}>
            {visCols.map(col=>(
              <Box key={col.key} sx={{ flex:1, minWidth:{ xs:'78vw', sm:190 }, maxWidth:270,
                display:'flex', flexDirection:'column', overflowY:'auto', maxHeight:'100%',
                '&::-webkit-scrollbar':{ width:4 },
                '&::-webkit-scrollbar-thumb':{ bgcolor:'#DFE1E6', borderRadius:2 } }}>
                <KanbanCol col={col} patients={filteredByStatus[col.key]||[]}
                  onUpdateStatus={updatePatientStatus} onUpdateProgress={updatePatientProgress}
                  userCargo={user?.cargo}/>
              </Box>
            ))}
          </Box>
        </Box>
      </DragDropContext>

      <Snackbar open={!!remSnack} autoHideDuration={3500} onClose={()=>setRemSnack(null)}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity="info" variant="filled" onClose={()=>setRemSnack(null)}
          sx={{ fontSize:'0.78rem', bgcolor:'#0052CC','& .MuiAlert-icon':{ fontSize:18 } }}>
          📅 Remarcado: {remSnack}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientFlowPanel;