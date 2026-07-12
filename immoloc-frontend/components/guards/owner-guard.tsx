'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role.store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface OwnerGuardProps {
  children: ReactNode;
  /**
   * Fallback pendant le chargement
   * @default <LoadingSpinner />
   */
  fallback?: ReactNode;
  /**
   * URL de redirection si pas propriétaire
   * @default '/'
   */
  redirectTo?: string;
  /**
   * Auto-switch vers PROPRIETAIRE si l'utilisateur est eligible
   * @default true
   */
  autoSwitch?: boolean;
}

/**
 * Owner Guard Component - Vérifie le rôle PROPRIETAIRE (avec gestion double rôle)
 *
 * Architecture propre pour système double rôle :
 *
 * 1. Attend hydratation du store
 * 2. Si eligible PROPRIETAIRE mais rôle = LOCATAIRE → Auto-switch synchrone
 * 3. Si PAS eligible PROPRIETAIRE → Redirect immédiat
 *
 * Features:
 * - ✅ Gère le timing du switch (pas de redirect prématuré)
 * - ✅ Switch synchrone (pas de race condition)
 * - ✅ Loading state propre pendant le switch
 * - ✅ Zero spaghetti code
 * - ✅ Logs clairs pour debug
 *
 * Usage:
 * ```tsx
 * <OwnerGuard>
 *   <DashboardContent />
 * </OwnerGuard>
 * ```
 */
export function OwnerGuard({
  children,
  fallback = <LoadingSpinner fullscreen />,
  redirectTo = '/',
  autoSwitch = true,
}: OwnerGuardProps) {
  const { activeRole, estProprietaire, setRole, hasHydrated } = useRoleStore();
  const router = useRouter();
  const hasAttemptedSwitch = useRef(false);

  // ══════════════════════════════════════════════════════════════════════════
  // Effect 1 : Vérifier eligibilité et switch si nécessaire
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Attendre hydratation
    if (!hasHydrated) {
      console.log('[OwnerGuard] ⏳ Waiting for store hydration...');
      return;
    }

    // Vérifier eligibilité PROPRIETAIRE
    if (!estProprietaire) {
      console.warn('[OwnerGuard] ❌ User not eligible as owner, redirecting to:', redirectTo);
      router.replace(redirectTo);
      return;
    }

    // Auto-switch si nécessaire (une seule fois)
    if (activeRole !== 'PROPRIETAIRE' && autoSwitch && !hasAttemptedSwitch.current) {
      console.log('[OwnerGuard] 🔄 Auto-switching to PROPRIETAIRE role...');
      hasAttemptedSwitch.current = true;
      setRole('PROPRIETAIRE');
      // Le re-render se fera automatiquement via le store
    }
  }, [estProprietaire, activeRole, hasHydrated, setRole, router, redirectTo, autoSwitch]);

  // ══════════════════════════════════════════════════════════════════════════
  // Rendering Logic (Clean & Explicit)
  // ══════════════════════════════════════════════════════════════════════════

  // Cas 1 : Store pas encore hydraté → Loading
  if (!hasHydrated) {
    return <>{fallback}</>;
  }

  // Cas 2 : Pas eligible propriétaire → Loading (redirect en cours)
  if (!estProprietaire) {
    return <>{fallback}</>;
  }

  // Cas 3 : Switch en cours → Loading (attendre que activeRole = PROPRIETAIRE)
  if (activeRole !== 'PROPRIETAIRE') {
    return <>{fallback}</>;
  }

  // Cas 4 : Tout est OK (activeRole = PROPRIETAIRE) → Afficher le contenu
  console.log('[OwnerGuard] ✅ Access granted - displaying owner content');
  return <>{children}</>;
}
