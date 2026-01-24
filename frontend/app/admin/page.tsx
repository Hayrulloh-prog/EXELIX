'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Download, LogIn } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  inactiveQRCodes: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/admin/stats');
      if (response.data) {
        setStats(response.data);
        setAuthenticated(true);
        await fetchUsers();
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const response = await api.post('/admin/login', loginData);
      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setAuthenticated(true);
        await fetchStats();
        await fetchUsers();
        toast.success('Успешный вход');
      } else {
        toast.error('Неверные учетные данные');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка входа';
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load statistics');
    }
  };

  const fetchUsers = async (pageNum = 1) => {
    try {
      const response = await api.get(`/admin/users?page=${pageNum}&limit=40`);
      if (pageNum === 1) {
        setUsers(response.data.users);
      } else {
        setUsers((prev) => [...prev, ...response.data.users]);
      }
      setHasMore(response.data.pagination.page < response.data.pagination.totalPages);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleGenerateQR = async () => {
    try {
      const response = await api.post(
        '/admin/qr/generate',
        { count: 100 },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `qr-codes-${Date.now()}.svg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('admin.qrGenerated'));
    } catch (error) {
      toast.error('Failed to generate QR codes');
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto card">
            <h1 className="text-3xl font-bold mb-8 text-center">{t('admin.title')}</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.username')}
                </label>
                 <input
                   type="text"
                   value={loginData.username}
                   onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                   className="input"
                   required
                   autoComplete="username"
                 />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.password')}
                </label>
                 <input
                   type="password"
                   value={loginData.password}
                   onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                   className="input"
                   required
                   autoComplete="current-password"
                 />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t('admin.login')}
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">{t('admin.title')}</h1>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600 mt-1">{t('admin.totalUsers')}</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600">{stats.totalRequests}</div>
                <div className="text-sm text-gray-600 mt-1">{t('admin.totalRequests')}</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{stats.successfulRequests}</div>
                <div className="text-sm text-gray-600 mt-1">{t('admin.successfulRequests')}</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-red-600">{stats.failedRequests}</div>
                <div className="text-sm text-gray-600 mt-1">{t('admin.failedRequests')}</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.inactiveQRCodes}</div>
                <div className="text-sm text-gray-600 mt-1">{t('admin.inactiveQRCodes')}</div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">{t('admin.users')}</h2>
            <button
              onClick={handleGenerateQR}
              className="btn btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('admin.generateQR')}
            </button>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Фото</th>
                  <th className="text-left py-3 px-4">Имя</th>
                  <th className="text-left py-3 px-4">Телефон</th>
                  <th className="text-left py-3 px-4">Telegram</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Дата</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-3 px-4">{user.phone}</td>
                    <td className="py-3 px-4">{user.telegram || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="text-center mt-6">
              <button onClick={handleLoadMore} className="btn btn-outline">
                {t('admin.showMore')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
