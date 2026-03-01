import { useContext } from 'react';
import {
  Box, Typography, Avatar, Chip, IconButton,
  Tooltip, Button, CircularProgress
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  WhatsApp, PlayArrow, ArrowBack, Cancel,
  Refresh, AttachMoney, MedicalServices
} from '@mui/icons-material';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';

/* ── Colunas com mesma estrutura visual do Jira ── */
const COLUMNS = [
  {
    key: 'pendentes',
    label: 'AGUARD. PAGAMENTO',
    count_color: '#92400E',
    count_bg: '#FEF3C7',
    tag_bg: '#F59E0B',
    tag_text: '#fff',
  },
  {
    key: 'aguardando',
    label: 'AGUARDANDO',
    count_color: '#1E40AF',
    count_bg: '#DBEAFE',
    tag_bg: '#2563EB',
    tag_text: '#fff',
  },
  {
    key: 'em_procedimento',
    label: 'EM PROCEDIMENTO',
    count_color: '#991B1B',
    count_bg: '#FEE2E2',
    tag_bg: '#EF4444',
    tag_text: '#fff',
  },
  {
    key: 'finalizado',
    label: 'FINALIZADOS',
    count_color: '#065F46',
    count_bg: '#D1FAE5',
    tag_bg: '#10B981',
    tag_text: '#fff',
  },
  {
    key: 'cancelado',
    label: 'CANCELADOS',
    count_color: '#374151',
    count_bg: '#F3F4F6',
    tag_bg: '#6B7280',
    tag_text: '#fff',
  },
];

const STEPS_MAP = {
  cirurgia: ['Prep.', 'Anest.', 'Proc.', 'Recup.'],
  consulta: ['Anam.', 'Exame', 'Diag.', 'Final.'],
  default: ['Prep.', 'Proc.', 'Final.'],
};
const getSteps = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('cirurgia') || t.includes('micro')) return STEPS_MAP.cirurgia;
  if (t.includes('consulta')) return STEPS_MAP.consulta;
  return STEPS_MAP.default;
};

const STATUS_FROM_COL = {
  pendentes: 'pendente_pagamento',
  aguardando: 'agendado',
  em_procedimento: 'em_procedimento',
  finalizado: 'finalizado',
  cancelado: 'cancelado',
};

