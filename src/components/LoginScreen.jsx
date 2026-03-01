import { useState, useContext } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Alert, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, MedicalServices } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const LoginScreen = ({ onSwitchToRegister }) => {
  const { login, isLoading } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', senha: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.senha) { setError('Preencha e-mail e senha'); return; }
    try {
      await login(form.email, form.senha);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <Box>
      {/* Logo */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '16px',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          mb: 1.5
        }}>
          <MedicalServices sx={{ color: '#fff', fontSize: 28 }} />
        </Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          MultiClinic
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Faça login para continuar
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          sx={{ mb: 2 }}
          autoComplete="email"
        />
        <TextField
          fullWidth
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          value={form.senha}
          onChange={(e) => setForm(f => ({ ...f, senha: e.target.value }))}
          sx={{ mb: 3 }}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(s => !s)} edge="end" size="small">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ mb: 2, height: 46 }}
        >
          {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Entrar'}
        </Button>
      </form>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">ou</Typography>
      </Divider>

      <Button fullWidth variant="outlined" onClick={onSwitchToRegister} sx={{ height: 42 }}>
        Criar nova conta / clínica
      </Button>
    </Box>
  );
};

export default LoginScreen;