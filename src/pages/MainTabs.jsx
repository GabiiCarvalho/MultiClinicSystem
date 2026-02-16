import { useContext, useState } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Tab, Tabs, Paper, Typography, AppBar,
  Toolbar, Avatar, Menu, MenuItem, IconButton,
  Badge, Divider
} from "@mui/material";
import PatientForm from "../components/PatientForm";
import Calendar from "../components/Calendar";
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
  const { getPatientsByStatus } = useContext(PatientsContext);

  if (!user) {
    return <AuthScreen />;
  }

  const patientsByStatus = getPatientsByStatus();

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

  // Definição de abas por perfil
  const atendenteTabs = [
    { 
      label: "Agendamentos", 
      icon: <CalendarMonthIcon />,
      content: <AppointmentManagement />
    },
    { 
      label: "Cadastro Paciente", 
      icon: <PersonAddIcon />,
      content: <PatientForm onChangeTab={setValue} />
    },
    { 
      label: "Calendário", 
      icon: <CalendarMonthIcon />,
      content: <Calendar />
    }
  ];

  const dentistaTabs = [
    { 
      label: "Minha Agenda", 
      icon: <CalendarMonthIcon />,
      content: <DentistSchedulePanel />
    }
  ];

  const financeiroTabs = [
    { 
      label: "Caixa", 
      icon: <AttachMoneyIcon />,
      content: <Cashier />
    }
  ];

  const gestorTabs = [
    { 
      label: "Dashboard", 
      icon: <DashboardIcon />,
      content: <Home />
    },
    { 
      label: "Fluxo de Pacientes", 
      icon: <PeopleIcon />,
      content: <PatientFlowPanel />
    },
    { 
      label: "Agendamentos", 
      icon: <CalendarMonthIcon />,
      content: <AppointmentManagement />
    },
    { 
      label: "Cadastro Paciente", 
      icon: <PersonAddIcon />,
      content: <PatientForm onChangeTab={setValue} />
    },
    { 
      label: "Calendário", 
      icon: <CalendarMonthIcon />,
      content: <Calendar />
    },
    { 
      label: "Materiais", 
      icon: <InventoryIcon />,
      content: <MaterialsManagement />
    },
    { 
      label: "Caixa", 
      icon: <AttachMoneyIcon />,
      content: <Cashier />
    },
    { 
      label: "Configurações", 
      icon: <SettingsIcon />,
      content: <Settings />
    }
  ];

  // Selecionar abas baseado no cargo
  const getTabsByRole = () => {
    switch(user.cargo) {
      case 'atendente':
        return atendenteTabs;
      case 'dentista':
        return dentistaTabs;
      case 'financeiro':
        return financeiroTabs;
      case 'gestor':
      case 'proprietario':
        return gestorTabs;
      default:
        return [];
    }
  };

  const tabs = getTabsByRole();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <MedicalServicesIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {clinicName} - {user.cargo === 'atendente' ? 'Atendente' :
                           user.cargo === 'dentista' ? 'Dentista' :
                           user.cargo === 'financeiro' ? 'Financeiro' :
                           user.cargo === 'gestor' ? 'Gestor' : 'Proprietário'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user.cargo === 'gestor' && (
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
              aria-label="account"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user.email}
                </Typography>
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
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};

export default MainTabs;