'use client';

import { useState, type ReactNode } from 'react';
import { GestionnaireSidebar } from './gestionnaire-sidebar';
import { GestionnaireHeader } from './gestionnaire-header';

interface GestionnaireShellProps {
  children: ReactNode;
}

export function GestionnaireShell({ children }: GestionnaireShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Gestionnaire */}
      <GestionnaireSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteneur principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header Gestionnaire */}
        <GestionnaireHeader
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />

        {/* Zone de contenu des pages du portail gestionnaire */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
