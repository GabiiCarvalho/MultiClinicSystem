import { useState } from 'react';
import { Box, Paper, Fade } from '@mui/material';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: 4
        }}
      >
        <Fade in timeout={400}>
          <Box>
            {isLogin ? (
              <LoginScreen
                onSwitchToRegister={() => setIsLogin(false)}
              />
            ) : (
              <RegisterScreen
                onSwitchToLogin={() => setIsLogin(true)}
              />
            )}
          </Box>
        </Fade>
      </Paper>
    </Box>
  );
};

export default AuthScreen;