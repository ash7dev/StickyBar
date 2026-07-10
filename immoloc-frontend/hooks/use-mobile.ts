import { useEffect, useState } from 'react';

/**
 * Hook optimisé pour détecter si l'appareil est mobile.
 * Le rendu initial reste stable entre SSR et hydration pour éviter les mismatches.
 */
export function useIsMobile(breakpoint: number = 1280) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [breakpoint]);

  return isMobile;
}
