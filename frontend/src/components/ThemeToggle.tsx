import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleToggleTheme = () => {
    toggleTheme();
  };

  return (
    <button
      onClick={handleToggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-300"
      aria-label={theme === 'light' ? t('theme.dark') : t('theme.light')}
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-5 h-5 text-gray-700" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-white">
            {t('theme.dark')}
          </span>
        </>
      ) : (
        <>
          <Sun className="w-5 h-5 text-yellow-400" />
          <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-white">
            {t('theme.light')}
          </span>
        </>
      )}
    </button>
  );
}
