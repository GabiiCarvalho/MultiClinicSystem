import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const PatientsContext = createContext();

/* ─────────────────────────────────────────────────────────────────────────────
   normalizePatient
   Unifica API (agendamentos JOIN pacientes) em 1 shape canônico.
   Cada "patient" no frontend = 1 AGENDAMENTO com dados do paciente embutidos.
   ───────────────────────────────────────────────────────────────────────────── */
export const normalizePatient = (raw) => {
  const pac = raw.paciente || {};

  return {
    // ─ Identidade ─
    id:               raw.id,                                    // id do AGENDAMENTO
    paciente_id:      pac.id || raw.paciente_id,

    // ─ Dados do paciente ─
    nome:             pac.nome  || raw.nome  || raw.name || '',
    name:             pac.nome  || raw.nome  || raw.name || '',
    telefone:         pac.telefone || raw.telefone || raw.phone || '',
    phone:            pac.telefone || raw.telefone || raw.phone || '',
    email:            pac.email    || raw.email    || '',
    cpf:              pac.cpf      || raw.cpf      || '',

    // ─ Dados do agendamento ─
    data_hora:        raw.data_hora || null,
    scheduleDate:     raw.data_hora || null,
    data_hora_fim:    raw.data_hora_fim || null,
    status:           raw.status || 'agendado',
    pago:             raw.pago ?? (raw.status !== 'pendente_pagamento'),
    valor:            parseFloat(raw.valor) || 0,
    observacoes:      raw.observacoes || raw.observations || '',
    observations:     raw.observacoes || raw.observations || '',

    // ─ Procedimento (pode ser objeto {id,nome} ou string) ─
    procedimento:     raw.procedimento?.nome || raw.procedimento || raw.procedureType || '',
    procedureType:    raw.procedimento?.nome || raw.procedimento || raw.procedureType || '',
    procedimento_id:  raw.procedimento?.id   || raw.procedimento_id || null,
    procedimento_obj: typeof raw.procedimento === 'object' ? raw.procedimento : null,

    // ─ Profissional (pode ser objeto {id,nome} ou string) ─
    dentist:          raw.profissional?.nome || raw.dentist || raw.dentista || '',
    dentista:         raw.profissional?.nome || raw.dentist || raw.dentista || '',
    profissional_id:  raw.profissional?.id   || raw.profissional_id || null,
    profissional_nome: raw.profissional?.nome || raw.dentist || raw.dentista || '',

    // ─ Progresso ─
    procedureProgress: raw.procedureProgress || raw.progresso || 0,
  };
};

export const PatientsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (user?.clinica_id) fetchPatients();
    else setPatients([]);
  }, [user?.clinica_id]); // eslint-disable-line

  /* ── GET /agendamentos — retorna agendamentos com JOIN paciente+profissional+procedimento ── */
  const fetchPatients = useCallback(async (busca = '') => {
    setLoading(true);
    try {
      const params = busca ? `?busca=${encodeURIComponent(busca)}` : '';
      const res = await api.get(`/agendamentos${params}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setPatients(data.map(normalizePatient));
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── POST /pacientes → POST /agendamentos ── */
  const addPatient = useCallback(async (p) => {
    try {
      const resPac = await api.post('/pacientes', {
        nome:        p.nome || p.name,
        telefone:    p.telefone || p.phone || '',
        email:       p.email    || null,
        cpf:         p.cpf      || null,
        observacoes: p.observations || p.observacoes || null,
      });
      const paciente = resPac.data;

      let agendamento = null;
      if (p.profissional_id && p.data_hora) {
        const resAgnd = await api.post('/agendamentos', {
          paciente_id:     paciente.id,
          profissional_id: p.profissional_id,
          procedimento_id: p.procedimento_id || null,
          data_hora:       p.data_hora,
          data_hora_fim:   p.data_hora_fim || null,
          valor:           p.valor || 0,
          observacoes:     p.observations || p.observacoes || null,
          status:          'pendente_pagamento',
        });
        agendamento = resAgnd.data;
      }

      await fetchPatients();
      return { paciente, agendamento };
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Erro ao criar paciente');
    }
  }, [fetchPatients]);

  /* ── PATCH /pacientes/:paciente_id ── */
  const updatePatient = useCallback(async (id, fields) => {
    try {
      const res = await api.patch(`/pacientes/${id}`, fields);
      setPatients(prev => prev.map(p =>
        p.paciente_id === id ? normalizePatient({ ...p, paciente: { ...p.paciente, ...res.data } }) : p
      ));
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Erro ao atualizar');
    }
  }, []);

  /* ── PATCH /agendamentos/:id/status ── */
  const updatePatientStatus = useCallback(async (id, status) => {
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, status, pago: status !== 'pendente_pagamento' } : p
    ));
    try {
      await api.patch(`/agendamentos/${id}/status`, { status });
    } catch (err) {
      console.error('Erro status:', err);
      fetchPatients();
    }
  }, [fetchPatients]);

  /* ── Progresso do procedimento ── */
  const updatePatientProgress = useCallback((id, progress) => {
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, procedureProgress: progress } : p
    ));
    api.patch(`/agendamentos/${id}/progresso`, { progress }).catch(() => {});
  }, []);

  /* ── Drag & drop: PATCH /agendamentos/:id/data ── */
  const updatePatientDate = useCallback(async (id, newDate) => {
    const iso = newDate instanceof Date ? newDate.toISOString() : String(newDate);
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, data_hora: iso, scheduleDate: iso } : p
    ));
    try {
      await api.patch(`/agendamentos/${id}/data`, {
        data_hora:     iso,
        data_hora_fim: new Date(new Date(iso).getTime() + 3600000).toISOString(),
      });
    } catch (err) {
      console.error('Erro reagendar:', err);
    }
  }, []);

  const marcarComoPago = useCallback((id) => {
    setPatients(prev => prev.map(p =>
      p.id === id ? { ...p, pago: true, status: 'agendado' } : p
    ));
  }, []);

  /* ── Kanban groups ── */
  const getPatientsByStatus = useCallback(() => ({
    pendentes:       patients.filter(p => p?.status === 'pendente_pagamento'),
    aguardando:      patients.filter(p =>
      ['agendado', 'confirmado'].includes(p?.status)
    ),
    em_procedimento: patients.filter(p =>
      ['em_procedimento', 'em_atendimento'].includes(p?.status)
    ),
    finalizado:      patients.filter(p => p?.status === 'finalizado'),
    cancelado:       patients.filter(p => p?.status === 'cancelado'),
  }), [patients]);

  return (
    <PatientsContext.Provider value={{
      patients, loading,
      setPatients, fetchPatients,
      addPatient, updatePatient,
      updatePatientStatus, updatePatientProgress,
      updatePatientDate, marcarComoPago,
      getPatientsByStatus, normalizePatient,
    }}>
      {children}
    </PatientsContext.Provider>
  );
};