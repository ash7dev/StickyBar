'use client';

import { useState, useId, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, DollarSign, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/use-currency';
import type { CurrencyCode, LanguageCode } from '@/stores/currency.store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CurrencyLanguageModal({ isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'currency' | 'language'>('currency');
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  const {
    currency,
    language,
    currencyInfo,
    languageInfo,
    setCurrency,
    setLanguage,
    supportedCurrencies,
    supportedLanguages,
  } = useCurrency();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const applyGoogleCookie = (lang: LanguageCode) => {
    const targetCode = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'es';
    const cookieValue = `/fr/${targetCode}`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieValue}; path=/;`;
  };

  const handleSelectCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    const targetLang = (code === 'USD' || code === 'GBP' || code === 'CAD') ? 'en' : language;
    applyGoogleCookie(targetLang);

    onClose();
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    applyGoogleCookie(code);

    onClose();
    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-forest-950/75 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-border bg-background-card p-6 shadow-2xl transition-all sm:rounded-3xl sm:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-forest-100 bg-forest-50 text-forest-700">
              <Globe className="h-5.5 w-5.5" />
            </span>
            <div>
              <h2 id={titleId} className="font-display text-lg font-bold text-foreground">
                Langue & Devise
              </h2>
              <p className="text-xs text-foreground-muted">
                Personnalisez votre affichage et votre monnaie de réservation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background-alt text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 rounded-2xl border border-border bg-background-alt p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('currency')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'currency'
                ? 'bg-background-card text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Devise ({currencyInfo.symbol})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'language'
                ? 'bg-background-card text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            <span className="text-sm">{languageInfo.flag}</span>
            <span>Langue ({languageInfo.native})</span>
          </button>
        </div>

        {/* Content Tab 1 : Devises */}
        {activeTab === 'currency' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-forest-700 bg-forest-50/70 border border-forest-100 p-2.5 rounded-xl">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-lime-600" />
              <span>
                <strong>Appariement intelligent :</strong> Sélectionner le USD, GBP ou CAD passe automatiquement l’application en Anglais.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {supportedCurrencies.map((c) => {
                const isSelected = currency === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCurrency(c.code)}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-forest-600 bg-forest-50/50 ring-2 ring-forest-500/20'
                        : 'border-border bg-background-card hover:bg-background-alt'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {c.code} <span className="font-semibold text-foreground-muted">({c.symbol})</span>
                        </p>
                        <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                          {c.name}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-forest-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Tab 2 : Langues */}
        {activeTab === 'language' && (
          <div className="mt-5 space-y-2.5">
            {supportedLanguages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-forest-600 bg-forest-50/50 ring-2 ring-forest-500/20'
                      : 'border-border bg-background-card hover:bg-background-alt'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{l.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{l.native}</p>
                      <p className="text-[11px] text-foreground-muted">{l.name}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-forest-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-pill bg-forest-900 hover:bg-forest-950 text-white py-3 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
