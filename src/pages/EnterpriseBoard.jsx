import { Box, Grid, Paper } from "@mui/material";
import PatientKanban from "./PatientKanban";
import CalendarSaaS from "./CalendarSaaS";

const EnterpriseBoard = () => {
  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <Grid container sx={{ height: "100%" }}>

        {/* ESQUERDA - DASHBOARD GESTOR */}
        <Grid item xs={4} sx={{ bgcolor: "#0f172a", p: 2 }}>
          <PatientKanban />
        </Grid>

        {/* DIREITA - CALENDÁRIO */}
        <Grid item xs={8} sx={{ bgcolor: "#f8fafc", p: 3 }}>
          <CalendarSaaS />
        </Grid>

      </Grid>
    </Box>
  );
};

export default EnterpriseBoard;