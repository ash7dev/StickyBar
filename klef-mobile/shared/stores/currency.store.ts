import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export interface CurrencyItem {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  rateToXof: number;
}

export const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  {
    code: 'XOF',
    name: 'Franc CFA',
    symbol: 'FCFA',
    flag: '🇸🇳',
    rateToXof: 1,
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    rateToXof: 0.00152449,
  },
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    rateToXof: 0.00165,
  },
];

const CURRENCY_STORAGE_KEY = 'klef_user_currency';

interface CurrencyState {
  currency: CurrencyCode;
  currencyInfo: CurrencyItem;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (amountInXof: number) => string;
  hydrateCurrency: () => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: 'XOF',
  currencyInfo: SUPPORTED_CURRENCIES[0],

  setCurrency: (code: CurrencyCode) => {
    const item = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
    set({ currency: code, currencyInfo: { ...item } });
    AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code).catch((e) => {
      console.error('[CurrencyStore] Error persisting currency:', e);
    });
  },

  formatPrice: (amountInXof: number) => {
    const { currencyInfo } = get();
    const converted = amountInXof * currencyInfo.rateToXof;

    if (currencyInfo.code === 'XOF') {
      return `${Math.round(converted).toLocaleString('fr-FR')} ${currencyInfo.symbol}`;
    }
    return `${currencyInfo.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  },

  hydrateCurrency: async () => {
    try {
      const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && (stored === 'XOF' || stored === 'EUR' || stored === 'USD')) {
        const item = SUPPORTED_CURRENCIES.find((c) => c.code === stored) || SUPPORTED_CURRENCIES[0];
        set({ currency: stored as CurrencyCode, currencyInfo: item });
      }
    } catch (e) {
      console.error('[CurrencyStore] Error hydrating currency:', e);
    }
  },
}));
