'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, CalendarDays, LayoutDashboard, Plus, Wallet } from 'lucide-react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';
import DashboardLoading from '@/app/dashboard/loading';

/* -- Barre de navigation basse (mobile) -----------------------------------
   Elle reste sombre : c'est du chrome flottant au-dessus d'un contenu de
   couleur imprevisible (photos, cartes blanches, graphiques). Une barre
   claire exigerait bordure epaisse et ombre lourde pour se detacher.
   Pas de .glass-dark ici pour la meme raison : un flou translucide sur un
   fond imprevisible perd en lisibilite, l'opacite forte reste plus sure.
   -------------------------------------------------------------------- */

type BottomNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  exact?: boolean;
  isAction?: boolean;
};

const BOTTOM_NAV: BottomNavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/annonces', label: 'Biens', icon: Building2 },
  { href: '/dashboard/annonces/nouvelle', label: 'Ajouter', icon: Plus, isAction: true },
  { href: '/dashboard/reservations', label: 'Séjours', icon: CalendarDays },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
];

// Path de la barre avec encoche : viewBox fixe (400x64), etire horizontalement
// via preserveAspectRatio="none" (hauteur rendue = 64px = hauteur viewBox,
// donc aucune distorsion verticale ; la distorsion horizontale residuelle
// est negligeable, la barre variant peu entre ~336 et 406px de large).
// L'encoche est un creux symetrique (deux courbes de Bezier) centre a 50%
// de la largeur — la ou vit le FAB, positionne en CSS avec left-1/2.
const NAV_BAR_PATH =
  'M32 0 H154 C174 0 180 30 200 30 C220 30 226 0 246 0 H368 A32 32 0 0 1 368 64 H32 A32 32 0 0 1 32 0 Z';

function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  // Retire will-change une fois l'animation d'entree terminee, pour ne pas
  // laisser un layer composite actif en permanence.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <nav
      aria-label="Navigation principale Hôte"
      className={cn(
        'fixed inset-x-0 z-[9999] mx-auto w-[calc(100%-1.5rem)] max-w-md lg:hidden',
        !entered && 'klef-rise',
      )}
      style={{
        bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        willChange: entered ? 'auto' : 'transform, opacity',
      }}
      onAnimationEnd={() => setEntered(true)}
      data-done={entered || undefined}
    >
      {/* Conteneur relatif : le SVG dessine le chrome (avec encoche), le
          FAB est pose par-dessus en absolu, la liste flotte au niveau z-10. */}
      <div className="relative h-16">
        <svg
          viewBox="0 0 400 64"
          preserveAspectRatio="none"
          className="absolute inset-0 h-16 w-full drop-shadow-[0_16px_40px_-6px_rgba(4,25,18,0.55)] pointer-events-none"
          aria-hidden="true"
        >
          <path
            d={NAV_BAR_PATH}
            className="fill-forest-950/95 stroke-white/15"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* Liseré clair sur le rebord superieur, pour le relief du chrome
              sans toucher au fond opaque (pas de .glass-dark ici). */}
          <path
            d="M32 0.75 H154 C174 0.75 180 30.75 200 30.75 C220 30.75 226 0.75 246 0.75 H368"
            fill="none"
            className="stroke-white/10"
            strokeWidth={1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <ul className="relative z-10 flex h-16 items-stretch justify-between px-2">
          {BOTTOM_NAV.map(({ href, label, icon: Icon, exact, isAction }) => {
            // L'emplacement du FAB reste un slot vide dans le flux (largeur
            // reservee sous l'encoche) : le bouton lui-meme est rendu a part,
            // en absolu, pour pouvoir deborder au-dessus du chrome.
            if (isAction) {
              return <li key={href} aria-hidden="true" className="flex-1" />;
            }

            const active = exact ? pathname === href : pathname.startsWith(href);

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1.5 rounded-pill px-1',
                    'transition-colors duration-150',
                    // Etat actif hors-lime : la navigation n'est pas l'action
                    // unique de l'ecran, seul le FAB porte le lime.
                    active ? 'text-on-inverse-marker' : 'text-forest-200 hover:text-neutral-50',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-forest-950',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-pill transition-all duration-200 ease-out',
                      active ? 'bg-marker-bg scale-100' : 'scale-90',
                    )}
                  >
                    <Icon className="h-6 w-6" strokeWidth={active ? 2.15 : 1.8} />
                  </span>

                  <span className="text-[0.625rem] font-semibold uppercase leading-none tracking-wide">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* FAB : niche dans l'encoche, deborde au-dessus du chrome — seule
            action lime de l'ecran ("ONE per screen"). */}
        <Link
          href="/dashboard/annonces/nouvelle"
          aria-label="Ajouter un bien"
          className={cn(
            'group absolute left-1/2 -top-5 z-20 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full',
            'bg-gradient-to-b from-forest-600 via-forest-800 to-forest-950 text-lime-400',
            'border-[1.5px] border-[var(--action-edge)]',
            'shadow-[var(--shadow-action)]',
            'active:scale-90 transition-transform duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-forest-950',
          )}
        >
          {/* Halo externe */}
          <div className="absolute inset-0 rounded-full bg-lime-400/20 blur-md opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
          {/* Anneau interne : profondeur, sans lime supplementaire visible */}
          <div className="absolute inset-1 rounded-full border border-lime-400/20 pointer-events-none" />
          <Plus className="relative z-10 h-6 w-6 stroke-[2.5]" aria-hidden="true" />
        </Link>
      </div>
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