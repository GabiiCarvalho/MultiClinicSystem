import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Criar e exportar o contexto separadamente
export const AuthContext = createContext();

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Usuário carregado do localStorage:', parsedUser);
        
        // Garantir que o cargo tenha um valor padrão
        const cargoLimpo = parsedUser.cargo ? parsedUser.cargo.trim().toLowerCase() : 'proprietario';
        
        const userWithDefaults = {
          ...parsedUser,
          cargo: cargoLimpo
        };
        
        setUser(userWithDefaults);
        setClinicName(parsedUser.loja_nome || 'Clínica Sorriso');
        api.defaults.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Erro ao parsear user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (email, senha) => {
    setIsLoading(true);
    try {
      console.log('Tentando login com:', email);
      
      const response = await api.post('/auth/login', {
        email: email.trim(),
        senha: senha
      });

      console.log('Resposta do login:', response.data);

      const { token, usuario } = response.data;

      // Garantir que o cargo tenha um valor padrão
      const cargoUsuario = usuario.cargo || 'proprietario';
      const cargoLimpo = cargoUsuario.trim().toLowerCase();
      
      // Adapta o usuário para o formato esperado pelo frontend
      const adaptedUser = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: cargoLimpo,
        loja_id: usuario.loja_id,
        loja_nome: usuario.loja_nome || 'Clínica Sorriso'
      };

      console.log('Usuário adaptado:', adaptedUser);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(adaptedUser));
      setUser(adaptedUser);
      setClinicName(adaptedUser.loja_nome);
      api.defaults.headers.Authorization = `Bearer ${token}`;

      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao fazer login';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/cadastrar-usuario', formData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao cadastrar';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setClinicName('');
    delete api.defaults.headers.Authorization;
  };

  // Verificar permissões baseado no cargo
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const cargo = user.cargo || '';
    
    // Gestor e proprietário têm todas as permissões
    if (cargo === 'gestor' || cargo === 'proprietario') return true;
    
    const permissions = {
      financeiro: [
        'view_dashboard', 'view_calendar', 'view_appointments',
        'view_patient_flow', 'view_financial', 'manage_cashier',
        'process_payments', 'view_reports', 'view_patients'
      ],
      atendente: [
        'view_calendar', 'view_appointments', 'create_patient',
        'edit_patient', 'view_patients', 'create_appointment',
        'edit_appointment', 'cancel_appointment', 'contact_patient'
      ],
      dentista: [
        'view_my_calendar', 'view_my_appointments', 'view_my_patients',
        'update_procedure_status', 'add_observations'
      ]
    };

    return permissions[cargo]?.includes(permission) || false;
  };

  const value = {
    user,
    clinicName,
    isLoading,
    login,
    register,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};