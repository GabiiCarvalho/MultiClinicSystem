import { createRoot } from 'react-dom/client';
import { PatientsProvider } from "./contexts/PatientsContext";
import App from './App.jsx';

const container = document.getElementById('root');

const root = createRoot(container);
root.render(
  <PatientsProvider>
    <App />
  </PatientsProvider>
);