import { useContext, useState, useEffect } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Tab, Tabs, Paper, Typography, AppBar,
  Toolbar, Avatar, Menu, MenuItem, IconButton,
  Badge, Divider, CircularProgress, Button
} from "@mui/material";
import PatientForm from "../components/PatientForm";
import Calendar from "../components/CalendarSaaS";
import Cashier from "./Cashier";
import Settings from "../components/Settings";
import AuthScreen from "../components/AuthScreen";
import AppointmentManagement from "../components/AppointmentManagement";
import DentistSchedulePanel from "../components/DentistSchedulePanel";
import PatientFlowPanel from "../components/PatientFlowPanel";
import MaterialsManagement from "../components/MaterialsManagement";
import Home from "./Home";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import SettingsIcon from '@mui/icons-material/Settings';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EventNoteIcon from '@mui/icons-material/EventNote';

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
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, clinicName, hasPermission } = useContext(AuthContext);
  const { getPatientsByStatus, loading } = useContext(PatientsContext);
  const [patientsByStatus, setPatientsByStatus] = useState({
    aguardando: [],
    em_procedimento: []
  });

  useEffect(() => {
    if (getPatientsByStatus) {
      try {
        const status = getPatientsByStatus();
        setPatientsByStatus({
          aguardando: status.aguardando || [],
          em_procedimento: status.em_procedimento || []
        });
      } catch (error) {
        console.error('Erro ao carregar status:', error);
      }
    }
  }, [getPatientsByStatus]);

  if (!user) {
    return <AuthScreen />;
  }

  console.log('Usuário logado:', user);
  console.log('Cargo do usuário:', user.cargo);
  console.log('Tipo do cargo:', typeof user.cargo);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const getRoleLabel = () => {
    const roles = {
      proprietario: '👑 Proprietário',
      gestor: '👑 Gestor',
      dentista: '🦷 Dentista',
      atendente: '📋 Atendente',
      financeiro: '💰 Financeiro'
    };
    return roles[user.cargo] || user.cargo;
  };

  // Função para mudar de aba programaticamente
  const changeTab = (tabIndex) => {
    setValue(tabIndex);
  };

  // Definição de abas por perfil
  const atendenteTabs = [
    { label: "Agendamentos", icon: <EventNoteIcon />, component: <AppointmentManagement /> },
    { label: "Cadastro", icon: <PersonAddIcon />, component: <PatientForm onChangeTab={changeTab} /> },
    { label: "Calendário", icon: <CalendarMonthIcon />, component: <Calendar /> },
    { label: "Fluxo", icon: <PeopleIcon />, component: <PatientFlowPanel /> }
  ];

  const dentistaTabs = [
    { label: "Minha Agenda", icon: <CalendarMonthIcon />, component: <DentistSchedulePanel /> },
    { label: "Meus Pacientes", icon: <PeopleIcon />, component: <PatientFlowPanel /> }
  ];

  const financeiroTabs = [
    { label: "Caixa", icon: <AttachMoneyIcon />, component: <Cashier /> },
    { label: "Dashboard", icon: <DashboardIcon />, component: <Home /> }
  ];

  const gestorTabs = [
    { label: "Dashboard", icon: <DashboardIcon />, component: <Home /> },
    { label: "Fluxo", icon: <PeopleIcon />, component: <PatientFlowPanel /> },
    { label: "Agendamentos", icon: <EventNoteIcon />, component: <AppointmentManagement /> },
    { label: "Cadastro", icon: <PersonAddIcon />, component: <PatientForm onChangeTab={changeTab} /> },
    { label: "Calendário", icon: <CalendarMonthIcon />, component: <Calendar /> },
    { label: "Materiais", icon: <InventoryIcon />, component: <MaterialsManagement /> },
    { label: "Caixa", icon: <AttachMoneyIcon />, component: <Cashier /> },
    { label: "Configurações", icon: <SettingsIcon />, component: <Settings /> }
  ];

  // Função para normalizar o cargo (remover acentos e tratar variações)
  const normalizeCargo = (cargo) => {
    if (!cargo) return '';
    
    const cargoStr = String(cargo).toLowerCase().trim();
    
    // Mapeamento de variações possíveis
    const mapaCargos = {
      'proprietario': 'proprietario',
      'proprietário': 'proprietario',
      'proprietaria': 'proprietario',
      'proprietária': 'proprietario',
      'gestor': 'gestor',
      'gestora': 'gestor',
      'dentista': 'dentista',
      'atendente': 'atendente',
      'financeiro': 'financeiro',
      'financeira': 'financeiro'
    };
    
    return mapaCargos[cargoStr] || cargoStr;
  };

  // Selecionar abas baseado no cargo normalizado
  const getTabsByRole = () => {
    const cargoNormalizado = normalizeCargo(user.cargo);
    
    console.log('Cargo original:', user.cargo);
    console.log('Cargo normalizado:', cargoNormalizado);
    
    switch (cargoNormalizado) {
      case 'atendente':
        console.log('Usando abas de atendente');
        return atendenteTabs;
      case 'dentista':
        console.log('Usando abas de dentista');
        return dentistaTabs;
      case 'financeiro':
        console.log('Usando abas de financeiro');
        return financeiroTabs;
      case 'gestor':
      case 'proprietario':
        console.log('Usando abas de gestor/proprietário');
        return gestorTabs;
      default:
        console.log('Cargo não reconhecido, usando gestor como fallback');
        return gestorTabs;
    }
  };

  const tabs = getTabsByRole();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <MedicalServicesIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {clinicName || 'Clínica'} - {getRoleLabel()}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {(user.cargo === 'gestor' || user.cargo === 'proprietario') && (
              <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
                <Badge badgeContent={patientsByStatus.aguardando.length} color="warning">
                  <Typography variant="body2">Aguardando</Typography>
                </Badge>
                <Badge badgeContent={patientsByStatus.em_procedimento.length} color="info">
                  <Typography variant="body2">Em Atendimento</Typography>
                </Badge>
              </Box>
            )}
            
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.nome}
            </Typography>
            
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.nome?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">{user.email}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} /> Sair
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Paper sx={{ borderRadius: 0 }}>
        <Tabs
          value={value}
          onChange={(e, newValue) => setValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {tabs.map((tab, index) => (
        <TabPanel key={index} value={value} index={index}>
          {tab.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default MainTabs;