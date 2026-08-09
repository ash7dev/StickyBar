'use client';

import { useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

interface AdminShellProps {
  children: React.ReactNode;
  urgentCount?: number;
}

export function AdminShell({ children, urgentCount = 0 }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Admin */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Conteneur principal */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header Admin */}
        <AdminHeader
          onMenuToggle={() => setSidebarOpen((v) => !v)}
          urgentCount={urgentCount}
        />

        {/* Zone de contenu des pages d'administration */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
