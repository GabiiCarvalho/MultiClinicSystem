import { useContext, useState, useEffect } from "react";
import { PatientsContext } from "../contexts/PatientsContext";
import { AuthContext } from "../contexts/AuthContext";
import {
  Box, Tab, Tabs, Paper, Typography, AppBar,
  Toolbar, Avatar, Menu, MenuItem, IconButton,
  Badge, Divider, CircularProgress
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

// Tabs que ocupam toda a tela sem padding
const FULLSCREEN_KEYS = ["calendario", "fluxo", "agenda", "enterprise", "board"];

function TabPanel({ children, value, index, tabKey }) {
  return (
    <div 
      role="tabpanel" 
      hidden={value !== index} 
      style={FULLSCREEN_KEYS.includes(tabKey) ? { height: "calc(100vh - 108px)", overflow: "hidden" } : {}}
    >
      {value === index && (
        <Box sx={FULLSCREEN_KEYS.includes(tabKey) ? { height: "100%", overflow: "hidden" } : { p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MainTabs = () => {
  const [value, setValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout, clinicName } = useContext(AuthContext);
  const { getPatientsByStatus, loading } = useContext(PatientsContext);

  const patientsByStatus = getPatientsByStatus ? getPatientsByStatus() : { aguardando: [], em_procedimento: [] };

  if (!user) return <AuthScreen />;

  const changeTab = (tabIndex) => setValue(tabIndex);

  const normalizeCargo = (cargo) => {
    if (!cargo) return '';
    const c = String(cargo).toLowerCase().trim();
    const map = {
      proprietario: 'proprietario', proprietário: 'proprietario',
      gestor: 'gestor', gestora: 'gestor',
      dentista: 'dentista',
      atendente: 'atendente',
      financeiro: 'financeiro', financeira: 'financeiro',
    };
    return map[c] || c;
  };

  const getRoleLabel = () => {
    const roles = {
      proprietario: '👑 Proprietário',
      gestor: '👑 Gestor',
      dentista: '🦷 Dentista',
      atendente: '📋 Atendente',
      financeiro: '💰 Financeiro',
    };
    return roles[normalizeCargo(user.cargo)] || user.cargo;
  };

  // Índice da aba "Caixa" varia por perfil — calculado dinamicamente
  const getCashierTabIndex = (tabs) => tabs.findIndex(t => t.key === 'cashier');

  const atendenteTabs = [
    { key: 'agendamentos', label: "Agendamentos", icon: <EventNoteIcon />, component: <AppointmentManagement /> },
    { key: 'cadastro', label: "Cadastro", icon: <PersonAddIcon />, component: <PatientForm onNavigateToCashier={() => changeTab(getCashierTabIndex(atendenteTabs))} /> },
    { key: 'calendario', label: "Calendário", icon: <CalendarMonthIcon />, component: <Calendar /> },
    { key: 'fluxo', label: "Fluxo", icon: <PeopleIcon />, component: <PatientFlowPanel /> },
  ];

  const dentistaTabs = [
    { key: 'agenda', label: "Minha Agenda", icon: <CalendarMonthIcon />, component: <DentistSchedulePanel /> },
    { key: 'pacientes', label: "Meus Pacientes", icon: <PeopleIcon />, component: <PatientFlowPanel /> },
  ];

  const financeiroTabs = [
    { key: 'cashier', label: "Caixa", icon: <AttachMoneyIcon />, component: <Cashier /> },
    { key: 'dashboard', label: "Dashboard", icon: <DashboardIcon />, component: <Home /> },
  ];

  const gestorTabs = [
    { key: 'dashboard', label: "Dashboard", icon: <DashboardIcon />, component: <Home /> },
    { key: 'fluxo', label: "Fluxo", icon: <PeopleIcon />, component: <PatientFlowPanel /> },
    { key: 'agendamentos', label: "Agendamentos", icon: <EventNoteIcon />, component: <AppointmentManagement /> },
    { key: 'cadastro', label: "Cadastro", icon: <PersonAddIcon />, component: null },
    { key: 'calendario', label: "Calendário", icon: <CalendarMonthIcon />, component: <Calendar /> },
    { key: 'materiais', label: "Materiais", icon: <InventoryIcon />, component: <MaterialsManagement /> },
    { key: 'cashier', label: "Caixa", icon: <AttachMoneyIcon />, component: <Cashier /> },
    { key: 'configuracoes', label: "Configurações", icon: <SettingsIcon />, component: <Settings /> },
  ];

  const getTabsByRole = () => {
    const cargo = normalizeCargo(user.cargo);
    switch (cargo) {
      case 'atendente': return atendenteTabs;
      case 'dentista': return dentistaTabs;
      case 'financeiro': return financeiroTabs;
      case 'gestor':
      case 'proprietario':
      default: return gestorTabs;
    }
  };

  const tabs = getTabsByRole();

  // Injetar função de navegação no PatientForm
  const cashierIndex = getCashierTabIndex(tabs);
  const tabsWithNav = tabs.map(t =>
    t.key === 'cadastro'
      ? { ...t, component: <PatientForm onNavigateToCashier={() => changeTab(cashierIndex)} /> }
      : t
  );

  const pendingCount = (patientsByStatus.aguardando?.length || 0) + (patientsByStatus.pendentes?.length || 0);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 52, sm: 64 }, px: { xs: 1.5, sm: 2 } }}>
          <MedicalServicesIcon sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ flexGrow: 1, fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
            {clinicName || 'MultiClinic'}
          </Typography>

          {/* Badges de status */}
          {['gestor', 'proprietario'].includes(normalizeCargo(user.cargo)) && (
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2, mr: 2 }}>
              <Badge badgeContent={patientsByStatus.aguardando?.length || 0} color="primary">
                <Typography variant="caption" color="text.secondary">Aguardando</Typography>
              </Badge>
              <Badge badgeContent={patientsByStatus.em_procedimento?.length || 0} color="error">
                <Typography variant="caption" color="text.secondary">Em Atend.</Typography>
              </Badge>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
            {user.nome}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, mr: 1 }}>
            {getRoleLabel()}
          </Typography>

          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 700 }}>
              {user.nome?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { mt: 1, minWidth: 200 } }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="body2" fontWeight={700}>{user.nome}</Typography>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              <Typography variant="caption" display="block" color="primary.main" fontWeight={600}>
                {getRoleLabel()}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { logout(); setAnchorEl(null); }} sx={{ color: 'error.main', gap: 1 }}>
              <LogoutIcon fontSize="small" /> Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Tabs de navegação - CORRIGIDO */}
      <Paper elevation={0} sx={{ 
        borderRadius: 0, 
        borderBottom: '1px solid', 
        borderColor: 'divider', 
        position: 'sticky', 
        top: { xs: 52, sm: 64 }, 
        zIndex: 100, 
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}>
        <Tabs
          value={value}
          onChange={(_, v) => setValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          indicatorColor="primary"
          textColor="primary"
          sx={{
            minHeight: { xs: 48, sm: 56 },
            '& .MuiTabs-scrollButtons': { 
              width: 28,
              '&.Mui-disabled': { opacity: 0.3 }
            },
            '& .MuiTabs-scrollButtons.MuiButtonBase-root': {
              transition: 'all 0.2s',
            },
          }}
        >
          {tabsWithNav.map((tab, i) => (
            <Tab
              key={tab.key}
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, sm: 0.8 },
                  px: { xs: 0.5, sm: 0.8, md: 1 }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    color: value === i ? 'primary.main' : 'text.secondary',
                    '& svg': { 
                      fontSize: { xs: 20, sm: 22, md: 24 }
                    }
                  }}>
                    {tab.icon}
                  </Box>
                  <Typography 
                    sx={{ 
                      display: { xs: 'none', sm: 'block' },
                      fontSize: { sm: '0.8rem', md: '0.9rem', lg: '0.95rem' },
                      fontWeight: value === i ? 600 : 500,
                      color: value === i ? 'primary.main' : 'text.secondary',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Box>
              }
              sx={{
                minHeight: { xs: 48, sm: 56 },
                minWidth: { xs: 48, sm: 'auto' },
                maxWidth: { lg: 140 },
                flex: { xs: '0 0 auto', sm: '0 1 auto', md: '1 1 0' },
                p: { xs: 0.5, sm: 1 },
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: 'primary.main',
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Conteúdo das abas */}
      {tabsWithNav.map((tab, i) => (
        <TabPanel key={tab.key} value={value} index={i} tabKey={tab.key}>
          {tab.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default MainTabs;