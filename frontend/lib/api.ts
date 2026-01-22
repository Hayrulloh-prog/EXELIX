import axios, { AxiosRequestConfig } from 'axios';

// Для Next.js используем NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Создаём экземпляр Axios для админки
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config: AxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const adminToken = localStorage.getItem('adminToken'); // берём adminToken
    if (adminToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${adminToken}`,
      };
    }
  }
  return config;
});

// Обработка ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken'); // удаляем токен
        window.location.href = '/admin/login'; // редирект на страницу логина админа
      }
    }
    return Promise.reject(error);
  }
);

export default api;
