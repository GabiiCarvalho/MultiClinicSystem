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
      const d = new Date(date).toISOString().split('T')[0];
      const res = await api.get(`/agendamentos?data=${d}`);
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAppointmentStatus = useCallback(async (id, status) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateAppointmentDate = useCallback(async (id, newDate) => {
    try {
      const inicio = new Date(newDate);
      const fim = new Date(inicio.getTime() + 60 * 60000);
      await api.patch(`/agendamentos/${id}/data`, { data_hora: inicio, data_hora_fim: fim });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, data_hora: inicio.toISOString() } : a));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const createAppointment = useCallback(async (data) => {
    try {
      const res = await api.post('/agendamentos', data);
      setAppointments((prev) => [...prev, res.data]);
      return res.data;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }, []);

  const deleteAppointment = useCallback(async (id) => {
    try {
      await api.delete(`/agendamentos/${id}`);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <AppointmentsContext.Provider value={{
      appointments, loading,
      fetchAppointmentsByDate, updateAppointmentStatus,
      updateAppointmentDate, createAppointment, deleteAppointment,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
};