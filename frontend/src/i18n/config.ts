import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import JSON translation files
import ruTranslations from '../locales/ru.json';
import kyTranslations from '../locales/ky.json';
import enTranslations from '../locales/en.json';

const resources = {
  ru: {
    translation: ruTranslations
  },
  en: {
    translation: enTranslations
  },
  ky: {
    translation: kyTranslations
  }
};

i18n
  .use(LanguageDetector) // Включаем автоопределение языка
  .use(initReactI18next)
  .init({
    resources,
    // lng: 'ru', // Убираем жесткую установку языка
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
    // Включаем определение языка
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: 'languageChanged',
    },
    initImmediate: false,
  });

export default i18n;
