import { useContext, useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Avatar, IconButton,
  Tooltip, Button, CircularProgress, ToggleButton, ToggleButtonGroup,
  Snackbar, Alert
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  WhatsApp, PlayArrow, ArrowBack, Cancel,
  Refresh, AttachMoney, MedicalServices,
  CalendarToday, ChevronLeft, ChevronRight, ViewWeek, Today
} from '@mui/icons-material';
import { format, isSameDay, isSameWeek, addDays, startOfWeek, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';

/* ─── Colunas ─── */
const COLUMNS = [
  { key: 'aguardando',      label: 'Aguardando',      status: 'agendado',        dot: '#3B82F6', bg: '#EFF6FF', colBg: '#DBEAFE', pill: '#BFDBFE', pillText: '#1E40AF', color: '#1E40AF' },
  { key: 'em_procedimento', label: 'Em Procedimento', status: 'em_procedimento', dot: '#df8510', bg: '#FFF5F5', colBg: '#FEE2E2', pill: '#FECACA', pillText: '#ad5803', color: '#9e4f01' },
  { key: 'finalizado',      label: 'Finalizados',     status: 'finalizado',      dot: '#10B981', bg: '#F0FDF4', colBg: '#D1FAE5', pill: '#A7F3D0', pillText: '#065F46', color: '#065F46' },
  { key: 'cancelado',       label: 'Cancelados',      status: 'cancelado',       dot: '#f14e4e', bg: '#F9FAFB', colBg: '#F3F4F6', pill: '#E5E7EB', pillText: '#cf0404', color: '#5e0101' },
];

const STATUS_FROM_COL = Object.fromEntries(COLUMNS.map(c => [c.key, c.status]));

const STEPS_MAP = {
  cirurgia: ['Prep.', 'Anest.', 'Proc.', 'Recup.'],
  consulta: ['Anam.', 'Exame', 'Diag.', 'Final.'],
  default:  ['Prep.', 'Proc.', 'Final.'],
};
const getSteps = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('cirurgia') || t.includes('micro')) return STEPS_MAP.cirurgia;
  if (t.includes('consulta')) return STEPS_MAP.consulta;
  return STEPS_MAP.default;
};

// Parse seguro da data
const parseDate = (str) => {
  if (!str) return null;
  try {
    const d = str instanceof Date ? str : parseISO(String(str));
    return isValid(d) ? d : null;
  } catch { return null; }
};

