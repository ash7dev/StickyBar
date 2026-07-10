/**
 * Configuration Sentry pour le monitoring des erreurs
 * Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Initialise Sentry pour le monitoring des erreurs
 * À appeler dans sentry.client.config.ts et sentry.server.config.ts
 */
export function initSentry() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const ENABLED = process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true';

  // Ne pas initialiser Sentry si désactivé ou en développement sans DSN
  if (!ENABLED || (!SENTRY_DSN && ENVIRONMENT === 'development')) {
    console.log('[Sentry] Monitoring désactivé');
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN manquant - monitoring non initialisé');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Taux d'échantillonnage des traces (0.0 à 1.0)
    // En production: réduire pour économiser le quota
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Taux d'échantillonnage des sessions de replay
    // Capture les sessions avec erreurs
    replaysOnErrorSampleRate: ENVIRONMENT === 'production' ? 1.0 : 0.0,

    // Taux d'échantillonnage général des replays
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0.0,

    // Désactiver en développement pour économiser les quotas
    enabled: ENVIRONMENT !== 'development',

    // Options de confidentialité
    beforeSend(event, hint) {
      // Filtrer les données sensibles
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Ne pas envoyer les erreurs de développement
      if (ENVIRONMENT === 'development') {
        console.log('[Sentry] Event (dev mode):', event);
        return null;
      }

      return event;
    },

    // Ignorer certaines erreurs courantes
    ignoreErrors: [
      // Erreurs réseau
      'Network request failed',
      'NetworkError',
      'Failed to fetch',

      // Erreurs de navigation
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',

      // Erreurs d'extension de navigateur
      'chrome-extension://',
      'moz-extension://',
    ],

    // Intégrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.log('[Sentry] Monitoring initialisé:', {
    environment: ENVIRONMENT,
    dsn: SENTRY_DSN ? '***' : 'missing',
  });
}

/**
 * Capture une erreur manuellement
 */
export function captureError(error: Error | unknown, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext('custom', context);
  }

  if (error instanceof Error) {
    Sentry.captureException(error);
  } else {
    Sentry.captureException(new Error(String(error)));
  }
}

/**
 * Capture un message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Définit l'utilisateur actuel pour le contexte
 */
export function setUser(user: { id: string; email?: string; role?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Ajoute un breadcrumb (fil d'Ariane) pour le debugging
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
