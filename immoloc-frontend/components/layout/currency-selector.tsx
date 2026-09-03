'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import type { CurrencyCode } from '@/stores/currency.store';

export function CurrencySelector() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    currency,
    currencyInfo,
    setCurrency,
    supportedCurrencies,
  } = useCurrency();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    const targetInfo = supportedCurrencies.find((c) => c.code === code);
    toast.success(`Devise passée en ${targetInfo?.name || code} (${targetInfo?.symbol || ''})`, {
      duration: 2000,
    });
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Changer la devise de paiement"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-forest-100/80 bg-white/80 hover:bg-lime-50/60 hover:border-forest-200 text-xs font-bold text-forest-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
      >
        <span className="text-sm leading-none">{currencyInfo.flag}</span>
        <span>{currencyInfo.symbol}</span>
        <ChevronDown className={`w-3 h-3 text-forest-600 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-white p-2 shadow-xl ring-1 ring-black/5 z-[9999] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 mb-1 border-b border-border">
            <p className="text-[10px] font-black uppercase text-foreground-faint tracking-wider">
              Devise d'affichage
            </p>
          </div>

          <div className="space-y-0.5">
            {supportedCurrencies.map((c) => {
              const isSelected = currency === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-forest-50 text-forest-900 font-bold'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-forest-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="text-xs">
                      {c.name} <span className="text-foreground-faint font-semibold">({c.symbol})</span>
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-forest-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
