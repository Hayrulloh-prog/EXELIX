import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Проверяем, это админский запрос или обычный пользовательский
    const isAdminRoute = config.url?.includes('/admin/');
    const tokenKey = isAdminRoute ? 'adminToken' : 'token';
    const token = localStorage.getItem(tokenKey);

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

// Обработка ошибок 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const isAdminRoute = error.config?.url?.includes('/admin/');
        if (isAdminRoute) {
          localStorage.removeItem('adminToken');
          if (window.location.pathname !== '/admin') {
            window.location.href = '/admin';
          }
        } else {
          localStorage.removeItem('token');
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
