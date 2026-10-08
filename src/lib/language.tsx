import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '../shared/types';

// App-wide EN/TE choice, remembered on the phone (same key as the website uses in the browser)
const STORAGE_KEY = 'parishath-language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  // Pick the English or Telugu text for the current language
  t: (en: string, te: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'te') setLanguageState(stored);
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
  }, []);

  const t = useCallback((en: string, te: string) => (language === 'en' ? en : te), [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
