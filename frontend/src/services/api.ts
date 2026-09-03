import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopledger_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on auth pages, logout
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register') && !currentPath.startsWith('/forgot-password') && !currentPath.startsWith('/reset-password')) {
        localStorage.removeItem('shopledger_token');
        localStorage.removeItem('shopledger_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
