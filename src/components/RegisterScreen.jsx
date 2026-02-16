import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Box, Paper, Typography, TextField, Button, 
  CircularProgress, Alert, Grid 
} from '@mui/material';

const RegisterScreen = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cnpj: '',
    address: '',
    clinicName: ''
  });
  const [error, setError] = useState('');
  const { register, isLoading } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await register(formData);
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      onSwitchToLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, width: 600 }}>
        <Typography variant="h4" gutterBottom align="center">
          Cadastro da Clínica
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nome da Clínica *"
                name="clinicName"
                fullWidth
                value={formData.clinicName}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Seu Nome Completo *"
                name="name"
                fullWidth
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email *"
                type="email"
                name="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Senha *"
                type="password"
                name="password"
                fullWidth
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmar Senha *"
                type="password"
                name="confirmPassword"
                fullWidth
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefone *"
                name="phone"
                fullWidth
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="CNPJ"
                name="cnpj"
                fullWidth
                value={formData.cnpj}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Endereço Completo *"
                name="address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ mt: 3 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Cadastrar Clínica'}
          </Button>
        </form>

        <Button fullWidth sx={{ mt: 2 }} onClick={onSwitchToLogin}>
          Já tem uma conta? Faça login
        </Button>
      </Paper>
    </Box>
  );
};

export default RegisterScreen;