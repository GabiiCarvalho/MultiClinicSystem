import { createContext, useState } from "react";

export const PatientsContext = createContext();

export const PatientsProvider = ({ children }) => {
    const [patients, setPatients] = useState([
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
            procedureType: "Consulta Odontológica",
            dentist: "Dra. Ana Silva",
            observations: "Paciente ansioso, precisa de atendimento calmo",
            scheduleDate: new Date('2024-01-15T10:00:00'),
            scheduleEndDate: new Date('2024-01-15T11:00:00'),
            cancelReason: null
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
            procedureType: "Limpeza Dental",
            dentist: "Dr. Carlos Santos",
            observations: "",
            scheduleDate: new Date('2024-01-15T14:00:00'),
            cancelReason: null
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
            procedureType: "Canal",
            dentist: "Dra. Mariana Oliveira",
            observations: "Tratamento de canal no dente 36",
            scheduleDate: new Date('2024-01-15T09:00:00'),
            scheduleEndDate: new Date('2024-01-15T11:00:00'),
            cancelReason: null
        },
        {
            id: 4,
            name: "Ana Paula Mendes",
            phone: "+5511666666666",
            email: "ana@email.com",
            cpf: "789.123.456-00",
            birthDate: new Date('1985-11-28'),
            inProcedure: false,
            procedureProgress: 0,
            completedToday: false,
            status: 'cancelado',
            procedureType: "Aplicação de Botox",
            dentist: "Dra. Juliana Costa",
            observations: "Primeira aplicação",
            scheduleDate: new Date('2024-01-16T15:30:00'),
            cancelReason: "Paciente desmarcou por problemas pessoais"
        },
        {
            id: 5,
            name: "Roberto Santos",
            phone: "+5511555555555",
            email: "roberto@email.com",
            cpf: "321.654.987-00",
            birthDate: new Date('1968-07-19'),
            inProcedure: false,
            procedureProgress: 0,
            completedToday: false,
            status: 'agendado',
            procedureType: "Microcirurgia",
            dentist: "Dr. Rafael Mendes",
            observations: "Remoção de lesão na mucosa",
            scheduleDate: new Date('2024-01-17T08:00:00'),
            scheduleEndDate: new Date('2024-01-17T12:00:00'),
            cancelReason: null
        }
    ]);

    const startProcedure = (patientId) => {
        setPatients(patients.map(patient => {
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
        setPatients(patients.map(patient => {
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

    const updateProcedureProgress = (patientId, progress) => {
        setPatients(patients.map(patient =>
            patient.id === patientId ? { ...patient, procedureProgress: progress } : patient
        ));
    };

    const completeProcedure = (patientId) => {
        setPatients(patients.map(patient => {
            if (patient.id !== patientId) return patient;

            const updatedPatient = {
                ...patient,
                completedToday: true,
                status: 'finalizado',
                inProcedure: false,
                procedureProgress: 3,
                procedureEndTime: new Date()
            };

            return updatedPatient;
        }));
    };

    const addPatient = (newPatient) => {
        const scheduleDate = new Date(newPatient.scheduleDate);
        let scheduleEndDate = null;

        if (newPatient.duration) {
            scheduleEndDate = new Date(scheduleDate.getTime() + newPatient.duration * 60 * 60 * 1000);
        }

        setPatients([...patients, {
            ...newPatient,
            id: Date.now(),
            inProcedure: false,
            status: 'agendado',
            procedureProgress: 0,
            completedToday: false,
            scheduleDate,
            scheduleEndDate,
            cancelReason: null
        }]);
    };

    const updatePatientSchedule = (patientId, newDateString) => {
        setPatients(patients.map(patient => {
            if (patient.id === patientId) {
                const newDate = new Date(newDateString);
                const originalDate = new Date(patient.scheduleDate);

                newDate.setHours(
                    originalDate.getHours(),
                    originalDate.getMinutes(),
                    originalDate.getSeconds()
                );

                let newEndDate = null;
                if (patient.scheduleEndDate) {
                    const duration = patient.scheduleEndDate - originalDate;
                    newEndDate = new Date(newDate.getTime() + duration);
                }

                return {
                    ...patient,
                    scheduleDate: newDate,
                    scheduleEndDate: newEndDate
                };
            }
            return patient;
        }));
    };

    const getPatientsByStatus = () => {
        return {
            aguardando: patients.filter(p => p.status === 'agendado'),
            em_procedimento: patients.filter(p => p.status === 'em_procedimento'),
            finalizado: patients.filter(p => p.status === 'finalizado'),
            cancelado: patients.filter(p => p.status === 'cancelado')
        };
    };

    return (
        <PatientsContext.Provider value={{
            patients,
            setPatients,
            addPatient,
            startProcedure,
            updatePatientStatus,
            updateProcedureProgress,
            completeProcedure,
            updatePatientSchedule,
            getPatientsByStatus
        }}>
            {children}
        </PatientsContext.Provider>
    );
};