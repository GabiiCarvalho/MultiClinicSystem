import { Box, Typography, Grid, Paper, Chip, Avatar, LinearProgress } from "@mui/material";
import { PatientsContext } from "../contexts/PatientsContext";
import { useContext } from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Home = () => {
  const { patients } = useContext(PatientsContext);

  // Agrupa pacientes por status
  const patientsByStatus = patients.reduce((acc, patient) => {
    if (!patient.inProcedure) return acc;

    const status =
      patient.procedureProgress === 1 ? 'Em Andamento' :
        patient.procedureProgress === 2 ? 'Finalização' :
          patient.procedureProgress >= 3 ? 'Finalizado' :
            'Preparação';

    if (!acc[status]) acc[status] = [];
    acc[status].push(patient);
    return acc;
  }, {});

  // Cores para cada status
  const statusColors = {
    'Preparação': '#1976d2',
    'Em Andamento': '#9c27b0',
    'Finalização': '#ff9800',
    'Finalizado': '#4caf50'
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Panorama de Procedimentos
      </Typography>

      {/* Cards de Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(patientsByStatus).map(([status, patientsList]) => (
          <Grid item xs={12} md={6} lg={4} key={status}>
            <Paper sx={{
              p: 2,
              borderLeft: `4px solid ${statusColors[status] || '#ccc'}`,
              boxShadow: 3
            }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  color: statusColors[status] || 'inherit'
                }}
              >
                {status} ({patientsList.length})
              </Typography>

              {patientsList.map(patient => (
                <Box
                  key={patient.id}
                  sx={{
                    mb: 3,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: '#fafafa'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: statusColors[status],
                      mr: 2,
                      color: 'white'
                    }}>
                      {patient.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">
                        <strong>{patient.name}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.procedureType}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dentista: {patient.dentist}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Barra de progresso */}
                  <LinearProgress
                    variant="determinate"
                    value={(patient.procedureProgress || 0) * 33}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 2,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: statusColors[status]
                      }
                    }}
                  />

                  {/* Etapas do procedimento */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    {['Preparação', 'Andamento', 'Finalização', 'Concluído'].map((etapa, index) => (
                      <Chip
                        key={etapa}
                        label={etapa}
                        size="small"
                        sx={{
                          backgroundColor: patient.procedureProgress >= index ? statusColors[status] : '#e0e0e0',
                          color: patient.procedureProgress >= index ? '#fff' : 'inherit',
                          minWidth: 80
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Resumo do Dia */}
      <Paper sx={{
        p: 3,
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
        boxShadow: 1
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Resumo do Dia
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Typography>
            <strong>Total de Pacientes:</strong> <span style={{ color: '#1976d2' }}>{patients.length}</span>
          </Typography>
          <Typography>
            <strong>Em Andamento:</strong> <span style={{ color: '#9c27b0' }}>{patients.filter(p => p.inProcedure && !p.completedToday).length}</span>
          </Typography>
          <Typography>
            <strong>Finalizados:</strong> <span style={{ color: '#4caf50' }}>{patients.filter(p => p.completedToday).length}</span>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;