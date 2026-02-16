import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Chip, Avatar, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import parseISO from 'date-fns/parseISO';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const DentistSchedulePanel = () => {
  const { patients, updatePatientProgress, updatePatientStatus } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [myPatients, setMyPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [newProgress, setNewProgress] = useState(0);

  useEffect(() => {
    // Filtrar pacientes do dentista logado
    const filtered = patients.filter(p => 
      p.dentist === user.nome && 
      p.status !== 'cancelado' &&
      isSameDay(parseISO(p.scheduleDate), selectedDate)
    );
    setMyPatients(filtered.sort((a, b) => 
      new Date(a.scheduleDate) - new Date(b.scheduleDate)
    ));
  }, [patients, user, selectedDate]);

  const handleUpdateProgress = () => {
    updatePatientProgress(selectedPatient.id, newProgress);
    if (newProgress === 3) { // Último passo
      updatePatientStatus(selectedPatient.id, 'finalizado');
    }
    setOpenProgressDialog(false);
  };

  const getSteps = (patient) => {
    if (patient.procedureType.includes('Cirurgia')) {
      return ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'];
    }
    if (patient.procedureType.includes('Consulta')) {
      return ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'];
    }
    return ['Preparação', 'Procedimento', 'Finalização'];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Minha Agenda - {user.nome}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <DatePicker
            label="Selecionar Data"
            value={selectedDate}
            onChange={setSelectedDate}
            format="dd/MM/yyyy"
          />
          <Typography variant="h6">
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {myPatients.length > 0 ? (
            myPatients.map(patient => {
              const steps = getSteps(patient);
              const currentStep = patient.procedureProgress || 0;
              const isCompleted = patient.status === 'finalizado';
              const isInProgress = patient.status === 'em_procedimento';

              return (
                <Grid item xs={12} md={6} key={patient.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar>{patient.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="h6">{patient.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {patient.procedureType}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={format(parseISO(patient.scheduleDate), 'HH:mm')}
                          icon={<AccessTimeIcon />}
                          size="small"
                          color="primary"
                        />
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Procedimento:</strong> {patient.procedureType}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Telefone:</strong> {patient.phone}
                      </Typography>

                      {patient.observations && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption">
                            <strong>Observações:</strong> {patient.observations}
                          </Typography>
                        </Box>
                      )}

                      {isInProgress && (
                        <Box sx={{ mt: 3 }}>
                          <Stepper activeStep={currentStep} alternativeLabel>
                            {steps.map((label) => (
                              <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        </Box>
                      )}

                      {isCompleted && (
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon color="success" />
                          <Typography color="success.main">Procedimento Concluído</Typography>
                        </Box>
                      )}

                      {patient.status === 'aguardando' && (
                        <Box sx={{ mt: 2 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => {
                              setSelectedPatient(patient);
                              updatePatientStatus(patient.id, 'em_procedimento');
                            }}
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
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum paciente agendado para esta data
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        <Dialog open={openProgressDialog} onClose={() => setOpenProgressDialog(false)}>
          <DialogTitle>Atualizar Progresso do Procedimento</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Paciente:</strong> {selectedPatient.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Procedimento:</strong> {selectedPatient.procedureType}
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Etapa Atual</InputLabel>
                  <Select
                    value={newProgress}
                    label="Etapa Atual"
                    onChange={(e) => setNewProgress(e.target.value)}
                  >
                    {getSteps(selectedPatient).map((step, index) => (
                      <MenuItem key={step} value={index}>
                        {step}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenProgressDialog(false)}>Cancelar</Button>
            <Button onClick={handleUpdateProgress} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DentistSchedulePanel;