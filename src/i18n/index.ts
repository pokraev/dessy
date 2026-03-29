import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import bg from './bg.json';
import en from './en.json';

const LANG_KEY = 'dessy-language';

function getSavedLang(): string {
  if (typeof window === 'undefined') return 'bg';
  return localStorage.getItem(LANG_KEY) || 'bg';
}

i18n.use(initReactI18next).init({
  resources: { bg: { translation: bg }, en: { translation: en } },
  lng: getSavedLang(),
  fallbackLng: 'bg',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
}

export default i18n;
