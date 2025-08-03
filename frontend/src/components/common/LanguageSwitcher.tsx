import { useTranslation } from 'react-i18next';
import type { SupportedLanguage, LanguageOption } from '@/i18n/types';

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <div className="flex items-center space-x-2">
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleLanguageChange(language.code)}
          className={`px-2 py-1 text-xs rounded ${
            i18n.language === language.code
              ? 'bg-primary-100 text-primary-800 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {language.nativeName}
        </button>
      ))}
    </div>
  );
}