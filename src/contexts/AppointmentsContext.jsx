import { createContext, useState, useCallback } from 'react';
import api from '../services/api';

const AppointmentsContext = createContext();
export default AppointmentsContext;

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // GET /agendamentos?data=YYYY-MM-DD — busca por dia específico
  const fetchAppointmentsByDate = useCallback(async (date) => {
    setLoading(true);
    try {
      const d = new Date(date).toISOString().split('T')[0];
      const res = await api.get(`/agendamentos?data=${d}`);
      const data = Array.isArray(res.data) ? res.data : [];
      // Merge: mantém dias que já foram carregados, substitui o dia atual
      setAppointments(prev => {
        const outros = prev.filter(a => {
          try { return new Date(a.data_hora).toISOString().split('T')[0] !== d; }
          catch { return true; }
        });
        return [...outros, ...data];
      });
    } catch {
      // Silencia — a view já mostra empty state
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /agendamentos?mes=YYYY-MM — busca o mês inteiro para a visão mensal
  const fetchAppointmentsByMonth = useCallback(async (date) => {
    setLoading(true);
    try {
      const d = new Date(date);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get(`/agendamentos?mes=${mes}`);
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // PATCH /agendamentos/:id/status
  const updateAppointmentStatus = useCallback(async (id, status) => {
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      console.error('Erro ao atualizar status agendamento:', e);
    }
  }, []);

  // PATCH /agendamentos/:id/data — usado pelo drag & drop do CalendarSaaS
  const updateAppointmentDate = useCallback(async (id, newDate) => {
    try {
      const inicio = new Date(newDate);
      const fim    = new Date(inicio.getTime() + 60 * 60000); // +1h padrão
      await api.patch(`/agendamentos/${id}/data`, {
        data_hora:     inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
      });
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, data_hora: inicio.toISOString() } : a)
      );
    } catch (e) {
      console.error('Erro ao reagendar agendamento:', e);
    }
  }, []);

  // POST /agendamentos
  const createAppointment = useCallback(async (data) => {
    try {
      const res = await api.post('/agendamentos', data);
      setAppointments(prev => [...prev, res.data]);
      return res.data;
    } catch (e) {
      console.error('Erro ao criar agendamento:', e);
      throw e;
    }
  }, []);

  // DELETE /agendamentos/:id
  const deleteAppointment = useCallback(async (id) => {
    try {
      await api.delete(`/agendamentos/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Erro ao deletar agendamento:', e);
    }
  }, []);

  return (
    <AppointmentsContext.Provider value={{
      appointments,
      loading,
      fetchAppointmentsByDate,
      fetchAppointmentsByMonth,   // ← novo
      updateAppointmentStatus,
      updateAppointmentDate,
      createAppointment,
      deleteAppointment,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
};