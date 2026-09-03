'use client';

import { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { CurrencyLanguageModal } from '@/components/ui/CurrencyLanguageModal';

export function CurrencySelector() {
  const [modalOpen, setModalOpen] = useState(false);
  const { currencyInfo, languageInfo } = useCurrency();

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Changer la devise et la langue"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-forest-100/80 bg-white/80 hover:bg-lime-50/60 hover:border-forest-200 text-xs font-bold text-forest-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
      >
        <span className="text-sm leading-none">{currencyInfo.flag}</span>
        <span>{currencyInfo.symbol}</span>
        <span className="text-[10px] text-foreground-muted font-mono uppercase">· {languageInfo.code}</span>
        <ChevronDown className="w-3 h-3 text-forest-600" />
      </button>

      <CurrencyLanguageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
