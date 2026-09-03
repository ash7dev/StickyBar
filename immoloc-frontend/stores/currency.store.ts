import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CurrencyCode = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'CAD';
export type LanguageCode = 'fr' | 'en' | 'es';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
}

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  flag: string;
  native: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  XOF: { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (WAEMU)', flag: '🇸🇳', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', decimals: 2 },
};

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  fr: { code: 'fr', name: 'Français', flag: '🇫🇷', native: 'Français' },
  en: { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸', native: 'Español' },
};

/* Taux de secours si le réseau est indisponible (1 XOF = x Devises) */
const DEFAULT_RATES: Record<CurrencyCode, number> = {
  XOF: 1,
  EUR: 1 / 655.957, // 0.00152458
  USD: 0.00167,
  GBP: 0.00128,
  CAD: 0.00226,
};

export interface FormattedPriceResult {
  amountStr: string;
  symbol: string;
  fullStr: string;
  formatted: string;
  toString: () => string;
}

interface CurrencyStore {
  currency: CurrencyCode;
  language: LanguageCode;
  rates: Record<CurrencyCode, number>;
  lastUpdated: number | null;
  isLoadingRates: boolean;
  
  setCurrency: (code: CurrencyCode, manualOverrideLanguage?: boolean) => void;
  setLanguage: (code: LanguageCode) => void;
  fetchRates: () => Promise<void>;
  formatAmount: (amountInXof: number | string) => string;
  getFormattedPrice: (amountInXof: number | string) => FormattedPriceResult;
  convertFromXof: (amountInXof: number) => number;
}

/**
 * Appariement intelligent Devise ➔ Langue par défaut :
 * - EUR / XOF ➔ Français (fr) sauf si déjà en Espagnol (es)
 * - USD / GBP / CAD ➔ Anglais (en)
 */
function getIntelligentLanguagePairing(currency: CurrencyCode, currentLang: LanguageCode): LanguageCode {
  if (currency === 'USD' || currency === 'GBP' || currency === 'CAD') {
    return 'en';
  }
  if (currency === 'EUR' || currency === 'XOF') {
    return currentLang === 'es' ? 'es' : 'fr';
  }
  return currentLang;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'XOF',
      language: 'fr',
      rates: DEFAULT_RATES,
      lastUpdated: null,
      isLoadingRates: false,

      setCurrency: (code, manualOverrideLanguage = false) => {
        const currentLang = get().language;
        const nextLang = manualOverrideLanguage
          ? currentLang
          : getIntelligentLanguagePairing(code, currentLang);

        set({
          currency: code,
          language: nextLang,
        });
      },

      setLanguage: (code) => {
        set({ language: code });
      },

      fetchRates: async () => {
        /* Ne rafraîchir les taux de change que toutes les 6 heures pour économiser le réseau */
        const last = get().lastUpdated;
        if (last && Date.now() - last < 6 * 3600 * 1000) return;

        set({ isLoadingRates: true });
        try {
          const res = await fetch('https://open.er-api.com/v6/latest/XOF');
          if (!res.ok) throw new Error('API rates unavailable');
          const data = await res.json();
          if (data && data.rates) {
            set({
              rates: {
                XOF: 1,
                EUR: 1 / 655.957, // Parité stricte BCEAO
                USD: data.rates.USD || DEFAULT_RATES.USD,
                GBP: data.rates.GBP || DEFAULT_RATES.GBP,
                CAD: data.rates.CAD || DEFAULT_RATES.CAD,
              },
              lastUpdated: Date.now(),
              isLoadingRates: false,
            });
          }
        } catch {
          set({ isLoadingRates: false });
        }
      },

      convertFromXof: (amountInXof: number) => {
        const { currency, rates } = get();
        const rate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;
        return amountInXof * rate;
      },

      formatAmount: (amountInXof: number | string) => {
        const num = Number(amountInXof) || 0;
        const { currency, rates } = get();
        const info = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.XOF;
        const rate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;

        const converted = num * rate;

        if (currency === 'XOF') {
          const formattedInt = new Intl.NumberFormat('fr-FR', {
            maximumFractionDigits: 0,
          }).format(Math.round(converted));
          return `${formattedInt} FCFA`;
        }

        const formatted = new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: info.decimals,
          maximumFractionDigits: info.decimals,
        }).format(converted);

        if (currency === 'EUR') return `${formatted} €`;
        if (currency === 'USD') return `$${formatted}`;
        if (currency === 'GBP') return `£${formatted}`;
        if (currency === 'CAD') return `CA$${formatted}`;

        return `${formatted} ${info.symbol}`;
      },

      getFormattedPrice: (amountInXof: number | string) => {
        const num = Number(amountInXof) || 0;
        const { currency, rates } = get();
        const info = SUPPORTED_CURRENCIES[currency] ?? SUPPORTED_CURRENCIES.XOF;
        const rate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;

        const converted = num * rate;
        let amountStr = '';
        let fullStr = '';

        if (currency === 'XOF') {
          amountStr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(converted));
          fullStr = `${amountStr} FCFA`;
        } else {
          amountStr = new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: info.decimals,
            maximumFractionDigits: info.decimals,
          }).format(converted);
          if (currency === 'EUR') fullStr = `${amountStr} €`;
          else if (currency === 'USD') fullStr = `$${amountStr}`;
          else if (currency === 'GBP') fullStr = `£${amountStr}`;
          else if (currency === 'CAD') fullStr = `CA$${amountStr}`;
          else fullStr = `${amountStr} ${info.symbol}`;
        }

        return {
          amountStr,
          symbol: info.symbol,
          fullStr,
          formatted: fullStr,
          toString: () => fullStr,
        };
      },
    }),
    {
      name: 'klef-currency-storage',
      partialize: (state) => ({
        currency: state.currency,
        language: state.language,
        rates: state.rates,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);
