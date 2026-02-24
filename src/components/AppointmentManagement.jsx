import { useState, useContext, useEffect } from 'react';
import { AppointmentsContext } from '../contexts/AppointmentsContext';
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
  CircularProgress,
  InputAdornment
} from '@mui/material';

import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';

import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';

const AppointmentManagement = () => {
  const {
    appointments,
    loading,
    fetchAppointmentsByDate,
    updateAppointmentStatus
  } = useContext(AppointmentsContext);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAppointmentsByDate(selectedDate);
  }, [selectedDate]);

  const handleConfirm = async (appointment) => {
    await updateAppointmentStatus(appointment.id, 'confirmado');
    setSnackbar({
      open: true,
      message: `Consulta confirmada para ${appointment.paciente.nome}`,
      severity: 'success'
    });
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;

    await updateAppointmentStatus(
      selectedAppointment.id,
      'cancelado',
      cancelReason
    );

    setOpenCancelDialog(false);
    setCancelReason('');
    setSnackbar({
      open: true,
      message: 'Agendamento cancelado com sucesso',
      severity: 'warning'
    });
  };

  const handleContact = (appointment, method) => {
    const { telefone, email } = appointment.paciente;

    if (method === 'phone' && telefone)
      window.location.href = `tel:${telefone}`;

    if (method === 'whatsapp' && telefone)
      window.open(`https://wa.me/${telefone.replace(/\D/g, '')}`, '_blank');

    if (method === 'email' && email)
      window.location.href = `mailto:${email}`;
  };

  const filteredAppointments = appointments.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();

    return (
      a.paciente.nome.toLowerCase().includes(term) ||
      a.paciente.telefone?.includes(term) ||
      a.paciente.email?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>

        {/* HEADER */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600}>
            Gestão de Agendamentos
          </Typography>
        </Box>

        {/* DATA + BUSCA */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={4}>
          <DatePicker
            label="Selecionar Data"
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            format="dd/MM/yyyy"
          />

          <TextField
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Stack>

        {/* LISTA */}
        <Grid container spacing={3}>
          {filteredAppointments.length === 0 && (
            <Grid item xs={12}>
              <Typography>Nenhum agendamento encontrado.</Typography>
            </Grid>
          )}

          {filteredAppointments.map((appointment) => (
            <Grid item xs={12} key={appointment.id}>
              <Card sx={{ borderRadius: 4 }}>
                <CardContent>

                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    {/* INFO PACIENTE */}
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>
                        {appointment.paciente.nome.charAt(0)}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={600}>
                          {appointment.paciente.nome}
                        </Typography>

                        <Typography variant="body2">
                          {appointment.procedimento.nome}
                        </Typography>

                        <Typography variant="caption">
                          Dentista: {appointment.dentista.nome}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* HORÁRIO + AÇÕES */}
                    <Stack direction="row" spacing={1} alignItems="center">

                      <Chip
                        icon={<EventIcon />}
                        label={format(parseISO(appointment.data), "HH:mm")}
                      />

                      {appointment.payment_status === 'pago' && (
                        <Chip
                          label="Pago"
                          color="success"
                          size="small"
                        />
                      )}

                      <Tooltip title="Ligar">
                        <IconButton onClick={() => handleContact(appointment, 'phone')}>
                          <PhoneIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="WhatsApp">
                        <IconButton onClick={() => handleContact(appointment, 'whatsapp')}>
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Confirmar">
                        <IconButton
                          onClick={() => handleConfirm(appointment)}
                          color="success"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Cancelar">
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setOpenCancelDialog(true);
                          }}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>

                    </Stack>
                  </Stack>

                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CANCELAMENTO */}
        <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
          <DialogTitle>Cancelar Agendamento</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Motivo"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCancelDialog(false)}>Voltar</Button>
            <Button color="error" variant="contained" onClick={handleCancel}>
              Confirmar Cancelamento
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </LocalizationProvider>
  );
};

export default AppointmentManagement;