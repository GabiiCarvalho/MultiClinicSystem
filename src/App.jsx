import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PatientsProvider } from "./contexts/PatientsContext";
import { AuthProvider } from "./contexts/AuthContext";
import MainTabs from "./pages/MainTabs";
import { ThemeProvider } from "@mui/material/styles";
import { pastelTheme } from "./theme/theme";
import CssBaseline from '@mui/material/CssBaseline';

function App() {
  return (
    <ThemeProvider theme={pastelTheme}>
      <CssBaseline />
      <AuthProvider>
        <PatientsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="*" element={<MainTabs />} />
            </Routes>
          </BrowserRouter>
        </PatientsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;