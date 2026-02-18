import { Box, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ClinicLogo } from './UI/ClinicLogo';
import { useEffect, useState } from 'react';

const SplashContainer = styled(Box)({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #FAF9F8 0%, #FFFFFF 100%)',
  position: 'relative',
});

const LogoWrapper = styled(Box)({
  animation: 'pulse 2s infinite ease-in-out',
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '50%': {
      transform: 'scale(1.05)',
      opacity: 0.9,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
});

export const SplashScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(() => onFinish(), 500);
          return 100;
        }
        return Math.min(oldProgress + 10, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <SplashContainer>
      <LogoWrapper>
        <ClinicLogo size={120} />
      </LogoWrapper>
      
      <Typography variant="h4" sx={{ mt: 3, fontWeight: 600, color: '#4A5568' }}>
        MultiClinic
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Sistema de Gestão para Clínicas
      </Typography>
      
      <CircularProgress 
        variant="determinate" 
        value={progress} 
        size={50}
        sx={{
          color: '#A7C7E7',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
    </SplashContainer>
  );
};