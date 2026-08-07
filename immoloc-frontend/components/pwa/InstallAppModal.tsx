'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Share, PlusSquare, Download, X, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const PWA_DISMISSED_KEY = 'klef_pwa_install_dismissed';
const COOKIE_CONSENT_KEY = 'klef_cookie_consent';

export function InstallAppModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Vérifier si déjà installé en mode Standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Détecter iOS et Mac Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    const macSafari = /macintosh/i.test(ua) && /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);
    
    setIsIOS(iosDevice);
    setIsMacSafari(macSafari);

    // 3. Capturer l'évènement natif de Chrome/Android/Edge (beforeinstallprompt)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Écouter la ré-ouverture manuelle depuis le Footer ou le Menu
    const handleManualOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-klef-install-modal', handleManualOpen);

    // 5. Déclencher automatiquement après vérification du consentement Cookie
    const timer = setTimeout(() => {
      const hasCookieConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
      const isDismissed = localStorage.getItem(PWA_DISMISSED_KEY);

      // Ne déclencher que si le consentement cookie est réglé ET que l'utilisateur n'a pas fermé la bannière récemment
      if (hasCookieConsent && !isDismissed && !isStandalone) {
        setIsOpen(true);
      }
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-klef-install-modal', handleManualOpen);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chrome/Android : Déclencher le prompt d'installation natif du navigateur
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      // Ne plus ré-afficher automatiquement pendant 7 jours
      localStorage.setItem(PWA_DISMISSED_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Impossible de sauvegarder le dismiss PWA :', e);
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed inset-x-0 bottom-4 z-[110] p-3 sm:p-6 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative rounded-card bg-background-card/95 backdrop-blur-xl border border-border shadow-float p-5 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300">
          
          {/* Lueurs décoratives */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-marker-bg blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-forest-500/10 blur-2xl pointer-events-none" />

          {/* En-tête avec bouton de fermeture */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-inner bg-forest-950 text-on-inverse-marker border border-forest-800 flex items-center justify-center shrink-0 shadow-xs">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 id="pwa-install-title" className="font-display text-base font-semibold text-foreground leading-snug">
                  Installer l'application Klef
                </h3>
                <p className="text-[11px] font-medium text-foreground-muted flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-500" />
                  Accès instantané & Mode hors-ligne
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-pill bg-background-alt hover:bg-border text-foreground-muted hover:text-foreground transition-colors shrink-0 border border-border"
              aria-label="Fermer la suggestion d'installation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Explications Android vs iOS */}
          <div className="my-4 space-y-3">
            <p className="text-xs text-foreground-muted leading-relaxed">
              Ajoutez Klef à votre écran d'accueil pour réserver en 1-clic, recevoir vos contrats de location et naviguer sans aucun téléchargement sur les stores.
            </p>

            {/* Guide pas-à-pas pour iPhone / Safari */}
            {isIOS ? (
              <div className="p-3.5 rounded-inner bg-background-alt border border-border space-y-2 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Share className="w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker" />
                  <span>Comment l'installer sur iPhone / iPad :</span>
                </p>
                <ol className="space-y-1.5 text-foreground-muted pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-on-inverse-marker text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span>Appuyez sur le bouton <strong>Partager</strong> <Share className="inline w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker mx-0.5" /> en bas de Safari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-on-inverse-marker text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span>Défilez vers le bas et touchez <strong>Sur l'écran d'accueil</strong> <PlusSquare className="inline w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker mx-0.5" /></span>
                  </li>
                </ol>
              </div>
            ) : isMacSafari ? (
              /* Guide pour Mac Safari Desktop */
              <div className="p-3.5 rounded-inner bg-background-alt border border-border space-y-2 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker" />
                  <span>Comment l'installer sur Mac (Safari Desktop) :</span>
                </p>
                <ol className="space-y-1.5 text-foreground-muted pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-on-inverse-marker text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
                    <span>Dans le menu Safari, cliquez sur <strong>Fichier</strong> en haut de l'écran</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-on-inverse-marker text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                    <span>Sélectionnez <strong>« Ajouter au Dock »</strong> pour ouvrir Klef comme une App Mac !</span>
                  </li>
                </ol>
              </div>
            ) : (
              /* Caractéristiques sur Android/Desktop Chrome */
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground">
                <div className="flex items-center gap-1.5 p-2 rounded-inner bg-background-alt border border-border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-600 shrink-0" />
                  <span>Lancement instantané</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-inner bg-background-alt border border-border">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-600 dark:text-on-inverse-marker shrink-0" />
                  <span>100% Sécurisé (0 Mo)</span>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-2 rounded-pill text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
            >
              Plus tard
            </button>

            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="btn-action text-xs px-5 py-2 shadow-sm active:scale-[0.98] inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Installer maintenant</span>
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 rounded-pill text-xs font-semibold text-foreground bg-background-alt border border-border transition-all"
              >
                J'ai compris
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default InstallAppModal;
