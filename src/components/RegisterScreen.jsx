import { useState, useContext } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress,
  Alert, MenuItem, Tabs, Tab, Divider, InputAdornment, IconButton
} from '@mui/material';
import { MedicalServices, Visibility, VisibilityOff } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

/**
 * RegisterScreen — compatível com o backend MultiClinic
 *
 * Tab 0 — Nova Clínica
 *   POST /clinicas/register → { nome (clínica), cnpj, email, senha, nomeLoja }
 *   O usuário criado recebe cargo = 'proprietario' automaticamente
 *
 * Tab 1 — Entrar em Clínica existente (colaborador)
 *   Este fluxo NÃO cria usuário via frontend por segurança.
 *   O gestor/proprietário cadastra colaboradores pelo painel de Configurações.
 *   Aqui apenas orientamos o colaborador.
 */

const CARGOS_LABEL = {
  gestor:      'Gestor',
  atendente:   'Atendente',
  dentista:    'Dentista',
  esteticista: 'Esteticista',
  financeiro:  'Financeiro',
};

const RegisterScreen = ({ onSwitchToLogin }) => {
  const { registerClinica, isLoading } = useContext(AuthContext);

  const [tab,     setTab]     = useState(0);
  const [showPwd, setShowPwd] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    // Proprietário
    nomeGestor: '',
    emailGestor: '',
    senhaGestor: '',
    // Clínica
    nomeClinica: '',
    cnpj: '',
    telefone: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Máscara de CNPJ: 00.000.000/0001-00
  const maskCNPJ = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.nomeGestor || !form.emailGestor || !form.senhaGestor) {
      setError('Preencha nome, e-mail e senha'); return;
    }
    if (!form.nomeClinica) {
      setError('Informe o nome da clínica'); return;
    }
    if (form.senhaGestor.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres'); return;
    }

    try {
      // POST /clinicas/register
      await registerClinica({
        nome:     form.nomeClinica,
        cnpj:     form.cnpj,
        email:    form.emailGestor,
        senha:    form.senhaGestor,
        telefone: form.telefone,
        // O proprietário é criado junto
        proprietario: {
          nome:  form.nomeGestor,
          email: form.emailGestor,
          senha: form.senhaGestor,
        },
      });

      setSuccess('Clínica registrada com sucesso! Faça login para continuar.');
      setTimeout(onSwitchToLogin, 2500);
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar clínica');
    }
  };

  return (
    <Box>
      {/* Logo */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 50, height: 50, borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)', mb: 1,
        }}>
          <MedicalServices sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" fontWeight={700}>Criar conta</Typography>
        <Typography variant="body2" color="text.secondary">MultiClinic</Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setError(''); setSuccess(''); }}
        variant="fullWidth"
        sx={{
          mb: 2,
          '& .MuiTab-root': { fontSize: '0.78rem', fontWeight: 600 },
          '& .Mui-selected': { color: '#2563EB' },
          '& .MuiTabs-indicator': { bgcolor: '#2563EB' },
        }}
      >
        <Tab label="Nova Clínica" />
        <Tab label="Sou Colaborador" />
      </Tabs>

      {error   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{success}</Alert>}

      {/* ── TAB 0: Nova Clínica ── */}
      {tab === 0 && (
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

            {/* Dados da Clínica */}
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5 }}>
              Dados da Clínica
            </Typography>

            <TextField
              fullWidth size="small"
              label="Nome da Clínica *"
              value={form.nomeClinica}
              onChange={e => set('nomeClinica', e.target.value)}
            />
            <TextField
              fullWidth size="small"
              label="CNPJ"
              value={form.cnpj}
              onChange={e => set('cnpj', maskCNPJ(e.target.value))}
              placeholder="00.000.000/0001-00"
              inputProps={{ maxLength: 18 }}
            />
            <TextField
              fullWidth size="small"
              label="Telefone"
              value={form.telefone}
              onChange={e => set('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
            />

            {/* Dados do Gestor */}
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 1 }}>
              Seus dados (Gestor)
            </Typography>

            <TextField
              fullWidth size="small"
              label="Seu nome *"
              value={form.nomeGestor}
              onChange={e => set('nomeGestor', e.target.value)}
            />
            <TextField
              fullWidth size="small"
              label="E-mail *"
              type="email"
              value={form.emailGestor}
              onChange={e => set('emailGestor', e.target.value)}
            />
            <TextField
              fullWidth size="small"
              label="Senha *"
              type={showPwd ? 'text' : 'password'}
              value={form.senhaGestor}
              onChange={e => set('senhaGestor', e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(s => !s)} size="small">
                      {showPwd ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={isLoading}
              sx={{ height: 46, mt: 0.5, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
            >
              {isLoading
                ? <CircularProgress size={22} color="inherit" />
                : 'Registrar Clínica'
              }
            </Button>
          </Box>
        </form>
      )}

      {/* ── TAB 1: Colaborador ── */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{
            p: 2, borderRadius: '10px',
            bgcolor: '#FFF8F0', border: '1px solid #FCD5A0',
          }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400E', mb: 0.5 }}>
              ⚠️ Colaboradores não se cadastram aqui
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#78350F', lineHeight: 1.6 }}>
              Dentistas, esteticistas, atendentes, financeiro e gestores são cadastrados
              pelo <strong>proprietário ou gestor</strong> da clínica, dentro do sistema,
              em <strong>Configurações → Equipe</strong>.
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderRadius: '10px', bgcolor: '#F0F9FF', border: '1px solid #BAE6FD' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0369A1', mb: 1 }}>
              Como funciona:
            </Typography>
            {[
              { cargo: 'Proprietário / Gestor', desc: 'Acessa com e-mail + CNPJ + senha da clínica' },
              { cargo: 'Dentista / Esteticista', desc: 'Acessa com e-mail e senha definidos pelo gestor. Vê apenas seus próprios pacientes e agenda.' },
              { cargo: 'Atendente', desc: 'Acessa com e-mail e senha. Gerencia agendamentos e cadastros.' },
              { cargo: 'Financeiro', desc: 'Acessa com e-mail e senha. Visualiza caixa e agendamentos.' },
            ].map(({ cargo, desc }) => (
              <Box key={cargo} sx={{ mb: 1, display: 'flex', gap: 1 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#0369A1', mt: '7px', flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0C4A6E' }}>{cargo}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#0369A1' }}>{desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Button
            fullWidth variant="contained" size="large"
            onClick={onSwitchToLogin}
            sx={{ height: 46, fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
          >
            Ir para o Login
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">ou</Typography>
      </Divider>

      <Button
        fullWidth variant="outlined"
        onClick={onSwitchToLogin}
        sx={{ height: 42, fontWeight: 600, borderColor: '#E2E8F0', color: '#475569' }}
      >
        Já tenho conta — Fazer login
      </Button>
    </Box>
  );
};

export default RegisterScreen;