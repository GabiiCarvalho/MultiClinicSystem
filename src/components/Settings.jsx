import { useState, useContext, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

const StyledCard = styled(Card)({
  borderRadius: 16,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
  },
});

const RoleChip = styled(Chip)(({ role }) => {
  const colors = {
    proprietario: { bg: '#9C27B0', color: '#FFFFFF' },
    gestor: { bg: '#A7C7E7', color: '#4A5568' },
    financeiro: { bg: '#C5E0C5', color: '#4F7A4F' },
    atendente: { bg: '#F9D7D7', color: '#A65D5D' },
    dentista: { bg: '#FFE5B4', color: '#B87C4A' }
  };
  const colorSet = colors[role] || colors.atendente;
  
  return {
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    fontWeight: 600,
    borderRadius: 20,
  };
});

const Settings = () => {
  const { user, clinicName } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Estado para novo/edição de colaborador
  const [novoColaborador, setNovoColaborador] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cpf: '',
    endereco: '',
    cargo: 'atendente',
    especialidade: '',
    cro: '',
    biografia: '',
    senha: ''
  });

  // Carregar colaboradores da API
  const carregarColaboradores = async () => {
    setLoading(true);
    try {
      const response = await api.get('/pessoas/colaboradores');
      console.log('Colaboradores carregados:', response.data);
      setColaboradores(response.data);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      showSnackbar('Erro ao carregar colaboradores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarColaboradores();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (colaborador = null) => {
    if (colaborador) {
      setEditingUser(colaborador);
      setNovoColaborador({
        nome: colaborador.nome || '',
        email: colaborador.email || '',
        telefone: colaborador.telefone || '',
        whatsapp: colaborador.whatsapp || colaborador.telefone || '',
        cpf: colaborador.cpf || '',
        endereco: colaborador.endereco || '',
        cargo: colaborador.cargo || 'atendente',
        especialidade: colaborador.especialidade || '',
        cro: colaborador.cro || '',
        biografia: colaborador.biografia || '',
        senha: '' // Senha não vem do backend
      });
    } else {
      setEditingUser(null);
      setNovoColaborador({
        nome: '',
        email: '',
        telefone: '',
        whatsapp: '',
        cpf: '',
        endereco: '',
        cargo: 'atendente',
        especialidade: '',
        cro: '',
        biografia: '',
        senha: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSaveColaborador = async () => {
    // Validações básicas
    if (!novoColaborador.nome || !novoColaborador.email || !novoColaborador.telefone) {
      showSnackbar('Preencha nome, email e telefone!', 'error');
      return;
    }

    if (!editingUser && !novoColaborador.senha) {
      showSnackbar('Senha é obrigatória para novo colaborador!', 'error');
      return;
    }

    if (novoColaborador.cargo === 'dentista' && !novoColaborador.cro) {
      showSnackbar('CRO é obrigatório para dentistas!', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        // Atualizar colaborador existente
        await api.put(`/pessoas/colaboradores/${editingUser.id}`, novoColaborador);
        showSnackbar('Colaborador atualizado com sucesso!');
      } else {
        // Criar novo colaborador
        await api.post('/pessoas/colaboradores', novoColaborador);
        showSnackbar('Colaborador adicionado com sucesso!');
      }
      
      // Recarregar lista
      await carregarColaboradores();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar colaborador:', error);
      const mensagem = error.response?.data?.error || 'Erro ao salvar colaborador';
      showSnackbar(mensagem, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColaborador = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este colaborador?')) return;

    setLoading(true);
    try {
      await api.delete(`/pessoas/colaboradores/${id}`);
      showSnackbar('Colaborador removido com sucesso!');
      await carregarColaboradores();
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      showSnackbar('Erro ao remover colaborador', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setNovoColaborador({
      ...novoColaborador,
      [e.target.name]: e.target.value
    });
  };

  const getRoleLabel = (cargo) => {
    const labels = {
      proprietario: '👑 Proprietário',
      gestor: '👑 Gestor',
      financeiro: '💰 Financeiro',
      atendente: '📋 Atendente',
      dentista: '🦷 Dentista'
    };
    return labels[cargo] || cargo;
  };

  // Verificar permissão (gestor ou proprietário)
  const temPermissao = () => {
    const cargo = user?.cargo || '';
    return cargo === 'gestor' || cargo === 'proprietario';
  };

  if (!temPermissao()) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <AccountCircleIcon sx={{ fontSize: 80, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ color: '#4A5568', fontWeight: 600 }}>
            Acesso Restrito
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Apenas gestores e proprietários podem acessar as configurações do sistema.
          </Typography>
          <Chip 
            label={`Seu cargo: ${getRoleLabel(user?.cargo) || 'Não informado'}`}
            sx={{ bgcolor: '#F0F4F8', color: '#4A5568' }}
          />
        </Paper>
      </Box>
    );
  }

  const filteredColaboradores = colaboradores.filter(c => {
    const cargo = c.cargo || '';
    if (tabValue === 0) return true;
    if (tabValue === 1) return cargo === 'atendente';
    if (tabValue === 2) return cargo === 'financeiro';
    if (tabValue === 3) return cargo === 'dentista';
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#4A5568' }}>
          ⚙️ Configurações - {clinicName || 'Clínica'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={carregarColaboradores}
            disabled={loading}
            sx={{ borderRadius: 30 }}
          >
            Recarregar
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={{
              borderRadius: 30,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
              color: '#4A5568',
              '&:hover': {
                background: 'linear-gradient(135deg, #8FB0D0 0%, #E5B7B7 100%)',
              },
            }}
          >
            Novo Colaborador
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Informações da Clínica
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Nome da Clínica</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {clinicName || user?.loja_nome || 'Não informado'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Usuário Logado</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.nome} ({getRoleLabel(user?.cargo)})
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total de Colaboradores</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {colaboradores.length} pessoas
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Distribuição</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`👑 Proprietários: ${colaboradores.filter(c => c.cargo === 'proprietario').length}`} 
                    size="small" 
                    sx={{ bgcolor: '#9C27B0', color: 'white' }}
                  />
                  <Chip 
                    label={`👑 Gestores: ${colaboradores.filter(c => c.cargo === 'gestor').length}`} 
                    size="small" 
                    sx={{ bgcolor: '#A7C7E7', color: '#4A5568' }}
                  />
                  <Chip 
                    label={`💰 Financeiro: ${colaboradores.filter(c => c.cargo === 'financeiro').length}`} 
                    size="small" 
                    sx={{ bgcolor: '#C5E0C5', color: '#4F7A4F' }}
                  />
                  <Chip 
                    label={`📋 Atendentes: ${colaboradores.filter(c => c.cargo === 'atendente').length}`} 
                    size="small" 
                    sx={{ bgcolor: '#F9D7D7', color: '#A65D5D' }}
                  />
                  <Chip 
                    label={`🦷 Dentistas: ${colaboradores.filter(c => c.cargo === 'dentista').length}`} 
                    size="small" 
                    sx={{ bgcolor: '#FFE5B4', color: '#B87C4A' }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: '1px solid #F0F0F0',
                '& .MuiTab-root': { py: 2 }
              }}
            >
              <Tab label={`Todos (${colaboradores.length})`} />
              <Tab label={`Atendentes (${colaboradores.filter(c => c.cargo === 'atendente').length})`} />
              <Tab label={`Financeiro (${colaboradores.filter(c => c.cargo === 'financeiro').length})`} />
              <Tab label={`Dentistas (${colaboradores.filter(c => c.cargo === 'dentista').length})`} />
            </Tabs>

            <Box sx={{ p: 3, maxHeight: '600px', overflow: 'auto' }}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {!loading && filteredColaboradores.length === 0 && (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography color="text.secondary">
                    Nenhum colaborador encontrado nesta categoria.
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {filteredColaboradores.map(colab => (
                  <Grid item xs={12} key={colab.id}>
                    <StyledCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                            <Avatar sx={{ 
                              bgcolor: colab.cargo === 'proprietario' ? '#9C27B0' :
                                      colab.cargo === 'gestor' ? '#A7C7E7' :
                                      colab.cargo === 'financeiro' ? '#C5E0C5' :
                                      colab.cargo === 'dentista' ? '#FFE5B4' : '#F9D7D7',
                              color: colab.cargo === 'proprietario' ? '#FFFFFF' : '#4A5568',
                              width: 56,
                              height: 56
                            }}>
                              {colab.nome?.charAt(0).toUpperCase() || '?'}
                            </Avatar>
                            
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {colab.nome}
                                </Typography>
                                <RoleChip 
                                  label={getRoleLabel(colab.cargo)}
                                  role={colab.cargo}
                                  size="small"
                                />
                              </Box>

                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmailIcon sx={{ fontSize: 18, color: '#A7C7E7' }} />
                                    <Typography variant="body2">{colab.email}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneIcon sx={{ fontSize: 18, color: '#F9D7D7' }} />
                                    <Typography variant="body2">{colab.telefone}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WhatsAppIcon sx={{ fontSize: 18, color: '#25D366' }} />
                                    <Typography variant="body2">{colab.whatsapp || colab.telefone}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BadgeIcon sx={{ fontSize: 18, color: '#C5E0C5' }} />
                                    <Typography variant="body2">CPF: {colab.cpf || 'Não informado'}</Typography>
                                  </Box>
                                </Grid>
                                {colab.cargo === 'dentista' && (
                                  <>
                                    <Grid item xs={12} sm={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AssignmentIndIcon sx={{ fontSize: 18, color: '#B87C4A' }} />
                                        <Typography variant="body2">CRO: {colab.cro || 'Não informado'}</Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon sx={{ fontSize: 18, color: '#A7C7E7' }} />
                                        <Typography variant="body2">Especialidade: {colab.especialidade || 'Não informada'}</Typography>
                                      </Box>
                                    </Grid>
                                  </>
                                )}
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon sx={{ fontSize: 18, color: '#FFE5B4' }} />
                                    <Typography variant="body2">{colab.endereco || 'Endereço não informado'}</Typography>
                                  </Box>
                                </Grid>
                                {colab.biografia && (
                                  <Grid item xs={12}>
                                    <Box sx={{ 
                                      mt: 1, 
                                      p: 1.5, 
                                      bgcolor: '#F9FAFB', 
                                      borderRadius: 2,
                                      border: '1px solid #F0F0F0'
                                    }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <DescriptionIcon sx={{ fontSize: 16 }} /> Biografia:
                                      </Typography>
                                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {colab.biografia}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton onClick={() => handleOpenDialog(colab)} size="small" sx={{ color: '#A7C7E7' }}>
                              <EditIcon />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteColaborador(colab.id)} size="small" sx={{ color: '#F9D7D7' }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Cadastro/Edição */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="nome"
                label="Nome Completo *"
                value={novoColaborador.nome}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon sx={{ color: '#A7C7E7' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Cargo *</InputLabel>
                <Select
                  name="cargo"
                  value={novoColaborador.cargo}
                  label="Cargo *"
                  onChange={handleChange}
                >
                  <MenuItem value="proprietario">👑 Proprietário</MenuItem>
                  <MenuItem value="gestor">👑 Gestor</MenuItem>
                  <MenuItem value="financeiro">💰 Financeiro</MenuItem>
                  <MenuItem value="atendente">📋 Atendente</MenuItem>
                  <MenuItem value="dentista">🦷 Dentista</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="email"
                label="Email *"
                type="email"
                value={novoColaborador.email}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#F9D7D7' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {!editingUser && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="senha"
                  label="Senha *"
                  type="password"
                  value={novoColaborador.senha}
                  onChange={handleChange}
                  required={!editingUser}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#C5E0C5' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="telefone"
                label="Telefone *"
                value={novoColaborador.telefone}
                onChange={handleChange}
                required
                placeholder="(00) 00000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#C5E0C5' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="whatsapp"
                label="WhatsApp"
                value={novoColaborador.whatsapp}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WhatsAppIcon sx={{ color: '#25D366' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="cpf"
                label="CPF"
                value={novoColaborador.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: '#FFE5B4' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="endereco"
                label="Endereço"
                value={novoColaborador.endereco}
                onChange={handleChange}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#D4E6F1' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {novoColaborador.cargo === 'dentista' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="cro"
                    label="CRO *"
                    value={novoColaborador.cro}
                    onChange={handleChange}
                    required
                    placeholder="00000-UF"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AssignmentIndIcon sx={{ color: '#B87C4A' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="especialidade"
                    label="Especialidade"
                    value={novoColaborador.especialidade}
                    onChange={handleChange}
                    placeholder="Ex: Odontologia Geral, Estética, etc."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon sx={{ color: '#A7C7E7' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="biografia"
                    label="Biografia / Qualificações"
                    value={novoColaborador.biografia}
                    onChange={handleChange}
                    multiline
                    rows={4}
                    placeholder="Especialidades, formações, experiências..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon sx={{ color: '#A7C7E7' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 30 }} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveColaborador}
            variant="contained"
            disabled={loading}
            sx={{
              borderRadius: 30,
              px: 4,
              background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
              color: '#4A5568',
              '&:hover': {
                background: 'linear-gradient(135deg, #8FB0D0 0%, #E5B7B7 100%)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : (editingUser ? 'Salvar' : 'Adicionar')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 30 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;