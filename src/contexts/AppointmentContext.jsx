import { createContext, useState, useCallback } from "react";
import axios from "axios";

export const AppointmentsContext = createContext();

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:3000/api"; // ajuste se necessário

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  /**
   * Buscar agendamentos por data
   */
  const fetchAppointmentsByDate = useCallback(async (date) => {
    try {
      setLoading(true);

      const formattedDate = new Date(date).toISOString().split("T")[0];

      const response = await axios.get(
        `${API_URL}/agendamentos?data=${formattedDate}`,
        getAuthConfig()
      );

      setAppointments(response.data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar status do agendamento
   */
  const updateAppointmentStatus = async (id, status) => {
    try {
      await axios.patch(
        `${API_URL}/agendamentos/${id}/status`,
        { status },
        getAuthConfig()
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? { ...appointment, status }
            : appointment
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  /**
   * Atualizar data/hora do agendamento (drag & drop)
   */
  const updateAppointmentDate = async (id, newDate) => {
    try {
      await axios.patch(
        `${API_URL}/agendamentos/${id}/data`,
        { data: newDate },
        getAuthConfig()
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? { ...appointment, data: newDate }
            : appointment
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar data:", error);
    }
  };

  /**
   * Criar novo agendamento
   */
  const createAppointment = async (appointmentData) => {
    try {
      const response = await axios.post(
        `${API_URL}/agendamentos`,
        appointmentData,
        getAuthConfig()
      );

      setAppointments((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
    }
  };

  /**
   * Deletar agendamento
   */
  const deleteAppointment = async (id) => {
    try {
      await axios.delete(
        `${API_URL}/agendamentos/${id}`,
        getAuthConfig()
      );

      setAppointments((prev) =>
        prev.filter((appointment) => appointment.id !== id)
      );
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
    }
  };

  return (
    <AppointmentsContext.Provider
      value={{
        appointments,
        loading,
        fetchAppointmentsByDate,
        updateAppointmentStatus,
        updateAppointmentDate,
        createAppointment,
        deleteAppointment
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
};