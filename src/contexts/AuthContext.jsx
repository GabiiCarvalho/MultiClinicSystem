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
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          api.defaults.headers.Authorization = `Bearer ${token}`;
        }
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

      const { token, usuario, loja_nome } = response.data;

      if (usuario && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        setUser(usuario);
        setClinicName(loja_nome || '');

        api.defaults.headers.Authorization = `Bearer ${token}`;

        return true;
      } else {
        throw new Error('Dados de login inválidos');
      }
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
      const response = await api.post('/auth/cadastrar-gestor', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        cnpj: formData.cnpj,
        address: formData.address,
        clinicName: formData.clinicName
      });

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
    localStorage.removeItem('clinicName');
    setUser(null);
    setClinicName('');
    delete api.defaults.headers.Authorization;
  };

  const updateClinicName = (newName) => {
    setClinicName(newName);
    localStorage.setItem('clinicName', newName);
  };

  // Verificar permissões
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      'atendente': ['view_schedule', 'create_appointment', 'cancel_appointment', 'contact_patient', 'create_budget'],
      'dentista': ['view_my_schedule', 'update_procedure_status', 'view_patient_info', 'add_observations'],
      'financeiro': ['view_cashier', 'process_payment', 'view_financial_reports', 'issue_receipt'],
      'gestor': ['view_all_schedules', 'manage_users', 'manage_materials', 'view_patient_flow', 'view_financial_reports', 'manage_prices', 'view_canceled_appointments']
    };

    if (user.cargo === 'gestor') return true; // Gestor tem todas as permissões
    
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
      updateClinicName,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);