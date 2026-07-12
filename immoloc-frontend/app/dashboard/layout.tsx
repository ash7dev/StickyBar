import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { OwnerGuard } from '@/components/guards';

/**
 * Dashboard Layout - Ultra Clean Version
 *
 * Architecture propre :
 * 1. Middleware (Edge) → Vérifie auth Supabase
 * 2. OwnerGuard (Client) → Vérifie rôle PROPRIETAIRE + auto-switch
 * 3. DashboardShell → UI du dashboard
 *
 * Avantages vs ancienne version :
 * - ✅ Pas de fetch serveur redondant (déjà fait par middleware)
 * - ✅ Loading state propre (pas de flash)
 * - ✅ Auto-switch vers PROPRIETAIRE si eligible
 * - ✅ Réutilisable (OwnerGuard peut être utilisé ailleurs)
 * - ✅ Type-safe
 * - ✅ Zero spaghetti code
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard>
      <DashboardShell>{children}</DashboardShell>
    </OwnerGuard>
  );
}
