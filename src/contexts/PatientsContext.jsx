import { createContext, useState, useCallback } from 'react';
import api from '../services/api';

export const PatientsContext = createContext();

// Helper: cria data para hoje com horário específico
const today = (h, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// Helper: cria data N dias a partir de hoje com horário
const fromToday = (days, h, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const INITIAL_MOCK = [
  {
    id: 1,
    nome: 'João Silva',
    telefone: '11999999999',
    email: 'joao@email.com',
    status: 'agendado',
    pago: true,
    procedimento: 'Consulta Odontológica',
    dentist: 'Dra. Ana Silva',
    data_hora: today(9, 0),        // hoje 09:00
    valor: 150,
    procedureProgress: 0,
  },
  {
    id: 2,
    nome: 'Maria Souza',
    telefone: '11888888888',
    email: 'maria@email.com',
    status: 'em_procedimento',
    pago: true,
    procedimento: 'Limpeza Dental',
    dentist: 'Dr. Carlos Santos',
    data_hora: today(10, 30),      // hoje 10:30
    valor: 200,
    procedureProgress: 1,
  },
  {
    id: 3,
    nome: 'Carlos Oliveira',
    telefone: '11777777777',
    email: 'carlos@email.com',
    status: 'finalizado',
    pago: true,
    procedimento: 'Canal',
    dentist: 'Dra. Mariana Oliveira',
    data_hora: today(14, 0),       // hoje 14:00
    valor: 1200,
    procedureProgress: 3,
  },
  {
    id: 4,
    nome: 'Ana Beatriz Lima',
    telefone: '11666666666',
    email: 'ana@email.com',
    status: 'agendado',
    pago: true,
    procedimento: 'Clareamento Dental',
    dentist: 'Dra. Ana Silva',
    data_hora: fromToday(1, 9, 0), // amanhã 09:00
    valor: 350,
    procedureProgress: 0,
  },
  {
    id: 5,
    nome: 'Roberto Alves',
    telefone: '11555555555',
    email: 'roberto@email.com',
    status: 'agendado',
    pago: true,
    procedimento: 'Extração',
    dentist: 'Dr. Carlos Santos',
    data_hora: fromToday(1, 11, 0), // amanhã 11:00
    valor: 280,
    procedureProgress: 0,
  },
  {
    id: 6,
    nome: 'Fernanda Costa',
    telefone: '11444444444',
    email: 'fernanda@email.com',
    status: 'agendado',
    pago: false,
    procedimento: 'Ortodontia',
    dentist: 'Dra. Mariana Oliveira',
    data_hora: fromToday(2, 15, 30), // daqui 2 dias 15:30
    valor: 500,
    procedureProgress: 0,
  },
  {
    id: 7,
    nome: 'Paulo Mendes',
    telefone: '11333333333',
    email: 'paulo@email.com',
    status: 'agendado',
    pago: true,
    procedimento: 'Implante Dentário',
    dentist: 'Dr. Ricardo Lima',
    data_hora: fromToday(3, 8, 0), // daqui 3 dias 08:00
    valor: 2500,
    procedureProgress: 0,
  },
  {
    id: 8,
    nome: 'Juliana Ferreira',
    telefone: '11222222222',
    email: 'juliana@email.com',
    status: 'agendado',
    pago: true,
    procedimento: 'Consulta de Rotina',
    dentist: 'Dra. Ana Silva',
    data_hora: fromToday(5, 14, 0), // daqui 5 dias 14:00
    valor: 120,
    procedureProgress: 0,
  },
  {
    id: 9,
    nome: 'Marcos Pereira',
    telefone: '11111111111',
    email: 'marcos@email.com',
    status: 'cancelado',
    pago: false,
    procedimento: 'Limpeza Dental',
    dentist: 'Dr. Carlos Santos',
    data_hora: fromToday(-1, 10, 0), // ontem 10:00
    valor: 200,
    procedureProgress: 0,
  },
  {
    id: 10,
    nome: 'Lucia Barbosa',
    telefone: '11000000000',
    email: 'lucia@email.com',
    status: 'finalizado',
    pago: true,
    procedimento: 'Restauração',
    dentist: 'Dra. Mariana Oliveira',
    data_hora: fromToday(-2, 9, 30), // 2 dias atrás 09:30
    valor: 400,
    procedureProgress: 3,
  },
];

export const PatientsProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => {
    try {
      const stored = localStorage.getItem('patients');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Se os dados salvos não têm data_hora recente, usa INITIAL_MOCK
        if (parsed.length > 0 && parsed[0].data_hora) {
          return parsed;
        }
      }
      return INITIAL_MOCK;
    } catch { return INITIAL_MOCK; }
  });

  const [loading, setLoading] = useState(false);

  const save = (updater) => {
    setPatients(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('patients', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const addPatient = useCallback((p) => {
    const patient = {
      ...p,
      id: p.id || Date.now(),
      status: p.status || (p.pago ? 'agendado' : 'pendente_pagamento'),
      procedureProgress: 0,
    };
    save((prev) => [...prev, patient]);

    // Tenta sincronizar com API
    api.post('/pacientes', patient).catch(() => {});
    return patient;
  }, []);

  const updatePatientStatus = useCallback((id, status, reason = null) => {
    save((prev) => prev.map((p) => p.id === id ? {
      ...p, status,
      inProcedure: status === 'em_procedimento',
      completedToday: status === 'finalizado',
      cancelReason: reason,
    } : p));
    api.patch(`/pacientes/${id}/status`, { status }).catch(() => {});
  }, []);

  const updatePatientProgress = useCallback((id, progress) => {
    save((prev) => prev.map((p) => p.id === id ? { ...p, procedureProgress: progress } : p));
  }, []);

  // Atualiza a data/hora de um paciente (usado pelo CalendarSaaS ao arrastar)
  const updatePatientDate = useCallback((id, newDate) => {
    const iso = newDate instanceof Date ? newDate.toISOString() : String(newDate);
    save((prev) => prev.map((p) => p.id === id ? { ...p, data_hora: iso } : p));
    api.patch(`/pacientes/${id}/data`, { data_hora: iso }).catch(() => {});
  }, []);

  const marcarComoPago = useCallback((id) => {
    save((prev) => prev.map((p) => p.id === id ? { ...p, pago: true, status: 'agendado' } : p));
  }, []);

  const getPatientsByStatus = useCallback(() => ({
    pendentes:       patients.filter((p) => p?.status === 'pendente_pagamento'),
    aguardando:      patients.filter((p) => p?.status === 'agendado' && p?.pago),
    em_procedimento: patients.filter((p) => p?.status === 'em_procedimento'),
    finalizado:      patients.filter((p) => p?.status === 'finalizado'),
    cancelado:       patients.filter((p) => p?.status === 'cancelado'),
  }), [patients]);

  // Força reset para dados mock frescos (útil em dev)
  const resetToMock = useCallback(() => {
    localStorage.removeItem('patients');
    setPatients(INITIAL_MOCK);
  }, []);

  return (
    <PatientsContext.Provider value={{
      patients, loading, setPatients,
      addPatient, updatePatientStatus, updatePatientProgress,
      updatePatientDate, marcarComoPago, getPatientsByStatus, resetToMock,
    }}>
      {children}
    </PatientsContext.Provider>
  );
};