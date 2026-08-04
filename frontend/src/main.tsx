import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import './i18n'; // Import i18n configuration

// Регистрация Service Worker для PWA и Push-уведомлений
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('✅ EXELIX ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ ServiceWorker registration note:', err);
      });
  });
}

// Обработчик события beforeinstallprompt для PWA установки
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new Event('pwa-installable'));
});

// Обработчик события appinstalled для отслеживания успешной установки
window.addEventListener('appinstalled', () => {
  (window as any).deferredPrompt = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
