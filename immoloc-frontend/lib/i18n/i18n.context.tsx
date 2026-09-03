'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useCurrencyStore } from '@/stores/currency.store';
import type { LanguageCode } from '@/stores/currency.store';
import { fr, type Dictionary } from './dictionaries/fr';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

const DICTIONARIES: Record<LanguageCode, Dictionary> = {
  fr,
  en,
  es,
};

interface I18nContextType {
  language: LanguageCode;
  dict: Dictionary;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'fr',
  dict: fr,
  t: (path) => path,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const language = useCurrencyStore((s) => s.language);

  const dict = useMemo(() => {
    return DICTIONARIES[language] ?? fr;
  }, [language]);

  const value = useMemo(() => {
    const t = (path: string): string => {
      const parts = path.split('.');
      let curr: any = dict;
      for (const part of parts) {
        if (curr && typeof curr === 'object' && part in curr) {
          curr = curr[part];
        } else {
          return path;
        }
      }
      return typeof curr === 'string' ? curr : path;
    };

    return { language, dict, t };
  }, [language, dict]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
