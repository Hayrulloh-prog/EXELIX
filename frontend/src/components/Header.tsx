import { Link, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, User } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
import UserDataSync from '../lib/userDataSync';

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Extract token from URL
  let qrToken = new URLSearchParams(location.search).get("token") || new URLSearchParams(location.search).get("qrToken");
  if (!qrToken) {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'notify' || pathParts[1] === 'qr') {
      qrToken = pathParts[2];
    }
  }

  const loginTo = qrToken ? `/login?qrToken=${qrToken}` : "/login";

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token");
      setIsLoggedIn(!!token);

      const userData = UserDataSync.load();
      if (userData) {
        setAvatarUrl(userData.avatarUrl || null);
      } else {
        setAvatarUrl(null);
      }
    };

    checkAuth();

    // Listen to storage events to update header dynamically
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="px-4 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow transition-all"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </Link>
          ) : (
            <Link
              to={loginTo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("auth.login")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
