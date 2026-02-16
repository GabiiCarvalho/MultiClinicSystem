import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box, Typography, Paper, Grid, Chip, Avatar, Button,
  Stepper, Step, StepLabel, Card, CardContent, Divider,
  Tabs, Tab, Badge, IconButton, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

const StatusBadge = styled(Chip)(({ theme, status }) => {
  const colors = {
    'aguardando': { bg: '#fff3e0', color: '#e65100', border: '#ffb74d' },
    'em_procedimento': { bg: '#e3f2fd', color: '#0d47a1', border: '#64b5f6' },
    'finalizado': { bg: '#e8f5e8', color: '#2e7d32', border: '#81c784' },
    'cancelado': { bg: '#ffebee', color: '#c62828', border: '#ef5350' }
  };
  const colorSet = colors[status] || colors['aguardando'];
  
  return (
    <Chip
      label={status === 'aguardando' ? 'Aguardando' : 
             status === 'em_procedimento' ? 'Em Procedimento' :
             status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
      size="small"
      sx={{
        backgroundColor: colorSet.bg,
        color: colorSet.color,
        border: `1px solid ${colorSet.border}`,
        fontWeight: 'bold'
      }}
    />
  );
});

const PatientFlowPanel = () => {
  const { patients, updatePatientStatus, getPatientsByStatus } = useContext(PatientsContext);
  const { user, hasPermission } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [patientsByStatus, setPatientsByStatus] = useState({
    aguardando: [],
    em_procedimento: [],
    finalizado: [],
    cancelado: []
  });

  useEffect(() => {
    setPatientsByStatus(getPatientsByStatus());
  }, [patients]);

  const handleUpdateStatus = (patientId, newStatus) => {
    updatePatientStatus(patientId, newStatus);
  };

  const renderPatientCard = (patient, showActions = true) => {
    const steps = patient.procedureType.includes('Cirurgia') ? 
      ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'] :
      patient.procedureType.includes('Consulta') ?
      ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'] :
      ['Preparação', 'Procedimento', 'Finalização'];

    const currentStep = patient.procedureProgress || 0;

    return (
      <StyledCard>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {patient.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {patient.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {patient.phone}
                </Typography>
              </Box>
            </Box>
            <StatusBadge status={patient.status} />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Procedimento:</strong> {patient.procedureType}
            </Typography>
            <Typography variant="body2">
              <strong>Dentista:</strong> {patient.dentist}
            </Typography>
            {patient.scheduleDate && (
              <Typography variant="body2">
                <strong>Horário:</strong> {new Date(patient.scheduleDate).toLocaleString('pt-BR')}
              </Typography>
            )}
          </Box>

          {patient.status === 'em_procedimento' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Progresso:</strong>
              </Typography>
              <Stepper activeStep={currentStep} alternativeLabel sx={{ mt: 1 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {patient.observations && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption">
                <strong>Obs:</strong> {patient.observations}
              </Typography>
            </Box>
          )}

          {showActions && hasPermission('view_patient_flow') && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {patient.status === 'aguardando' && (
                  <Tooltip title="Iniciar Procedimento">
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleUpdateStatus(patient.id, 'em_procedimento')}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {patient.status === 'em_procedimento' && (
                  <Tooltip title="Finalizar">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleUpdateStatus(patient.id, 'finalizado')}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {(patient.status === 'aguardando' || patient.status === 'em_procedimento') && (
                  <Tooltip title="Cancelar">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleUpdateStatus(patient.id, 'cancelado')}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {patient.status === 'finalizado' && (
                  <Tooltip title="Reabrir">
                    <IconButton 
                      size="small" 
                      color="warning"
                      onClick={() => handleUpdateStatus(patient.id, 'aguardando')}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </StyledCard>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Painel de Fluxo de Pacientes
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.aguardando.length} color="warning">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1 }} />
                  Aguardando
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.em_procedimento.length} color="info">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PlayArrowIcon sx={{ mr: 1 }} />
                  Em Procedimento
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.finalizado.length} color="success">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Finalizados
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.cancelado.length} color="error">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CancelIcon sx={{ mr: 1 }} />
                  Cancelados
                </Box>
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {tabValue === 0 && patientsByStatus.aguardando.map(patient => (
          <Grid item xs={12} md={6} lg={4} key={patient.id}>
            {renderPatientCard(patient)}
          </Grid>
        ))}
        {tabValue === 1 && patientsByStatus.em_procedimento.map(patient => (
          <Grid item xs={12} md={6} lg={4} key={patient.id}>
            {renderPatientCard(patient)}
          </Grid>
        ))}
        {tabValue === 2 && patientsByStatus.finalizado.map(patient => (
          <Grid item xs={12} md={6} lg={4} key={patient.id}>
            {renderPatientCard(patient)}
          </Grid>
        ))}
        {tabValue === 3 && patientsByStatus.cancelado.map(patient => (
          <Grid item xs={12} md={6} lg={4} key={patient.id}>
            {renderPatientCard(patient, false)}
          </Grid>
        ))}
      </Grid>

      {tabValue === 0 && patientsByStatus.aguardando.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum paciente aguardando atendimento
          </Typography>
        </Paper>
      )}
      {tabValue === 1 && patientsByStatus.em_procedimento.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum paciente em procedimento
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PatientFlowPanel;