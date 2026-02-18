import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ClinicLogo } from './UI/ClinicLogo';

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #FAF9F8 0%, #FFFFFF 100%)',
  position: 'relative',
  padding: '20px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '400px',
    background: 'linear-gradient(180deg, rgba(167,199,231,0.2) 0%, rgba(249,215,215,0.2) 100%)',
    pointerEvents: 'none',
  },
});

const StyledPaper = styled(Paper)({
  width: '100%',
  maxWidth: 600,
  padding: 40,
  borderRadius: 32,
  backgroundColor: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.02)',
  border: '1px solid rgba(255,255,255,0.5)',
  position: 'relative',
  zIndex: 1,
});

const LogoWrapper = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 24,
});

const StyledStepIcon = styled(Box)(({ active, completed }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: completed ? '#C5E0C5' : active ? '#A7C7E7' : '#F0F0F0',
  color: completed ? '#4F7A4F' : active ? '#4A5568' : '#999',
  fontSize: '0.9rem',
  fontWeight: 600,
}));

const FormSection = styled(Box)({
  marginTop: 24,
  marginBottom: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

const SectionTitle = styled(Typography)({
  fontWeight: 600,
  marginBottom: 8,
  color: '#4A5568',
  fontSize: '1.25rem',
});

const SectionSubtitle = styled(Typography)({
  color: '#718096',
  marginBottom: 16,
});

const StyledTextField = styled(TextField)({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    '&:hover': {
      backgroundColor: '#FFFFFF',
    },
    '&.Mui-focused': {
      backgroundColor: '#FFFFFF',
    },
  },
});

const RegisterScreen = ({ onSwitchToLogin }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [tipoCadastro, setTipoCadastro] = useState('nova'); // 'nova' ou 'existente'
  
  const [formData, setFormData] = useState({
    // Dados do Usuário
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cargo: 'atendente', // gestor, financeiro, atendente, dentista
    
    // Dados da Clínica (para nova clínica)
    clinicName: '',
    cnpj: '',
    address: '',
    
    // CNPJ para vincular a clínica existente
    cnpjExistente: '',
    
    // Dados específicos para dentista
    especialidade: '',
    cro: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, isLoading } = useContext(AuthContext);

  const steps = ['Tipo de Cadastro', 'Dados do Usuário', 'Dados da Clínica', 'Revisão'];

  const getStepsByType = () => {
    if (tipoCadastro === 'nova') {
      return ['Tipo de Cadastro', 'Dados do Usuário', 'Dados da Clínica', 'Revisão'];
    } else {
      return ['Tipo de Cadastro', 'Dados do Usuário', 'Vincular Clínica', 'Revisão'];
    }
  };

  const steps2 = getStepsByType();

  const handleNext = () => {
    if (activeStep === 0) {
      // Tipo de cadastro selecionado
      if (!tipoCadastro) {
        setError('Selecione o tipo de cadastro');
        return;
      }
    } else if (activeStep === 1) {
      // Validar dados do usuário
      if (!formData.name || !formData.email || !formData.password || !formData.phone || !formData.cargo) {
        setError('Preencha todos os campos obrigatórios do usuário');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (formData.cargo === 'dentista' && (!formData.especialidade || !formData.cro)) {
        setError('Dentista precisa preencher especialidade e CRO');
        return;
      }
    } else if (activeStep === 2) {
      if (tipoCadastro === 'nova') {
        // Validar dados da nova clínica
        if (!formData.clinicName || !formData.cnpj || !formData.address) {
          setError('Preencha todos os dados da clínica');
          return;
        }
      } else {
        // Validar CNPJ para vincular
        if (!formData.cnpjExistente) {
          setError('Preencha o CNPJ da clínica');
          return;
        }
      }
    }
    
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    
    try {
      // Prepara os dados para envio baseado no tipo de cadastro
      const dadosEnvio = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        cargo: formData.cargo,
      };

      if (tipoCadastro === 'nova') {
        dadosEnvio.clinicName = formData.clinicName;
        dadosEnvio.cnpj = formData.cnpj;
        dadosEnvio.address = formData.address;
      } else {
        dadosEnvio.cnpj = formData.cnpjExistente;
      }

      if (formData.cargo === 'dentista') {
        dadosEnvio.especialidade = formData.especialidade;
        dadosEnvio.cro = formData.cro;
      }

      await register(dadosEnvio);
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 3000);
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FormSection>
            <SectionTitle variant="h6">
              Tipo de Cadastro
            </SectionTitle>
            <SectionSubtitle variant="body2">
              Escolha se você é o primeiro usuário da clínica ou vai se vincular a uma já existente
            </SectionSubtitle>

            <RadioGroup
              value={tipoCadastro}
              onChange={(e) => setTipoCadastro(e.target.value)}
            >
              <FormControlLabel 
                value="nova" 
                control={<Radio />} 
                label="Sou o primeiro usuário - Quero cadastrar minha clínica" 
              />
              <FormControlLabel 
                value="existente" 
                control={<Radio />} 
                label="Já tenho uma clínica cadastrada - Quero me vincular pelo CNPJ" 
              />
            </RadioGroup>
          </FormSection>
        );

      case 1:
        return (
          <FormSection>
            <SectionTitle variant="h6">
              Dados do Usuário
            </SectionTitle>
            <SectionSubtitle variant="body2">
              Informações da pessoa que irá acessar o sistema
            </SectionSubtitle>

            <StyledTextField
              name="name"
              label="Nome Completo *"
              value={formData.name}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: '#A7C7E7' }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              name="email"
              label="Email *"
              type="email"
              value={formData.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#F9D7D7' }} />
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              name="phone"
              label="Telefone *"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: '#FFE5B4' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Cargo *</InputLabel>
              <Select
                name="cargo"
                value={formData.cargo}
                label="Cargo *"
                onChange={handleChange}
                sx={{ borderRadius: 12 }}
              >
                <MenuItem value="gestor">👑 Gestor (Acesso total)</MenuItem>
                <MenuItem value="financeiro">💰 Financeiro (Caixa e relatórios)</MenuItem>
                <MenuItem value="atendente">📋 Atendente (Recepção e agendamentos)</MenuItem>
                <MenuItem value="dentista">🦷 Dentista (Apenas seus pacientes)</MenuItem>
              </Select>
              <FormHelperText>Selecione sua função na clínica</FormHelperText>
            </FormControl>

            {formData.cargo === 'dentista' && (
              <>
                <StyledTextField
                  name="especialidade"
                  label="Especialidade *"
                  value={formData.especialidade}
                  onChange={handleChange}
                  placeholder="Ex: Odontologia Geral, Estética, Cirurgia..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#C5E0C5' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <StyledTextField
                  name="cro"
                  label="CRO *"
                  value={formData.cro}
                  onChange={handleChange}
                  placeholder="Ex: 12345-SC"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AssignmentIndIcon sx={{ color: '#D4E6F1' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}

            <StyledTextField
              name="password"
              label="Senha *"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#C5E0C5' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <StyledTextField
              name="confirmPassword"
              label="Confirmar Senha *"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#D4E6F1' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </FormSection>
        );

      case 2:
        if (tipoCadastro === 'nova') {
          return (
            <FormSection>
              <SectionTitle variant="h6">
                Dados da Clínica
              </SectionTitle>
              <SectionSubtitle variant="body2">
                Informações da sua clínica (primeiro cadastro)
              </SectionSubtitle>

              <StyledTextField
                name="clinicName"
                label="Nome da Clínica *"
                value={formData.clinicName}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#A7C7E7' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                name="cnpj"
                label="CNPJ *"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentIndIcon sx={{ color: '#F9D7D7' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                name="address"
                label="Endereço Completo *"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: '#C5E0C5' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </FormSection>
          );
        } else {
          return (
            <FormSection>
              <SectionTitle variant="h6">
                Vincular à Clínica Existente
              </SectionTitle>
              <SectionSubtitle variant="body2">
                Informe o CNPJ da clínica onde você trabalha
              </SectionSubtitle>

              <StyledTextField
                name="cnpjExistente"
                label="CNPJ da Clínica *"
                value={formData.cnpjExistente}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AssignmentIndIcon sx={{ color: '#A7C7E7' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Ao informar o CNPJ, você será vinculado à clínica já existente e terá acesso 
                aos mesmos pacientes, procedimentos e agendamentos que os outros funcionários.
              </Alert>
            </FormSection>
          );
        }

      case 3:
        return (
          <FormSection>
            <SectionTitle variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
              Revise os dados antes de finalizar
            </SectionTitle>

            <Paper sx={{ p: 3, bgcolor: '#F9FAFB', borderRadius: 3, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#A7C7E7' }}>
                Dados do Usuário
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Nome</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formData.name || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formData.email || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Telefone</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formData.phone || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Cargo</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formData.cargo === 'gestor' ? '👑 Gestor' :
                     formData.cargo === 'financeiro' ? '💰 Financeiro' :
                     formData.cargo === 'atendente' ? '📋 Atendente' :
                     '🦷 Dentista'}
                  </Typography>
                </Box>
                {formData.cargo === 'dentista' && (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Especialidade</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.especialidade || '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">CRO</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.cro || '—'}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>

            <Paper sx={{ p: 3, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#F9D7D7' }}>
                {tipoCadastro === 'nova' ? 'Dados da Clínica (Nova)' : 'Vínculo com Clínica'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {tipoCadastro === 'nova' ? (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Nome da Clínica</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.clinicName || '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">CNPJ</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.cnpj || '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Endereço</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formData.address || '—'}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">CNPJ da Clínica</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formData.cnpjExistente || '—'}
                    </Typography>
                    <Typography variant="body2" color="info.main" sx={{ mt: 1 }}>
                      Você será vinculado à clínica existente com este CNPJ
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </FormSection>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <GradientBackground>
        <StyledPaper sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: '#C5E0C5', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#4F7A4F' }}>
            Cadastro Realizado com Sucesso!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Você será redirecionado para a tela de login em instantes...
          </Typography>
          <CircularProgress size={30} sx={{ color: '#A7C7E7' }} />
        </StyledPaper>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StyledPaper>
        <LogoWrapper>
          <ClinicLogo size={80} />
        </LogoWrapper>
        
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
          {tipoCadastro === 'nova' ? 'Cadastro da Clínica' : 'Vincular à Clínica'}
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          {tipoCadastro === 'nova' 
            ? 'Crie sua clínica e defina os usuários que terão acesso'
            : 'Informe seus dados e o CNPJ da clínica para se vincular'}
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps2.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconComponent={(props) => (
                  <StyledStepIcon active={props.active} completed={props.completed}>
                    {props.completed ? '✓' : index + 1}
                  </StyledStepIcon>
                )}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 20,
              backgroundColor: '#FFE0E0',
              color: '#A65D5D',
              '& .MuiAlert-icon': { color: '#A65D5D' }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              sx={{ 
                borderRadius: 30,
                px: 4,
                py: 1.5,
                color: activeStep === 0 ? '#CCC' : '#4A5568',
                borderColor: activeStep === 0 ? '#F0F0F0' : '#A7C7E7',
                '&:hover': {
                  borderColor: activeStep === 0 ? '#F0F0F0' : '#8FB0D0',
                  backgroundColor: activeStep === 0 ? 'transparent' : '#F9FAFB',
                },
              }}
            >
              Voltar
            </Button>
            
            {activeStep === steps2.length - 1 ? (
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={isLoading}
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 30,
                  background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
                  color: '#4A5568',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #8FB0D0 0%, #E5B7B7 100%)',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ color: '#4A5568' }} /> : 'Finalizar Cadastro'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                sx={{
                  px: 5,
                  py: 1.5,
                  borderRadius: 30,
                  background: 'linear-gradient(135deg, #A7C7E7 0%, #F9D7D7 100%)',
                  color: '#4A5568',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #8FB0D0 0%, #E5B7B7 100%)',
                  },
                }}
              >
                Próximo
              </Button>
            )}
          </Box>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            ou
          </Typography>
        </Divider>

        <Button
          fullWidth
          onClick={onSwitchToLogin}
          sx={{
            py: 1.5,
            borderRadius: 40,
            border: '1px solid #F0F0F0',
            color: '#4A5568',
            '&:hover': {
              borderColor: '#A7C7E7',
              backgroundColor: '#FAFAFA',
            },
          }}
        >
          Já tem uma conta? Faça login
        </Button>
      </StyledPaper>
    </GradientBackground>
  );
};

export default RegisterScreen;