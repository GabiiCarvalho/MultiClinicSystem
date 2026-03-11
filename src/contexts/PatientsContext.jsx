import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const PatientsContext = createContext();

export const PatientsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(false);

  // ── Carrega pacientes da API quando o usuário logar ──────────────────────
  useEffect(() => {
    if (user?.clinica_id) {
      fetchPatients();
    } else {
      // Usuário deslogou — limpa dados
      setPatients([]);
    }
  }, [user?.clinica_id]);

  // GET /pacientes — já filtrado por clinica_id no backend via JWT
  const fetchPatients = useCallback(async (busca = '') => {
    setLoading(true);
    try {
      const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const res = await api.get(`/pacientes${params}`);
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /pacientes — cria na API, backend vincula ao clinica_id do JWT
  const addPatient = useCallback(async (p) => {
    try {
      const body = {
        nome:            p.nome || p.name,
        telefone:        p.telefone || p.phone || '',
        email:           p.email    || '',
        cpf:             p.cpf      || '',
        data_nascimento: p.data_nascimento || null,
        observacoes:     p.observations || p.observacoes || '',
      };
      const res = await api.post('/pacientes', body);
      const created = res.data;

      // Se tiver agendamento junto, cria o agendamento também
      if (p.data_hora && p.profissional_id) {
        await api.post('/agendamentos', {
          paciente_id:      created.id,
          profissional_id:  p.profissional_id,
          procedimento_id:  p.procedimento_id || null,
          data_hora:        p.data_hora,
          data_hora_fim:    p.data_hora_fim || null,
          valor:            p.valor || 0,
          observacoes:      p.observations || p.observacoes || '',
        });
      }

      await fetchPatients(); // recarrega lista atualizada da API
      return created;
    } catch (err) {
      console.error('Erro ao criar paciente:', err);
      throw new Error(err.response?.data?.error || 'Erro ao criar paciente');
    }
  }, [fetchPatients]);

  // PATCH /pacientes/:id — atualiza campos do paciente
  const updatePatient = useCallback(async (id, fields) => {
    try {
      const res = await api.patch(`/pacientes/${id}`, fields);
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...res.data } : p));
      return res.data;
    } catch (err) {
      console.error('Erro ao atualizar paciente:', err);
      throw new Error(err.response?.data?.error || 'Erro ao atualizar');
    }
  }, []);

  // Atualiza status de um agendamento (usado pelo Kanban e CalendarSaaS)
  // PATCH /agendamentos/:id/status
  const updatePatientStatus = useCallback(async (id, status) => {
    // Atualização otimista no estado local
    setPatients(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Reverte em caso de erro
      await fetchPatients();
    }
  }, [fetchPatients]);

  // Atualiza progresso do procedimento (sem rota dedicada, usa patch local)
  const updatePatientProgress = useCallback((id, progress) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, procedureProgress: progress } : p));
    // Persiste via PATCH /agendamentos/:id/progresso se o agendamento existir
    api.patch(`/agendamentos/${id}/progresso`, { progress }).catch(() => {});
  }, []);

  // Atualiza data/hora de um paciente — usado pelo CalendarSaaS no drag & drop
  // PATCH /pacientes/:id/data
  const updatePatientDate = useCallback(async (id, newDate) => {
    const iso = newDate instanceof Date ? newDate.toISOString() : String(newDate);
    setPatients(prev => prev.map(p => p.id === id ? { ...p, data_hora: iso } : p));
    try {
      await api.patch(`/pacientes/${id}/data`, { data_hora: iso });
    } catch (err) {
      console.error('Erro ao reagendar:', err);
    }
  }, []);

  const marcarComoPago = useCallback((id) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, pago: true, status: 'agendado' } : p));
  }, []);

  // Agrupa pacientes por status para o Kanban
  const getPatientsByStatus = useCallback(() => ({
    pendentes:       patients.filter(p => p?.status === 'pendente_pagamento'),
    aguardando:      patients.filter(p => p?.status === 'agendado' && p?.pago),
    em_procedimento: patients.filter(p => p?.status === 'em_procedimento'),
    finalizado:      patients.filter(p => p?.status === 'finalizado'),
    cancelado:       patients.filter(p => p?.status === 'cancelado'),
  }), [patients]);

  return (
    <PatientsContext.Provider value={{
      patients,
      loading,
      setPatients,
      fetchPatients,
      addPatient,
      updatePatient,
      updatePatientStatus,
      updatePatientProgress,
      updatePatientDate,
      marcarComoPago,
      getPatientsByStatus,
    }}>
      {children}
    </PatientsContext.Provider>
  );
};