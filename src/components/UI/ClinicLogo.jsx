import { Box, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import logo from '../../assets/logo.jpg';

const LogoContainer = styled(Box)(({ size = 60 }) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  border: '2px solid rgba(255,255,255,0.8)',
  backgroundColor: '#FFFFFF',
}));

const LogoImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const ClinicLogo = ({ size = 60, variant = 'circular' }) => {
  return (
    <LogoContainer size={size}>
      <LogoImage src={logo} alt="Clinic Logo" />
    </LogoContainer>
  );
};

export const ClinicAvatar = ({ size = 60, src }) => {
  return (
    <Avatar
      src={src || logo}
      alt="Clinic Logo"
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.8)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      }}
    />
  );
};