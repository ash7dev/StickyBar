import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/dashboard/shell';
import { OwnerGuard } from '@/components/guards';
import DashboardLoading from './loading';

/**
 * Dashboard Layout - Ultra Clean Version avec Squelette Klef v2
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard fallback={<DashboardShell><DashboardLoading /></DashboardShell>}>
      <DashboardShell>{children}</DashboardShell>
    </OwnerGuard>
  );
}
