'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestorationReset() {
  const pathname = usePathname();

  useEffect(() => {
    // Empêche le navigateur de restaurer un décalage de scroll vers le footer
    // lorsque le DOM se charge de façon asynchrone lors d'un rafraîchissement.
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Réinitialise le scroll en haut de page lors d'un chargement/rafraîchissement
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
