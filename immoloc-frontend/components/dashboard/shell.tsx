'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Building2, CalendarDays, Wallet, Plus } from 'lucide-react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';

// ── Barre de navigation mobile (bottom - PROPRIETAIRE) ───────────────────────

type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
};

const BOTTOM_NAV: BottomNavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/annonces', label: 'Biens', icon: Building2 },
  { href: '/dashboard/reservations', label: 'Réservations', icon: CalendarDays },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
];

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background-card/80 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-center justify-around px-4 pt-2 pb-1 relative">
        {/* Items gauche */}
        {BOTTOM_NAV.slice(0, 2).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-0 flex-1"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                active && 'bg-emerald-600 shadow-md shadow-emerald-600/20'
              )}>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'text-white' : 'text-foreground-muted'
                  )}
                  strokeWidth={2.5}
                />
              </div>
              <span className={cn(
                'text-[9px] font-semibold truncate',
                active ? 'text-emerald-700' : 'text-foreground-muted'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* FAB central */}
        <Link
          href="/dashboard/annonces/nouvelle"
          className="flex flex-col items-center -mt-6 px-3"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-600/30 active:scale-95 transition-all mb-1 border-4 border-background">
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </div>
          <span className="text-[9px] font-semibold text-emerald-700">
            Nouveau
          </span>
        </Link>

        {/* Items droite */}
        {BOTTOM_NAV.slice(2, 4).map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-3 min-w-0 flex-1"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                active && 'bg-emerald-600 shadow-md shadow-emerald-600/20'
              )}>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-colors',
                    active ? 'text-white' : 'text-foreground-muted'
                  )}
                  strokeWidth={2.5}
                />
              </div>
              <span className={cn(
                'text-[9px] font-semibold truncate',
                active ? 'text-emerald-700' : 'text-foreground-muted'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Shell principal ───────────────────────────────────────────────────────────

const DETAIL_PAGE_RE = /^\/dashboard\/(annonces|reservations)\/[^/]+(\/.*)?$/;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, nestToken } = useRoleStore();
  const hideHeader = DETAIL_PAGE_RE.test(pathname);

  // Compute authorization directly without state
  const isAuthorized = nestToken && activeRole === 'PROPRIETAIRE';

  useEffect(() => {
    // Protection du dashboard : seulement si le rôle actif est PROPRIETAIRE
    if (nestToken && activeRole !== 'PROPRIETAIRE') {
      router.replace('/');
    }
  }, [activeRole, nestToken, router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-alt">
        <div className="w-8 h-8 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background-alt">
      {/* Sidebar — overlay sur mobile, dans le flux sur desktop */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Zone contenu */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!hideHeader && <DashboardHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Barre mobile bas */}
      <BottomNav />
    </div>
  );
}
