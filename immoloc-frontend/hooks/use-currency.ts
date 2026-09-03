'use client';

import { useEffect } from 'react';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '@/stores/currency.store';

export function useCurrency() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const formatAmount = useCurrencyStore((s) => s.formatAmount);
  const convertFromXof = useCurrencyStore((s) => s.convertFromXof);
  const fetchRates = useCurrencyStore((s) => s.fetchRates);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return {
    currency,
    currencyInfo: SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.XOF,
    setCurrency,
    formatAmount,
    convertFromXof,
    supportedCurrencies: Object.values(SUPPORTED_CURRENCIES),
  };
}
