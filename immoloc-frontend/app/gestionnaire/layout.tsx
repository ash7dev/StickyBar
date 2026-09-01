'use client';

import type { ReactNode } from 'react';
import { GestionnaireGuard } from '@/components/guards/gestionnaire-guard';
import { GestionnaireShell } from '@/components/gestionnaire/gestionnaire-shell';

export default function GestionnaireLayout({ children }: { children: ReactNode }) {
  return (
    <GestionnaireGuard>
      <GestionnaireShell>
        {children}
      </GestionnaireShell>
    </GestionnaireGuard>
  );
}
