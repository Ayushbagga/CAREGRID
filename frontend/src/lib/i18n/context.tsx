'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, SupportedLocale } from './translations';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: typeof translations['mr'];
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'mr',
  setLocale: () => {},
  t: translations['mr']
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('mr');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('caregrid_locale') as SupportedLocale;
      if (saved && (saved === 'mr' || saved === 'hi' || saved === 'en')) {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caregrid_locale', newLocale);
    }
  };

  const t = translations[locale] || translations['mr'];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
