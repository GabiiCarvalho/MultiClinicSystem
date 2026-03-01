import { useState } from 'react';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import { ViewKanban, CalendarMonth } from '@mui/icons-material';
import PatientKanban from '../components/PatientKanban';
import CalendarSaaS from '../components/CalendarSaaS';

const EnterpriseBoard = () => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileView, setMobileView] = useState('kanban');

  // ── Mobile: toggle ──
  if (isMobile) {
    return (
      <Box sx={{ height: 'calc(100vh - 108px)', display: 'flex', flexDirection: 'column', bgcolor: '#F9FAFB' }}>
        <Box sx={{
          display: 'flex', bgcolor: '#fff',
          borderBottom: '1px solid #E5E7EB',
          p: '6px 8px', gap: 1, flexShrink: 0,
        }}>
          {[
            { id: 'kanban',   label: 'Fluxo',  Icon: ViewKanban   },
            { id: 'calendar', label: 'Agenda', Icon: CalendarMonth },
          ].map(({ id, label, Icon }) => (
            <Button key={id} fullWidth size="small"
              startIcon={<Icon sx={{ fontSize: 15 }} />}
              onClick={() => setMobileView(id)}
              sx={{
                py: 0.7, fontSize: '0.73rem', borderRadius: '8px',
                bgcolor: mobileView === id ? '#EFF6FF' : 'transparent',
                color:   mobileView === id ? '#2563EB'  : '#6B7280',
                border: `1px solid ${mobileView === id ? '#93C5FD' : '#E5E7EB'}`,
                fontWeight: mobileView === id ? 700 : 400,
              }}>
              {label}
            </Button>
          ))}
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {mobileView === 'kanban' ? <PatientKanban /> : <CalendarSaaS />}
        </Box>
      </Box>
    );
  }

  // ── Desktop / Tablet: split view ──
  return (
    <Box sx={{
      height: 'calc(100vh - 108px)',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: '#F9FAFB',
    }}>
      {/* ESQUERDA — Kanban estilo Jira */}
      <Box sx={{
        width: { md: '42%', lg: '38%', xl: '35%' },
        flexShrink: 0,
        borderRight: '1px solid #E5E7EB',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#F9FAFB',
      }}>
        <PatientKanban />
      </Box>

      {/* DIREITA — Calendário claro */}
      <Box sx={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
      }}>
        <CalendarSaaS />
      </Box>
    </Box>
  );
};

export default EnterpriseBoard;