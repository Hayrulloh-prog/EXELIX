import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../lib/api';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = async (lng: string) => {

    i18n.changeLanguage(lng);

    // Update language in user profile
    try {
      const token = localStorage.getItem("userToken") || localStorage.getItem("token");
      if (token) {
        const response = await fetch(API_ENDPOINTS.UPDATE_LANGUAGE, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ language: lng }),
        });

        if (!response.ok) {
        } else {
        }
      }
    } catch (error) {
      console.error('Error updating language:', error);
    }

    // Trigger language change event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }));
  };

  const currentLanguage = i18n.language;

  return {
    t,
    changeLanguage,
    currentLanguage,
    languages: [
      { code: 'ru', name: '🇷🇺 Русский' },
      { code: 'ky', name: '🇰🇬 Кыргызский' },
      { code: 'en', name: '🇺🇸 English' }
    ]
  };
};
