import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ClinicLogo } from './UI/ClinicLogo';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #FAF9F8 0%, #FFFFFF 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '400px',
    background: 'linear-gradient(180deg, rgba(167,199,231,0.2) 0%, rgba(249,215,215,0.2) 100%)',
    pointerEvents: 'none',
  },
});

const StyledPaper = styled(Paper)({
  width: '100%',
  maxWidth: 440,
  padding: 40,
  borderRadius: 32,
  backgroundColor: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.02)',
  border: '1px solid rgba(255,255,255,0.5)',
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const LoginScreen = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <GradientBackground>
      <StyledPaper elevation={0}>
        <ClinicLogo size={80} />
        
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
          MultiClinic
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Sistema de Gestão para Clínicas Odontológicas e Estéticas
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 20,
              backgroundColor: '#FFE0E0',
              color: '#A65D5D',
              '& .MuiAlert-icon': { color: '#A65D5D' },
              width: '100%',
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder="Seu email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#A7C7E7' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              placeholder="Sua senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#F9D7D7' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 40,
                background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
                color: '#4A5568',
                fontWeight: 600,
                fontSize: '1rem',
                '&:hover': {
                  background: 'linear-gradient(135deg, #8FB0D0 0%, #E5B7B7 100%)',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: '#4A5568' }} /> : 'Entrar'}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 3, width: '100%' }}>
          <Typography variant="caption" color="text.secondary">
            ou
          </Typography>
        </Divider>

        <Button
          fullWidth
          onClick={onSwitchToRegister}
          sx={{
            py: 1.5,
            borderRadius: 40,
            border: '1px solid #F0F0F0',
            color: '#4A5568',
            '&:hover': {
              borderColor: '#A7C7E7',
              backgroundColor: '#FAFAFA',
            },
          }}
        >
          Cadastrar nova clínica
        </Button>

        <Typography variant="caption" align="center" sx={{ display: 'block', mt: 3, color: '#718096' }}>
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
        </Typography>
      </StyledPaper>
    </GradientBackground>
  );
};

export default LoginScreen;