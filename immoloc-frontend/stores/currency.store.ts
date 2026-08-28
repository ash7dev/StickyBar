import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  symbol: string;
  rateFromFcfa: number; // 1 FCFA * rate = Amount in Currency
  flag: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  XOF: {
    code: 'XOF',
    label: 'FCFA (XOF)',
    symbol: 'FCFA',
    rateFromFcfa: 1,
    flag: '🇸🇳',
  },
  EUR: {
    code: 'EUR',
    label: 'Euro (€)',
    symbol: '€',
    rateFromFcfa: 1 / 655.957,
    flag: '🇪🇺',
  },
  USD: {
    code: 'USD',
    label: 'US Dollar ($)',
    symbol: '$',
    rateFromFcfa: 1 / 600,
    flag: '🇺🇸',
  },
};

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  getFormattedPrice: (priceInFcfa: number | string | null | undefined) => { amountStr: string; symbol: string; fullStr: string };
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'XOF',
      setCurrency: (code) => set({ currency: code }),
      getFormattedPrice: (priceInFcfa) => {
        if (priceInFcfa === null || priceInFcfa === undefined) {
          return { amountStr: '—', symbol: '', fullStr: '—' };
        }
        const num = typeof priceInFcfa === 'string' ? parseFloat(priceInFcfa) : priceInFcfa;
        if (Number.isNaN(num) || num <= 0) {
          return { amountStr: '—', symbol: '', fullStr: '—' };
        }

        const curr = CURRENCIES[get().currency] ?? CURRENCIES.XOF;
        const converted = Math.round(num * curr.rateFromFcfa);
        const amountStr = converted.toLocaleString('fr-FR');

        if (curr.code === 'XOF') {
          return { amountStr, symbol: 'FCFA', fullStr: `${amountStr} FCFA` };
        } else if (curr.code === 'EUR') {
          return { amountStr, symbol: '€', fullStr: `${amountStr} €` };
        } else {
          return { amountStr, symbol: '$', fullStr: `${amountStr} $` };
        }
      },
    }),
    {
      name: 'klef-currency',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
