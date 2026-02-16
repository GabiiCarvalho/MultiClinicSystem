import { useState, useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import { PatientsContext } from "../contexts/PatientsContext";
import {
  TextField, Button, Typography, Box,
  MenuItem, Paper, Container, Tabs, Tab,
  Autocomplete, Chip, Alert, Avatar,
  FormGroup, Grid
} from "@mui/material";
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import 'react-toastify/dist/ReactToastify.css';

const PatientForm = ({ onChangeTab }) => {
  const { patients, setPatients } = useContext(PatientsContext);
  const [localTabValue, setLocalTabValue] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    birthDate: null,
    procedureType: "Consulta Odontológica",
    dentist: "Dra. Ana Silva",
    observations: "",
    scheduleDate: new Date(),
    scheduleTime: new Date()
  });

  const [quickScheduleForm, setQuickScheduleForm] = useState({
    procedureType: "Consulta Odontológica",
    dentist: "Dra. Ana Silva",
    scheduleDate: new Date(),
    scheduleTime: new Date(),
    observations: ""
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
    "Lipoaspiração": 5000,
    "Rinoplastia": 8000,
    "Blefaroplastia": 4000,
    "Outros": 300
  };

  const procedureDescriptions = {
    "Consulta Odontológica": "Avaliação inicial com dentista",
    "Limpeza Dental": "Remoção de tártaro e profilaxia",
    "Clareamento": "Clareamento dental a laser",
    "Extração": "Extração de dente",
    "Canal": "Tratamento de canal",
    "Microcirurgia": "Procedimento cirúrgico minimamente invasivo",
    "Aplicação de Botox": "Aplicação de toxina botulínica",
    "Preenchimento": "Preenchimento facial com ácido hialurônico",
    "Lipoaspiração": "Procedimento de lipoaspiração localizada",
    "Rinoplastia": "Cirurgia plástica no nariz",
    "Blefaroplastia": "Cirurgia das pálpebras",
    "Outros": "Outros procedimentos"
  };

  const dentists = [
    'Dra. Ana Silva',
    'Dr. Carlos Santos',
    'Dra. Mariana Oliveira',
    'Dr. Rafael Mendes',
    'Dra. Juliana Costa'
  ];

  const handleTabChange = (event, newValue) => {
    setLocalTabValue(newValue);
  };

  const handleNewPatientSubmit = (e) => {
    e.preventDefault();

    if (!newPatientForm.name || !newPatientForm.phone) {
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const newPatient = {
      ...newPatientForm,
      id: Date.now(),
      inProcedure: false,
      procedureProgress: 0,
      completedToday: false
    };

    setPatients([...patients, newPatient]);
    
    setNewPatientForm({
      name: "",
      phone: "",
      email: "",
      cpf: "",
      birthDate: null,
      procedureType: "Consulta Odontológica",
      dentist: "Dra. Ana Silva",
      observations: "",
      scheduleDate: new Date(),
      scheduleTime: new Date()
    });

    toast.success("Paciente cadastrado com sucesso! Você será redirecionado para o caixa para finalizar o pagamento.");
    onChangeTab(6);
  };

  const handleQuickScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error("Selecione um paciente para agendar o procedimento!");
      return;
    }

    localStorage.setItem('pendingServiceSchedule', JSON.stringify({
      patient: selectedPatient,
      procedureType: quickScheduleForm.procedureType,
      dentist: quickScheduleForm.dentist,
      scheduleDate: quickScheduleForm.scheduleDate,
      scheduleTime: quickScheduleForm.scheduleTime,
      observations: quickScheduleForm.observations
    }));

    onChangeTab(6);
    toast.info("Você será redirecionado ao caixa para finalizar");
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    patient.phone.includes(searchInput)
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Container maxWidth="md">
        <Paper sx={{ p: 3, mt: 4 }}>
          <ToastContainer position="top-center" autoClose={3000} />

          <Tabs value={localTabValue} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
            <Tab label="Agendamento Rápido" />
            <Tab label="Novo Cadastro" />
          </Tabs>

          {localTabValue === 0 ? (
            <form onSubmit={handleQuickScheduleSubmit}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Agendamento para Paciente Cadastrado
              </Typography>

              <Autocomplete
                options={filteredPatients}
                getOptionLabel={(option) => `${option.name} (${option.phone})`}
                inputValue={searchInput}
                onInputChange={(e, newValue) => setSearchInput(newValue)}
                onChange={(e, newValue) => setSelectedPatient(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar paciente por nome ou telefone" fullWidth sx={{ mb: 2 }} />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography>{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.phone} • {option.email || 'Sem email'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />

              {selectedPatient && (
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedPatient.name}
                  </Typography>
                  <Typography variant="body2">
                    Telefone: {selectedPatient.phone}
                  </Typography>
                  {selectedPatient.email && (
                    <Typography variant="body2">
                      Email: {selectedPatient.email}
                    </Typography>
                  )}
                </Box>
              )}

              <TextField
                select
                label="Tipo de Procedimento"
                fullWidth
                value={quickScheduleForm.procedureType}
                onChange={(e) => setQuickScheduleForm({ ...quickScheduleForm, procedureType: e.target.value })}
                sx={{ mb: 2 }}
              >
                {Object.entries(procedurePrices).map(([procedure, price]) => (
                  <MenuItem key={procedure} value={procedure}>
                    {procedure} - R$ {price.toFixed(2)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Dentista Responsável"
                fullWidth
                value={quickScheduleForm.dentist}
                onChange={(e) => setQuickScheduleForm({ ...quickScheduleForm, dentist: e.target.value })}
                sx={{ mb: 2 }}
              >
                {dentists.map((dentist) => (
                  <MenuItem key={dentist} value={dentist}>
                    {dentist}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <DatePicker
                  label="Data do Procedimento"
                  value={quickScheduleForm.scheduleDate}
                  onChange={(newDate) => setQuickScheduleForm({ ...quickScheduleForm, scheduleDate: newDate })}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={new Date()}
                  format="dd/MM/yyyy"
                />
                <TimePicker
                  label="Horário do Procedimento"
                  value={quickScheduleForm.scheduleTime}
                  onChange={(newTime) => setQuickScheduleForm({ ...quickScheduleForm, scheduleTime: newTime })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>

              <TextField
                label="Observações"
                fullWidth
                multiline
                rows={2}
                value={quickScheduleForm.observations}
                onChange={(e) => setQuickScheduleForm({ ...quickScheduleForm, observations: e.target.value })}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={!selectedPatient}
                sx={{ py: 1.5 }}
              >
                AGENDAR PROCEDIMENTO
              </Button>
            </form>
          ) : (
            <form onSubmit={handleNewPatientSubmit}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Cadastrar Novo Paciente
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nome Completo *"
                    fullWidth
                    required
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <PhoneInput
                    country={'br'}
                    value={newPatientForm.phone}
                    onChange={(phone) => setNewPatientForm({ ...newPatientForm, phone })}
                    inputStyle={{ width: '100%' }}
                    placeholder="Telefone *"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={newPatientForm.email}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="CPF"
                    fullWidth
                    value={newPatientForm.cpf}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, cpf: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Data de Nascimento"
                    value={newPatientForm.birthDate}
                    onChange={(newDate) => setNewPatientForm({ ...newPatientForm, birthDate: newDate })}
                    slotProps={{ textField: { fullWidth: true } }}
                    format="dd/MM/yyyy"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Tipo de Procedimento"
                    fullWidth
                    value={newPatientForm.procedureType}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, procedureType: e.target.value })}
                  >
                    {Object.entries(procedurePrices).map(([procedure, price]) => (
                      <MenuItem key={procedure} value={procedure}>
                        {procedure} - R$ {price.toFixed(2)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Dentista Responsável"
                    fullWidth
                    value={newPatientForm.dentist}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, dentist: e.target.value })}
                  >
                    {dentists.map((dentist) => (
                      <MenuItem key={dentist} value={dentist}>
                        {dentist}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Data do Procedimento"
                    value={newPatientForm.scheduleDate}
                    onChange={(newDate) => setNewPatientForm({ ...newPatientForm, scheduleDate: newDate })}
                    slotProps={{ textField: { fullWidth: true } }}
                    minDate={new Date()}
                    format="dd/MM/yyyy"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Horário do Procedimento"
                    value={newPatientForm.scheduleTime}
                    onChange={(newTime) => setNewPatientForm({ ...newPatientForm, scheduleTime: newTime })}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Observações"
                    fullWidth
                    multiline
                    rows={3}
                    value={newPatientForm.observations}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, observations: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                sx={{ mt: 3, py: 1.5 }}
              >
                CADASTRAR PACIENTE
              </Button>
            </form>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default PatientForm;