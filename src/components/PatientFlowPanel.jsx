import { useState, useContext, useEffect } from 'react';
import { PatientsContext } from '../contexts/PatientsContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Avatar,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

// Função segura para formatar data
const formatDate = (dateString) => {
  if (!dateString) return 'Horário não informado';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return 'Data inválida';
  }
};

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderRadius: 16,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
  },
}));

const StatusChip = ({ status }) => {
  const colors = {
    agendado: { bg: '#FFF0D9', color: '#B87C4A', label: '📅 Aguardando' },
    em_procedimento: { bg: '#F9D7D7', color: '#A65D5D', label: '⚕️ Em Procedimento' },
    finalizado: { bg: '#C5E0C5', color: '#4F7A4F', label: '✅ Finalizado' },
    cancelado: { bg: '#FFC9C9', color: '#A65D5D', label: '❌ Cancelado' }
  };
  
  const colorSet = colors[status] || colors.agendado;
  
  return (
    <Chip
      label={colorSet.label}
      size="small"
      sx={{
        backgroundColor: colorSet.bg,
        color: colorSet.color,
        fontWeight: 600,
        borderRadius: 20,
        '& .MuiChip-label': { px: 2 }
      }}
    />
  );
};

const PatientFlowPanel = () => {
  const { patients, updatePatientStatus, getPatientsByStatus, loading } = useContext(PatientsContext);
  const { user } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [patientsByStatus, setPatientsByStatus] = useState({
    aguardando: [],
    em_procedimento: [],
    finalizado: [],
    cancelado: []
  });

  useEffect(() => {
    try {
      const status = getPatientsByStatus();
      setPatientsByStatus({
        aguardando: Array.isArray(status.aguardando) ? status.aguardando : [],
        em_procedimento: Array.isArray(status.em_procedimento) ? status.em_procedimento : [],
        finalizado: Array.isArray(status.finalizado) ? status.finalizado : [],
        cancelado: Array.isArray(status.cancelado) ? status.cancelado : []
      });
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  }, [patients, getPatientsByStatus]);

  const handleUpdateStatus = (patientId, newStatus) => {
    try {
      updatePatientStatus(patientId, newStatus);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getSteps = (procedureType) => {
    if (!procedureType) return ['Preparação', 'Procedimento', 'Finalização'];
    
    const type = String(procedureType).toLowerCase();
    if (type.includes('cirurgia') || type.includes('microcirurgia')) {
      return ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'];
    }
    if (type.includes('consulta')) {
      return ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'];
    }
    return ['Preparação', 'Procedimento', 'Finalização'];
  };

  const renderPatientCard = (patient, showActions = true) => {
    if (!patient || !patient.id) return null;

    const steps = getSteps(patient.procedureType);
    const currentStep = patient.procedureProgress || 0;

    return (
      <StyledCard>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: patient.status === 'em_procedimento' ? '#F9D7D7' : 
                         patient.status === 'finalizado' ? '#C5E0C5' : 
                         patient.status === 'cancelado' ? '#FFC9C9' : '#FFF0D9',
                color: patient.status === 'em_procedimento' ? '#A65D5D' : 
                       patient.status === 'finalizado' ? '#4F7A4F' : 
                       patient.status === 'cancelado' ? '#A65D5D' : '#B87C4A',
                width: 48,
                height: 48
              }}>
                {patient.name ? patient.name.charAt(0).toUpperCase() : '?'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {patient.name || 'Nome não informado'}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div">
                  {patient.phone || 'Telefone não informado'}
                </Typography>
                {patient.email && (
                  <Typography variant="caption" color="text.secondary" component="div">
                    {patient.email}
                  </Typography>
                )}
              </Box>
            </Box>
            <StatusChip status={patient.status} />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Procedimento:</strong> {patient.procedureType || 'Não informado'}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Dentista:</strong> {patient.dentist || 'Não informado'}
            </Typography>
            {patient.scheduleDate && (
              <Typography variant="body2">
                <strong>Horário:</strong> {formatDate(patient.scheduleDate)}
              </Typography>
            )}
          </Box>

          {patient.status === 'em_procedimento' && steps && steps.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Progresso:</strong>
              </Typography>
              <Stepper activeStep={currentStep} alternativeLabel sx={{ mt: 1 }}>
                {steps.map((label, index) => (
                  <Step key={label || `step-${index}`}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: '#F9D7D7' },
                          '&.Mui-completed': { color: '#C5E0C5' }
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {patient.observations && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2 }}>
              <Typography variant="caption">
                <strong>Obs:</strong> {patient.observations}
              </Typography>
            </Box>
          )}

          {showActions && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {patient.status === 'agendado' && (
                  <Tooltip title="Iniciar Procedimento">
                    <IconButton 
                      size="small"
                      onClick={() => handleUpdateStatus(patient.id, 'em_procedimento')}
                      sx={{ 
                        bgcolor: '#F9D7D7',
                        '&:hover': { bgcolor: '#E5B7B7' }
                      }}
                    >
                      <PlayArrowIcon sx={{ color: '#A65D5D' }} />
                    </IconButton>
                  </Tooltip>
                )}
                {patient.status === 'em_procedimento' && (
                  <Tooltip title="Finalizar">
                    <IconButton 
                      size="small"
                      onClick={() => handleUpdateStatus(patient.id, 'finalizado')}
                      sx={{ 
                        bgcolor: '#C5E0C5',
                        '&:hover': { bgcolor: '#B0D0B0' }
                      }}
                    >
                      <CheckCircleIcon sx={{ color: '#4F7A4F' }} />
                    </IconButton>
                  </Tooltip>
                )}
                {(patient.status === 'agendado' || patient.status === 'em_procedimento') && (
                  <Tooltip title="Cancelar">
                    <IconButton 
                      size="small"
                      onClick={() => handleUpdateStatus(patient.id, 'cancelado')}
                      sx={{ 
                        bgcolor: '#FFC9C9',
                        '&:hover': { bgcolor: '#F0B0B0' }
                      }}
                    >
                      <CancelIcon sx={{ color: '#A65D5D' }} />
                    </IconButton>
                  </Tooltip>
                )}
                {patient.status === 'finalizado' && (
                  <Tooltip title="Reabrir">
                    <IconButton 
                      size="small"
                      onClick={() => handleUpdateStatus(patient.id, 'agendado')}
                      sx={{ 
                        bgcolor: '#FFF0D9',
                        '&:hover': { bgcolor: '#FFE5B4' }
                      }}
                    >
                      <RefreshIcon sx={{ color: '#B87C4A' }} />
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress sx={{ color: '#A7C7E7' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#4A5568', mb: 3 }}>
        📊 Fluxo de Pacientes
      </Typography>

      <Paper sx={{ borderRadius: 3, mb: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': { py: 2 },
            '& .Mui-selected': { fontWeight: 600 }
          }}
        >
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.aguardando.length} color="warning">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon /> Aguardando
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.em_procedimento.length} color="info">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlayArrowIcon /> Em Procedimento
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.finalizado.length} color="success">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon /> Finalizados
                </Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={patientsByStatus.cancelado.length} color="error">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CancelIcon /> Cancelados
                </Box>
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {tabValue === 0 && patientsByStatus.aguardando.length > 0 && 
          patientsByStatus.aguardando.map(patient => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              {renderPatientCard(patient)}
            </Grid>
          ))
        }
        {tabValue === 1 && patientsByStatus.em_procedimento.length > 0 && 
          patientsByStatus.em_procedimento.map(patient => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              {renderPatientCard(patient)}
            </Grid>
          ))
        }
        {tabValue === 2 && patientsByStatus.finalizado.length > 0 && 
          patientsByStatus.finalizado.map(patient => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              {renderPatientCard(patient)}
            </Grid>
          ))
        }
        {tabValue === 3 && patientsByStatus.cancelado.length > 0 && 
          patientsByStatus.cancelado.map(patient => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              {renderPatientCard(patient, false)}
            </Grid>
          ))
        }
      </Grid>

      {tabValue === 0 && patientsByStatus.aguardando.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <AccessTimeIcon sx={{ fontSize: 60, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#718096' }}>
            Nenhum paciente aguardando
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Os pacientes agendados aparecerão aqui
          </Typography>
        </Paper>
      )}

      {tabValue === 1 && patientsByStatus.em_procedimento.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <PlayArrowIcon sx={{ fontSize: 60, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#718096' }}>
            Nenhum paciente em procedimento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inicie um atendimento na aba "Aguardando"
          </Typography>
        </Paper>
      )}

      {tabValue === 2 && patientsByStatus.finalizado.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#718096' }}>
            Nenhum paciente finalizado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Os pacientes concluídos aparecerão aqui
          </Typography>
        </Paper>
      )}

      {tabValue === 3 && patientsByStatus.cancelado.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <CancelIcon sx={{ fontSize: 60, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#718096' }}>
            Nenhum paciente cancelado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Os pacientes cancelados aparecerão aqui
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PatientFlowPanel;