import { useState, useContext } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar, Badge,
  List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Divider,
  useTheme, useMediaQuery, Menu, MenuItem, Chip, Stack,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import { AuthContext } from '../../contexts/AuthContext';
import { PatientsContext } from '../../contexts/PatientsContext';

const DRAWER_FULL = 256;
const DRAWER_MINI = 68;

const ROLE_COLORS = {
  proprietario: { bg: '#E8D5FF', color: '#7B40D4', label: 'Proprietário' },
  gestor:       { bg: '#D0E8FF', color: '#2E6BB5', label: 'Gestor' },
  financeiro:   { bg: '#D0F5E8', color: '#2E855E', label: 'Financeiro' },
  atendente:    { bg: '#FFF3D0', color: '#B5742E', label: 'Atendente' },
  dentista:     { bg: '#FFE0D0', color: '#B53E2E', label: 'Dentista' },
};

const NAV_ITEMS = {
  gestor: [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardRoundedIcon /> },
    { key: 'flow', label: 'Fluxo de Pacientes', icon: <PeopleRoundedIcon />, badge: 'patients' },
    { key: 'appointments', label: 'Agendamentos', icon: <EventNoteRoundedIcon /> },
    { key: 'calendar', label: 'Calendário', icon: <CalendarMonthRoundedIcon /> },
    { key: 'register', label: 'Cadastro', icon: <PersonAddRoundedIcon /> },
    { key: 'cashier', label: 'Caixa', icon: <PaymentsRoundedIcon /> },
    { key: 'materials', label: 'Materiais', icon: <InventoryRoundedIcon /> },
    { key: 'settings', label: 'Configurações', icon: <SettingsRoundedIcon /> },
  ],
  proprietario: [
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardRoundedIcon /> },
    { key: 'flow', label: 'Fluxo de Pacientes', icon: <PeopleRoundedIcon />, badge: 'patients' },
    { key: 'appointments', label: 'Agendamentos', icon: <EventNoteRoundedIcon /> },
    { key: 'calendar', label: 'Calendário', icon: <CalendarMonthRoundedIcon /> },
    { key: 'register', label: 'Cadastro', icon: <PersonAddRoundedIcon /> },
    { key: 'cashier', label: 'Caixa', icon: <PaymentsRoundedIcon /> },
    { key: 'materials', label: 'Materiais', icon: <InventoryRoundedIcon /> },
    { key: 'settings', label: 'Configurações', icon: <SettingsRoundedIcon /> },
  ],
  atendente: [
    { key: 'appointments', label: 'Agendamentos', icon: <EventNoteRoundedIcon /> },
    { key: 'calendar', label: 'Calendário', icon: <CalendarMonthRoundedIcon /> },
    { key: 'register', label: 'Cadastro', icon: <PersonAddRoundedIcon /> },
    { key: 'flow', label: 'Fluxo de Pacientes', icon: <PeopleRoundedIcon /> },
  ],
  dentista: [
    { key: 'dentist-schedule', label: 'Minha Agenda', icon: <CalendarMonthRoundedIcon /> },
    { key: 'flow', label: 'Meus Pacientes', icon: <PeopleRoundedIcon /> },
  ],
  financeiro: [
    { key: 'cashier', label: 'Caixa', icon: <PaymentsRoundedIcon /> },
    { key: 'dashboard', label: 'Dashboard', icon: <DashboardRoundedIcon /> },
    { key: 'flow', label: 'Procedimentos', icon: <PeopleRoundedIcon /> },
  ],
};

