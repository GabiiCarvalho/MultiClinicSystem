import { createContext, useState, useCallback } from 'react';
import api from '../services/api';

export const PatientsContext = createContext();

const INITIAL_MOCK = [
  { id: 1, nome: 'João Silva', telefone: '11999999999', email: 'joao@email.com', status: 'agendado', pago: true, procedimento: 'Consulta Odontológica', dentist: 'Dra. Ana Silva', data_hora: new Date().toISOString(), valor: 150, procedureProgress: 0 },
  { id: 2, nome: 'Maria Souza', telefone: '11888888888', email: 'maria@email.com', status: 'em_procedimento', pago: true, procedimento: 'Limpeza Dental', dentist: 'Dr. Carlos Santos', data_hora: new Date().toISOString(), valor: 200, procedureProgress: 1 },
  { id: 3, nome: 'Carlos Oliveira', telefone: '11777777777', email: 'carlos@email.com', status: 'finalizado', pago: true, procedimento: 'Canal', dentist: 'Dra. Mariana Oliveira', data_hora: new Date().toISOString(), valor: 1200, procedureProgress: 3 },
];

export const PatientsProvider = ({ children }) => {
  const [patients, setPatients] = useState(() => {
    try {
      const stored = localStorage.getItem('patients');
      return stored ? JSON.parse(stored) : INITIAL_MOCK;
    } catch { return INITIAL_MOCK; }
  });
  const [loading, setLoading] = useState(false);

  const save = (list) => {
    setPatients(list);
    try { localStorage.setItem('patients', JSON.stringify(list)); } catch {}
  };

  const addPatient = useCallback((p) => {
    const patient = {
      ...p,
      id: p.id || Date.now(),
      status: p.status || (p.pago ? 'agendado' : 'pendente_pagamento'),
      procedureProgress: 0,
    };
    save((prev) => [...prev, patient]);
    return patient;
  }, []);

  const updatePatientStatus = useCallback((id, status, reason = null) => {
    save((prev) => prev.map((p) => p.id === id ? {
      ...p, status,
      inProcedure: status === 'em_procedimento',
      completedToday: status === 'finalizado',
      cancelReason: reason,
    } : p));
  }, []);

  const updatePatientProgress = useCallback((id, progress) => {
    save((prev) => prev.map((p) => p.id === id ? { ...p, procedureProgress: progress } : p));
  }, []);

  const marcarComoPago = useCallback((id) => {
    save((prev) => prev.map((p) => p.id === id ? { ...p, pago: true, status: 'agendado' } : p));
  }, []);

  const getPatientsByStatus = useCallback(() => ({
    pendentes: patients.filter((p) => p?.status === 'pendente_pagamento'),
    aguardando: patients.filter((p) => p?.status === 'agendado' && p?.pago),
    em_procedimento: patients.filter((p) => p?.status === 'em_procedimento'),
    finalizado: patients.filter((p) => p?.status === 'finalizado'),
    cancelado: patients.filter((p) => p?.status === 'cancelado'),
  }), [patients]);

  return (
    <PatientsContext.Provider value={{
      patients, loading, setPatients,
      addPatient, updatePatientStatus, updatePatientProgress,
      marcarComoPago, getPatientsByStatus,
    }}>
      {children}
    </PatientsContext.Provider>
  );
};