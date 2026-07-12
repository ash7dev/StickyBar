'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/stores/role.store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthGuardProps {
  children: ReactNode;
  /**
   * Fallback pendant le chargement de l'auth
   * @default <LoadingSpinner />
   */
  fallback?: ReactNode;
  /**
   * URL de redirection si non authentifié
   * @default '/login'
   */
  redirectTo?: string;
}

/**
 * Auth Guard Component - Vérifie l'authentification côté client
 *
 * Features:
 * - ✅ Redirect automatique si non authentifié
 * - ✅ Loading state propre (pas de flash)
 * - ✅ Réutilisable partout
 * - ✅ Type-safe
 *
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  fallback = <LoadingSpinner />,
  redirectTo = '/login',
}: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Pas encore chargé ou non authentifié → Afficher le fallback
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Authentifié → Afficher le contenu protégé
  return <>{children}</>;
}
