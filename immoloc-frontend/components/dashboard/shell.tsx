'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, CalendarDays, LayoutDashboard, Settings, Wallet } from 'lucide-react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';
import DashboardLoading from '@/app/dashboard/loading';

/* -- Barre de navigation basse (mobile) -----------------------------------
   Elle reste sombre : c'est du chrome flottant au-dessus d'un contenu de
   couleur imprevisible (photos, cartes blanches, graphiques). Une barre
   claire exigerait bordure epaisse et ombre lourde pour se detacher.
   -------------------------------------------------------------------- */

type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
};

const BOTTOM_NAV: BottomNavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/annonces', label: 'Biens', icon: Building2 },
  { href: '/dashboard/reservations', label: 'Séjours', icon: CalendarDays },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/parametres', label: 'Réglages', icon: Settings },
];

function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 z-[9999] mx-auto w-[calc(100%-1.5rem)] max-w-md lg:hidden"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <ul
        className={cn(
          'flex items-stretch justify-between gap-0.5 rounded-card border border-white/10 p-1.5',
          'bg-forest-950/92 shadow-lg backdrop-blur-lg',
        )}
      >
        {BOTTOM_NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-inner px-1 py-1.5',
                  'transition-colors duration-150',
                  active ? 'text-on-inverse-marker' : 'text-forest-200 hover:text-neutral-50',
                )}
              >
                <span
                  className={cn(
                    'grid h-6 w-10 place-items-center rounded-pill transition-colors duration-150',
                    active && 'bg-marker-bg',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.9} />
                </span>

                <span className="text-[0.625rem] font-medium leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>,
    document.body
  );
}

/* -- Shell ---------------------------------------------------------------- */

const DETAIL_PAGE_RE = /^\/dashboard\/(annonces|reservations)\/[^/]+(\/.*)?$/;

// Hauteur de la barre + son decalage bas. L'ancien pb-20 (80px) etait juste
// en dessous : barre a 12px du bas + 52px de haut + safe area = jusqu'a 100px
// sur un appareil a indicateur d'accueil. Le dernier element etait masque.
const CONTENT_PAD_BOTTOM = 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { activeRole, nestToken, hasHydrated } = useRoleStore();

  const isDetailPage = DETAIL_PAGE_RE.test(pathname);
  const hideHeader = isDetailPage;
  const isAuthorized = Boolean(nestToken) && activeRole === 'PROPRIETAIRE';

  useEffect(() => {
    if (!hasHydrated) return;

    if (!nestToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (activeRole !== 'PROPRIETAIRE') {
      router.replace('/');
    }
  }, [activeRole, nestToken, hasHydrated, pathname, router]);

  const ready = hasHydrated && isAuthorized;
  const isDashboardHome = pathname === '/dashboard';

  const contentPadBottom = isDetailPage
    ? 'pb-6 lg:pb-8'
    : 'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8';

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-pill focus:bg-forest-600 focus:px-5 focus:py-3 focus:font-semibold focus:text-white"
      >
        Aller au contenu
      </a>

      <DashboardSidebar
        isOpen={ready ? sidebarOpen : false}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!hideHeader && (
          <DashboardHeader onMenuToggle={ready ? () => setSidebarOpen((v) => !v) : () => { }} />
        )}

        <main id="contenu" className={cn('flex-1 overflow-y-auto', contentPadBottom, !isDashboardHome && 'pt-[env(safe-area-inset-top,0px)] sm:pt-0')}>
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
            {ready ? children : <DashboardLoading />}
          </div>
        </main>
      </div>

      {ready && !isDetailPage && <BottomNav />}
    </div>
  );
}