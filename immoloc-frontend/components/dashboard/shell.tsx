'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, CalendarRange, LayoutDashboard, Menu, Plus } from 'lucide-react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { useRoleStore } from '@/stores/role.store';
import { usePendingDecisions } from '@/features/calendar/hooks/use-pending-decisions';
import { cn } from '@/lib/utils/cn';
import DashboardLoading from '@/app/dashboard/loading';

/* -- Barre de navigation basse (< 1024 px) ---------------------------------
   Pilule sombre flottante, assortie à la navbar desktop : elle se détache de
   n'importe quel contenu (photos, cartes blanches) sans bordure lourde.
   « Menu » ouvre le tiroir (Biens, Revenus, Wallet, Paramètres…) : c'est le
   seul accès à ces pages sur mobile, l'en-tête n'existant que sur l'accueil.
   -------------------------------------------------------------------- */

type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  badge?: 'decisions';
};

const LEFT_ITEMS: BottomNavItem[] = [
  { href: '/dashboard', label: 'Aujourd’hui', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/calendrier', label: 'Calendrier', icon: CalendarRange },
];
const RIGHT_ITEMS: BottomNavItem[] = [
  { href: '/dashboard/reservations', label: 'Réservations', icon: CalendarDays, badge: 'decisions' },
];
/** Pages rangées dans le tiroir : l'onglet « Menu » s'allume quand on y est. */
const MENU_PATHS = ['/dashboard/annonces', '/dashboard/stats', '/dashboard/wallet', '/dashboard/parametres', '/dashboard/profil'];

const noopSubscribe = () => () => {};

function isActive(pathname: string, item: BottomNavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function BottomNav({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  // Rendu client uniquement (portail vers <body>), sans setState dans un effet
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const { data: decisions = [] } = usePendingDecisions();

  // Position de la pastille active : 5 colonnes égales (2 onglets, +, 1 onglet, Menu)
  const menuActive = MENU_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const slot = (() => {
    const left = LEFT_ITEMS.findIndex((i) => isActive(pathname, i));
    if (left >= 0) return left;
    const right = RIGHT_ITEMS.findIndex((i) => isActive(pathname, i));
    if (right >= 0) return 3 + right;
    return menuActive ? 4 : -1;
  })();

  if (!isClient) return null;

  const renderItem = (item: BottomNavItem) => {
    const active = isActive(pathname, item);
    const count = item.badge ? decisions.length : 0;
    return (
      <li key={item.href} className="flex">
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          aria-label={count > 0 ? `${item.label}, ${count} à décider` : undefined}
          className={cn(
            'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] transition-colors duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60',
            active ? 'text-lime-300' : 'text-forest-200 hover:text-neutral-50',
          )}
        >
          <span className="relative">
            <item.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-2.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-pill bg-gold-400 px-1 text-[10px] font-bold text-gold-800 ring-2 ring-forest-950"
              >
                {count > 9 ? '9+' : count}
              </span>
            )}
          </span>
          <span className="text-[10px] font-semibold leading-none">{item.label}</span>
        </Link>
      </li>
    );
  };

  return createPortal(
    <nav
      aria-label="Navigation de l’espace hôte"
      className="klef-rise fixed inset-x-0 z-[9999] mx-auto w-[calc(100%-1.5rem)] max-w-md lg:hidden"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative h-[68px] rounded-[28px] border border-white/10 bg-forest-950/95 shadow-[0_18px_40px_-8px_rgba(4,25,18,0.55)] backdrop-blur-xl">
        {/* Pastille de l'onglet actif : glisse d'une colonne à l'autre */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-1.5 bottom-1.5 rounded-[22px] bg-white/[0.08] transition-[left,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            slot < 0 && 'opacity-0',
          )}
          style={{ left: `calc(${Math.max(slot, 0) * 20}% + 6px)`, width: 'calc(20% - 12px)' }}
        />

        <ul className="relative grid h-full grid-cols-5">
          {LEFT_ITEMS.map(renderItem)}

          {/* Action principale : seule touche lime de l'écran */}
          <li className="flex items-start justify-center">
            <Link
              href="/dashboard/annonces/nouvelle"
              aria-label="Publier un bien"
              className={cn(
                '-mt-6 grid h-[58px] w-[58px] place-items-center rounded-full bg-lime-400 text-forest-950',
                'shadow-[0_10px_24px_-4px_rgba(155,194,44,0.6)] ring-[5px] ring-background',
                'transition-transform duration-150 active:scale-90',
                'focus:outline-none focus-visible:ring-lime-200',
              )}
            >
              <Plus className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
            </Link>
          </li>

          {RIGHT_ITEMS.map(renderItem)}

          <li className="flex">
            <button
              type="button"
              onClick={onMenu}
              aria-haspopup="dialog"
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] transition-colors duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60',
                menuActive ? 'text-lime-300' : 'text-forest-200 hover:text-neutral-50',
              )}
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={menuActive ? 2.2 : 1.8} aria-hidden="true" />
              <span className="text-[10px] font-semibold leading-none">Menu</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>,
    document.body,
  );
}

/* -- Shell ---------------------------------------------------------------- */

const DETAIL_PAGE_RE = /^\/dashboard\/(annonces|reservations)\/[^/]+(\/.*)?$/;

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
        <DashboardHeader
          desktopOnly={hideHeader}
          onMenuToggle={ready ? () => setSidebarOpen((v) => !v) : () => { }}
        />

        <main id="contenu" className={cn('flex-1 overflow-y-auto', contentPadBottom, !isDashboardHome && 'pt-[env(safe-area-inset-top,0px)] sm:pt-0')}>
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
            {ready ? children : <DashboardLoading />}
          </div>
        </main>
      </div>

      {ready && !isDetailPage && <BottomNav onMenu={() => setSidebarOpen(true)} />}
    </div>
  );
}