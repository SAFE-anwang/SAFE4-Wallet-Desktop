


import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import i18n_en from './i18n_en';
import i18n_zh from './i18n_zh';

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: i18n_en,
      },
      zh: {
        translation: i18n_zh,
      },
    },
    lng: "zh",         // 默认语言
    fallbackLng: "zh", // 后备语言
    interpolation: {
      escapeValue: false, // React 已经安全
    },
  });

export default i18n;
