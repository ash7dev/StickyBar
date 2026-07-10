/**
 * Configuration centralisée de l'API
 * À utiliser partout au lieu de dupliquer la config
 */
export const API_CONFIG = {
  /**
   * URL de base de l'API NestJS
   * Configurable via NEXT_PUBLIC_API_URL
   */
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',

  /**
   * Timeout pour les requêtes API (en ms)
   */
  TIMEOUT: 30000,

  /**
   * Nombre de tentatives de retry en cas d'échec
   */
  RETRY_ATTEMPTS: 3,

  /**
   * Délai avant expiration du token (en ms)
   * Utilisé pour rafraîchir le token proactivement
   */
  TOKEN_REFRESH_MARGIN: 60000, // 1 minute avant expiration
} as const;

/**
 * Helper pour construire une URL complète vers l'API
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_CONFIG.BASE_URL}${cleanPath}`;
}

/**
 * Helper pour vérifier si l'API est configurée
 */
export function isApiConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_API_URL;
}
