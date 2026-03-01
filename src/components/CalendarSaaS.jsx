import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import {
  Box, Typography, Chip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, CircularProgress,
  IconButton, Snackbar, Alert
} from '@mui/material';
import {
  format, parseISO, isSameDay, addDays,
  startOfWeek, startOfMonth, endOfMonth, endOfWeek, isSameMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PlayArrow, CheckCircle, Cancel,
  ChevronLeft, ChevronRight, EventNote,
  AccessTime, Person, DragIndicator
} from '@mui/icons-material';
import AppointmentsContext from '../contexts/AppointmentsContext';
import { PatientsContext } from '../contexts/PatientsContext';

/* ─── Paleta por STATUS (igual ao Kanban) ─── */
const STATUS_COLORS = {
  agendado:        { dot: '#3B82F6', bg: '#EFF6FF', colBg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
  confirmado:      { dot: '#3B82F6', bg: '#EFF6FF', colBg: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
  em_procedimento: { dot: '#df8510', bg: '#FFF8F0', colBg: '#FEE2E2', border: '#FCD5A0', text: '#9e4f01' },
  em_atendimento:  { dot: '#df8510', bg: '#FFF8F0', colBg: '#FEE2E2', border: '#FCD5A0', text: '#9e4f01' },
  finalizado:      { dot: '#10B981', bg: '#F0FDF4', colBg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' },
  cancelado:       { dot: '#f14e4e', bg: '#FFF5F5', colBg: '#FEE2E2', border: '#FECACA', text: '#5e0101' },
};
const DEFAULT_C = STATUS_COLORS.agendado;
const getColor  = (a) => STATUS_COLORS[a?.status] || DEFAULT_C;

const HOURS          = Array.from({ length: 13 }, (_, i) => i + 7); // 07–19h
const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const safeParse = (str) => {
  try { const d = new Date(str); return isNaN(d) ? null : d; } catch { return null; }
};
const safeFmt = (str, fmt) => {
  try { return format(new Date(str), fmt); } catch { return ''; }
};

/* ════════════════════════════════════════
   HOOK: drag & drop via HTML5 nativo
   zoneId: "day:YYYY-MM-DD" | "hour:HH" | "week:YYYY-MM-DD:HH"
   ════════════════════════════════════════ */
function useDnD(onCommit) {
  const [ghost,   setGhost]   = useState(null);   // appt sendo arrastado
  const [overZone, setOver]   = useState(null);
  const ref = useRef(null);

  const start  = useCallback((appt, e) => {
    e.stopPropagation();
    ref.current = appt;
    setGhost(appt);
    // imagem transparente
    const img = document.createElement('div');
    img.style.cssText = `position:fixed;top:-999px;left:-999px;
      padding:4px 10px;background:${getColor(appt).colBg};
      border:1px solid ${getColor(appt).dot};border-radius:6px;
      font-size:12px;font-weight:700;color:${getColor(appt).text};white-space:nowrap`;
    img.textContent = appt.paciente?.nome || 'Paciente';
    document.body.appendChild(img);
    e.dataTransfer.setDragImage(img, 60, 16);
    setTimeout(() => document.body.removeChild(img), 0);
  }, []);

  const enter  = useCallback((id, e) => { e.preventDefault(); setOver(id); }, []);
  const over   = useCallback((e)     => { e.preventDefault(); }, []);
  const leave  = useCallback(()      => setOver(null), []);
  const drop   = useCallback((id, e) => {
    e.preventDefault();
    if (ref.current) onCommit(ref.current, id);
    ref.current = null; setGhost(null); setOver(null);
  }, [onCommit]);
  const end    = useCallback(()      => { ref.current = null; setGhost(null); setOver(null); }, []);

  return { ghost, overZone, start, enter, over, leave, drop, end };
}

/* ────────────────────────────────────────
   EventChip — cartão compacto (mês/semana)
   ──────────────────────────────────────── */
const EventChip = ({ appt, onOpen, dnd }) => {
  const c     = getColor(appt);
  const time  = safeFmt(appt.data_hora, 'HH:mm');
  const ghost = dnd.ghost?.id === appt.id;
  return (
    <Box
      draggable
      onDragStart={(e) => dnd.start(appt, e)}
      onDragEnd={dnd.end}
      onClick={(e) => { e.stopPropagation(); onOpen(appt); }}
      sx={{
        px: '5px', py: '2px', mb: '2px', borderRadius: '4px',
        bgcolor: ghost ? c.colBg : c.bg,
        border: `1px solid ${ghost ? c.dot : c.border}`,
        display: 'flex', alignItems: 'center', gap: '4px',
        opacity: ghost ? 0.4 : 1,
        cursor: 'grab', userSelect: 'none',
        transition: 'opacity .1s, border-color .1s',
        '&:hover': { borderColor: c.dot, filter: 'brightness(0.96)' },
      }}
    >
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0 }} />
      <Typography sx={{ color: c.text, fontSize: '0.62rem', fontWeight: 600, flex: 1 }} noWrap>
        {time} {appt.paciente?.nome || '—'}
      </Typography>
    </Box>
  );
};

/* ────────────────────────────────────────
   DayCell — célula do grid do mês
   ──────────────────────────────────────── */
const DayCell = ({ day, appointments, isToday, isSel, inMonth, isLastRow, isLastCol, onOpen, onSelect, dnd }) => {
  const zoneId = `day:${format(day, 'yyyy-MM-dd')}`;
  const isOver = dnd.overZone === zoneId;
  const dayA   = appointments.filter(a => { try { return isSameDay(new Date(a.data_hora), day); } catch { return false; } });

  return (
    <Box
      onDragOver={dnd.over}
      onDragEnter={(e) => dnd.enter(zoneId, e)}
      onDragLeave={dnd.leave}
      onDrop={(e) => dnd.drop(zoneId, e)}
      onClick={() => onSelect(day)}
      sx={{
        p: '5px 6px',
        borderRight:  !isLastCol ? '1px solid #E9ECF0' : 'none',
        borderBottom: !isLastRow ? '1px solid #E9ECF0' : 'none',
        bgcolor: isOver ? '#DBEAFE' : isSel ? '#EFF6FF' : inMonth ? '#fff' : '#FAFBFC',
        outline: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
        outlineOffset: '-2px',
        cursor: 'pointer', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', position: 'relative',
        transition: 'background .1s, outline-color .1s',
        '&:hover': { bgcolor: isOver ? '#DBEAFE' : '#F5F7FA' },
      }}
    >
      {/* Número do dia */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: '3px', flexShrink: 0 }}>
        <Box sx={{
          width: 24, height: 24, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: isToday ? '#2563EB' : 'transparent',
        }}>
          <Typography sx={{
            fontSize: '0.74rem',
            fontWeight: isToday ? 700 : inMonth ? 500 : 400,
            color: isToday ? '#fff' : inMonth ? '#1E293B' : '#C4CAD4', lineHeight: 1,
          }}>
            {format(day, 'd')}
          </Typography>
        </Box>
      </Box>

      {/* Eventos */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {dayA.slice(0, 3).map(a => (
          <EventChip key={a.id} appt={a} onOpen={onOpen} dnd={dnd} />
        ))}
        {dayA.length > 3 && (
          <Typography sx={{ fontSize: '0.58rem', color: '#64748B', pl: 0.3, fontWeight: 600 }}>
            +{dayA.length - 3} mais
          </Typography>
        )}
      </Box>

      {/* Badge "Soltar aqui" */}
      {isOver && dnd.ghost && (
        <Box sx={{
          position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
          bgcolor: '#2563EB', color: '#fff', borderRadius: '4px',
          px: '5px', py: '1px', fontSize: '0.52rem', fontWeight: 700,
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
        }}>
          {format(day, 'dd/MM')}
        </Box>
      )}
    </Box>
  );
};

/* ════════════════════════════════════════
   CALENDÁRIO PRINCIPAL
   ════════════════════════════════════════ */
const CalendarSaaS = () => {
  const ctx                      = useContext(AppointmentsContext);
  const apiAppointments          = ctx?.appointments            ?? [];
  const loading                  = ctx?.loading                 ?? false;
  const fetchAppointmentsByDate  = ctx?.fetchAppointmentsByDate;
  const fetchAppointmentsByMonth = ctx?.fetchAppointmentsByMonth;
  const updateAppointmentStatus  = ctx?.updateAppointmentStatus;
  const updateAppointmentDate    = ctx?.updateAppointmentDate;

  const { patients = [], updatePatientDate } = useContext(PatientsContext) || {};

  const patientsAsAppts = useMemo(() => patients
    .filter(p => p.data_hora || p.date)
    .map(p => ({
      id:           `pat-${p.id}`,
      _patientId:   p.id,
      data_hora:    p.data_hora || p.date,
      status:       p.status === 'em_procedimento' ? 'em_atendimento'
                  : p.status === 'finalizado'       ? 'finalizado'
                  : p.status === 'cancelado'        ? 'cancelado' : 'agendado',
      paciente:     { nome: p.nome || p.name },
      procedimento: { nome: p.procedimento || p.procedureType || '—' },
      dentista:     { nome: p.dentist || p.dentista || '—' },
      valor:        p.valor,
      _local:       true,
    })), [patients]);

  /* appointments exibidos — API tem prioridade */
  const [localAppts, setLocalAppts] = useState([]);
  useEffect(() => {
    setLocalAppts(apiAppointments.length ? apiAppointments : patientsAsAppts);
  }, [apiAppointments, patientsAsAppts]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view,         setView]         = useState('month');
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [openDialog,   setOpenDialog]   = useState(false);
  const [snack,        setSnack]        = useState(null); // { msg, name }
  const today = new Date();

  /* fetch */
  useEffect(() => {
    if (view === 'month') fetchAppointmentsByMonth?.(selectedDate);
  }, [view, selectedDate.getFullYear(), selectedDate.getMonth()]);
  useEffect(() => {
    if (view === 'day') { fetchAppointmentsByDate?.(selectedDate); return; }
    if (view === 'week') {
      const s = startOfWeek(selectedDate, { weekStartsOn: 0 });
      Array.from({ length: 7 }, (_, i) => fetchAppointmentsByDate?.(addDays(s, i)));
    }
  }, [view, selectedDate.toDateString()]);

  /* navegação */
  const changePeriod = (delta) => {
    const d = new Date(selectedDate);
    if (view === 'day')   d.setDate(d.getDate() + delta);
    if (view === 'week')  d.setDate(d.getDate() + 7 * delta);
    if (view === 'month') d.setMonth(d.getMonth() + delta);
    setSelectedDate(d);
  };

  /* ── COMMIT DO DRAG & DROP ── */
  const commitDrop = useCallback((appt, zoneId) => {
    // parse zoneId
    let newDate = null;

    if (zoneId.startsWith('day:')) {
      // "day:YYYY-MM-DD" — mantém a hora original, só muda o dia
      const [, dateStr] = zoneId.split('day:');
      const [y, m, d]   = dateStr.split('-').map(Number);
      const orig        = safeParse(appt.data_hora);
      newDate = new Date(y, m - 1, d, orig ? orig.getHours() : 9, orig ? orig.getMinutes() : 0);

    } else if (zoneId.startsWith('hour:')) {
      // "hour:HH" — mesmo dia selecionado, hora nova
      const h   = Number(zoneId.split(':')[1]);
      newDate   = new Date(selectedDate);
      newDate.setHours(h, 0, 0, 0);

    } else if (zoneId.startsWith('week:')) {
      // "week:YYYY-MM-DD:HH" — dia + hora nova
      const [, dateStr, hStr] = zoneId.split(':');
      const [y, m, d]         = dateStr.split('-').map(Number);
      newDate = new Date(y, m - 1, d, Number(hStr), 0, 0, 0);
    }

    if (!newDate || isNaN(newDate)) return;

    const nome = appt.paciente?.nome || 'Paciente';
    const label = `${nome} → ${format(newDate, "dd/MM 'às' HH:mm")}`;

    // 1. Atualiza estado local (otimista)
    setLocalAppts(prev =>
      prev.map(a => a.id === appt.id ? { ...a, data_hora: newDate.toISOString() } : a)
    );

    // 2. Persiste — atualiza o contexto reativo (PatientFlowPanel reage automaticamente)
    if (appt._local && appt._patientId) {
      updatePatientDate?.(appt._patientId, newDate);
    } else {
      updateAppointmentDate?.(appt.id, newDate);
    }

    setSnack({ msg: label });
  }, [selectedDate, updateAppointmentDate]);

  const dnd = useDnD(commitDrop);

  /* helpers */
  const apptsByHour = useMemo(() => {
    const map = {};
    localAppts.forEach(a => {
      const d = safeParse(a.data_hora);
      if (!d || !isSameDay(d, selectedDate)) return;
      const h = d.getHours();
      if (!map[h]) map[h] = [];
      map[h].push(a);
    });
    return map;
  }, [localAppts, selectedDate]);

  const weekDays = useMemo(() => {
    const s = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const s = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
    const e = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });
    const days = []; let d = s;
    while (d <= e) { days.push(new Date(d)); d = addDays(d, 1); }
    return days;
  }, [selectedDate]);

  const changeStatus = (status) => {
    if (!selectedAppt) return;
    updateAppointmentStatus?.(selectedAppt.id, status);
    setLocalAppts(prev => prev.map(a => a.id === selectedAppt.id ? { ...a, status } : a));
    setOpenDialog(false);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>

        {/* ── Toolbar ── */}
        <Box sx={{
          px: 2, py: 1.2, borderBottom: '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap',
          bgcolor: '#FAFAFA', flexShrink: 0,
        }}>
          {/* Navegação */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <IconButton size="small" onClick={() => changePeriod(-1)} sx={{ color: '#64748B' }}>
              <ChevronLeft sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton size="small" onClick={() => changePeriod(1)}  sx={{ color: '#64748B' }}>
              <ChevronRight sx={{ fontSize: 20 }} />
            </IconButton>
          </Box>

          {/* Período */}
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', textTransform: 'capitalize', flex: 1 }}>
            {view === 'month' ? format(selectedDate, 'MMMM yyyy', { locale: ptBR })
             : view === 'week'
               ? `${format(weekDays[0], 'dd MMM', { locale: ptBR })} – ${format(weekDays[6], 'dd MMM yyyy', { locale: ptBR })}`
               : format(selectedDate, "EEE, dd 'de' MMMM", { locale: ptBR })}
          </Typography>

          {/* Hoje */}
          <Button size="small" variant="outlined" onClick={() => setSelectedDate(new Date())}
            sx={{ fontSize: '0.72rem', px: 1.5, borderColor: '#E2E8F0', color: '#475569',
              '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' } }}>
            Hoje
          </Button>

          {/* Hint drag */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5,
            bgcolor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', px: 1, py: '3px',
          }}>
            <DragIndicator sx={{ fontSize: 13, color: '#94A3B8' }} />
            <Typography sx={{ fontSize: '0.62rem', color: '#64748B' }}>Arraste para remarcar</Typography>
          </Box>

          {/* Legenda */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.2 }}>
            {[
              { label: 'Aguardando',      dot: '#3B82F6' },
              { label: 'Em Procedimento', dot: '#df8510' },
              { label: 'Finalizado',      dot: '#10B981' },
              { label: 'Cancelado',       dot: '#f14e4e' },
            ].map(({ label, dot }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '2px', bgcolor: dot }} />
                <Typography sx={{ fontSize: '0.62rem', color: '#64748B' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Toggle visão */}
          <Box sx={{ display: 'flex', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
            {['day', 'week', 'month'].map((v, i) => (
              <Button key={v} size="small" onClick={() => setView(v)}
                sx={{
                  px: 1.4, py: 0.4, fontSize: '0.72rem', borderRadius: 0, minWidth: 0,
                  bgcolor: view === v ? '#0052CC' : 'transparent',
                  color:   view === v ? '#fff'    : '#64748B',
                  fontWeight: view === v ? 700 : 400,
                  borderRight: i < 2 ? '1px solid #E2E8F0' : 'none',
                  '&:hover': { bgcolor: view === v ? '#0747A6' : '#F1F5F9' },
                }}>
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </Button>
            ))}
          </Box>
        </Box>

        {/* ══ VISÃO MÊS ══ */}
        {view === 'month' && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Cabeçalho dias */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
              {WEEK_DAYS_SHORT.map(d => (
                <Box key={d} sx={{ py: 1, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {d}
                  </Typography>
                </Box>
              ))}
            </Box>
            {/* Grid */}
            <Box sx={{
              flex: 1, display: 'grid',
              gridTemplateColumns: 'repeat(7,1fr)',
              gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, 1fr)`,
              overflow: 'hidden',
            }}>
              {monthDays.map((day, idx) => (
                <DayCell
                  key={day.toISOString()}
                  day={day}
                  appointments={localAppts}
                  isToday={isSameDay(day, today)}
                  isSel={isSameDay(day, selectedDate)}
                  inMonth={isSameMonth(day, selectedDate)}
                  isLastRow={idx >= monthDays.length - 7}
                  isLastCol={(idx + 1) % 7 === 0}
                  onOpen={(a) => { setSelectedAppt(a); setOpenDialog(true); }}
                  onSelect={(d) => { setSelectedDate(d); setView('day'); }}
                  dnd={dnd}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ══ VISÃO SEMANA ══ */}
        {view === 'week' && (
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Coluna de horas */}
            <Box sx={{ width: 46, flexShrink: 0, borderRight: '1px solid #F1F5F9', overflowY: 'auto', '&::-webkit-scrollbar': { width: 0 } }}>
              <Box sx={{ height: 44 }} />
              {HOURS.map(h => (
                <Box key={h} sx={{ height: 58, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', pr: 1, pt: '3px' }}>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>{String(h).padStart(2,'0')}h</Typography>
                </Box>
              ))}
            </Box>

            {/* Dias */}
            <Box sx={{ flex: 1, display: 'flex', overflowX: 'auto', overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4, height: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 2 } }}>
              {weekDays.map((day, di) => {
                const isToday = isSameDay(day, today);
                const dayA    = localAppts.filter(a => { try { return isSameDay(new Date(a.data_hora), day); } catch { return false; } });
                return (
                  <Box key={day.toISOString()} sx={{ flex: 1, minWidth: { xs: 80, sm: 90 }, borderRight: di < 6 ? '1px solid #F1F5F9' : 'none' }}>
                    {/* Header */}
                    <Box sx={{
                      height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, bgcolor: '#FAFAFA', zIndex: 1,
                      cursor: 'pointer', '&:hover': { bgcolor: '#F1F5F9' },
                    }}
                      onClick={() => { setSelectedDate(day); setView('day'); }}>
                      <Typography sx={{ fontSize: '0.58rem', color: '#94A3B8', textTransform: 'uppercase', lineHeight: 1 }}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </Typography>
                      <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isToday ? '#2563EB' : 'transparent' }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: isToday ? '#fff' : '#0F172A', lineHeight: 1 }}>
                          {format(day, 'd')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Slots hora */}
                    {HOURS.map(h => {
                      const zoneId = `week:${format(day,'yyyy-MM-dd')}:${h}`;
                      const isOver = dnd.overZone === zoneId;
                      const hAppts = dayA.filter(a => { try { return new Date(a.data_hora).getHours() === h; } catch { return false; } });
                      return (
                        <Box key={h}
                          onDragOver={dnd.over}
                          onDragEnter={(e) => dnd.enter(zoneId, e)}
                          onDragLeave={dnd.leave}
                          onDrop={(e) => dnd.drop(zoneId, e)}
                          sx={{
                            height: 58, borderBottom: '1px solid #F8FAFC',
                            p: '2px 3px', overflow: 'hidden', position: 'relative',
                            bgcolor: isOver ? '#EFF6FF' : 'transparent',
                            outline: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
                            outlineOffset: '-2px',
                            transition: 'background .1s, outline-color .1s',
                          }}
                        >
                          {hAppts.map(a => {
                            const c = getColor(a);
                            const ghost = dnd.ghost?.id === a.id;
                            return (
                              <Box key={a.id}
                                draggable
                                onDragStart={(e) => dnd.start(a, e)}
                                onDragEnd={dnd.end}
                                onClick={() => { setSelectedAppt(a); setOpenDialog(true); }}
                                sx={{
                                  px: '4px', py: '2px', borderRadius: '4px', mb: '2px',
                                  bgcolor: ghost ? c.colBg : c.bg,
                                  borderLeft: `3px solid ${c.dot}`,
                                  opacity: ghost ? 0.4 : 1,
                                  cursor: 'grab', userSelect: 'none',
                                  '&:hover': { filter: 'brightness(0.95)' },
                                }}>
                                <Typography sx={{ color: c.text, fontSize: '0.58rem', fontWeight: 700, lineHeight: 1.2 }} noWrap>
                                  {safeFmt(a.data_hora, 'HH:mm')}
                                </Typography>
                                <Typography sx={{ color: c.text, fontSize: '0.58rem', opacity: 0.8 }} noWrap>
                                  {a.paciente?.nome || '—'}
                                </Typography>
                              </Box>
                            );
                          })}

                          {/* Indicador drop */}
                          {isOver && dnd.ghost && (
                            <Box sx={{
                              position: 'absolute', inset: 0, pointerEvents: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              bgcolor: '#EFF6FF99',
                            }}>
                              <Typography sx={{ fontSize: '0.55rem', color: '#2563EB', fontWeight: 700 }}>
                                {String(h).padStart(2,'0')}:00
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ══ VISÃO DIA ══ */}
        {view === 'day' && (
          <Box sx={{ flex: 1, overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 2 } }}>
            {HOURS.map(hour => {
              const zoneId  = `hour:${hour}`;
              const isOver  = dnd.overZone === zoneId;
              const hAppts  = apptsByHour[hour] || [];
              return (
                <Box key={hour}
                  onDragOver={dnd.over}
                  onDragEnter={(e) => dnd.enter(zoneId, e)}
                  onDragLeave={dnd.leave}
                  onDrop={(e) => dnd.drop(zoneId, e)}
                  sx={{
                    display: 'flex', minHeight: 60,
                    bgcolor: isOver ? '#EFF6FF' : 'transparent',
                    borderBottom: '1px solid #F1F5F9',
                    outline: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
                    outlineOffset: '-2px',
                    transition: 'background .1s, outline-color .1s',
                    position: 'relative',
                  }}
                >
                  {/* Label hora */}
                  <Box sx={{ width: 46, flexShrink: 0, pt: '6px', pr: 1, textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.63rem', color: '#94A3B8' }}>
                      {String(hour).padStart(2,'0')}h
                    </Typography>
                  </Box>

                  {/* Eventos */}
                  <Box sx={{ flex: 1, borderLeft: '1px solid #F1F5F9', px: 1, py: '4px' }}>
                    {hAppts.map(appt => {
                      const c     = getColor(appt);
                      const ghost = dnd.ghost?.id === appt.id;
                      return (
                        <Box key={appt.id}
                          draggable
                          onDragStart={(e) => dnd.start(appt, e)}
                          onDragEnd={dnd.end}
                          onClick={() => { setSelectedAppt(appt); setOpenDialog(true); }}
                          sx={{
                            mb: '4px', px: 1, py: '6px', borderRadius: '6px',
                            bgcolor: ghost ? c.colBg : c.bg,
                            border: `1px solid ${ghost ? c.dot : c.border}`,
                            borderLeft: `3px solid ${c.dot}`,
                            boxShadow: ghost ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                            opacity: ghost ? 0.4 : 1,
                            cursor: 'grab', display: 'flex', gap: '8px', alignItems: 'center',
                            userSelect: 'none',
                            transition: 'all .1s',
                            '&:hover': { filter: 'brightness(0.96)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
                          }}
                        >
                          <DragIndicator sx={{ fontSize: 14, color: c.dot, opacity: 0.5, flexShrink: 0 }} />
                          <Avatar sx={{ width: 24, height: 24, bgcolor: `${c.dot}22`, color: c.text, fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                            {(appt.paciente?.nome || '?').charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ color: c.text, fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.2 }} noWrap>
                              {appt.paciente?.nome || '—'}
                            </Typography>
                            <Typography sx={{ color: c.text, fontSize: '0.62rem', opacity: 0.75, lineHeight: 1.2 }} noWrap>
                              {appt.procedimento?.nome || '—'} · {appt.dentista?.nome || '—'}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                            <Typography sx={{ color: c.text, fontSize: '0.65rem', fontWeight: 700 }}>
                              {safeFmt(appt.data_hora, 'HH:mm')}
                            </Typography>
                            <Chip label={appt.status} size="small"
                              sx={{ fontSize: '0.5rem', height: 14, bgcolor: `${c.dot}18`, color: c.text, fontWeight: 700, border: `1px solid ${c.border}` }} />
                          </Box>
                        </Box>
                      );
                    })}

                    {/* Drop vazio */}
                    {hAppts.length === 0 && isOver && dnd.ghost && (
                      <Box sx={{
                        height: 46, border: '1px dashed #3B82F6', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                        bgcolor: '#EFF6FF',
                      }}>
                        <DragIndicator sx={{ fontSize: 13, color: '#3B82F6' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#3B82F6', fontWeight: 700 }}>
                          Soltar às {String(hour).padStart(2,'0')}:00
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* ══ Dialog detalhes ══ */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' } }}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: '1px solid #F1F5F9', fontSize: '0.95rem' }}>
            Detalhes do Agendamento
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {selectedAppt && (() => {
              const c = getColor(selectedAppt);
              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: c.bg, color: c.text, fontWeight: 700, border: `2px solid ${c.border}`, width: 42, height: 42 }}>
                      {(selectedAppt.paciente?.nome || '?').charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.95rem">{selectedAppt.paciente?.nome || '—'}</Typography>
                      <Chip label={selectedAppt.status} size="small"
                        sx={{ bgcolor: c.bg, color: c.text, fontWeight: 700, border: `1px solid ${c.border}`, fontSize: '0.68rem', mt: 0.3 }} />
                    </Box>
                  </Box>
                  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '8px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {[
                      { icon: <AccessTime sx={{ color: '#94A3B8', fontSize: 14 }} />, label: safeFmt(selectedAppt.data_hora, "dd/MM/yyyy 'às' HH:mm") || '—' },
                      { icon: <EventNote sx={{ color: '#94A3B8', fontSize: 14 }} />,  label: selectedAppt.procedimento?.nome || selectedAppt.procedimento || '—' },
                      { icon: <Person sx={{ color: '#94A3B8', fontSize: 14 }} />,     label: selectedAppt.dentista?.nome    || selectedAppt.dentista    || '—' },
                    ].map(({ icon, label }, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {icon}
                        <Typography variant="body2" color="text.secondary" fontSize="0.82rem">{label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #F1F5F9' }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined" size="small" sx={{ fontSize: '0.72rem' }}>Fechar</Button>
            {selectedAppt?.status === 'agendado' && (
              <Button startIcon={<PlayArrow />} variant="contained" size="small"
                onClick={() => changeStatus('em_atendimento')}
                sx={{ bgcolor: '#df8510', '&:hover': { bgcolor: '#b36a0e' }, fontSize: '0.72rem' }}>
                Iniciar
              </Button>
            )}
            {selectedAppt?.status === 'em_atendimento' && (
              <Button startIcon={<CheckCircle />} variant="contained" color="success" size="small"
                onClick={() => changeStatus('finalizado')} sx={{ fontSize: '0.72rem' }}>
                Finalizar
              </Button>
            )}
            {['agendado', 'confirmado'].includes(selectedAppt?.status) && (
              <Button startIcon={<Cancel />} size="small" color="error" variant="outlined"
                onClick={() => changeStatus('cancelado')} sx={{ fontSize: '0.72rem' }}>
                Cancelar
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* ── Snackbar confirmação de remarcação ── */}
        <Snackbar
          open={!!snack}
          autoHideDuration={3000}
          onClose={() => setSnack(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" variant="filled" onClose={() => setSnack(null)}
            sx={{ fontSize: '0.78rem', '& .MuiAlert-icon': { fontSize: 18 } }}>
            ✓ Remarcado: {snack?.msg}
          </Alert>
        </Snackbar>

      </Box>
    </LocalizationProvider>
  );
};

export default CalendarSaaS;