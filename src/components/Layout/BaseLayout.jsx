import { Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const GradientBackground = styled(Box)({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #FAF9F8 0%, #FFFFFF 100%)',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: 'linear-gradient(180deg, rgba(167,199,231,0.1) 0%, rgba(249,215,215,0.1) 100%)',
    pointerEvents: 'none',
  },
});

const ContentContainer = styled(Container)({
  position: 'relative',
  zIndex: 1,
  paddingTop: 32,
  paddingBottom: 32,
});

export const BaseLayout = ({
  children,
  maxWidth = "xl",
  disablePadding = false,
}) => {
  return (
    <GradientBackground>
      <ContentContainer
        maxWidth={maxWidth}
        sx={{
          paddingTop: disablePadding ? 0 : 4,
          paddingBottom: disablePadding ? 0 : 4,
        }}
      >
        {children}
      </ContentContainer>
    </GradientBackground>
  );
};