import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PatientsProvider } from "./contexts/PatientsContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AppointmentsProvider } from "./contexts/AppointmentsContext";
import MainTabs from "./pages/MainTabs";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme/theme";
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PatientsProvider>
          <AppointmentsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<MainTabs />} />
              </Routes>
            </BrowserRouter>
          </AppointmentsProvider>
        </PatientsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;