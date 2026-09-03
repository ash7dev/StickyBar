'use client';

import { useEffect } from 'react';
import { useCurrencyStore, SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '@/stores/currency.store';

export function useCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  const language = useCurrencyStore((s) => s.language);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const setLanguage = useCurrencyStore((s) => s.setLanguage);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  const convertFromXof = useCurrencyStore((s) => s.convertFromXof);
  const fetchRates = useCurrencyStore((s) => s.fetchRates);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    currency,
    language,
    currencyInfo: SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.XOF,
    languageInfo: SUPPORTED_LANGUAGES[language] ?? SUPPORTED_LANGUAGES.fr,
    setCurrency,
    setLanguage,
    formatAmount,
    convertFromXof,
    supportedCurrencies: Object.values(SUPPORTED_CURRENCIES),
    supportedLanguages: Object.values(SUPPORTED_LANGUAGES),
  };
}
