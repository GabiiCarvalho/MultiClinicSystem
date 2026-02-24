import { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  CircularProgress,
  Grid
} from "@mui/material";

import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import EventIcon from "@mui/icons-material/Event";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckIcon from "@mui/icons-material/Check";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { AppointmentsContext } from "../contexts/AppointmentsContext";

const statusColor = {
  agendado: "#1976d2",
  confirmado: "#0288d1",
  em_atendimento: "#f57c00",
  finalizado: "#2e7d32",
  cancelado: "#d32f2f"
};

const CalendarSaaS = () => {
  const {
    appointments,
    loading,
    fetchAppointmentsByDate,
    updateAppointmentStatus,
    updateAppointmentDate
  } = useContext(AppointmentsContext);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchAppointmentsByDate(selectedDate);
  }, [selectedDate]);

  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => isSameDay(parseISO(a.data), selectedDate))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [appointments, selectedDate]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const appointmentId = result.draggableId;
    const appointment = appointments.find(
      (a) => a.id.toString() === appointmentId
    );

    if (!appointment) return;

    const newIndex = result.destination.index;
    const newTime = new Date(selectedDate);
    newTime.setHours(8 + newIndex);
    newTime.setMinutes(0);

    updateAppointmentDate(appointment.id, newTime);
  };

  const changeStatus = (status) => {
    updateAppointmentStatus(selectedAppointment.id, status);
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ p: 3 }}>

          <Typography variant="h4" fontWeight={600} mb={3}>
            Agenda da Clínica
          </Typography>

          <ButtonGroup sx={{ mb: 3 }}>
            <Button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}>
              Anterior
            </Button>
            <Button onClick={() => setSelectedDate(new Date())}>
              Hoje
            </Button>
            <Button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}>
              Próximo
            </Button>
          </ButtonGroup>

          <Typography variant="h6" mb={2}>
            {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
          </Typography>

          <Droppable droppableId="day-view">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {dayAppointments.length === 0 && (
                  <Paper sx={{ p: 3 }}>
                    Nenhum agendamento para este dia.
                  </Paper>
                )}

                {dayAppointments.map((appointment, index) => (
                  <Draggable
                    key={appointment.id.toString()}
                    draggableId={appointment.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <Paper
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{
                          p: 2,
                          mb: 2,
                          borderLeft: `4px solid ${statusColor[appointment.status]}`,
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setOpenDialog(true);
                        }}
                      >
                        <Grid container justifyContent="space-between">
                          <Grid item>
                            <Typography fontWeight={600}>
                              {appointment.paciente.nome}
                            </Typography>
                            <Typography variant="body2">
                              {appointment.procedimento.nome}
                            </Typography>
                            <Typography variant="caption">
                              Dentista: {appointment.dentista.nome}
                            </Typography>
                          </Grid>

                          <Grid item>
                            <Chip
                              label={appointment.status}
                              sx={{
                                backgroundColor:
                                  statusColor[appointment.status],
                                color: "#fff"
                              }}
                            />
                            <Typography variant="body2" mt={1}>
                              {format(parseISO(appointment.data), "HH:mm")}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* DIALOG DETALHES */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogContent>
              {selectedAppointment && (
                <>
                  <Typography fontWeight={600}>
                    {selectedAppointment.paciente.nome}
                  </Typography>
                  <Typography>
                    {selectedAppointment.procedimento.nome}
                  </Typography>
                  <Typography>
                    Dentista: {selectedAppointment.dentista.nome}
                  </Typography>
                  <Typography>
                    Horário:{" "}
                    {format(
                      parseISO(selectedAppointment.data),
                      "dd/MM/yyyy HH:mm"
                    )}
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Fechar</Button>

              {selectedAppointment?.status === "agendado" && (
                <Button
                  startIcon={<PlayArrowIcon />}
                  variant="contained"
                  onClick={() => changeStatus("em_atendimento")}
                >
                  Iniciar
                </Button>
              )}

              {selectedAppointment?.status === "em_atendimento" && (
                <Button
                  startIcon={<CheckIcon />}
                  color="success"
                  variant="contained"
                  onClick={() => changeStatus("finalizado")}
                >
                  Finalizar
                </Button>
              )}
            </DialogActions>
          </Dialog>

        </Box>
      </DragDropContext>
    </LocalizationProvider>
  );
};

export default CalendarSaaS;