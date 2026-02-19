import React, { createContext, useState, useEffect } from "react";

export const PatientsContext = createContext();

export const PatientsProvider = ({ children }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carregar pacientes do localStorage ou usar dados iniciais
    useEffect(() => {
        try {
            const storedPatients = localStorage.getItem('patients');
            if (storedPatients) {
                const parsed = JSON.parse(storedPatients);
                // Converter strings de data de volta para objetos Date
                const patientsWithDates = parsed.map(p => ({
                    ...p,
                    scheduleDate: p.scheduleDate ? new Date(p.scheduleDate) : null,
                    birthDate: p.birthDate ? new Date(p.birthDate) : null,
                    // Garantir que todos os pacientes tenham status
                    status: p.status || (p.pago ? 'agendado' : 'pendente_pagamento')
                }));
                setPatients(patientsWithDates);
            } else {
                // Dados iniciais para teste
                const initialPatients = [
                    {
                        id: 1,
                        name: "João Silva",
                        phone: "+5511999999999",
                        email: "joao@email.com",
                        cpf: "123.456.789-00",
                        birthDate: new Date('1980-05-15'),
                        inProcedure: false,
                        procedureProgress: 0,
                        completedToday: false,
                        status: 'agendado',
                        pago: true,
                        procedureType: "Consulta Odontológica",
                        dentist: "Dra. Ana Silva",
                        observations: "Paciente ansioso, precisa de atendimento calmo",
                        scheduleDate: new Date(new Date().setHours(10, 0, 0, 0)),
                        valor: 150
                    },
                    {
                        id: 2,
                        name: "Maria Souza",
                        phone: "+5511888888888",
                        email: "maria@email.com",
                        cpf: "987.654.321-00",
                        birthDate: new Date('1990-08-22'),
                        inProcedure: true,
                        procedureProgress: 1,
                        completedToday: false,
                        status: 'em_procedimento',
                        pago: true,
                        procedureType: "Limpeza Dental",
                        dentist: "Dr. Carlos Santos",
                        observations: "",
                        scheduleDate: new Date(new Date().setHours(14, 0, 0, 0)),
                        valor: 200
                    },
                    {
                        id: 3,
                        name: "Carlos Oliveira",
                        phone: "+5511777777777",
                        email: "carlos@email.com",
                        cpf: "456.789.123-00",
                        birthDate: new Date('1975-03-10'),
                        inProcedure: false,
                        procedureProgress: 0,
                        completedToday: true,
                        status: 'finalizado',
                        pago: true,
                        procedureType: "Canal",
                        dentist: "Dra. Mariana Oliveira",
                        observations: "Tratamento de canal no dente 36",
                        scheduleDate: new Date(new Date().setHours(9, 0, 0, 0)),
                        valor: 1200
                    }
                ];
                setPatients(initialPatients);
                localStorage.setItem('patients', JSON.stringify(initialPatients));
            }
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Salvar no localStorage sempre que patients mudar
    useEffect(() => {
        if (!loading) {
            try {
                localStorage.setItem('patients', JSON.stringify(patients));
            } catch (error) {
                console.error('Erro ao salvar pacientes:', error);
            }
        }
    }, [patients, loading]);

    const startProcedure = (patientId) => {
        setPatients(prev => prev.map(patient => {
            if (patient.id === patientId) {
                return {
                    ...patient,
                    inProcedure: true,
                    status: 'em_procedimento',
                    procedureProgress: 0,
                    procedureStartTime: new Date()
                };
            }
            return patient;
        }));
    };

    const updatePatientStatus = (patientId, newStatus, cancelReason = null) => {
        setPatients(prev => prev.map(patient => {
            if (patient.id === patientId) {
                return {
                    ...patient,
                    status: newStatus,
                    inProcedure: newStatus === 'em_procedimento',
                    completedToday: newStatus === 'finalizado',
                    cancelReason: cancelReason,
                    procedureProgress: newStatus === 'finalizado' ? 3 : patient.procedureProgress
                };
            }
            return patient;
        }));
    };

    const updatePatientProgress = (patientId, progress) => {
        setPatients(prev => prev.map(patient =>
            patient.id === patientId ? { ...patient, procedureProgress: progress } : patient
        ));
    };

    const completeProcedure = (patientId) => {
        setPatients(prev => prev.map(patient => {
            if (patient.id !== patientId) return patient;
            return {
                ...patient,
                completedToday: true,
                status: 'finalizado',
                inProcedure: false,
                procedureProgress: 3,
                procedureEndTime: new Date()
            };
        }));
    };

    const addPatient = (newPatient) => {
        const patient = {
            ...newPatient,
            id: Date.now(),
            inProcedure: false,
            status: newPatient.pago ? 'agendado' : 'pendente_pagamento',
            procedureProgress: 0,
            completedToday: false,
            cancelReason: null
        };
        setPatients(prev => [...prev, patient]);
        
        // Se não estiver pago, retorna para redirecionar ao caixa
        if (!newPatient.pago) {
            return { ...patient, redirectToCashier: true };
        }
        return patient;
    };

    const updatePatientSchedule = (patientId, newDate) => {
        setPatients(prev => prev.map(patient => {
            if (patient.id === patientId) {
                return {
                    ...patient,
                    scheduleDate: newDate
                };
            }
            return patient;
        }));
    };

    const getPatientsByStatus = () => {
        try {
            const aguardando = patients.filter(p => p && p.status === 'agendado' && p.pago === true);
            const pendentes = patients.filter(p => p && p.status === 'pendente_pagamento');
            const em_procedimento = patients.filter(p => p && p.status === 'em_procedimento');
            const finalizado = patients.filter(p => p && p.status === 'finalizado');
            const cancelado = patients.filter(p => p && p.status === 'cancelado');
            
            console.log('Status dos pacientes:', {
                aguardando: aguardando.length,
                pendentes: pendentes.length,
                em_procedimento: em_procedimento.length,
                finalizado: finalizado.length,
                cancelado: cancelado.length
            });
            
            return {
                aguardando,
                pendentes,
                em_procedimento,
                finalizado,
                cancelado
            };
        } catch (error) {
            console.error('Erro em getPatientsByStatus:', error);
            return {
                aguardando: [],
                pendentes: [],
                em_procedimento: [],
                finalizado: [],
                cancelado: []
            };
        }
    };

    const marcarComoPago = (patientId) => {
        setPatients(prev => prev.map(patient => {
            if (patient.id === patientId) {
                return {
                    ...patient,
                    pago: true,
                    status: 'agendado'
                };
            }
            return patient;
        }));
    };

    const value = {
        patients,
        setPatients,
        addPatient,
        startProcedure,
        updatePatientStatus,
        updatePatientProgress,
        completeProcedure,
        updatePatientSchedule,
        getPatientsByStatus,
        marcarComoPago,
        loading
    };

    return (
        <PatientsContext.Provider value={value}>
            {children}
        </PatientsContext.Provider>
    );
};