export const AppLayout = ({ currentPage, onNavigate, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const { user, clinicName, logout } = useContext(AuthContext);
  const { getPatientsByStatus } = useContext(PatientsContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [miniMode, setMiniMode] = useState(isTablet);
  const [anchorEl, setAnchorEl] = useState(null);

  const patientsByStatus = getPatientsByStatus();
  const pendingCount = (patientsByStatus.pendentes?.length || 0) + (patientsByStatus.aguardando?.length || 0);
  const inProcCount = patientsByStatus.em_procedimento?.length || 0;

  const roleInfo = ROLE_COLORS[user?.cargo] || ROLE_COLORS.atendente;
  const navItems = NAV_ITEMS[user?.cargo] || NAV_ITEMS.atendente;
  const drawerWidth = isMobile ? DRAWER_FULL : (miniMode ? DRAWER_MINI : DRAWER_FULL);

  const SidebarContent = () => (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #1A2E4A 0%, #0F1E30 100%)',
      overflowX: 'hidden',
    }}>
      {/* Logo */}
      <Box sx={{
        px: miniMode && !isMobile ? 1 : 2.5,
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: miniMode && !isMobile ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: 64,
      }}>
        {(!miniMode || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F86C6, #7BA7D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MedicalServicesRoundedIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                {clinicName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Sistema Clínico
              </Typography>
            </Box>
          </Box>
        )}
        {miniMode && !isMobile ? (
          <Tooltip title={clinicName} placement="right">
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F86C6, #7BA7D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MedicalServicesRoundedIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          </Tooltip>
        ) : !isMobile ? (
          <IconButton onClick={() => setMiniMode(true)} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
            <ChevronLeftRoundedIcon />
          </IconButton>
        ) : null}
      </Box>

      {/* Nav Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.5 }}>
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = currentPage === item.key;
            const badgeCount = item.badge === 'patients' ? pendingCount : 0;
            return (
              <Tooltip key={item.key} title={miniMode && !isMobile ? item.label : ''} placement="right">
                <ListItemButton
                  onClick={() => { onNavigate(item.key); if (isMobile) setMobileOpen(false); }}
                  sx={{
                    mx: 1, mb: 0.5, borderRadius: 2,
                    justifyContent: miniMode && !isMobile ? 'center' : 'flex-start',
                    px: miniMode && !isMobile ? 1 : 1.5, py: 1,
                    backgroundColor: isActive ? 'rgba(79,134,198,0.2)' : 'transparent',
                    '&:hover': { backgroundColor: isActive ? 'rgba(79,134,198,0.25)' : 'rgba(255,255,255,0.05)' },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon sx={{
                    minWidth: miniMode && !isMobile ? 0 : 36,
                    color: isActive ? '#7BA7D8' : 'rgba(255,255,255,0.55)',
                  }}>
                    <Badge badgeContent={badgeCount > 0 ? badgeCount : null} color="warning" max={99}>
                      {item.icon}
                    </Badge>
                  </ListItemIcon>
                  {(!miniMode || isMobile) && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem', fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#90BDE8' : 'rgba(255,255,255,0.75)',
                        noWrap: true,
                      }}
                    />
                  )}
                  {(!miniMode || isMobile) && isActive && (
                    <Box sx={{ width: 3, height: 20, borderRadius: 2, backgroundColor: '#4F86C6', ml: 'auto' }} />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
      </Box>

      {/* User Profile */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', p: miniMode && !isMobile ? 1 : 2 }}>
        {miniMode && !isMobile ? (
          <Tooltip title={`${user?.nome} — ${roleInfo.label}`} placement="right">
            <IconButton onClick={logout} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#E07070' }, display: 'flex', mx: 'auto' }}>
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: roleInfo.color, fontSize: '0.9rem', fontWeight: 700, flexShrink: 0 }}>
              {user?.nome?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="subtitle2" sx={{ color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nome}
              </Typography>
              <Chip label={roleInfo.label} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: roleInfo.bg, color: roleInfo.color, mt: 0.25 }} />
            </Box>
            <Tooltip title="Sair">
              <IconButton onClick={logout} size="small" sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#E07070' } }}>
                <LogoutRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  const PAGE_TITLES = {
    dashboard: 'Dashboard', flow: 'Fluxo de Pacientes', appointments: 'Agendamentos',
    calendar: 'Calendário', register: 'Cadastro de Paciente', cashier: 'Caixa',
    materials: 'Gestão de Materiais', settings: 'Configurações', 'dentist-schedule': 'Minha Agenda',
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar Desktop */}
      {!isMobile && (
        <Box
          sx={{
            width: drawerWidth, flexShrink: 0, transition: 'width 0.25s ease',
            '& .MuiDrawer-paper': { width: drawerWidth, transition: 'width 0.25s ease', boxSizing: 'border-box', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.12)' },
          }}
          component="nav"
        >
          <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': { width: drawerWidth, transition: 'width 0.25s ease', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.12)' } }}>
            <SidebarContent />
          </Drawer>
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_FULL, border: 'none' } }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: 'white',
            borderBottom: '1px solid rgba(44,62,80,0.06)',
            color: 'text.primary',
            zIndex: (t) => t.zIndex.drawer - 1,
          }}
        >
          <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
            {isMobile ? (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ color: 'text.secondary' }}>
                <MenuIcon />
              </IconButton>
            ) : miniMode ? (
              <Tooltip title="Expandir menu">
                <IconButton onClick={() => setMiniMode(false)} sx={{ color: 'text.secondary' }}>
                  <MenuOpenIcon />
                </IconButton>
              </Tooltip>
            ) : null}

            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {PAGE_TITLES[currentPage] || 'MultiClinic'}
            </Typography>

            <Box sx={{ flex: 1 }} />

            {/* Status chips - tablet+ */}
            {!isMobile && (pendingCount > 0 || inProcCount > 0) && (
              <Stack direction="row" spacing={1}>
                {pendingCount > 0 && (
                  <Chip size="small" label={`${pendingCount} aguardando`} sx={{ bgcolor: '#FFF3D0', color: '#B5742E', fontWeight: 600 }} />
                )}
                {inProcCount > 0 && (
                  <Chip size="small" label={`${inProcCount} em atendimento`} sx={{ bgcolor: '#FFE0D0', color: '#B53E2E', fontWeight: 600 }} />
                )}
              </Stack>
            )}

            <IconButton sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={pendingCount || null} color="warning">
                <NotificationsNoneRoundedIcon />
              </Badge>
            </IconButton>

            <Tooltip title={user?.nome}>
              <Avatar
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ width: 36, height: 36, bgcolor: roleInfo.color, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', border: `2px solid ${roleInfo.bg}` }}
              >
                {user?.nome?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, borderRadius: 3, minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2">{user?.nome}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: 'error.main', gap: 1 }}>
                <LogoutRoundedIcon fontSize="small" /> Sair
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 2.5, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};