/* ─────────────────────────────────────────
   Card — fiel ao estilo Jira
───────────────────────────────────────── */
const PatientCard = ({ patient, index, col, onUpdateStatus, onUpdateProgress, userCargo }) => {
  const steps  = getSteps(patient.procedimento || patient.procedureType);
  const cur    = patient.procedureProgress || 0;
  const isProc = patient.status === 'em_procedimento';
  const canAct = ['gestor', 'proprietario', 'dentista', 'atendente'].includes(userCargo);
  const phone  = (patient.telefone || patient.phone || '').replace(/\D/g, '');
  const nome   = patient.nome || patient.name || '?';
  const proc   = patient.procedimento || patient.procedureType || '—';
  const dentista = patient.dentist || patient.dentista || '—';

  return (
    <Draggable draggableId={String(patient.id)} index={index}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: '8px',
            bgcolor: '#fff',
            borderRadius: '6px',
            border: `1px solid ${snapshot.isDragging ? '#93C5FD' : '#DFE1E6'}`,
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(0,0,0,0.14)'
              : '0 1px 2px rgba(9,30,66,0.08)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            cursor: 'grab',
            '&:hover': {
              boxShadow: '0 3px 8px rgba(9,30,66,0.14)',
              borderColor: '#B3BAC5',
            },
          }}
        >
          <Box sx={{ p: '10px 12px' }}>

            {/* ── Nome em destaque (como título do card Jira) ── */}
            <Typography sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#172B4D',
              lineHeight: 1.4,
              mb: 1,
            }}>
              {nome}
            </Typography>

            {/* ── Chip do procedimento (igual label colorido do Jira) ── */}
            <Box sx={{ mb: 1 }}>
              <Chip
                label={proc}
                size="small"
                sx={{
                  bgcolor: col.tag_bg,
                  color: col.tag_text,
                  fontWeight: 700,
                  fontSize: '0.63rem',
                  height: 18,
                  borderRadius: '3px',
                  letterSpacing: '0.02em',
                  maxWidth: '100%',
                  '& .MuiChip-label': { px: '6px' },
                }}
              />
            </Box>

            {/* ── Dentista ── */}
            <Typography sx={{ fontSize: '0.72rem', color: '#6B7280', mb: isProc ? 1 : 0.5 }}>
              {dentista}
            </Typography>

            {/* ── Stepper apenas em procedimento ── */}
            {isProc && (
              <Box sx={{ display: 'flex', gap: '3px', mb: 1 }}>
                {steps.map((s, i) => (
                  <Box key={s} sx={{
                    flex: 1, textAlign: 'center',
                    py: '3px', borderRadius: '3px',
                    bgcolor: i <= cur ? col.tag_bg : '#F4F5F7',
                    transition: 'background 0.2s',
                  }}>
                    <Typography sx={{
                      fontSize: '0.5rem', fontWeight: 700,
                      color: i <= cur ? col.tag_text : '#97A0AF',
                    }}>
                      {s}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* ── Rodapé: ID-like + valor + avatar (igual Jira) ── */}
            <Box sx={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', mt: 1,
              pt: '6px', borderTop: '1px solid #F4F5F7',
            }}>
              {/* Lado esquerdo: ícone + ID numérico + valor */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{
                  width: 14, height: 14, borderRadius: '2px',
                  bgcolor: col.tag_bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MedicalServices sx={{ fontSize: 9, color: col.tag_text }} />
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#97A0AF', fontWeight: 500 }}>
                  #{String(patient.id).padStart(3, '0')}
                </Typography>
                {patient.valor && (
                  <Typography sx={{
                    fontSize: '0.65rem', color: '#059669', fontWeight: 700,
                    bgcolor: '#F0FDF4', px: '5px', py: '1px',
                    borderRadius: '3px', border: '1px solid #BBF7D0',
                  }}>
                    R${Number(patient.valor).toFixed(0)}
                  </Typography>
                )}
              </Box>

              {/* Lado direito: WhatsApp + avatar */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {phone && (
                  <Tooltip title={`WhatsApp: ${phone}`}>
                    <IconButton size="small" component="a" href={`https://wa.me/55${phone}`} target="_blank"
                      sx={{ color: '#22C55E', p: '2px', '&:hover': { bgcolor: '#F0FDF4' } }}>
                      <WhatsApp sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title={nome}>
                  <Avatar sx={{
                    width: 24, height: 24,
                    fontSize: '0.68rem', fontWeight: 700,
                    bgcolor: col.tag_bg + 'CC',
                    color: col.tag_text,
                    border: `1.5px solid #fff`,
                    boxShadow: '0 0 0 1.5px #DFE1E6',
                  }}>
                    {nome.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              </Box>
            </Box>

            {/* ── Ações contextuais (abaixo do rodapé) ── */}
            {canAct && (
              <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap', mt: '8px' }}>
                {patient.status === 'pendente_pagamento' && (
                  <Button size="small" onClick={() => onUpdateStatus(patient.id, 'agendado')}
                    sx={{
                      flex: 1, fontSize: '0.6rem', py: '2px', minHeight: 22,
                      color: '#92400E', bgcolor: '#FEF3C7',
                      border: '1px solid #FCD34D', borderRadius: '4px',
                      '&:hover': { bgcolor: '#FDE68A' },
                    }}>
                    <AttachMoney sx={{ fontSize: 10, mr: '2px' }} /> Confirmar Pag.
                  </Button>
                )}
                {patient.status === 'agendado' && patient.pago && (
                  <Button size="small" onClick={() => onUpdateStatus(patient.id, 'em_procedimento')}
                    sx={{
                      flex: 1, fontSize: '0.6rem', py: '2px', minHeight: 22,
                      color: '#fff', bgcolor: '#2563EB', borderRadius: '4px',
                      '&:hover': { bgcolor: '#1D4ED8' },
                    }}>
                    <PlayArrow sx={{ fontSize: 10, mr: '2px' }} /> Iniciar
                  </Button>
                )}
                {isProc && (
                  <>
                    <IconButton size="small"
                      onClick={() => onUpdateProgress(patient.id, Math.max(0, cur - 1))}
                      disabled={cur === 0}
                      sx={{
                        border: '1px solid #DFE1E6', color: '#97A0AF',
                        p: '3px', borderRadius: '4px',
                        '&:not(:disabled):hover': { color: '#344563', bgcolor: '#F4F5F7' },
                      }}>
                      <ArrowBack sx={{ fontSize: 10 }} />
                    </IconButton>
                    <Button size="small"
                      onClick={() => {
                        const next = cur + 1;
                        if (next >= steps.length) onUpdateStatus(patient.id, 'finalizado');
                        else onUpdateProgress(patient.id, next);
                      }}
                      sx={{
                        flex: 1, fontSize: '0.6rem', py: '2px', minHeight: 22,
                        color: col.count_color, bgcolor: col.count_bg,
                        border: `1px solid ${col.tag_bg}55`, borderRadius: '4px',
                        '&:hover': { filter: 'brightness(0.95)' },
                      }}>
                      {cur >= steps.length - 1 ? '✓ Finalizar' : 'Avançar →'}
                    </Button>
                  </>
                )}
                {patient.status === 'finalizado' && (
                  <Button size="small" onClick={() => onUpdateStatus(patient.id, 'agendado')}
                    sx={{
                      flex: 1, fontSize: '0.6rem', py: '2px', minHeight: 22,
                      color: '#344563', bgcolor: '#F4F5F7',
                      border: '1px solid #DFE1E6', borderRadius: '4px',
                      '&:hover': { bgcolor: '#EBECF0' },
                    }}>
                    <Refresh sx={{ fontSize: 10, mr: '2px' }} /> Reabrir
                  </Button>
                )}
                {(patient.status === 'agendado' || isProc) && (
                  <Tooltip title="Cancelar">
                    <IconButton size="small" onClick={() => onUpdateStatus(patient.id, 'cancelado')}
                      sx={{
                        color: '#EF4444', p: '3px', borderRadius: '4px',
                        border: '1px solid #FECACA',
                        '&:hover': { bgcolor: '#FEF2F2' },
                      }}>
                      <Cancel sx={{ fontSize: 10 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Draggable>
  );
};

/* ─────────────────────────────────────────
   Coluna — idêntica ao Jira
   Fundo cinza claro, header com título + count
───────────────────────────────────────── */
const KanbanColumn = ({ col, patients, onUpdateStatus, onUpdateProgress, userCargo }) => (
  <Box sx={{
    width: { xs: '80vw', sm: 230, md: 210, lg: 220 },
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    bgcolor: '#F4F5F7',
    borderRadius: '6px',
    overflow: 'hidden',
  }}>
    {/* Header da coluna */}
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      px: 1.5, py: 1.2,
    }}>
      <Typography sx={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#344563',
        letterSpacing: '0.04em',
        flex: 1,
        textTransform: 'uppercase',
      }}>
        {col.label}
      </Typography>
      <Box sx={{
        minWidth: 20, height: 20,
        borderRadius: '50%',
        bgcolor: col.count_bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        px: 0.6,
      }}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: col.count_color }}>
          {patients.length}
        </Typography>
      </Box>
    </Box>

    {/* Drop zone */}
    <Droppable droppableId={col.key}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            flex: 1,
            minHeight: 80,
            px: 1, pb: 1,
            bgcolor: snapshot.isDraggingOver ? '#E8ECF0' : '#F4F5F7',
            borderRadius: '0 0 6px 6px',
            transition: 'background 0.1s',
          }}
        >
          {patients.length === 0 && !snapshot.isDraggingOver && (
            <Box sx={{
              textAlign: 'center', py: 3,
              border: '2px dashed #DFE1E6',
              borderRadius: '6px',
              bgcolor: '#fff',
            }}>
              <Typography sx={{ color: '#B3BAC5', fontSize: '0.7rem' }}>
                Sem itens
              </Typography>
            </Box>
          )}
          {patients.map((p, i) => (
            <PatientCard
              key={p.id} patient={p} index={i} col={col}
              onUpdateStatus={onUpdateStatus}
              onUpdateProgress={onUpdateProgress}
              userCargo={userCargo}
            />
          ))}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  </Box>
);

/* ─────────────────────────────────────────
   Board principal — estilo Jira Board
───────────────────────────────────────── */
const PatientKanban = () => {
  const {
    patients, updatePatientStatus, updatePatientProgress,
    getPatientsByStatus, loading,
  } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const byStatus = getPatientsByStatus();

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    const newStatus = STATUS_FROM_COL[destination.droppableId];
    if (newStatus) updatePatientStatus(Number(draggableId), newStatus);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#F4F5F7' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>

      {/* ── Topo estilo Jira Board ── */}
      <Box sx={{
        px: 2, py: 1.5,
        borderBottom: '1px solid #DFE1E6',
        flexShrink: 0,
        bgcolor: '#fff',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{
            fontSize: '1.1rem', fontWeight: 700,
            color: '#172B4D', letterSpacing: '-0.01em',
          }}>
            Board
          </Typography>
          {/* Avatares dos dentistas (decorativo) */}
          <Box sx={{ display: 'flex', ml: 1 }}>
            {['A', 'B', 'C'].map((l, i) => (
              <Avatar key={l} sx={{
                width: 26, height: 26, fontSize: '0.7rem', fontWeight: 700,
                bgcolor: ['#3B82F6', '#EF4444', '#10B981'][i],
                ml: i > 0 ? '-6px' : 0,
                border: '2px solid #fff',
              }}>{l}</Avatar>
            ))}
          </Box>

          {/* Resumo rápido */}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            {COLUMNS.map(c => (
              <Box key={c.key} sx={{
                display: 'flex', alignItems: 'center', gap: 0.4,
                bgcolor: c.count_bg, px: 0.8, py: 0.2,
                borderRadius: '10px',
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.tag_bg }} />
                <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: c.count_color }}>
                  {(byStatus[c.key] || []).length}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Kanban board com scroll horizontal ── */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          px: 2, py: 2,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          bgcolor: '#fff',
          '&::-webkit-scrollbar': { height: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: '#F4F5F7', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: '#C1C7D0', borderRadius: 3,
            '&:hover': { bgcolor: '#97A0AF' },
          },
        }}>
          {COLUMNS.map(col => (
            <Box key={col.key} sx={{
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto', maxHeight: '100%',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#DFE1E6', borderRadius: 2 },
            }}>
              <KanbanColumn
                col={col}
                patients={byStatus[col.key] || []}
                onUpdateStatus={updatePatientStatus}
                onUpdateProgress={updatePatientProgress}
                userCargo={user?.cargo}
              />
            </Box>
          ))}
        </Box>
      </DragDropContext>
    </Box>
  );
};

export default PatientKanban;