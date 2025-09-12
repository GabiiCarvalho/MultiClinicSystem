import { useContext, useState } from "react";
import { PetsContext } from "../contexts/PetsContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Tab, Tabs, Paper, Typography, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, Alert
} from "@mui/material";
import PetForm from "../components/PetForm";
import ServiceFlow from "../components/ServiceFlow";
import Home from "./Home";
import Calendar from "../components/Calendar";
import Cashier from "./Cashier";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import LoginScreen from '../components/LoginScreen';
import Settings from "../components/Settings";
import AuthScreen from "../components/AuthScreen";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MainTabs = () => {
  const [value, setValue] = useState(0);
  const { pets, setPets } = useContext(PetsContext);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const activePets = pets.filter(pet => pet.inService && pet.serviceProgress < 3);
  const finishedPets = pets.filter(pet => pet.serviceProgress === 3);

  const { user } = useContext(AuthContext);
  if (!user) {
    return <AuthScreen />;
  }

  const clients = pets.reduce((acc, pet) => {
    const existingClient = acc.find(c => c.owner === pet.owner && c.phone === pet.phone);
    if (existingClient) {
      existingClient.pets.push(pet);
    } else {
      acc.push({
        owner: pet.owner,
        phone: pet.phone,
        pets: [pet]
      });
    }
    return acc;
  }, []);

  const groupedFinishedPets = finishedPets.reduce((acc, pet) => {
    if (!acc[pet.serviceType]) {
      acc[pet.serviceType] = [];
    }
    acc[pet.serviceType].push(pet);
    return acc;
  }, {});

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const updatePetProgress = (petId, progress) => {
    setPets(pets.map(pet =>
      pet.id === petId ? { ...pet, serviceProgress: progress } : pet
    ));
  };

  const completeService = (petId) => {
    setPets(pets.map(pet =>
      pet.id === petId ? {
        ...pet,
        serviceProgress: 3,
        completedToday: true,
        inService: false,
        completionDate: new Date().toISOString()
      } : pet
    ));
  };

  const handleOpenRenewDialog = (client) => {
    setSelectedClient(client);
    setRenewDialogOpen(true);
  };

  const handleCloseRenewDialog = () => {
    setRenewDialogOpen(false);
    setSelectedClient(null);
  };

  const formatDate = (date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const getServiceColor = (serviceType) => {
    const serviceColors = {
      'Banho Completo': '#FF2D75',
      'Banho e Tosa': '#00F0FF',
      'Tosa Higiênica': '#e73434ff',
      'Tosa Completa': '#ffd700ff',
      'Plano Mensal': '#4671ffff',
      'Banho': '#8e24aa',
      'Outros': '#8fe99bff'
    };
    return serviceColors[serviceType] || serviceColors['Outros'];
  };

  const employeeTabs = [
    { 
      label: "Serviços Ativos", 
      content: activePets.length > 0 ? (
        activePets.map(pet => (
          <ServiceFlow
            key={pet.id}
            pet={pet}
            onNextStep={(petId, step) => updatePetProgress(petId, step)}
            onComplete={completeService}
          />
        ))
      ) : (
        <Typography>Nenhum pet em serviço no momento</Typography>
      )
    },
    { 
      label: "Serviços Finalizados", 
      content: finishedPets.length > 0 ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            Panorama de Serviços
          </Typography>
          {Object.entries(groupedFinishedPets).map(([serviceType, pets]) => (
            <Box key={serviceType} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {serviceType} ({pets.length})
              </Typography>
              {pets.map(pet => (
                <Paper key={pet.id} sx={{
                  p: 2,
                  mb: 2,
                  borderLeft: '4px solid #439104',
                  position: 'relative'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                      bgcolor: '#439104',
                      width: 40,
                      height: 40,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}>
                      {pet.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {pet.name} ({pet.breed})
                      </Typography>
                      <Typography variant="body2">
                        Dono: {pet.owner}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CheckCircleIcon sx={{ color: '#439104' }} />
                    <Typography variant="caption" color="text.secondary">
                      Finalizado
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Typography>Nenhum serviço finalizado hoje</Typography>
      )
    },
    { 
      label: "Agenda", 
      icon: <EventIcon />, 
      iconPosition: "start",
      content: <Calendar />
    }
  ];

  const ownerTabs = [
    { label: "Início", content: <Home /> },
    { label: "Cadastro Pet", content: <PetForm onChangeTab={setValue} /> },
    { 
      label: "Clientes", 
      icon: <PeopleIcon />, 
      iconPosition: "start",
      content: (
        <>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            Clientes Cadastrados
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Dono</TableCell>
                  <TableCell>Contato</TableCell>
                  <TableCell>Pets</TableCell>
                  <TableCell>Serviços Agendados</TableCell>
                  <TableCell>Planos Mensais</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={`${client.owner}-${client.phone}`}>
                    <TableCell>
                      <Typography fontWeight="bold">{client.owner}</Typography>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      {client.pets.map(pet => (
                        <Box key={pet.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Avatar sx={{
                            width: 32,
                            height: 32,
                            fontSize: 14,
                            bgcolor: pet.inService ? '#29cf98ff' : '#439104ff'
                          }}>
                            {pet.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography>{pet.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pet.breed}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </TableCell>
                    <TableCell>
                      {client.pets.map(pet => (
                        <Box key={pet.id} sx={{ mb: 1 }}>
                          <Chip
                            label={pet.serviceType}
                            size="small"
                            sx={{
                              backgroundColor: getServiceColor(pet.serviceType),
                              color: 'white',
                              mr: 1
                            }}
                          />
                          {pet.scheduleDate && (
                            <Typography variant="caption">
                              {formatDate(pet.scheduleDate)}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </TableCell>
                    <TableCell>
                      {client.pets.filter(p => p.serviceType === "Plano Mensal").length > 0 ? (
                        client.pets.filter(p => p.serviceType === "Plano Mensal").map(pet => (
                          <Box key={pet.id} sx={{ mb: 1 }}>
                            <Chip
                              label={`${pet.monthlyBathsRemaining || 0} banhos restantes`}
                              color={pet.monthlyBathsRemaining > 0 ? "primary" : "warning"}
                              variant="outlined"
                              size="small"
                            />
                            {pet.lastRenewalDate && (
                              <Typography variant="caption" display="block">
                                Última renovação: {formatDate(pet.lastRenewalDate, 'dd/MM/yyyy')}
                              </Typography>
                            )}
                          </Box>
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Nenhum plano ativo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.pets.some(p => p.serviceType === "Plano Mensal") && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenRenewDialog(client)}
                        >
                          Renovar Plano
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )
    },
    { 
      label: "Serviços Ativos", 
      content: activePets.length > 0 ? (
        activePets.map(pet => (
          <ServiceFlow
            key={pet.id}
            pet={pet}
            onNextStep={(petId, step) => updatePetProgress(petId, step)}
            onComplete={completeService}
          />
        ))
      ) : (
        <Typography>Nenhum pet em serviço no momento</Typography>
      )
    },
    { 
      label: "Serviços Finalizados", 
      content: finishedPets.length > 0 ? (
        <Box>
          <Typography variant="h4" gutterBottom>
            Panorama de Serviços
          </Typography>
          {Object.entries(groupedFinishedPets).map(([serviceType, pets]) => (
            <Box key={serviceType} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {serviceType} ({pets.length})
              </Typography>
              {pets.map(pet => (
                <Paper key={pet.id} sx={{
                  p: 2,
                  mb: 2,
                  borderLeft: '4px solid #439104',
                  position: 'relative'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                      bgcolor: '#439104',
                      width: 40,
                      height: 40,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }}>
                      {pet.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {pet.name} ({pet.breed})
                      </Typography>
                      <Typography variant="body2">
                        Dono: {pet.owner}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <CheckCircleIcon sx={{ color: '#439104' }} />
                    <Typography variant="caption" color="text.secondary">
                      Finalizado
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Typography>Nenhum serviço finalizado hoje</Typography>
      )
    },
    { 
      label: "Agenda", 
      icon: <EventIcon />, 
      iconPosition: "start",
      content: <Calendar />
    },
    { label: "Caixa", content: <Cashier /> },
    { label: "Configurações", content: <Settings /> }
  ];

  const tabs = user.cargo === 'proprietario' ? ownerTabs : employeeTabs;

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition={tab.iconPosition}
            />
          ))}
        </Tabs>
      </Paper>

      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.content}
        </TabPanel>
      ))}

      <Dialog open={renewDialogOpen} onClose={handleCloseRenewDialog}>
        <DialogTitle>Renovar Plano Mensal</DialogTitle>
        <DialogContent>
          {selectedClient && (
            <>
              <Typography gutterBottom>
                Cliente: <strong>{selectedClient.owner}</strong>
              </Typography>
              <Typography gutterBottom>
                Para renovar o plano mensal, você deve:
              </Typography>

              <Alert severity="info" sx={{ my: 2 }}>
                <strong>1.</strong> Ir para a aba de <strong>Caixa</strong><br />
                <strong>2.</strong> Buscar pelo cliente "{selectedClient.owner}"<br />
                <strong>3.</strong> Adicionar o serviço "Renovação Plano Mensal" ao carrinho<br />
                <strong>4.</strong> Realizar o pagamento
              </Alert>

              <Typography variant="body2" color="text.secondary">
                Esta ação não pode ser feita diretamente aqui para garantir o registro do pagamento.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRenewDialog}>Fechar</Button>
          <Button
            onClick={() => {
              handleCloseRenewDialog();
              setValue(tabs.findIndex(tab => tab.label === "Caixa"))
            }}
            variant="contained"
            color="primary"
          >
            Ir para o Caixa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MainTabs;