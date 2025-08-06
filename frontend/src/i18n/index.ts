import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enCommon from './resources/en/common.json';
import enCourse from './resources/en/course.json';
import enLesson from './resources/en/lesson.json';
import enDashboard from './resources/en/dashboard.json';
import enMaterial from './resources/en/material.json';
import enProgress from './resources/en/progress.json';
import jaCommon from './resources/ja/common.json';
import jaCourse from './resources/ja/course.json';
import jaLesson from './resources/ja/lesson.json';
import jaDashboard from './resources/ja/dashboard.json';
import jaMaterial from './resources/ja/material.json';
import jaProgress from './resources/ja/progress.json';

const resources = {
  en: {
    common: enCommon,
    course: enCourse,
    lesson: enLesson,
    dashboard: enDashboard,
    material: enMaterial,
    progress: enProgress,
  },
  ja: {
    common: jaCommon,
    course: jaCourse,
    lesson: jaLesson,
    dashboard: jaDashboard,
    material: jaMaterial,
    progress: jaProgress,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'course', 'lesson', 'dashboard', 'material', 'progress'],
    
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