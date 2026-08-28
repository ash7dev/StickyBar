'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useCurrencyStore, CURRENCIES, type CurrencyCode } from '@/stores/currency.store';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCurrency = CURRENCIES[currency] ?? CURRENCIES.XOF;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Changer la devise"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-forest-100/80 bg-white/80 hover:bg-lime-50/60 hover:border-forest-200 text-xs font-semibold text-forest-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
      >
        <span className="text-sm leading-none">{activeCurrency.flag}</span>
        <span>{activeCurrency.symbol}</span>
        <ChevronDown className={`w-3 h-3 text-forest-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-forest-100/80 bg-white/95 backdrop-blur-md shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-forest-100/50 mb-1">
            <p className="text-[10px] font-black uppercase text-foreground-muted tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-forest-600" />
              Devise de prix
            </p>
          </div>

          <div className="space-y-0.5">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
              const item = CURRENCIES[code];
              const isSelected = currency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setCurrency(code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-forest-50 text-forest-900 font-black'
                      : 'text-forest-800 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.flag}</span>
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-forest-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
