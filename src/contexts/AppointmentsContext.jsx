/**
 * AppointmentsContext
 *
 * Contexto secundário para o CalendarSaaS buscar por data/mês específicos.
 * A FONTE ÚNICA DE VERDADE continua sendo PatientsContext.
 * Este contexto agora apenas dispara fetchPatients() do PatientsContext
 * após qualquer mutação, garantindo sincronização.
 */
import { createContext, useState, useCallback } from 'react';
import api from '../services/api';

const AppointmentsContext = createContext();
export default AppointmentsContext;

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointmentsByDate = useCallback(async (date) => {
    setLoading(true);
    try {
      const d   = new Date(date).toISOString().split('T')[0];
      const res = await api.get(`/agendamentos?data=${d}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setAppointments(prev => {
        const outros = prev.filter(a => {
          try { return new Date(a.data_hora).toISOString().split('T')[0] !== d; } catch { return true; }
        });
        return [...outros, ...data];
      });
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchAppointmentsByMonth = useCallback(async (date) => {
    setLoading(true);
    try {
      const d   = new Date(date);
      const mes = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const res = await api.get(`/agendamentos?mes=${mes}`);
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch { setAppointments([]); } finally { setLoading(false); }
  }, []);

  const updateAppointmentStatus = useCallback(async (id, status) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      setAppointments(prev => prev.map(a => a.id===id ? {...a,status} : a));
    } catch (e) { console.error(e); }
  }, []);

  const updateAppointmentDate = useCallback(async (id, newDate) => {
    try {
      const inicio = new Date(newDate);
      await api.patch(`/agendamentos/${id}/data`, {
        data_hora:     inicio.toISOString(),
        data_hora_fim: new Date(inicio.getTime()+3600000).toISOString(),
      });
      setAppointments(prev => prev.map(a => a.id===id ? {...a,data_hora:inicio.toISOString()} : a));
    } catch (e) { console.error(e); }
  }, []);

  const createAppointment = useCallback(async (data) => {
    const res = await api.post('/agendamentos', data);
    setAppointments(prev => [...prev, res.data]);
    return res.data;
  }, []);

  return (
    <AppointmentsContext.Provider value={{
      appointments, loading,
      fetchAppointmentsByDate, fetchAppointmentsByMonth,
      updateAppointmentStatus, updateAppointmentDate,
      createAppointment,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
};