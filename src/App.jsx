import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PatientsProvider } from "./contexts/PatientsContext";
import MainTabs from "./pages/MainTabs";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "./contexts/AuthContext";

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#ff9800' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
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