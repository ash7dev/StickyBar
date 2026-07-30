'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role.store';

interface OwnerGuardProps {
  children: ReactNode;
  /**
   * Fallback pendant le chargement
   * @default <div className="w-full h-full p-6 bg-background-alt animate-pulse rounded-card" />
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

export function OwnerGuard({
  children,
  fallback = (
    <div className="w-full min-h-[400px] p-6 bg-background-alt/60 border border-border/60 animate-pulse rounded-card" />
  ),
  redirectTo = '/',
  autoSwitch = true,
}: OwnerGuardProps) {
  const { activeRole, estProprietaire, setRole, hasHydrated } = useRoleStore();
  const router = useRouter();
  const hasAttemptedSwitch = useRef(false);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!estProprietaire) {
      router.replace(redirectTo);
      return;
    }

    if (activeRole !== 'PROPRIETAIRE' && autoSwitch && !hasAttemptedSwitch.current) {
      hasAttemptedSwitch.current = true;
      setRole('PROPRIETAIRE');
    }
  }, [estProprietaire, activeRole, hasHydrated, setRole, router, redirectTo, autoSwitch]);

  if (!hasHydrated) {
    return <>{fallback}</>;
  }

  if (!estProprietaire) {
    return <>{fallback}</>;
  }

  if (activeRole !== 'PROPRIETAIRE') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
