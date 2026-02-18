import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
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
  Snackbar
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
  const { user, clinicName } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dados mockados para exemplo
  const [colaboradores, setColaboradores] = useState([
    {
      id: 1,
      nome: 'Ana Oliveira',
      email: 'ana.oliveira@clinica.com',
      telefone: '(11) 99999-9999',
      whatsapp: '(11) 99999-9999',
      cpf: '123.456.789-00',
      endereco: 'Rua das Flores, 123 - São Paulo/SP',
      cargo: 'gestor',
      biografia: ''
    },
    {
      id: 2,
      nome: 'Carlos Santos',
      email: 'carlos.santos@clinica.com',
      telefone: '(11) 98888-8888',
      whatsapp: '(11) 98888-8888',
      cpf: '987.654.321-00',
      endereco: 'Av. Paulista, 1000 - São Paulo/SP',
      cargo: 'financeiro',
      biografia: ''
    },
    {
      id: 3,
      nome: 'Mariana Costa',
      email: 'mariana.costa@clinica.com',
      telefone: '(11) 97777-7777',
      whatsapp: '(11) 97777-7777',
      cpf: '456.789.123-00',
      endereco: 'Rua Augusta, 500 - São Paulo/SP',
      cargo: 'atendente',
      biografia: ''
    },
    {
      id: 4,
      nome: 'Dra. Juliana Mendes',
      email: 'juliana.mendes@clinica.com',
      telefone: '(11) 96666-6666',
      whatsapp: '(11) 96666-6666',
      cpf: '789.123.456-00',
      endereco: 'Alameda Santos, 800 - São Paulo/SP',
      cargo: 'dentista',
      cro: '12345-SP',
      biografia: 'Especialista em Odontologia Estética e Reabilitação Oral. Formada pela USP com aperfeiçoamento em Lentes de Contato Dental.'
    }
  ]);

  const [novoColaborador, setNovoColaborador] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cpf: '',
    endereco: '',
    cargo: 'atendente',
    cro: '',
    biografia: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setNovoColaborador(user);
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
        cro: '',
        biografia: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleSaveColaborador = () => {
    if (editingUser) {
      // Editar existente
      setColaboradores(prev => prev.map(c => 
        c.id === editingUser.id ? { ...novoColaborador, id: c.id } : c
      ));
      setSnackbar({
        open: true,
        message: 'Colaborador atualizado com sucesso!',
        severity: 'success'
      });
    } else {
      // Adicionar novo
      const novoId = Math.max(...colaboradores.map(c => c.id)) + 1;
      setColaboradores(prev => [...prev, { ...novoColaborador, id: novoId }]);
      setSnackbar({
        open: true,
        message: 'Colaborador adicionado com sucesso!',
        severity: 'success'
      });
    }
    handleCloseDialog();
  };

  const handleDeleteColaborador = (id) => {
    setColaboradores(prev => prev.filter(c => c.id !== id));
    setSnackbar({
      open: true,
      message: 'Colaborador removido com sucesso!',
      severity: 'success'
    });
  };

  const handleChange = (e) => {
    setNovoColaborador({
      ...novoColaborador,
      [e.target.name]: e.target.value
    });
  };

  // Verifica se é gestor
  if (user?.cargo !== 'gestor') {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <AccountCircleIcon sx={{ fontSize: 80, color: '#D0DCE8', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ color: '#4A5568', fontWeight: 600 }}>
            Acesso Restrito
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Apenas gestores podem acessar as configurações do sistema.
          </Typography>
          <Chip 
            label={`Seu cargo: ${user?.cargo || 'Não informado'}`}
            sx={{ bgcolor: '#F0F4F8', color: '#4A5568' }}
          />
        </Paper>
      </Box>
    );
  }

  const filteredColaboradores = colaboradores.filter(c => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return c.cargo === 'atendente';
    if (tabValue === 2) return c.cargo === 'financeiro';
    if (tabValue === 3) return c.cargo === 'dentista';
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#4A5568' }}>
          ⚙️ Configurações
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
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
                  {clinicName || 'Não informado'}
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
                  <Chip label={`👑 Gestores: ${colaboradores.filter(c => c.cargo === 'gestor').length}`} size="small" />
                  <Chip label={`💰 Financeiro: ${colaboradores.filter(c => c.cargo === 'financeiro').length}`} size="small" />
                  <Chip label={`📋 Atendentes: ${colaboradores.filter(c => c.cargo === 'atendente').length}`} size="small" />
                  <Chip label={`🦷 Dentistas: ${colaboradores.filter(c => c.cargo === 'dentista').length}`} size="small" />
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
              <Tab label="Todos" />
              <Tab label="Atendentes" />
              <Tab label="Financeiro" />
              <Tab label="Dentistas" />
            </Tabs>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                {filteredColaboradores.map(colab => (
                  <Grid item xs={12} key={colab.id}>
                    <StyledCard>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: colab.cargo === 'gestor' ? '#A7C7E7' :
                                      colab.cargo === 'financeiro' ? '#C5E0C5' :
                                      colab.cargo === 'dentista' ? '#FFE5B4' : '#F9D7D7',
                              color: '#4A5568',
                              width: 56,
                              height: 56
                            }}>
                              {colab.nome.charAt(0)}
                            </Avatar>
                            
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {colab.nome}
                                </Typography>
                                <RoleChip 
                                  label={colab.cargo === 'gestor' ? '👑 Gestor' :
                                         colab.cargo === 'financeiro' ? '💰 Financeiro' :
                                         colab.cargo === 'dentista' ? '🦷 Dentista' : '📋 Atendente'}
                                  role={colab.cargo}
                                  size="small"
                                />
                              </Box>

                              <Grid container spacing={2} sx={{ mt: 1 }}>
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
                                    <Typography variant="body2">{colab.whatsapp}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BadgeIcon sx={{ fontSize: 18, color: '#C5E0C5' }} />
                                    <Typography variant="body2">CPF: {colab.cpf}</Typography>
                                  </Box>
                                </Grid>
                                {colab.cargo === 'dentista' && (
                                  <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <AssignmentIndIcon sx={{ fontSize: 18, color: '#B87C4A' }} />
                                      <Typography variant="body2">CRO: {colab.cro}</Typography>
                                    </Box>
                                  </Grid>
                                )}
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <LocationOnIcon sx={{ fontSize: 18, color: '#FFE5B4' }} />
                                    <Typography variant="body2">{colab.endereco}</Typography>
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

                          <Box>
                            <IconButton onClick={() => handleOpenDialog(colab)} size="small">
                              <EditIcon sx={{ fontSize: 20, color: '#A7C7E7' }} />
                            </IconButton>
                            <IconButton onClick={() => handleDeleteColaborador(colab.id)} size="small">
                              <DeleteIcon sx={{ fontSize: 20, color: '#F9D7D7' }} />
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
              <FormControl fullWidth>
                <InputLabel>Cargo *</InputLabel>
                <Select
                  name="cargo"
                  value={novoColaborador.cargo}
                  label="Cargo *"
                  onChange={handleChange}
                >
                  <MenuItem value="atendente">📋 Atendente</MenuItem>
                  <MenuItem value="financeiro">💰 Financeiro</MenuItem>
                  <MenuItem value="dentista">🦷 Dentista</MenuItem>
                  <MenuItem value="gestor">👑 Gestor</MenuItem>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#F9D7D7' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="telefone"
                label="Telefone *"
                value={novoColaborador.telefone}
                onChange={handleChange}
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
                label="WhatsApp *"
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
                label="CPF *"
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
                label="Endereço *"
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
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 30 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveColaborador}
            variant="contained"
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
            {editingUser ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={snackbar.severity}
          sx={{ borderRadius: 30 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;