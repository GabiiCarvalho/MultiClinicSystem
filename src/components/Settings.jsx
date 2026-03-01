import { useState, useContext } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, MenuItem,
  Divider, Alert, Snackbar, Card, CardContent, Avatar, Chip,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress
} from '@mui/material';
import { Settings as SettingsIcon, PersonAdd, Delete, Edit, Save, Business } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const CARGOS = [
  { value: 'gestor', label: 'Gestor' },
  { value: 'atendente', label: 'Atendente' },
  { value: 'dentista', label: 'Dentista' },
  { value: 'financeiro', label: 'Financeiro' },
];

const CARGO_COLORS = {
  proprietario: '#7C3AED',
  gestor: '#2563EB',
  dentista: '#059669',
  atendente: '#D97706',
  financeiro: '#0891B2',
};

const Settings = () => {
  const { user, clinicName, register } = useContext(AuthContext);
  const [tab, setTab] = useState(0);
  const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', cargo: 'atendente' });
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [clinicForm, setClinicForm] = useState({ nome: clinicName || '', telefone: '', endereco: '' });

  const show = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.email || !newUser.senha) {
      show('Preencha todos os campos', 'error'); return;
    }
    setLoading(true);
    try {
      await register({ ...newUser, tipoCadastro: 'existente', cnpjExistente: user?.cnpj });
      show('Colaborador cadastrado com sucesso!');
      setNewUser({ nome: '', email: '', senha: '', cargo: 'atendente' });
    } catch (err) {
      show(err.message || 'Erro ao cadastrar colaborador', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SettingsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" fontWeight={700}>Configurações</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Info da Clínica */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <Business sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>Informações da Clínica</Typography>
            </Box>

            <Box sx={{ mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">Clínica</Typography>
              <Typography variant="h6" fontWeight={700}>{clinicName || '—'}</Typography>
              <Typography variant="caption" color="text.secondary">ID: {user?.loja_id || '—'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth label="Nome da Clínica"
                value={clinicForm.nome}
                onChange={e => setClinicForm(f => ({ ...f, nome: e.target.value }))}
              />
              <TextField
                fullWidth label="Telefone"
                value={clinicForm.telefone}
                onChange={e => setClinicForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(00) 0000-0000"
              />
              <TextField
                fullWidth label="Endereço"
                value={clinicForm.endereco}
                onChange={e => setClinicForm(f => ({ ...f, endereco: e.target.value }))}
                placeholder="Rua, número, cidade"
              />
              <Button variant="contained" startIcon={<Save />}
                onClick={() => show('Configurações salvas! (integração backend pendente)')}>
                Salvar Alterações
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Meu Perfil */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Meu Perfil</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: 2 }}>
              <Avatar sx={{
                width: 52, height: 52, fontWeight: 700, fontSize: '1.2rem',
                bgcolor: CARGO_COLORS[user?.cargo] || 'primary.main'
              }}>
                {user?.nome?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight={700}>{user?.nome}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Chip
                  label={user?.cargo?.charAt(0).toUpperCase() + user?.cargo?.slice(1)}
                  size="small"
                  sx={{ mt: 0.5, bgcolor: `${CARGO_COLORS[user?.cargo]}15`, color: CARGO_COLORS[user?.cargo], fontWeight: 700 }}
                />
              </Box>
            </Box>

            <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.8rem' }}>
              Para alterar senha ou e-mail, entre em contato com o administrador da clínica.
            </Alert>
          </Paper>
        </Grid>

        {/* Adicionar Colaborador */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
              <PersonAdd sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>Adicionar Colaborador</Typography>
            </Box>

            <form onSubmit={handleAddUser}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="Nome *" value={newUser.nome}
                    onChange={e => setNewUser(f => ({ ...f, nome: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth label="E-mail *" type="email" value={newUser.email}
                    onChange={e => setNewUser(f => ({ ...f, email: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth label="Senha *" type="password" value={newUser.senha}
                    onChange={e => setNewUser(f => ({ ...f, senha: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField select fullWidth label="Cargo" value={newUser.cargo}
                    onChange={e => setNewUser(f => ({ ...f, cargo: e.target.value }))}>
                    {CARGOS.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button type="submit" fullWidth variant="contained" disabled={loading}
                    sx={{ height: '100%', minHeight: 40 }}>
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Adicionar'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;