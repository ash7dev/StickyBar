'use client';

import { useEffect } from 'react';
import { initWebVitals, measureBundleSize } from '@/lib/monitoring/performance';

/**
 * Composant pour initialiser le monitoring des Web Vitals
 * À placer dans le root layout
 */
export function WebVitalsInit() {
  useEffect(() => {
    // Initialiser le monitoring des Web Vitals
    initWebVitals();

    // Mesurer la taille des bundles
    measureBundleSize();
  }, []);

  return null;
}
