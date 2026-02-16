import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
  Chip, Avatar, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, Alert, Snackbar
} from '@mui/material';
import { LocalizationProvider, DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import parseISO from 'date-fns/parseISO';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';

const AppointmentManagement = () => {
  const { patients, addPatient, updatePatientStatus, getPatientsByStatus } = useContext(PatientsContext);
  const { user, hasPermission } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [budget, setBudget] = useState({
    procedureType: 'Consulta Odontológica',
    estimatedPrice: 150,
    notes: ''
  });

  const procedurePrices = {
    "Consulta Odontológica": 150,
    "Limpeza Dental": 200,
    "Clareamento": 800,
    "Extração": 350,
    "Canal": 1200,
    "Microcirurgia": 2500,
    "Aplicação de Botox": 600,
    "Preenchimento": 1200,
    "Outros": 300
  };

  useEffect(() => {
    const filtered = patients.filter(p => 
      p.status === 'agendado' &&
      isSameDay(parseISO(p.scheduleDate), selectedDate)
    ).sort((a, b) => new Date(a.scheduleDate) - new Date(b.scheduleDate));
    setAppointments(filtered);
  }, [patients, selectedDate]);

  const handleContactPatient = (patient, method) => {
    if (method === 'phone') {
      window.location.href = `tel:${patient.phone}`;
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`, '_blank');
    } else if (method === 'email' && patient.email) {
      window.location.href = `mailto:${patient.email}`;
    }
    setSnackbar({
      open: true,
      message: `Contato iniciado com ${patient.name}`,
      severity: 'info'
    });
  };

  const handleConfirmAppointment = (patient) => {
    setSnackbar({
      open: true,
      message: `Consulta confirmada para ${patient.name}`,
      severity: 'success'
    });
  };

  const handleCancelAppointment = () => {
    updatePatientStatus(selectedPatient.id, 'cancelado', cancelReason);
    setOpenCancelDialog(false);
    setCancelReason('');
    setSnackbar({
      open: true,
      message: `Agendamento cancelado: ${cancelReason || 'Sem motivo informado'}`,
      severity: 'warning'
    });
  };

  const handleCreateBudget = () => {
    // Salvar orçamento (implementar no backend)
    setSnackbar({
      open: true,
      message: `Orçamento criado para ${selectedPatient?.name}`,
      severity: 'success'
    });
    setOpenBudgetDialog(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Gestão de Agendamentos
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
          {appointments.length > 0 ? (
            appointments.map(appointment => (
              <Grid item xs={12} key={appointment.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                          {appointment.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{appointment.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.phone}
                          </Typography>
                          {appointment.email && (
                            <Typography variant="body2" color="text.secondary">
                              {appointment.email}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              label={appointment.procedureType}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={`Dentista: ${appointment.dentist}`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        <Chip
                          label={format(parseISO(appointment.scheduleDate), 'HH:mm')}
                          icon={<EventIcon />}
                          color="secondary"
                        />
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ligar">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleContactPatient(appointment, 'phone')}
                            >
                              <PhoneIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="WhatsApp">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleContactPatient(appointment, 'whatsapp')}
                            >
                              <img src="/whatsapp-icon.svg" alt="WhatsApp" width={20} height={20} />
                            </IconButton>
                          </Tooltip>
                          {appointment.email && (
                            <Tooltip title="Email">
                              <IconButton 
                                size="small" 
                                color="info"
                                onClick={() => handleContactPatient(appointment, 'email')}
                              >
                                <EmailIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Confirmar">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleConfirmAppointment(appointment)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Criar Orçamento">
                            <IconButton 
                              size="small" 
                              color="info"
                              onClick={() => {
                                setSelectedPatient(appointment);
                                setBudget({
                                  procedureType: appointment.procedureType,
                                  estimatedPrice: procedurePrices[appointment.procedureType],
                                  notes: ''
                                });
                                setOpenBudgetDialog(true);
                              }}
                            >
                              <ReceiptIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => {
                                setSelectedPatient(appointment);
                                setOpenCancelDialog(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>

                    {appointment.observations && (
                      <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption">
                          <strong>Observações:</strong> {appointment.observations}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhum agendamento para esta data
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        {/* Diálogo de Cancelamento */}
        <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
          <DialogTitle>Cancelar Agendamento</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Paciente:</strong> {selectedPatient.name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Procedimento:</strong> {selectedPatient.procedureType}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Motivo do Cancelamento"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCancelDialog(false)}>Voltar</Button>
            <Button onClick={handleCancelAppointment} color="error" variant="contained">
              Confirmar Cancelamento
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Orçamento */}
        <Dialog open={openBudgetDialog} onClose={() => setOpenBudgetDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Criar Orçamento</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Paciente:</strong> {selectedPatient.name}
                </Typography>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Procedimento</InputLabel>
                  <Select
                    value={budget.procedureType}
                    label="Procedimento"
                    onChange={(e) => setBudget({
                      ...budget,
                      procedureType: e.target.value,
                      estimatedPrice: procedurePrices[e.target.value]
                    })}
                  >
                    {Object.keys(procedurePrices).map(proc => (
                      <MenuItem key={proc} value={proc}>{proc}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Valor Estimado"
                  type="number"
                  value={budget.estimatedPrice}
                  onChange={(e) => setBudget({ ...budget, estimatedPrice: e.target.value })}
                  sx={{ mt: 2 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observações"
                  value={budget.notes}
                  onChange={(e) => setBudget({ ...budget, notes: e.target.value })}
                  sx={{ mt: 2 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBudgetDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateBudget} variant="contained">
              Criar Orçamento
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentManagement;