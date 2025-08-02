import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enCommon from './resources/en/common.json';
import enCourse from './resources/en/course.json';
import jaCommon from './resources/ja/common.json';
import jaCourse from './resources/ja/course.json';

const resources = {
  en: {
    common: enCommon,
    course: enCourse,
  },
  ja: {
    common: jaCommon,
    course: jaCourse,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'course'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;