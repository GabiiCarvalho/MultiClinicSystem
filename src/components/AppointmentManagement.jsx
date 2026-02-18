import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Stack,
  Divider,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, isSameDay, parseISO } from 'date-fns';
import { styled } from '@mui/material/styles';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TodayIcon from '@mui/icons-material/Today';

// Função segura para formatar data sem usar date-fns
const formatTime = (dateValue) => {
  if (!dateValue) return '--:--';
  
  try {
    let date;
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return '--:--';
    }
    
    if (isNaN(date.getTime())) return '--:--';
    
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '--:--';
  }
};

const StyledCard = styled(Card)({
  transition: 'all 0.3s ease',
  borderRadius: 16,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 48px rgba(167,199,231,0.2)',
  },
});

const PatientAvatar = styled(Avatar)({
  width: 56,
  height: 56,
  background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
  color: '#4A5568',
  fontWeight: 600,
  fontSize: '1.5rem',
});

const TimeChip = styled(Chip)({
  backgroundColor: '#F0F4F8',
  borderRadius: 20,
  fontWeight: 500,
  '& .MuiChip-icon': {
    color: '#A7C7E7',
  },
});

const AppointmentManagement = () => {
  const { patients, updatePatientStatus, loading } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (patients && patients.length > 0) {
      try {
        const filtered = patients.filter(p => {
          if (!p || p.status !== 'agendado') return false;
          if (!p.scheduleDate) return false;
          
          try {
            const scheduleDate = typeof p.scheduleDate === 'string' 
              ? new Date(p.scheduleDate) 
              : p.scheduleDate;
            
            if (!(scheduleDate instanceof Date) || isNaN(scheduleDate.getTime())) return false;
            
            return isSameDay(scheduleDate, selectedDate);
          } catch (e) {
            return false;
          }
        }).sort((a, b) => {
          try {
            const dateA = a.scheduleDate ? new Date(a.scheduleDate) : new Date();
            const dateB = b.scheduleDate ? new Date(b.scheduleDate) : new Date();
            return dateA - dateB;
          } catch (e) {
            return 0;
          }
        });
        
        setAppointments(filtered);
      } catch (error) {
        console.error('Erro ao filtrar agendamentos:', error);
        setAppointments([]);
      }
    } else {
      setAppointments([]);
    }
  }, [patients, selectedDate]);

  const handleContact = (patient, method) => {
    if (!patient) return;
    
    const actions = {
      phone: () => patient.phone && (window.location.href = `tel:${patient.phone}`),
      whatsapp: () => patient.phone && window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`, '_blank'),
      email: () => patient.email && (window.location.href = `mailto:${patient.email}`),
    };
    
    try {
      actions[method]?.();
      setSnackbar({
        open: true,
        message: `Contato iniciado com ${patient.name || 'paciente'}`,
        severity: 'info',
      });
    } catch (error) {
      console.error('Erro ao contatar:', error);
    }
  };

  const handleConfirm = (patient) => {
    if (!patient) return;
    setSnackbar({
      open: true,
      message: `Consulta confirmada para ${patient.name || 'paciente'}`,
      severity: 'success',
    });
  };

  const handleCancel = () => {
    if (selectedPatient) {
      try {
        updatePatientStatus(selectedPatient.id, 'cancelado', cancelReason);
        setOpenCancelDialog(false);
        setCancelReason('');
        setSnackbar({
          open: true,
          message: `Agendamento cancelado para ${selectedPatient.name}`,
          severity: 'warning',
        });
      } catch (error) {
        console.error('Erro ao cancelar:', error);
      }
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const filteredAppointments = appointments.filter(app => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(term)) ||
      (app.phone && app.phone.includes(term)) ||
      (app.email && app.email.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: '#A7C7E7' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            📋 Gestão de Agendamentos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie os agendamentos do dia, confirme horários e entre em contato com os pacientes
          </Typography>
        </Box>

        <Box sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: 'white', 
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          border: '1px solid #F0F0F0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigateDate(-1)}
                startIcon={<ArrowBackIcon />}
                sx={{ borderRadius: 30 }}
              >
                Anterior
              </Button>
              <Button
                variant="contained"
                onClick={goToToday}
                startIcon={<TodayIcon />}
                sx={{ borderRadius: 30 }}
              >
                Hoje
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigateDate(1)}
                endIcon={<ArrowForwardIcon />}
                sx={{ borderRadius: 30 }}
              >
                Próximo
              </Button>
            </Box>

            <DatePicker
              label="Selecionar Data"
              value={selectedDate}
              onChange={setSelectedDate}
              format="dd/MM/yyyy"
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 200 }
                }
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ color: '#A7C7E7' }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Buscar paciente por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#A7C7E7' }} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        <Grid container spacing={3}>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map(appointment => (
              <Grid item xs={12} key={appointment.id}>
                <StyledCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between', 
                      alignItems: { xs: 'stretch', sm: 'flex-start' },
                      gap: 2
                    }}>
                      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <PatientAvatar>
                          {appointment.name ? appointment.name.charAt(0).toUpperCase() : '?'}
                        </PatientAvatar>
                        
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {appointment.name || 'Nome não informado'}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={appointment.procedureType || 'Procedimento'}
                              size="small"
                              sx={{
                                backgroundColor: '#F0F4F8',
                                color: '#4A5568',
                              }}
                            />
                            <Chip
                              label={appointment.dentist || 'Dentista'}
                              size="small"
                              sx={{
                                backgroundColor: '#F9D7D7',
                                color: '#A65D5D',
                              }}
                            />
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                            {appointment.phone && (
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 16, color: '#A7C7E7' }} />
                                {appointment.phone}
                              </Typography>
                            )}
                            {appointment.email && (
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 16, color: '#F9D7D7' }} />
                                {appointment.email}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Box>

                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'row', sm: 'column' },
                        alignItems: { xs: 'center', sm: 'flex-end' },
                        justifyContent: 'space-between',
                        gap: 2
                      }}>
                        <TimeChip
                          label={formatTime(appointment.scheduleDate)}
                          icon={<EventIcon />}
                        />
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {appointment.phone && (
                            <Tooltip title="Ligar">
                              <IconButton 
                                size="small"
                                onClick={() => handleContact(appointment, 'phone')}
                                sx={{ 
                                  bgcolor: '#F0F4F8',
                                  '&:hover': { bgcolor: '#E0E8F0' }
                                }}
                              >
                                <PhoneIcon sx={{ fontSize: 20, color: '#4A5568' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {appointment.phone && (
                            <Tooltip title="WhatsApp">
                              <IconButton 
                                size="small"
                                onClick={() => handleContact(appointment, 'whatsapp')}
                                sx={{ 
                                  bgcolor: '#F0F4F8',
                                  '&:hover': { bgcolor: '#E0E8F0' }
                                }}
                              >
                                <WhatsAppIcon sx={{ fontSize: 20, color: '#25D366' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {appointment.email && (
                            <Tooltip title="Email">
                              <IconButton 
                                size="small"
                                onClick={() => handleContact(appointment, 'email')}
                                sx={{ 
                                  bgcolor: '#F0F4F8',
                                  '&:hover': { bgcolor: '#E0E8F0' }
                                }}
                              >
                                <EmailIcon sx={{ fontSize: 20, color: '#4A5568' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="Confirmar">
                            <IconButton 
                              size="small"
                              onClick={() => handleConfirm(appointment)}
                              sx={{ 
                                bgcolor: '#C5E0C5',
                                '&:hover': { bgcolor: '#B0D0B0' }
                              }}
                            >
                              <CheckCircleIcon sx={{ fontSize: 20, color: '#4F7A4F' }} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Criar Orçamento">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedPatient(appointment);
                                setOpenBudgetDialog(true);
                              }}
                              sx={{ 
                                bgcolor: '#D4E6F1',
                                '&:hover': { bgcolor: '#C0D6E0' }
                              }}
                            >
                              <ReceiptIcon sx={{ fontSize: 20, color: '#4A7B8C' }} />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Cancelar">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setSelectedPatient(appointment);
                                setOpenCancelDialog(true);
                              }}
                              sx={{ 
                                bgcolor: '#FFC9C9',
                                '&:hover': { bgcolor: '#F0B0B0' }
                              }}
                            >
                              <CancelIcon sx={{ fontSize: 20, color: '#A65D5D' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>

                    {appointment.observations && (
                      <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: '#F9FAFB', 
                        borderRadius: 2,
                        border: '1px solid #F0F0F0'
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Observações:
                        </Typography>
                        <Typography variant="body2">
                          {appointment.observations}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </StyledCard>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 6, 
                textAlign: 'center', 
                bgcolor: 'white', 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                border: '1px solid #F0F0F0'
              }}>
                <EventIcon sx={{ fontSize: 60, color: '#D0DCE8', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: '#718096' }}>
                  Nenhum agendamento para esta data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Selecione outra data ou crie um novo agendamento
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Diálogo de Cancelamento */}
        <Dialog 
          open={openCancelDialog} 
          onClose={() => setOpenCancelDialog(false)}
          PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cancelar Agendamento
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Paciente:</strong> {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Procedimento:</strong> {selectedPatient.procedureType}
                  </Typography>
                  {selectedPatient.scheduleDate && (
                    <Typography variant="body2">
                      <strong>Horário:</strong> {formatTime(selectedPatient.scheduleDate)}
                    </Typography>
                  )}
                </Box>
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Motivo do Cancelamento"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Digite o motivo do cancelamento..."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={() => setOpenCancelDialog(false)}
              sx={{ borderRadius: 30 }}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="contained"
              sx={{ 
                borderRadius: 30,
                bgcolor: '#FFC9C9',
                color: '#A65D5D',
                '&:hover': {
                  bgcolor: '#F0B0B0',
                }
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Orçamento */}
        <Dialog 
          open={openBudgetDialog} 
          onClose={() => setOpenBudgetDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Criar Orçamento
            </Typography>
          </DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Paciente:</strong> {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Telefone:</strong> {selectedPatient.phone}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Procedimento"
                      value={selectedPatient.procedureType || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Valor Estimado"
                      type="number"
                      defaultValue="150"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1, color: '#718096' }}>R$</Typography>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Observações"
                      placeholder="Descreva os detalhes do orçamento..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button 
              onClick={() => setOpenBudgetDialog(false)}
              sx={{ borderRadius: 30 }}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained"
              sx={{ 
                borderRadius: 30,
                bgcolor: '#A7C7E7',
                '&:hover': { bgcolor: '#8FB0D0' }
              }}
              onClick={() => {
                setSnackbar({
                  open: true,
                  message: `Orçamento criado para ${selectedPatient?.name}`,
                  severity: 'success'
                });
                setOpenBudgetDialog(false);
              }}
            >
              Criar Orçamento
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ 
              borderRadius: 30,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentManagement;