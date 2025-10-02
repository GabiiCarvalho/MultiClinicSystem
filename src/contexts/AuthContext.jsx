// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [petshopName, setPetshopName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('🔍 AuthContext - Token:', token);
    console.log('🔍 AuthContext - UserData:', userData);


    if (token && userData) {
      try {
        // Verifica se userData é um JSON válido antes de fazer parse
        const parsedUser = JSON.parse(userData);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
          api.defaults.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Erro ao parsear user data:', error);
        // Limpa dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Função de login
  const login = async (email, senha) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        senha: senha
      });

      console.log('Resposta completa:', response);
      console.log('Dados da resposta:', response.data);

      const { token, usuario, loja_nome } = response.data;

      // Salvar dados - CORRIGIDO (verifica se usuario existe)
      if (usuario && token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        setUser(usuario);
        setPetshopName(loja_nome || '');

        // Configurar token nas requisições
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

  // Função de cadastro
  const register = async (formData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/cadastrar-proprietario', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        cnpj: formData.cnpj,
        address: formData.address,
        petshopName: formData.petshopName
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao cadastrar';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('petshopName');
    setUser(null);
    setPetshopName('');
    delete api.defaults.headers.Authorization;
  };

  return (
    <AuthContext.Provider value={{
      user,
      petshopName,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);