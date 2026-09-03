'use client';

import { useEffect } from 'react';
import { useCurrencyStore } from '@/stores/currency.store';
import type { LanguageCode } from '@/stores/currency.store';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

/**
 * Permet de déclencher la traduction automatique du DOM (y compris les annonces hôtes)
 * via le cookie officiel et l'API Google Translate.
 */
function setGoogleTranslateCookie(lang: LanguageCode) {
  const targetCode = lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'es';
  const cookieValue = `/fr/${targetCode}`;
  
  document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`;
  document.cookie = `googtrans=${cookieValue}; path=/;`;
}

export function GoogleTranslateScript() {
  const language = useCurrencyStore((s) => s.language);

  useEffect(() => {
    // 1. Définir le cookie de traduction Google
    setGoogleTranslateCookie(language);

    // 2. Injecter le script Google Translate s'il n'est pas déjà présent
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'fr',
              includedLanguages: 'fr,en,es',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    // 3. Forcer le basculement d'élément select Google Translate dès qu'il est prêt
    const applyTranslation = () => {
      const selectEl = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (selectEl) {
        if (selectEl.value !== language) {
          selectEl.value = language;
          selectEl.dispatchEvent(new Event('change'));
        }
        return true;
      }
      return false;
    };

    let intervalId: NodeJS.Timeout | null = null;
    if (!applyTranslation()) {
      intervalId = setInterval(() => {
        if (applyTranslation() && intervalId) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    // 4. Observer le DOM pour supprimer activement les iframes et réinitialiser le body.top
    const observer = new MutationObserver(() => {
      if (document.body.style.top !== '0px' && document.body.style.top !== '') {
        document.body.style.top = '0px';
      }
      const banner = document.querySelector('.goog-te-banner-frame');
      if (banner) {
        banner.remove();
      }
      const skiptranslate = document.querySelectorAll('.skiptranslate');
      skiptranslate.forEach((el) => {
        if (el.tagName === 'IFRAME') {
          (el as HTMLElement).style.display = 'none';
        }
      });
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      if (intervalId) clearInterval(intervalId);
      observer.disconnect();
    };
  }, [language]);

  return (
    <div id="google_translate_element" className="hidden border-none p-0 m-0 w-0 h-0 overflow-hidden" aria-hidden="true" />
  );
}
