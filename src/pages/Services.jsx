import { useState, useContext } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import ProcedureFlow from "../components/ProcedureFlow";
import { Button, TextField, Box, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

const Services = () => {
  const { patients, setPatients } = useContext(PatientsContext);
  const [newPatient, setNewPatient] = useState({ 
    name: "", 
    procedureType: "Consulta Odontológica",
    dentist: "Dra. Ana Silva"
  });

  const handleAddPatient = () => {
    if (newPatient.name) {
      setPatients([...patients, { 
        ...newPatient, 
        id: Date.now(),
        procedureProgress: 0,
        inProcedure: false,
        completedToday: false,
        phone: "",
        scheduleDate: new Date()
      }]);
      setNewPatient({ 
        name: "", 
        procedureType: "Consulta Odontológica",
        dentist: "Dra. Ana Silva"
      });
    }
  };

  const handleNextStep = (patientId, step) => {
    setPatients(patients.map(patient => 
      patient.id === patientId ? { ...patient, procedureProgress: step } : patient
    ));
  };

  const handleCompleteProcedure = (patientId) => {
    setPatients(patients.map(patient => 
      patient.id === patientId ? { 
        ...patient, 
        completedToday: true
      } : patient
    ));
  };

  const dentists = ['Dra. Ana Silva', 'Dr. Carlos Santos', 'Dra. Mariana Oliveira'];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Procedimentos da Clínica
      </Typography>

      {/* Formulário para adicionar novo paciente */}
      <Box sx={{ display: "flex", gap: 2, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Nome do Paciente"
          value={newPatient.name}
          onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Tipo de Procedimento</InputLabel>
          <Select
            value={newPatient.procedureType}
            label="Tipo de Procedimento"
            onChange={(e) => setNewPatient({ ...newPatient, procedureType: e.target.value })}
          >
            <MenuItem value="Consulta Odontológica">Consulta Odontológica</MenuItem>
            <MenuItem value="Limpeza Dental">Limpeza Dental</MenuItem>
            <MenuItem value="Clareamento">Clareamento</MenuItem>
            <MenuItem value="Extração">Extração</MenuItem>
            <MenuItem value="Canal">Canal</MenuItem>
            <MenuItem value="Microcirurgia">Microcirurgia</MenuItem>
            <MenuItem value="Aplicação de Botox">Aplicação de Botox</MenuItem>
            <MenuItem value="Preenchimento">Preenchimento</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Dentista</InputLabel>
          <Select
            value={newPatient.dentist}
            label="Dentista"
            onChange={(e) => setNewPatient({ ...newPatient, dentist: e.target.value })}
          >
            {dentists.map((dentist) => (
              <MenuItem key={dentist} value={dentist}>{dentist}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleAddPatient}>
          Adicionar Paciente
        </Button>
      </Box>

      {/* Lista de pacientes em procedimento */}
      <Typography variant="h6" gutterBottom>
        Pacientes em Atendimento:
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {patients.map((patient) => (
          <ProcedureFlow 
            key={patient.id} 
            patient={patient} 
            onNextStep={handleNextStep}
            onComplete={handleCompleteProcedure}
          />
        ))}
      </Box>
    </Box>
  );
};

export default Services;