import { useState, useContext } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Alert, InputAdornment, IconButton, Divider, Tabs, Tab
} from '@mui/material';
import { Visibility, VisibilityOff, MedicalServices } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

/**
 * LoginScreen — compatível com o backend MultiClinic
 *
 * Tab 0 — Usuário (dentista, atendente, gestor, etc.)
 *   POST /auth/login  →  { email, senha }
 *
 * Tab 1 — Clínica (proprietário, login com CNPJ)
 *   POST /auth/clinica/login  →  { email, cnpj, senha }
 */
const LoginScreen = ({ onSwitchToRegister }) => {
  const { login, loginClinica, isLoading } = useContext(AuthContext);

  const [tab,          setTab]          = useState(0); // 0 = usuário, 1 = clínica
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');

  const [form, setForm] = useState({ email: '', senha: '', cnpj: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.senha) {
      setError('Preencha e-mail e senha');
      return;
    }
    if (tab === 1 && !form.cnpj) {
      setError('Informe o CNPJ da clínica');
      return;
    }

    try {
      if (tab === 0) {
        // Login de usuário — email + senha
        await login(form.email, form.senha);
      } else {
        // Login da clínica — email + cnpj + senha
        await loginClinica(form.email, form.cnpj, form.senha);
      }
    } catch (err) {
      setError(err.message || 'Credenciais inválidas');
    }
  };

  return (
    <Box>
      {/* Logo */}
      <Box sx={{ textAlign: 'center', mb: 2.5 }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '16px',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)', mb: 1.5,
        }}>
          <MedicalServices sx={{ color: '#fff', fontSize: 28 }} />
        </Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">MultiClinic</Typography>
        <Typography variant="body2" color="text.secondary">Faça login para continuar</Typography>
      </Box>

      {/* Toggle: Usuário / Clínica */}
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setError(''); }}
        variant="fullWidth"
        sx={{
          mb: 2.5,
          '& .MuiTab-root': { fontSize: '0.78rem', fontWeight: 600 },
          '& .Mui-selected': { color: '#2563EB' },
          '& .MuiTabs-indicator': { bgcolor: '#2563EB' },
        }}
      >
        <Tab label="Colaborador" />
        <Tab label="Clínica (proprietário)" />
      </Tabs>

      {/* Descrição da aba */}
      <Box sx={{
        mb: 2, px: 1.5, py: 1, borderRadius: '8px',
        bgcolor: tab === 0 ? '#EFF6FF' : '#F0FDF4',
        border: `1px solid ${tab === 0 ? '#BFDBFE' : '#A7F3D0'}`,
      }}>
        <Typography sx={{ fontSize: '0.72rem', color: tab === 0 ? '#1E40AF' : '#065F46' }}>
          {tab === 0
            ? '👤 Dentista, esteticista, atendente, gestor ou financeiro — use seu e-mail e senha cadastrados pelo gestor.'
            : '🏥 Acesso com CNPJ — para o proprietário ou gestor que registrou a clínica.'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>

          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            autoComplete="email"
            size="small"
          />

          {/* Campo CNPJ — só aparece na aba Clínica */}
          {tab === 1 && (
            <TextField
              fullWidth
              label="CNPJ da Clínica"
              value={form.cnpj}
              onChange={e => set('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              size="small"
              inputProps={{ maxLength: 18 }}
            />
          )}

          <TextField
            fullWidth
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={form.senha}
            onChange={e => set('senha', e.target.value)}
            autoComplete="current-password"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(s => !s)} edge="end" size="small">
                    {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
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
            sx={{
              height: 46, fontWeight: 700, fontSize: '0.9rem',
              bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' },
            }}
          >
            {isLoading
              ? <CircularProgress size={22} color="inherit" />
              : tab === 0 ? 'Entrar' : 'Entrar como Clínica'
            }
          </Button>
        </Box>
      </form>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">ou</Typography>
      </Divider>

      <Button
        fullWidth variant="outlined"
        onClick={onSwitchToRegister}
        sx={{ height: 42, fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}
      >
        Registrar nova clínica
      </Button>
    </Box>
  );
};

export default LoginScreen;