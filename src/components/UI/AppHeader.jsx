import { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Divider,
  Chip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { AuthContext } from '../../contexts/AuthContext';
import { PatientsContext } from '../../contexts/PatientsContext';
import { ClinicAvatar } from '../UI/ClinicLogo';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';

const StyledAppBar = styled(AppBar)({
  backgroundColor: 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 20px rgba(0,0,0,0.02)',
  borderBottom: '1px solid rgba(255,255,255,0.5)',
});

const Logo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
});

export const AppHeader = () => {
  const { user, logout, clinicName } = useContext(AuthContext);
  const { getPatientsByStatus } = useContext(PatientsContext);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const patientsByStatus = getPatientsByStatus();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getRoleLabel = () => {
    const roles = {
      proprietario: 'Proprietário',
      gestor: 'Gestor',
      dentista: 'Dentista',
      atendente: 'Atendente',
      financeiro: 'Financeiro',
    };
    return roles[user?.cargo] || user?.cargo;
  };

  return (
    <StyledAppBar position="sticky">
      <Toolbar>
        <Logo>
          <ClinicAvatar size={44} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              {clinicName || 'MultiClinic'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              {getRoleLabel()}
            </Typography>
          </Box>
        </Logo>

        <Box sx={{ flexGrow: 1 }} />

        {user?.cargo === 'gestor' && (
          <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
            <Badge
              badgeContent={patientsByStatus.aguardando?.length || 0}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#FFE5B4',
                  color: '#B87C4A',
                },
              }}
            >
              <Chip
                icon={<PeopleIcon />}
                label="Aguardando"
                variant="outlined"
                size="small"
                sx={{ borderRadius: 20 }}
              />
            </Badge>
            <Badge
              badgeContent={patientsByStatus.em_procedimento?.length || 0}
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#F9D7D7',
                  color: '#A65D5D',
                },
              }}
            >
              <Chip
                icon={<CalendarTodayIcon />}
                label="Em Atendimento"
                variant="outlined"
                size="small"
                sx={{ borderRadius: 20 }}
              />
            </Badge>
          </Box>
        )}

        <IconButton size="large" sx={{ mr: 1 }}>
          <Badge variant="dot" color="primary">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.nome}
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              {user?.email}
            </Typography>
          </Box>
          <IconButton onClick={handleMenu} size="small">
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              }}
            >
              {user?.nome?.charAt(0)}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
              minWidth: 200,
            },
          }}
        >
          <MenuItem disabled>
            <Box sx={{ py: 1 }}>
              <Typography variant="subtitle2">{user?.nome}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleClose}>
            <SettingsIcon sx={{ mr: 1, fontSize: 20, color: '#718096' }} />
            Configurações
          </MenuItem>
          <MenuItem onClick={logout}>
            <LogoutIcon sx={{ mr: 1, fontSize: 20, color: '#A65D5D' }} />
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
};