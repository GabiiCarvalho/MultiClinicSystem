import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Chip, Avatar, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel, CircularProgress, Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Parse seguro de datas ISO ou Date
const parseDate = (str) => {
  if (!str) return null;
  try {
    const d = str instanceof Date ? str : parseISO(String(str));
    return isValid(d) ? d : null;
  } catch { return null; }
};

// Função getSteps com verificação segura
const getSteps = (procedureType = '') => {
  const proc = procedureType ? String(procedureType).toLowerCase() : '';
  if (proc.includes('cirurgia') || proc.includes('microcirurgia')) {
    return ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'];
  }
  if (proc.includes('consulta')) {
    return ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'];
  }
  return ['Preparação', 'Procedimento', 'Finalização'];
};

const DentistSchedulePanel = () => {
  const { patients, updatePatientStatus, updatePatientProgress, fetchPatients } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [newProgress, setNewProgress] = useState(0);
  const [error, setError] = useState('');

  // ✅ CORRIGIDO: Buscar pacientes do dentista logado
  useEffect(() => {
    const loadPatients = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Buscar agendamentos do dia filtrados por profissional_id
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const response = await api.get(`/agendamentos?data=${dateStr}&profissional_id=${user.id}`);
        
        const appointments = Array.isArray(response.data) ? response.data : [];
        
        // Se não veio do backend com JOIN, normalizar
        const normalized = appointments.map(appt => ({
          id: appt.id,
          paciente: appt.paciente || { nome: appt.paciente_nome },
          nome: appt.paciente?.nome || appt.paciente_nome,
          procedimento: appt.procedimento?.nome || appt.procedimento_nome,
          procedureType: appt.procedimento?.nome || appt.procedimento_nome,
          data_hora: appt.data_hora,
          status: appt.status,
          procedureProgress: appt.progresso || 0,
          observacoes: appt.observacoes,
          telefone: appt.paciente?.telefone,
        }));
        
        setMyPatients(normalized);
      } catch (err) {
        console.error('Erro ao buscar agenda:', err);
        setError('Erro ao carregar agenda. Tente novamente.');
        
        // Fallback: usar dados do contexto como backup
        const filtered = patients.filter(p => {
          // Verificar se é do dentista logado
          const isMyPatient = p.profissional_id ? 
            String(p.profissional_id) === String(user.id) :
            (p.dentist || p.dentista) === user.nome;
          
          if (!isMyPatient) return false;
          
          // Verificar se é da data selecionada
          const d = parseDate(p.data_hora);
          return d ? isSameDay(d, selectedDate) : false;
        });
        
        setMyPatients(filtered);
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, [selectedDate, user?.id, patients]);

  const handleUpdateProgress = async () => {
    if (!selectedPatient) return;
    const steps = getSteps(selectedPatient.procedimento || selectedPatient.procedureType);
    await updatePatientProgress(selectedPatient.id, newProgress);
    if (newProgress >= steps.length - 1) {
      await updatePatientStatus(selectedPatient.id, 'finalizado');
    }
    setOpenProgressDialog(false);
  };

  const handleIniciar = async (patient) => {
    setSelectedPatient(patient);
    await updatePatientStatus(patient.id, 'em_procedimento');
  };

  const getNome = (p) => p.paciente?.nome || p.nome || p.name || '?';
  const getProcedureName = (p) => {
    if (!p) return '—';
    if (p.procedimento?.nome) return p.procedimento.nome;
    if (p.procedureType?.nome) return p.procedureType.nome;
    if (typeof p.procedimento === 'string') return p.procedimento;
    if (typeof p.procedureType === 'string') return p.procedureType;
    return '—';
  };
  const getTelefone = (p) => p.paciente?.telefone || p.telefone || p.phone || '';
  const getObs = (p) => p.observacoes || p.observations || '';

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Minha Agenda
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {user?.nome} · {user?.especialidade || user?.cargo}
          </Typography>
        </Box>

        {/* Seletor de data */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <DatePicker
            label="Selecionar Data"
            value={selectedDate}
            onChange={(v) => v && setSelectedDate(v)}
            format="dd/MM/yyyy"
            slotProps={{ textField: { size: 'small' } }}
          />
          <Typography variant="h6" color="text.secondary">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Typography>
        </Box>

        {/* Erro */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Grid de pacientes */}
        {!loading && (
          <Grid container spacing={3}>
            {myPatients.length > 0 ? (
              myPatients.map(patient => {
                const nome = getNome(patient);
                const procedureName = getProcedureName(patient);
                const steps = getSteps(procedureName);
                const currentStep = patient.procedureProgress || 0;
                const isCompleted = patient.status === 'finalizado';
                const isInProgress = patient.status === 'em_procedimento';
                const apptDate = parseDate(patient.data_hora);

                return (
                  <Grid item xs={12} md={6} key={patient.id}>
                    <Card elevation={2}>
                      <CardContent>
                        {/* Cabeçalho do card */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                              {nome.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="h6">{nome}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {procedureName}
                              </Typography>
                            </Box>
                          </Box>
                          {apptDate && (
                            <Chip
                              label={format(apptDate, 'HH:mm')}
                              icon={<AccessTimeIcon />}
                              size="small"
                              color="primary"
                            />
                          )}
                        </Box>

                        {/* Detalhes */}
                        <Typography variant="body2" gutterBottom>
                          <strong>Procedimento:</strong> {procedureName}
                        </Typography>
                        {getTelefone(patient) && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Telefone:</strong> {getTelefone(patient)}
                          </Typography>
                        )}

                        {/* Observações */}
                        {getObs(patient) && (
                          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, borderLeft: '3px solid #3f51b5' }}>
                            <Typography variant="caption">
                              <strong>Observações:</strong> {getObs(patient)}
                            </Typography>
                          </Box>
                        )}

                        {/* Stepper em procedimento */}
                        {isInProgress && (
                          <Box sx={{ mt: 3 }}>
                            <Stepper activeStep={currentStep} alternativeLabel>
                              {steps.map(label => (
                                <Step key={label}>
                                  <StepLabel>{label}</StepLabel>
                                </Step>
                              ))}
                            </Stepper>
                          </Box>
                        )}

                        {/* Finalizado */}
                        {isCompleted && (
                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color="success" />
                            <Typography color="success.main">Procedimento Concluído</Typography>
                          </Box>
                        )}

                        {/* Ações */}
                        {patient.status === 'agendado' && (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<PlayArrowIcon />}
                              onClick={() => handleIniciar(patient)}
                            >
                              Iniciar Atendimento
                            </Button>
                          </Box>
                        )}

                        {isInProgress && (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setNewProgress(currentStep);
                                setOpenProgressDialog(true);
                              }}
                            >
                              Atualizar Progresso
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nenhum paciente agendado para esta data
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Dialog de progresso */}
        <Dialog open={openProgressDialog} onClose={() => setOpenProgressDialog(false)}>
          <DialogTitle>Atualizar Progresso do Procedimento</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Paciente:</strong> {getNome(selectedPatient)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Procedimento:</strong> {getProcedureName(selectedPatient)}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Etapa Atual</InputLabel>
                  <Select
                    value={newProgress}
                    label="Etapa Atual"
                    onChange={(e) => setNewProgress(e.target.value)}
                  >
                    {getSteps(getProcedureName(selectedPatient)).map((step, index) => (
                      <MenuItem key={step} value={index}>
                        {index + 1}. {step}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProgressDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdateProgress} variant="contained">Salvar</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default DentistSchedulePanel;