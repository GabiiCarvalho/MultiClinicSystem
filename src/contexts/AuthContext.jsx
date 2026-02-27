import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

const CARGO_MAP = {
  proprietario: 'proprietario', proprietário: 'proprietario',
  gestor: 'gestor', gestora: 'gestor',
  dentista: 'dentista',
  atendente: 'atendente',
  financeiro: 'financeiro', financeira: 'financeiro',
};

const normalizeCargo = (cargo) => {
  if (!cargo) return 'gestor';
  const c = String(cargo).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CARGO_MAP[c] || CARGO_MAP[cargo.toLowerCase().trim()] || cargo.toLowerCase().trim();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [clinicName, setClinicName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const u = { ...parsed, cargo: normalizeCargo(parsed.cargo) };
        setUser(u);
        setClinicName(parsed.loja_nome || parsed.clinicName || 'Clínica');
        api.defaults.headers.Authorization = `Bearer ${token}`;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, senha) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email: email.trim(), senha });
      const { token, usuario } = res.data;
      const cargo = normalizeCargo(usuario.cargo);
      const u = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo,
        loja_id: usuario.loja_id,
        loja_nome: usuario.loja_nome || 'Clínica',
      };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      api.defaults.headers.Authorization = `Bearer ${token}`;
      setUser(u);
      setClinicName(u.loja_nome);
      return true;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/cadastrar-usuario', {
        ...formData,
        tipoCadastro: formData.tipoCadastro || (formData.cnpj && !formData.cnpjExistente ? 'nova' : 'existente'),
      });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.Authorization;
    setUser(null);
    setClinicName('');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    const { cargo } = user;
    if (cargo === 'gestor' || cargo === 'proprietario') return true;
    const perms = {
      financeiro: ['view_dashboard','view_calendar','view_financial','manage_cashier','process_payments','view_reports','view_patients','view_procedures'],
      atendente: ['view_calendar','view_appointments','create_patient','edit_patient','view_patients','create_appointment','edit_appointment','cancel_appointment','contact_patient'],
      dentista: ['view_my_calendar','view_my_appointments','view_my_patients','update_procedure_status','add_observations'],
    };
    return perms[cargo]?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, clinicName, isLoading, login, register, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};