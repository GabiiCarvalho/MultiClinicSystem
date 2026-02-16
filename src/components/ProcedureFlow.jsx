import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  Alert
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useState } from "react";

const ProcedureFlow = ({ patient, onNextStep, onComplete }) => {
  const [activeStep, setActiveStep] = useState(patient.procedureProgress || 0);
  const [openDialog, setOpenDialog] = useState(false);

  const getSteps = () => {
    if (patient.procedureType.includes('Cirurgia') || patient.procedureType.includes('Microcirurgia')) {
      return ['Preparação', 'Anestesia', 'Procedimento', 'Recuperação'];
    }
    if (patient.procedureType.includes('Consulta')) {
      return ['Anamnese', 'Exame', 'Diagnóstico', 'Finalização'];
    }
    return ['Preparação', 'Procedimento', 'Finalização'];
  };

  const steps = getSteps();

  const handleNext = () => {
    const newStep = activeStep + 1;
    setActiveStep(newStep);

    if (newStep === steps.length - 1) {
      setOpenDialog(true);
    } else {
      onNextStep?.(patient.id, newStep);
    }
  };

  const handleComplete = () => {
    const updatedPatient = {
      ...patient,
      completedToday: true,
      inProcedure: false,
      procedureProgress: steps.length
    };

    onComplete?.(updatedPatient);
    setOpenDialog(false);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Procedimento para: {patient.name}
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        {patient.procedureType} - {patient.dentist}
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {patient.observations && (
        <Box sx={{
          mb: 3,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          borderLeft: '4px solid #3f51b5'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Observações:
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
            {patient.observations}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleNext}
          disabled={activeStep >= steps.length}
          sx={{ px: 6, py: 1.5 }}
        >
          {activeStep >= steps.length - 1 ? 'Finalizar' : 'Próximo Passo'}
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Confirmar Finalização
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ fontSize: '1.1rem' }}>
            Confirmar que o procedimento para {patient.name} foi concluído com sucesso?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ px: 4, py: 1 }}
          >
            CANCELAR
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            color="primary"
            sx={{ px: 4, py: 1 }}
          >
            CONFIRMAR
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProcedureFlow;