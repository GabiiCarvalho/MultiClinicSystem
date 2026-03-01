import { useState, useContext } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Alert, MenuItem, Tabs, Tab, Divider, InputAdornment, IconButton
} from '@mui/material';
import { MedicalServices, Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const CARGOS = ['gestor', 'atendente', 'dentista', 'financeiro'];

const RegisterScreen = ({ onSwitchToLogin }) => {
  const { register, isLoading } = useContext(AuthContext);
  const [tab, setTab] = useState(0); // 0 = nova clínica, 1 = entrar em existente
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    nome: '', email: '', senha: '', cargo: 'gestor',
    // nova clínica
    nomeLoja: '', cnpj: '',
    // existente
    cnpjExistente: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.nome || !form.email || !form.senha) { setError('Preencha todos os campos obrigatórios'); return; }
    if (tab === 0 && !form.nomeLoja) { setError('Informe o nome da clínica'); return; }
    if (tab === 1 && !form.cnpjExistente) { setError('Informe o CNPJ da clínica'); return; }

    try {
      await register({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        cargo: tab === 0 ? 'proprietario' : form.cargo,
        nomeLoja: tab === 0 ? form.nomeLoja : undefined,
        cnpj: tab === 0 ? form.cnpj : undefined,
        cnpjExistente: tab === 1 ? form.cnpjExistente : undefined,
        tipoCadastro: tab === 0 ? 'nova' : 'existente',
      });
      setSuccess('Cadastro realizado! Faça login para continuar.');
      setTimeout(onSwitchToLogin, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar');
    }
  };

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 50, height: 50, borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)', mb: 1
        }}>
          <MedicalServices sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" fontWeight={700}>Criar conta</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="fullWidth">
        <Tab label="Nova Clínica" sx={{ fontSize: '0.8rem' }} />
        <Tab label="Entrar em Clínica" sx={{ fontSize: '0.8rem' }} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField fullWidth label="Seu nome *" value={form.nome} onChange={e => set('nome', e.target.value)} />
          <TextField fullWidth label="E-mail *" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          <TextField
            fullWidth label="Senha *"
            type={showPwd ? 'text' : 'password'}
            value={form.senha} onChange={e => set('senha', e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd(s => !s)} size="small">
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {tab === 0 ? (
            <>
              <TextField fullWidth label="Nome da Clínica *" value={form.nomeLoja} onChange={e => set('nomeLoja', e.target.value)} />
              <TextField fullWidth label="CNPJ" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </>
          ) : (
            <>
              <TextField fullWidth label="CNPJ da Clínica *" value={form.cnpjExistente} onChange={e => set('cnpjExistente', e.target.value)} placeholder="00.000.000/0000-00" />
              <TextField select fullWidth label="Seu cargo" value={form.cargo} onChange={e => set('cargo', e.target.value)}>
                {CARGOS.map(c => <MenuItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</MenuItem>)}
              </TextField>
            </>
          )}

          <Button type="submit" fullWidth variant="contained" size="large" disabled={isLoading} sx={{ height: 46, mt: 0.5 }}>
            {isLoading ? <CircularProgress size={22} color="inherit" /> : (tab === 0 ? 'Criar Clínica' : 'Entrar na Clínica')}
          </Button>
        </Box>
      </form>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">ou</Typography>
      </Divider>

      <Button fullWidth variant="outlined" onClick={onSwitchToLogin}>
        Já tenho conta — Fazer login
      </Button>
    </Box>
  );
};

export default RegisterScreen;