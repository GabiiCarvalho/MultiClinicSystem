import { useContext } from "react";
import { Box, Typography, Paper, Chip } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";

const columns = [
  { id: "aguardando", title: "Aguardando" },
  { id: "em_procedimento", title: "Em Procedimento" },
  { id: "finalizado", title: "Finalizado" },
  { id: "cancelado", title: "Cancelado" }
];

const PatientKanban = () => {
  const { patients, updatePatientStatus } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);

  const filteredPatients =
    user.cargo === "dentista"
      ? patients.filter((p) => p.dentist === user.nome)
      : patients;

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    updatePatientStatus(Number(draggableId), destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Typography variant="h5" sx={{ color: "white", mb: 3 }}>
        Fluxo de Pacientes
      </Typography>

      <Box sx={{ display: "flex", gap: 2, overflowX: "auto" }}>
        {columns.map((column) => (
          <Droppable droppableId={column.id} key={column.id}>
            {(provided) => (
              <Paper
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minWidth: 260,
                  p: 2,
                  bgcolor: "#1e293b",
                  color: "white"
                }}
              >
                <Typography fontWeight={600} mb={2}>
                  {column.title}
                </Typography>

                {filteredPatients
                  .filter((p) => p.status === column.id)
                  .map((patient, index) => (
                    <Draggable
                      key={patient.id}
                      draggableId={patient.id.toString()}
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
                            bgcolor: "#334155",
                            color: "white",
                            cursor: "pointer"
                          }}
                        >
                          <Typography fontWeight={600}>
                            {patient.name}
                          </Typography>

                          <Typography variant="caption">
                            {patient.procedureType}
                          </Typography>

                          <Chip
                            label={patient.dentist}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </Paper>
                      )}
                    </Draggable>
                  ))}

                {provided.placeholder}
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default PatientKanban;