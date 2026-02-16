import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Box, Paper, Typography, TextField, Button, 
  CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';

const LoginScreen = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" gutterBottom align="center">
          Login Clínica Odonto & Estética
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            label="Senha"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Entrar'}
          </Button>
        </form>

        <Button fullWidth sx={{ mt: 2 }} onClick={onSwitchToRegister}>
          Não tem conta? Cadastre sua Clínica
        </Button>
      </Paper>
    </Box>
  );
};

export default LoginScreen;