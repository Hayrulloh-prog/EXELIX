import { useLanguage } from '../hooks/useLanguage';
import { useState, useMemo } from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { changeLanguage, currentLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = useMemo(() =>
    languages.find((lang) => lang.code === currentLanguage) || languages[0],
    [currentLanguage, languages]
  );

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors duration-300"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden sm:inline">{currentLang.name}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-900 rounded-lg shadow-lg border border-gray-200 dark:border-white z-20">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 transition-colors duration-300 ${
                  currentLanguage === lang.code
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-white'
                }`}
              >
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
