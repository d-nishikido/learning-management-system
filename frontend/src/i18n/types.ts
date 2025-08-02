import type { ReactNode } from 'react';

export interface TranslationValues {
  [key: string]: string | number | ReactNode;
}

export type SupportedLanguage = 'en' | 'ja';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}