import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS, API_BASE_URL } from '../lib/api';
import { StatisticsCards } from '../components/StatisticsCards';
import { Loader2, Download, LogIn, Users, Shield, Eye, EyeOff, User, Trash2, Phone, Search } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRequests: number;
  successfulRequests?: number;
  failedRequests?: number;
  inactiveQRCodes: number;
  inactiveUsers?: number;
  lastUpdated?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegram: string | null;
  avatarUrl: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export function AdminPage() {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'kg' | 'ru'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [allInactiveUsers, setAllInactiveUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [inactivePage, setInactivePage] = useState(1);
  const [inactiveHasMore, setInactiveHasMore] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [inactiveCountry, setInactiveCountry] = useState<'all' | 'kg' | 'ru'>('all');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [inactiveSearchQuery, setInactiveSearchQuery] = useState('');

  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [debouncedActiveSearch, setDebouncedActiveSearch] = useState('');
  const [debouncedInactiveSearch, setDebouncedInactiveSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedActiveSearch(activeSearchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [activeSearchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedInactiveSearch(inactiveSearchQuery);
    }, 450);
    return () => clearTimeout(handler);
  }, [inactiveSearchQuery]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadStats();
    }
  }, [authenticated, selectedCountry]);

  useEffect(() => {
    if (authenticated) {
      loadUsers(1, false, selectedCountry, debouncedActiveSearch);
    }
  }, [authenticated, selectedCountry, debouncedActiveSearch]);

  useEffect(() => {
    if (authenticated) {
      loadInactiveUsers(1, false, inactiveCountry, debouncedInactiveSearch);
    }
  }, [authenticated, inactiveCountry, debouncedInactiveSearch]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.ADMIN_ME, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAuthenticated(true);
      } else {
        localStorage.removeItem('adminToken');
        setAuthenticated(false);
      }
    } catch (error) {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setAuthenticated(true);
      } else {
        if (data.message === 'Invalid credentials') {
          toast.error(t('auth.invalidCredentials'));
        } else {
          toast.error(data.message || t('auth.loginError'));
        }
      }
    } catch (error) {
      toast.error(t('errors.networkError'));
    } finally {
      setLoginLoading(false);
    }
  };

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const countryParam = selectedCountry === 'all' ? '' : `?country=${selectedCountry}`;

      const response = await fetch(`${API_ENDPOINTS.ADMIN_STATS}${countryParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        // Save stats to localStorage
        localStorage.setItem('adminStats', JSON.stringify(data.stats));
      }
    } catch (error) {
    } finally {
      setStatsLoading(false);
    }
  };

  const filteredStats = stats;
  const inactiveUsersList = allInactiveUsers;
  const searchedUsers = users;

  const loadInactiveUsers = async (pageNum = 1, append = false, country = inactiveCountry, searchQuery = debouncedInactiveSearch) => {
    try {
      const token = localStorage.getItem('adminToken');
      const countryParam = country === 'all' ? '' : `&country=${country}`;
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';
      const url = `${API_ENDPOINTS.ADMIN_USERS}?is_active=false&page=${pageNum}&limit=10${countryParam}${searchParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const updatedUsers = append
          ? [...allInactiveUsers, ...data.users]
          : data.users;

        setAllInactiveUsers(updatedUsers);
        setInactiveHasMore(data.users.length === 10);
        setInactivePage(pageNum);
      }
    } catch (error) {
    }
  };

  const loadMoreInactiveUsers = () => {
    if (inactiveHasMore) {
      loadInactiveUsers(inactivePage + 1, true, inactiveCountry, debouncedInactiveSearch);
    }
  };

  const loadUsers = async (pageNum = 1, append = false, country = selectedCountry, searchQuery = debouncedActiveSearch) => {
    try {
      const token = localStorage.getItem('adminToken');
      const countryParam = country === 'all' ? '' : `&country=${country}`;
      const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : '';
      const url = `${API_ENDPOINTS.ADMIN_USERS}?page=${pageNum}&limit=10${countryParam}${searchParam}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const updatedUsers = append
          ? [...users, ...data.users]
          : data.users;

        setUsers(updatedUsers);
        setHasMore(data.users.length === 10);
        setPage(pageNum);

        // Save users to localStorage (only if not appending and no filters)
        if (!append && !searchQuery.trim() && country === 'all') {
          localStorage.setItem('adminUsers', JSON.stringify(updatedUsers));
        }
      }
    } catch (error) {
    }
  };

  const loadMoreUsers = () => {
    if (hasMore) {
      loadUsers(page + 1, true, selectedCountry, debouncedActiveSearch);
    }
  };

  const generateBatchQR = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.GENERATE_QR_BATCH}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Get filename from response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : `qr-codes-${new Date().toISOString().split('T')[0]}.svg`;

        // Download SVG directly
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Refresh statistics to reflect the newly generated QR codes
        await loadStats();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || t('admin.qrError'));
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast.error(t('admin.qrError'));
    }
  };


  const handleToggleStatus = async (userId: string, currentIsActive: boolean) => {
    if (!window.confirm(t('admin.confirmToggleStatus'))) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              isActive: data.isActive,
              createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : u.createdAt
            };
          }
          return u;
        }));
        toast.success(data.isActive ? t('admin.userActivated') : t('admin.userDeactivated'));
        loadInactiveUsers();
        loadStats();
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (e) {
      toast.error(t('common.networkError', 'Ошибка сети'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t('admin.confirmDeleteUser'))) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success(t('admin.deleteSuccess'));
        loadInactiveUsers();
        loadStats(); // Reload stats after deletion
      } else {
        toast.error(data.message || t('common.error'));
      }
    } catch (e) {
      toast.error(t('common.networkError', 'Ошибка сети'));
    }
  };


  if (loading) {
    return (
      <div className="h-[90vh] overflow-hidden hero-gradient px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-blue-600" />
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="h-[90vh] overflow-hidden hero-gradient px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
            <div className="feature-card sm:py-4 px-4">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Shield className="w-10 h-10 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('admin.title')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('admin.login')}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('auth.email')}
                    </label>
                    <input
                      type="email"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="input"
                      placeholder="admin@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="input pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="btn btn-primary w-full flex items-center justify-center gap-3 mt-8"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('auth.login')}...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        {t('auth.login')}
                      </>
                    )}
                  </button>
                </form>
            </div>
          </div>
        </div>
    );
  }

  const renderUserTable = (usersList: User[]) => (
    <div className="max-h-[655px] overflow-y-auto overflow-x-auto">
      <table className="w-full min-w-[1100px]">
        <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">#</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.firstName')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.phone')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.telegram')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('admin.mode', 'Режим')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.status')}</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">{t('dashboard.date')}</th>
            <th className="text-center py-3 pl-6 pr-4 font-semibold text-gray-700 dark:text-gray-300">{t('admin.actions', 'Действия')}</th>
          </tr>
        </thead>
        <tbody>
          {usersList.map((user, index) => {
            // 1 year expiration (365 * 24 * 60 * 60 * 1000)
            const isExpired = (Date.now() - new Date(user.createdAt).getTime()) > 365 * 24 * 60 * 60 * 1000;
            const isReallyActive = user.isActive && !isExpired;
            return (
              <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-3 px-4 text-gray-500 font-medium">{usersList.length - index}</td>
                <td className="py-3 px-1">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_BASE_URL}${user.avatarUrl}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.phone}</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {user.telegram?.replace(/^@+/, '') || '—'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'open'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {user.status === 'open' ? t('dashboard.openStatus') : t('dashboard.closedStatus')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isReallyActive
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }`}>
                    {isReallyActive ? t('admin.active', 'Активно') : t('admin.inactive', 'Неактивно')}
                  </span>
                </td>
                <td className="py-3 px-1 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isReallyActive} onChange={() => handleToggleStatus(user.id, isReallyActive)} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                    <button onClick={() => window.open(`tel:${user.phone}`)} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title={t('dashboard.phone', 'Телефон')}>
                      <Phone className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen hero-gradient px-4 py-8">
      <div className="flex justify-center items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('admin.title')}
        </h1>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards
        stats={filteredStats}
        loading={statsLoading}
      />

      {/* Actions */}
      <div className="flex justify-end gap-4 my-8">
        <button
          onClick={generateBatchQR}
          className="btn btn-primary flex items-center  gap-3"
        >
          <Download className="w-5 h-5" />
          {t('admin.downloadQR')}
        </button>
      </div>

      {/* Inactive Users Table */}
      {allInactiveUsers.length > 0 ? (
        <div className="feature-card sm:py-4 px-4 mb-8">
          <div className="flex flex-col lg:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('admin.stats.inactiveUsers')}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t('admin.search', 'Поиск...')}
                    value={inactiveSearchQuery}
                    onChange={(e) => setInactiveSearchQuery(e.target.value)}
                    className="input pl-9 py-2 text-sm w-full"
                  />
                </div>

                {/* Фильтр по стране для неактивных */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setInactiveCountry('all')}
                      className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                        inactiveCountry === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {t('admin.allCountries')}
                    </button>
                    <button
                      onClick={() => setInactiveCountry('kg')}
                      className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                        inactiveCountry === 'kg'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      🇰🇬 {t('admin.kyrgyzstan')}
                    </button>
                    <button
                      onClick={() => setInactiveCountry('ru')}
                      className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                        inactiveCountry === 'ru'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      🇷🇺 {t('admin.russia')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {inactiveUsersList.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('admin.noUsersFound')}</p>
              </div>
            ) : (
              <>
                {renderUserTable(inactiveUsersList)}
                {inactiveHasMore && (
                  <div className="text-center mt-6">
                    <button
                      onClick={loadMoreInactiveUsers}
                      className="btn btn-secondary"
                    >
                      {t('admin.showMore')}
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      ) : null}

      {/* Users Table */}
      <div className="feature-card sm:py-4 px-4">
        <div className="flex flex-col lg:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('admin.users')}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('admin.search', 'Поиск...')}
                value={activeSearchQuery}
                onChange={(e) => setActiveSearchQuery(e.target.value)}
                className="input pl-9 py-2 text-sm w-full"
              />
            </div>

            {/* Переключатель стран */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCountry('all')}
                  className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                    selectedCountry === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {t('admin.allCountries')}
                </button>
                <button
                  onClick={() => setSelectedCountry('kg')}
                  className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                    selectedCountry === 'kg'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  🇰🇬 {t('admin.kyrgyzstan')}
                </button>
                <button
                  onClick={() => setSelectedCountry('ru')}
                  className={`px-3 py-2 sm:px-4 rounded-lg font-medium transition-colors text-sm ${
                    selectedCountry === 'ru'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  🇷🇺 {t('admin.russia')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {searchedUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('admin.noUsersFound')}
            </p>
          </div>
        ) : (
          <>
            {renderUserTable(searchedUsers)}

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMoreUsers}
                  className="btn btn-secondary"
                >
                  {t('admin.showMore')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