/* ─── Card ─── */
const PatientCard = ({ patient, index, col, onUpdateStatus, onUpdateProgress, userCargo }) => {
  const steps    = getSteps(patient.procedimento || patient.procedureType);
  const cur      = patient.procedureProgress || 0;
  const isProc   = patient.status === 'em_procedimento';
  const canAct   = ['gestor', 'proprietario', 'dentista', 'atendente'].includes(userCargo);
  const phone    = (patient.telefone || patient.phone || '').replace(/\D/g, '');
  const nome     = patient.nome || patient.name || '?';
  const proc     = patient.procedimento || patient.procedureType || '—';
  const dentista = patient.dentist || patient.dentista || '—';
  const apptDate = parseDate(patient.data_hora);

  return (
    <Draggable draggableId={String(patient.id)} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1.5, bgcolor: '#fff', borderRadius: '8px',
            border: `1px solid ${snapshot.isDragging ? col.dot : '#DFE1E6'}`,
            boxShadow: snapshot.isDragging ? `0 10px 28px rgba(0,0,0,0.2), 0 0 0 2px ${col.dot}44` : '0 1px 2px rgba(9,30,66,0.08)',
            cursor: 'grab', overflow: 'hidden',
            transition: 'box-shadow 0.12s, border-color 0.12s',
            '&:hover': { boxShadow: '0 4px 12px rgba(9,30,66,0.14)', borderColor: '#B3BAC5' },
          }}
        >
          <Box sx={{ height: 3, bgcolor: col.dot }} />
          <Box sx={{ p: '10px 12px 12px' }}>

            {/* Nome */}
            <Typography sx={{ color: '#172B4D', fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.35, mb: 0.5 }}>
              {nome}
            </Typography>

            {/* Data e hora de atendimento */}
            {apptDate && (
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8,
                bgcolor: col.bg, border: `1px solid ${col.pill}`,
                borderRadius: '4px', px: '6px', py: '3px',
                width: 'fit-content',
              }}>
                <CalendarToday sx={{ fontSize: 10, color: col.color }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: col.color }}>
                  {format(apptDate, "EEE, dd/MM", { locale: ptBR })}
                  {' · '}
                  {format(apptDate, "HH:mm")}
                </Typography>
              </Box>
            )}

            {/* Procedimento */}
            <Box sx={{ mb: 0.8 }}>
              <Box sx={{
                display: 'inline-block', bgcolor: col.pill, color: col.pillText,
                borderRadius: '3px', px: '6px', py: '2px',
                fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.02em',
                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {proc}
              </Box>
            </Box>

            {/* Dentista */}
            <Typography sx={{ color: '#5E6C84', fontSize: '0.72rem', mb: 1 }} noWrap>
              {dentista}
            </Typography>

            {/* Stepper */}
            {isProc && (
              <Box sx={{ display: 'flex', gap: 0.3, mb: 1 }}>
                {steps.map((s, i) => (
                  <Box key={s} sx={{ flex: 1, py: '3px', textAlign: 'center', borderRadius: '3px', bgcolor: i <= cur ? col.dot : '#F4F5F7', transition: 'background 0.15s' }}>
                    <Typography sx={{ color: i <= cur ? '#fff' : '#97A0AF', fontSize: '0.5rem', fontWeight: 700 }}>{s}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Rodapé */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {patient.valor ? (
                <Typography sx={{ color: '#006644', fontSize: '0.7rem', fontWeight: 700, bgcolor: '#E3FCEF', px: '6px', py: '2px', borderRadius: '3px', border: '1px solid #ABF5D1' }}>
                  R$ {Number(patient.valor).toFixed(0)}
                </Typography>
              ) : <Box />}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                {phone && (
                  <Tooltip title="WhatsApp">
                    <IconButton size="small" component="a" href={`https://wa.me/55${phone}`} target="_blank"
                      sx={{ color: '#22C55E', p: '3px', '&:hover': { bgcolor: '#F0FDF4' } }}>
                      <WhatsApp sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={nome}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.68rem', fontWeight: 700, bgcolor: col.colBg, color: col.color, border: `1.5px solid ${col.dot}55` }}>
                    {nome.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              </Box>
            </Box>

            {/* Ações */}
            {canAct && (
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1, pt: 1, borderTop: '1px solid #EBECF0' }}>
                {patient.status === 'pendente_pagamento' && (
                  <Button size="small" fullWidth onClick={() => onUpdateStatus(patient.id, 'agendado')}
                    sx={{ fontSize: '0.62rem', py: 0.3, minHeight: 26, color: '#92400E', bgcolor: '#FEF3C7', border: '1px solid #FDE68A', '&:hover': { bgcolor: '#FDE68A' } }}>
                    <AttachMoney sx={{ fontSize: 11, mr: 0.3 }} /> Confirmar Pagamento
                  </Button>
                )}
                {patient.status === 'agendado' && patient.pago && (
                  <Button size="small" fullWidth onClick={() => onUpdateStatus(patient.id, 'em_procedimento')}
                    sx={{ fontSize: '0.62rem', py: 0.3, minHeight: 26, bgcolor: '#0052CC', color: '#fff', '&:hover': { bgcolor: '#0747A6' } }}>
                    <PlayArrow sx={{ fontSize: 11, mr: 0.3 }} /> Iniciar Atendimento
                  </Button>
                )}
                {isProc && (
                  <Box sx={{ display: 'flex', gap: 0.5, width: '100%' }}>
                    <IconButton size="small" onClick={() => onUpdateProgress(patient.id, Math.max(0, cur - 1))} disabled={cur === 0}
                      sx={{ border: '1px solid #DFE1E6', color: '#97A0AF', p: '3px', '&:not(:disabled):hover': { color: '#172B4D', borderColor: '#B3BAC5' } }}>
                      <ArrowBack sx={{ fontSize: 11 }} />
                    </IconButton>
                    <Button size="small" sx={{ flex: 1, fontSize: '0.62rem', py: 0.3, minHeight: 26, color: col.color, border: `1px solid ${col.dot}77`, bgcolor: col.bg, '&:hover': { bgcolor: col.colBg } }}
                      onClick={() => { const next = cur + 1; if (next >= steps.length) onUpdateStatus(patient.id, 'finalizado'); else onUpdateProgress(patient.id, next); }}>
                      {cur >= steps.length - 1 ? '✓ Finalizar' : 'Avançar →'}
                    </Button>
                    <Tooltip title="Cancelar">
                      <IconButton size="small" onClick={() => onUpdateStatus(patient.id, 'cancelado')}
                        sx={{ border: '1px solid #FFBDAD', color: '#DE350B', p: '3px', '&:hover': { bgcolor: '#FFEBE6' } }}>
                        <Cancel sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
                {patient.status === 'agendado' && (
                  <Tooltip title="Cancelar">
                    <IconButton size="small" onClick={() => onUpdateStatus(patient.id, 'cancelado')}
                      sx={{ border: '1px solid #FFBDAD', color: '#DE350B', p: '3px', '&:hover': { bgcolor: '#FFEBE6' } }}>
                      <Cancel sx={{ fontSize: 11 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {patient.status === 'finalizado' && (
                  <Button size="small" fullWidth onClick={() => onUpdateStatus(patient.id, 'agendado')}
                    sx={{ fontSize: '0.62rem', py: 0.3, minHeight: 26, color: '#5E6C84', border: '1px solid #DFE1E6', '&:hover': { bgcolor: '#F4F5F7', color: '#172B4D' } }}>
                    <Refresh sx={{ fontSize: 11, mr: 0.3 }} /> Reabrir
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Draggable>
  );
};

/* ─── Coluna ─── */
const KanbanColumn = ({ col, patients, onUpdateStatus, onUpdateProgress, userCargo }) => (
  <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#F4F5F7', borderRadius: '8px', p: '10px', minHeight: 120 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: col.dot, flexShrink: 0 }} />
      <Typography sx={{ color: '#5E6C84', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
        {col.label}
      </Typography>
      <Box sx={{ bgcolor: '#DFE1E6', color: '#5E6C84', borderRadius: '10px', px: '7px', py: '1px', fontSize: '0.68rem', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
        {patients.length}
      </Box>
    </Box>
    <Droppable droppableId={col.key}>
      {(provided, snapshot) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}
          sx={{ flex: 1, minHeight: 50, borderRadius: '6px', p: snapshot.isDraggingOver ? '6px' : 0, bgcolor: snapshot.isDraggingOver ? col.colBg : 'transparent', border: snapshot.isDraggingOver ? `2px dashed ${col.dot}` : '2px dashed transparent', transition: 'all 0.12s' }}>
          {patients.length === 0 && !snapshot.isDraggingOver && (
            <Box sx={{ py: 3, textAlign: 'center', border: '2px dashed #DFE1E6', borderRadius: '6px', bgcolor: '#fff' }}>
              <Typography sx={{ color: '#C1C7D0', fontSize: '0.68rem' }}>Sem itens</Typography>
            </Box>
          )}
          {patients.map((p, i) => (
            <PatientCard key={p.id} patient={p} index={i} col={col}
              onUpdateStatus={onUpdateStatus} onUpdateProgress={onUpdateProgress} userCargo={userCargo} />
          ))}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  </Box>
);

/* ─── Board principal ─── */
const PatientFlowPanel = () => {
  const { patients, updatePatientStatus, updatePatientProgress, getPatientsByStatus, loading } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const [filterMode, setFilterMode] = useState('day'); // 'day' | 'week' | 'all'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rescheduledSnack, setRescheduledSnack] = useState(null);

  // Detecta remarcações vindas do CalendarSaaS (mudança de data_hora via contexto)
  const prevPatientsRef = useRef({});
  useEffect(() => {
    const prev = prevPatientsRef.current;
    patients.forEach(p => {
      const prevDate = prev[p.id];
      if (prevDate && prevDate !== p.data_hora && p.data_hora) {
        try {
          const novaData = parseDate(p.data_hora);
          if (novaData) {
            setRescheduledSnack(`${p.nome || p.name} → ${format(novaData, "EEE dd/MM 'às' HH:mm", { locale: ptBR })}`);
          }
        } catch {}
      }
      prev[p.id] = p.data_hora;
    });
    prevPatientsRef.current = prev;
  }, [patients]);

  // Navegar por dia ou semana
  const navigate = (delta) => {
    const d = new Date(selectedDate);
    if (filterMode === 'day')  d.setDate(d.getDate() + delta);
    if (filterMode === 'week') d.setDate(d.getDate() + 7 * delta);
    setSelectedDate(d);
  };

  // Período exibido na toolbar
  const periodLabel = useMemo(() => {
    if (filterMode === 'all') return 'Todos os pacientes';
    if (filterMode === 'day') return format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const end   = addDays(start, 6);
    return `${format(start, 'dd/MM', { locale: ptBR })} – ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`;
  }, [filterMode, selectedDate]);

  // Dias da semana atual (para o mini-seletor semanal)
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Filtrar pacientes pela data
  const filterPatient = (p) => {
    if (filterMode === 'all') return true;
    const d = parseDate(p.data_hora);
    if (!d) return false;
    if (filterMode === 'day')  return isSameDay(d, selectedDate);
    if (filterMode === 'week') return isSameWeek(d, selectedDate, { weekStartsOn: 0 });
    return true;
  };

  const byStatus = getPatientsByStatus();

  // Aplica filtro em cada coluna
  const filteredByStatus = useMemo(() => {
    const result = {};
    Object.keys(byStatus).forEach(k => {
      result[k] = byStatus[k].filter(filterPatient);
    });
    return result;
  }, [byStatus, filterMode, selectedDate]);

  const totalFiltered = Object.values(filteredByStatus).reduce((a, b) => a + b.length, 0);
  const today = new Date();

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = STATUS_FROM_COL[destination.droppableId];
    if (newStatus) updatePatientStatus(Number(draggableId), newStatus);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#F4F5F7' }}>

      {/* ── Header ── */}
      <Box sx={{ px: 2.5, pt: 1.8, pb: 1.2, bgcolor: '#fff', borderBottom: '1px solid #DFE1E6', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: '6px', bgcolor: '#0052CC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MedicalServices sx={{ color: '#fff', fontSize: 16 }} />
          </Box>
          <Box>
            <Typography sx={{ color: '#172B4D', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1 }}>
              Fluxo de Pacientes
            </Typography>
            <Typography sx={{ color: '#5E6C84', fontSize: '0.7rem' }}>
              Board · {patients.length} total
            </Typography>
          </Box>

          {/* Mini resumo por coluna */}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {COLUMNS.map(c => (
              <Box key={c.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: c.dot }} />
                <Typography sx={{ color: '#5E6C84', fontSize: '0.65rem' }}>
                  <Box component="span" sx={{ fontWeight: 700, color: '#172B4D' }}>
                    {(filteredByStatus[c.key] || []).length}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Barra de filtro por data ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>

          {/* Toggle dia / semana / todos */}
          <ToggleButtonGroup
            value={filterMode}
            exclusive
            onChange={(_, v) => { if (v) setFilterMode(v); }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.2, py: 0.3, fontSize: '0.68rem', fontWeight: 600,
                border: '1px solid #DFE1E6', color: '#5E6C84',
                '&.Mui-selected': { bgcolor: '#0052CC', color: '#fff', borderColor: '#0052CC' },
                '&:hover': { bgcolor: '#F4F5F7' },
              },
            }}
          >
            <ToggleButton value="day"><Today sx={{ fontSize: 13, mr: 0.4 }} />Dia</ToggleButton>
            <ToggleButton value="week"><ViewWeek sx={{ fontSize: 13, mr: 0.4 }} />Semana</ToggleButton>
            <ToggleButton value="all">Todos</ToggleButton>
          </ToggleButtonGroup>

          {/* Navegação prev/next */}
          {filterMode !== 'all' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton size="small" onClick={() => navigate(-1)}
                sx={{ border: '1px solid #DFE1E6', p: '3px', color: '#5E6C84', '&:hover': { bgcolor: '#F4F5F7' } }}>
                <ChevronLeft sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => navigate(1)}
                sx={{ border: '1px solid #DFE1E6', p: '3px', color: '#5E6C84', '&:hover': { bgcolor: '#F4F5F7' } }}>
                <ChevronRight sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}

          {/* Label do período */}
          {filterMode !== 'all' && (
            <Typography sx={{ color: '#172B4D', fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize', flex: 1 }}>
              {periodLabel}
            </Typography>
          )}

          {/* Botão Hoje */}
          {filterMode !== 'all' && (
            <Button size="small" variant="outlined"
              onClick={() => setSelectedDate(new Date())}
              sx={{ fontSize: '0.68rem', px: 1.2, py: 0.3, borderColor: '#DFE1E6', color: '#5E6C84', minHeight: 26, '&:hover': { borderColor: '#94A3B8', bgcolor: '#F8FAFC' } }}>
              Hoje
            </Button>
          )}

          {/* Contador filtrado */}
          <Box sx={{ bgcolor: totalFiltered > 0 ? '#EFF6FF' : '#F4F5F7', border: `1px solid ${totalFiltered > 0 ? '#BFDBFE' : '#DFE1E6'}`, borderRadius: '10px', px: 1, py: '2px' }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: totalFiltered > 0 ? '#1E40AF' : '#5E6C84' }}>
              {totalFiltered} {totalFiltered === 1 ? 'paciente' : 'pacientes'}
            </Typography>
          </Box>
        </Box>

        {/* ── Mini seletor de dias da semana (só no modo semana) ── */}
        {filterMode === 'week' && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1.2, flexWrap: 'wrap' }}>
            {weekDays.map(day => {
              const isToday   = isSameDay(day, today);
              const isSel     = isSameDay(day, selectedDate);
              const dayCount  = patients.filter(p => { const d = parseDate(p.data_hora); return d && isSameDay(d, day); }).length;
              return (
                <Box key={day.toISOString()}
                  onClick={() => { setSelectedDate(day); setFilterMode('day'); }}
                  sx={{
                    flex: 1, minWidth: 36, textAlign: 'center',
                    py: '4px', px: '4px',
                    borderRadius: '6px', cursor: 'pointer',
                    bgcolor: isToday ? '#0052CC' : isSel ? '#EFF6FF' : '#F4F5F7',
                    border: `1px solid ${isToday ? '#0052CC' : isSel ? '#BFDBFE' : '#DFE1E6'}`,
                    '&:hover': { bgcolor: isToday ? '#0747A6' : '#EFF6FF', borderColor: '#93C5FD' },
                    transition: 'all 0.1s',
                  }}
                >
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 600, color: isToday ? '#93C5FD' : '#97A0AF', textTransform: 'uppercase', lineHeight: 1 }}>
                    {format(day, 'EEE', { locale: ptBR })}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isToday ? '#fff' : isSel ? '#1E40AF' : '#172B4D', lineHeight: 1.4 }}>
                    {format(day, 'd')}
                  </Typography>
                  {dayCount > 0 && (
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: isToday ? '#fff' : '#3B82F6', mx: 'auto', mt: '2px' }} />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* ── Board ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{
          flex: 1, overflowX: 'auto', overflowY: 'hidden', py: 2,
          display: 'flex', justifyContent: 'center',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: '#EBECF0', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#C1C7D0', borderRadius: 3, '&:hover': { bgcolor: '#97A0AF' } },
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', px: 3, width: '100%', maxWidth: 1100 }}>
            {COLUMNS.map(col => (
              <Box key={col.key} sx={{
                flex: 1, minWidth: { xs: '78vw', sm: 180 }, maxWidth: 260,
                display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '100%',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#DFE1E6', borderRadius: 2 },
              }}>
                <KanbanColumn
                  col={col}
                  patients={filteredByStatus[col.key] || []}
                  onUpdateStatus={updatePatientStatus}
                  onUpdateProgress={updatePatientProgress}
                  userCargo={user?.cargo}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </DragDropContext>
      {/* Snackbar: remarcação vinda do Calendário */}
      <Snackbar
        open={!!rescheduledSnack}
        autoHideDuration={3500}
        onClose={() => setRescheduledSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setRescheduledSnack(null)}
          sx={{ fontSize: '0.78rem', bgcolor: '#0052CC', '& .MuiAlert-icon': { fontSize: 18 } }}>
          📅 Remarcado via Calendário: {rescheduledSnack}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientFlowPanel;