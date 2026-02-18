import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

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
        setUser(parsedUser);
        setClinicName(parsedUser.loja_nome || '');
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
      const response = await api.post('/auth/login', {
        email: email.trim(),
        senha: senha
      });

      const { token, usuario } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
      setClinicName(usuario.loja_nome || '');
      api.defaults.headers.Authorization = `Bearer ${token}`;

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao fazer login';
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
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao cadastrar';
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
    
    // Gestor tem todas as permissões
    if (user.cargo === 'gestor') return true;
    
    const permissions = {
      financeiro: [
        'view_dashboard',
        'view_calendar',
        'view_appointments',
        'view_patient_flow',
        'view_financial',
        'manage_cashier',
        'process_payments',
        'view_reports',
        'view_patients',
        'view_procedures'
      ],
      atendente: [
        'view_calendar',
        'view_appointments',
        'create_patient',
        'edit_patient',
        'view_patients',
        'create_appointment',
        'edit_appointment',
        'cancel_appointment',
        'contact_patient'
      ],
      dentista: [
        'view_my_calendar',
        'view_my_appointments',
        'view_my_patients',
        'update_procedure_status',
        'add_observations',
        'view_my_procedures'
      ]
    };

    return permissions[user.cargo]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      clinicName,
      isLoading,
      login,
      register,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);