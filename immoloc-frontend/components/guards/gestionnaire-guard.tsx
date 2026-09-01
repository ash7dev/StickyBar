'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role.store';

interface GestionnaireGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  autoSwitch?: boolean;
}

export function GestionnaireGuard({
  children,
  fallback = (
    <div className="w-full min-h-[400px] p-6 bg-background-alt/60 border border-border/60 animate-pulse rounded-card" />
  ),
  redirectTo = '/login',
  autoSwitch = true,
}: GestionnaireGuardProps) {
  const { activeRole, nestToken, setRole, hasHydrated } = useRoleStore();
  const router = useRouter();
  const hasAttemptedSwitch = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!nestToken) {
      router.replace(redirectTo);
      return;
    }

    if (activeRole !== 'GESTIONNAIRE' && autoSwitch && !hasAttemptedSwitch.current) {
      hasAttemptedSwitch.current = true;
      setRole('GESTIONNAIRE');
    }
  }, [nestToken, activeRole, hasHydrated, setRole, router, redirectTo, autoSwitch]);

  if (!hasHydrated || !nestToken) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
