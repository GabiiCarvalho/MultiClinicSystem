import axios from 'axios';

// URL da API - backend na porta 3001
const baseURL = import.meta.env.VITE_API_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:3001/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 6000,
});

// Adicionar interceptor para incluir token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('petshopName');
      window.location.href = '/login';
    }

    if (error.code === 'ECONNABORTED') {
      console.error('Timeout na requisição');
    } else if (!error.response) {
      console.error("Erro de rede - servidor não responde");
    }
    return Promise.reject(error);
  }
);

export default api;