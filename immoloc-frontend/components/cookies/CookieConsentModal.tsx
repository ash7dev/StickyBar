'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, SlidersHorizontal, X, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const CONSENT_STORAGE_KEY = 'klef_cookie_consent';

export interface CookiePreferences {
  necessary: boolean; // Toujours true
  analytics: boolean;
  marketing: boolean;
  acceptedAt: string;
}

export function CookieConsentModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<{ analytics: boolean; marketing: boolean }>({
    analytics: true,
    marketing: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenModal = () => {
      setIsOpen(true);
      setShowPreferences(true);
    };

    window.addEventListener('open-klef-cookie-modal', handleOpenModal);
    return () => window.removeEventListener('open-klef-cookie-modal', handleOpenModal);
  }, []);

  const savePreferences = (customPrefs: { analytics: boolean; marketing: boolean }) => {
    const payload: CookiePreferences = {
      necessary: true,
      analytics: customPrefs.analytics,
      marketing: customPrefs.marketing,
      acceptedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Impossible de sauvegarder le consentement cookie :', e);
    }

    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ analytics: true, marketing: true });
  };

  const handleNecessaryOnly = () => {
    savePreferences({ analytics: false, marketing: false });
  };

  const handleSaveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-6 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="relative rounded-card bg-background-card/95 backdrop-blur-xl border border-border shadow-float p-5 sm:p-7 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          {/* Halo d'ambiance discret */}
          <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-forest-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />

          {!showPreferences ? (
            /* ── Vue Principale ── */
            <div className="space-y-4 sm:space-y-5">
              
              {/* Header avec Icône & Titre */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-inner bg-forest-950 text-lime-400 border border-forest-800 flex items-center justify-center shrink-0 shadow-xs">
                    <Cookie className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2
                      id="cookie-consent-title"
                      className="font-display text-base sm:text-lg font-semibold text-foreground tracking-tight leading-snug"
                    >
                      Respect de votre vie privée
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 dark:text-lime-400 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Confidentialité & Transparence
                    </span>
                  </div>
                </div>

                {/* Fermeture (Cookies nécessaires uniquement) */}
                <button
                  onClick={handleNecessaryOnly}
                  className="w-8 h-8 rounded-pill bg-background-alt hover:bg-border flex items-center justify-center transition-colors text-foreground-muted hover:text-foreground shrink-0 border border-border"
                  aria-label="Fermer et conserver uniquement les cookies nécessaires"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Explicatif */}
              <p
                id="cookie-consent-desc"
                className="text-xs sm:text-sm text-foreground-muted leading-relaxed"
              >
                Nous utilisons des cookies pour personnaliser notre contenu, assurer la sécurité de vos réservations et mesurer l'audience de la plateforme. En poursuivant, vous acceptez notre{' '}
                <Link
                  href="/confidentialite"
                  className="font-semibold text-foreground underline decoration-foreground/40 dark:decoration-lime-400/50 underline-offset-4 hover:decoration-foreground dark:hover:decoration-lime-400 transition-all"
                >
                  Politique de confidentialité & cookies
                </Link>
                . Vos choix sont modifiables à tout moment.
              </p>

              {/* Actions principales */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="inline-flex items-center justify-center gap-2.5 px-4 py-2 rounded-pill text-xs font-semibold text-foreground bg-background-alt hover:bg-border/60 border border-border transition-all order-3 sm:order-1 active:scale-[0.98]"
                >
                  <span className="w-6 h-6 rounded-full bg-forest-950 text-lime-400 border border-forest-800 flex items-center justify-center shrink-0 shadow-sm">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </span>
                  <span>Gérer les préférences</span>
                </button>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 order-1 sm:order-2">
                  <button
                    onClick={handleNecessaryOnly}
                    className="px-4 py-2.5 rounded-pill text-xs font-semibold text-foreground bg-background-alt hover:bg-border/60 border border-border transition-all text-center active:scale-[0.98]"
                  >
                    Nécessaires uniquement
                  </button>

                  <button
                    onClick={handleAcceptAll}
                    className="btn-action text-xs px-5 py-2.5 shadow-sm text-center active:scale-[0.98]"
                  >
                    Accepter tout
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ── Vue Panneau de Gestion des Préférences ── */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Header Préférences */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">Gestion des préférences</h3>
                    <p className="text-[11px] text-foreground-muted">Ajustez vos autorisations de cookies</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-1.5 rounded-pill hover:bg-background-alt text-foreground-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Liste des catégories de cookies */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                
                {/* 1. Cookies Nécessaires */}
                <div className="p-3.5 rounded-inner bg-background-alt border border-border flex items-start justify-between gap-3">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Lock className="w-3.5 h-3.5 text-forest-600 dark:text-lime-400 shrink-0" />
                      <span className="text-xs font-semibold text-foreground">Strictement nécessaires</span>
                      <span className="px-2 py-0.5 rounded-pill bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-lime-300 text-[10px] font-bold uppercase tracking-wider">
                        Requis
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed">
                      Essentiels au fonctionnement du site, à l'authentification et au séquestre de paiement.
                    </p>
                  </div>
                  <div className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-pill border-2 border-transparent bg-forest-800 opacity-60">
                    <span className="translate-x-5 inline-block h-5 w-5 transform rounded-pill bg-white shadow-xs" />
                  </div>
                </div>

                {/* 2. Cookies Analytiques */}
                <div className="p-3.5 rounded-inner bg-background-card border border-border flex items-start justify-between gap-3 hover:border-border-hover transition-colors">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      <span className="text-xs font-semibold text-foreground">Analytiques & Performance</span>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed">
                      Mesure de l'audience et amélioration continue de l'ergonomie.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.analytics}
                    onClick={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      preferences.analytics ? 'bg-forest-900 dark:bg-lime-400' : 'bg-neutral-300 dark:bg-neutral-700'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-white dark:bg-forest-950 shadow-xs ring-0 transition duration-200 ease-in-out',
                        preferences.analytics ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {/* 3. Cookies Marketing */}
                <div className="p-3.5 rounded-inner bg-background-card border border-border flex items-start justify-between gap-3 hover:border-border-hover transition-colors">
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-success-600 shrink-0" />
                      <span className="text-xs font-semibold text-foreground">Personnalisation</span>
                    </div>
                    <p className="text-[11px] text-foreground-muted leading-relaxed">
                      Recommandations personnalisées selon vos recherches de logements.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.marketing}
                    onClick={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      preferences.marketing ? 'bg-forest-900 dark:bg-lime-400' : 'bg-neutral-300 dark:bg-neutral-700'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-pill bg-white dark:bg-forest-950 shadow-xs ring-0 transition duration-200 ease-in-out',
                        preferences.marketing ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

              </div>

              {/* Actions Préférences */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 rounded-pill text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
                >
                  Retour
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  className="btn-action text-xs px-5 py-2.5 shadow-sm active:scale-[0.98]"
                >
                  Enregistrer mes choix
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default CookieConsentModal;

