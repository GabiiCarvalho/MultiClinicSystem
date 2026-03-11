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

const getSteps = (procedureType = '') => {
  const t = procedureType.toLowerCase();
  if (t.includes('cirurgia') || t.includes('microcirurgia')) {
    return ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'];
  }
  if (t.includes('consulta')) {
    return ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'];
  }
  return ['Preparação', 'Procedimento', 'Finalização'];
};

const DentistSchedulePanel = () => {
  const { patients, updatePatientStatus, updatePatientProgress } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const [selectedDate,        setSelectedDate]        = useState(new Date());
  const [myPatients,          setMyPatients]          = useState([]);
  const [apiAppointments,     setApiAppointments]     = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedPatient,     setSelectedPatient]     = useState(null);
  const [openProgressDialog,  setOpenProgressDialog]  = useState(false);
  const [newProgress,         setNewProgress]         = useState(0);
  const [error,               setError]               = useState('');

  // Busca agendamentos do dia na API filtrados pelo profissional logado
  useEffect(() => {
    if (!user?.id) return;
    const fetchMyAppointments = async () => {
      setLoadingAppointments(true);
      setError('');
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // O backend já filtra por profissional_id quando o cargo é dentista/esteticista
        const res = await api.get(`/agendamentos?data=${dateStr}`);
        setApiAppointments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Erro ao buscar agenda:', err);
        setError('Não foi possível carregar sua agenda.');
        setApiAppointments([]);
      } finally {
        setLoadingAppointments(false);
      }
    };
    fetchMyAppointments();
  }, [selectedDate, user?.id]);

  // Mescla agendamentos da API com pacientes locais do contexto
  // Prioridade: API (dados reais) > contexto local (mock/pending)
  useEffect(() => {
    if (apiAppointments.length > 0) {
      // Usa dados da API — já filtrados pelo JWT (profissional_id = user.id)
      const sorted = [...apiAppointments].sort((a, b) => {
        const da = parseDate(a.data_hora);
        const db = parseDate(b.data_hora);
        if (!da || !db) return 0;
        return da - db;
      });
      setMyPatients(sorted);
    } else {
      // Fallback: filtra contexto local pelo profissional_id OU nome do dentista
      const filtered = patients.filter(p => {
        // Verifica por ID (dado vindo da API)
        if (p.profissional_id && user?.id) {
          if (String(p.profissional_id) !== String(user.id)) return false;
        } else {
          // Fallback por nome (dado mock/local)
          const dentistaNome = p.dentist || p.dentista || '';
          if (dentistaNome && user?.nome && dentistaNome !== user.nome) return false;
        }
        // Filtra por data selecionada
        if (p.status === 'cancelado') return false;
        const d = parseDate(p.data_hora);
        return d ? isSameDay(d, selectedDate) : false;
      });
      const sorted = [...filtered].sort((a, b) => {
        const da = parseDate(a.data_hora);
        const db = parseDate(b.data_hora);
        if (!da || !db) return 0;
        return da - db;
      });
      setMyPatients(sorted);
    }
  }, [apiAppointments, patients, user, selectedDate]);

  const handleUpdateProgress = async () => {
    if (!selectedPatient) return;
    const steps = getSteps(selectedPatient.procedimento || selectedPatient.procedureType);
    updatePatientProgress(selectedPatient.id, newProgress);
    if (newProgress >= steps.length - 1) {
      await updatePatientStatus(selectedPatient.id, 'finalizado');
    }
    setOpenProgressDialog(false);
  };

  const handleIniciar = async (patient) => {
    setSelectedPatient(patient);
    await updatePatientStatus(patient.id, 'em_procedimento');
  };

  // Extrai campos independente de vir da API ou do contexto local
  const getNome      = (p) => p.paciente?.nome || p.nome || p.name || '?';
  const getProcedure = (p) => p.procedimento?.nome || p.procedimento || p.procedureType || '—';
  const getTelefone  = (p) => p.paciente?.telefone || p.telefone || p.phone || '';
  const getObs       = (p) => p.observacoes || p.observations || '';

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
        {loadingAppointments && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Grid de pacientes */}
        {!loadingAppointments && (
          <Grid container spacing={3}>
            {myPatients.length > 0 ? (
              myPatients.map(patient => {
                const steps       = getSteps(getProcedure(patient));
                const currentStep = patient.procedureProgress || 0;
                const isCompleted = patient.status === 'finalizado';
                const isInProgress = patient.status === 'em_procedimento';
                const apptDate    = parseDate(patient.data_hora);
                const nome        = getNome(patient);

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
                                {getProcedure(patient)}
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
                          <strong>Procedimento:</strong> {getProcedure(patient)}
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
                  <strong>Procedimento:</strong> {getProcedure(selectedPatient)}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Etapa Atual</InputLabel>
                  <Select
                    value={newProgress}
                    label="Etapa Atual"
                    onChange={(e) => setNewProgress(e.target.value)}
                  >
                    {getSteps(getProcedure(selectedPatient)).map((step, index) => (
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