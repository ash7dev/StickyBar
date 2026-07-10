/**
 * Monitoring des performances Web Vitals
 * Documentation: https://web.dev/vitals/
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { captureMessage, addBreadcrumb } from './sentry';

/**
 * Seuils des Core Web Vitals (en ms sauf CLS)
 * Source: https://web.dev/defining-core-web-vitals-thresholds/
 */
const THRESHOLDS = {
  // Largest Contentful Paint - chargement perçu
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // Interaction to Next Paint - interactivité
  INP: {
    good: 200,
    needsImprovement: 500,
  },
  // Cumulative Layout Shift - stabilité visuelle
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint - première peinture
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte - réactivité serveur
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * Détermine la qualité d'une métrique
 */
function getMetricQuality(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Envoie une métrique à Sentry ou un service analytics
 */
function sendMetric(metric: Metric) {
  const quality = getMetricQuality(metric.name, metric.value);

  // Log en développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      quality,
    });
  }

  // Ajouter un breadcrumb Sentry
  addBreadcrumb(
    `Web Vital: ${metric.name}`,
    'performance',
    {
      value: metric.value,
      rating: metric.rating,
      quality,
      id: metric.id,
      navigationType: metric.navigationType,
    }
  );

  // Si la métrique est mauvaise, capturer un message Sentry
  if (quality === 'poor') {
    captureMessage(
      `Poor ${metric.name}: ${metric.value}`,
      'warning'
    );
  }

  // Envoyer à Google Analytics si activé
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * Initialise le monitoring des Web Vitals
 * À appeler côté client uniquement
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  try {
    // Core Web Vitals
    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);

    // Autres métriques utiles
    onFCP(sendMetric);
    onTTFB(sendMetric);
  } catch (error) {
    console.error('[Web Vitals] Erreur d\'initialisation:', error);
  }
}

/**
 * Mesure la performance d'une opération
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  const start = performance.now();

  const end = () => {
    const duration = performance.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }

    addBreadcrumb(name, 'performance', { duration });
  };

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(end);
    }

    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
}

/**
 * Hook React pour mesurer le temps de rendu d'un composant
 */
export function useRenderTime(componentName: string) {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`[Slow Render] ${componentName}: ${duration.toFixed(2)}ms`);
    }

    if (duration > 100) {
      addBreadcrumb(
        `Slow render: ${componentName}`,
        'performance',
        { duration }
      );
    }
  };
}

/**
 * Mesure la taille du bundle chargé
 */
export function measureBundleSize() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('.js')) {
          const resource = entry as PerformanceResourceTiming;
          const size = resource.transferSize || 0;

          if (size > 500000) { // Plus de 500KB
            console.warn(`[Large Bundle] ${entry.name}: ${(size / 1024).toFixed(2)}KB`);

            addBreadcrumb(
              'Large bundle loaded',
              'performance',
              {
                url: entry.name,
                size: size,
              }
            );
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  } catch (error) {
    console.error('[Bundle Size] Erreur de mesure:', error);
  }
}
