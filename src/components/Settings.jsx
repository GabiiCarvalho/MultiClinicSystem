import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider
} from '@mui/material';

const Settings = () => {
  const { clinicName, user, updateClinicName } = useContext(AuthContext);
  const [newClinicName, setNewClinicName] = useState(clinicName || '');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    updateClinicName(newClinicName);
    setMessage('Nome da clínica salvo com sucesso!');
    
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  if (user.cargo !== 'proprietario') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Acesso restrito ao proprietário
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações da Clínica
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <TextField
          label="Nome da Clínica"
          value={newClinicName}
          onChange={(e) => setNewClinicName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <Button
          variant="contained"
          onClick={handleSave}
        >
          Salvar Nome
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informações da Conta
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography><strong>Nome:</strong> {user.nome}</Typography>
        <Typography><strong>Email:</strong> {user.email}</Typography>
        <Typography><strong>Cargo:</strong> {user.cargo === 'proprietario' ? 'Proprietário' : 'Funcionário'}</Typography>
        <Typography><strong>ID da Clínica:</strong> {user.loja_id}</Typography>
      </Paper>
    </Box>
  );
};

export default Settings;