'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight, Bell, ChevronDown, LogOut, Plus, Settings, UserRound, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { useGatedAction } from '@/features/gate/hooks/use-gated-action';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { usePendingDecisions } from '@/features/calendar/hooks/use-pending-decisions';
import { PaixiLogo } from '@/components/brand/PaixiLogo';

type TabItem = { href: string; label: string; exact?: boolean; badge?: 'decisions' };

const TABS: TabItem[] = [
  { href: '/dashboard', label: 'Aujourd’hui', exact: true },
  { href: '/dashboard/calendrier', label: 'Calendrier' },
  { href: '/dashboard/reservations', label: 'Réservations', badge: 'decisions' },
  { href: '/dashboard/annonces', label: 'Biens' },
  { href: '/dashboard/stats', label: 'Revenus' },
  { href: '/dashboard/wallet', label: 'Wallet' },
];

function isActive(pathname: string, tab: TabItem) {
  return tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

/**
 * Navigation hôte desktop (≥ 1024 px) — direction « Bento » :
 * onglets en pilule avec indicateur glissant, création en lime, compte à droite.
 * Sous 1024 px, l'en-tête + tiroir et la barre du bas prennent le relais.
 */
export function OwnerTopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { logout } = useAuth();
  const { switchRole, isSwitching } = useSwitchRole();
  const { data: decisions = [] } = usePendingDecisions();
  const counts = { decisions: decisions.length };

  // ── Indicateur glissant sous l'onglet actif ─────────────────────────────
  // Positionné directement dans le DOM, AVANT l'affichage : avec un état React
  // mis à jour après coup, le texte du nouvel onglet passait en blanc une image
  // avant que la pastille foncée n'arrive dessous (onglet invisible un instant).
  const tabsRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const placedOnce = useRef(false);
  const activeIndex = TABS.findIndex((t) => isActive(pathname, t));

  useLayoutEffect(() => {
    const list = tabsRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const place = () => {
      const tab = activeIndex >= 0 ? list.querySelectorAll<HTMLElement>('[data-tab]')[activeIndex] : null;
      if (!tab) {
        indicator.style.opacity = '0';
        return;
      }
      // Premier placement sans animation (sinon la pastille glisse depuis la gauche au chargement)
      if (!placedOnce.current) indicator.style.transition = 'none';
      // Position mesurée par rapport à la barre elle-même : offsetLeft valait 0,
      // car chaque onglet est dans un <li> positionné (son propre offsetParent).
      const listBox = list.getBoundingClientRect();
      const tabBox = tab.getBoundingClientRect();
      indicator.style.left = `${tabBox.left - listBox.left - list.clientLeft}px`;
      indicator.style.width = `${tabBox.width}px`;
      indicator.style.opacity = '1';
      if (!placedOnce.current) {
        void indicator.offsetWidth; // applique la position avant de réactiver la transition
        indicator.style.transition = '';
        placedOnce.current = true;
      }
    };

    place();
    // Largeur des onglets qui change (badge qui apparaît, polices chargées, zoom)
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeIndex]);

  // ── Menus (notifications / compte) ─────────────────────────────────────
  const [menu, setMenu] = useState<'none' | 'notif' | 'account'>('none');
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    // Fermer les menus après une navigation (ajustement d'état pendant le rendu)
    setLastPath(pathname);
    setMenu('none');
  }

  useEffect(() => {
    if (menu === 'none') return;
    const onPointerDown = (e: PointerEvent) => {
      const ref = menu === 'notif' ? notifRef : accountRef;
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu('none');
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenu('none');
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menu]);

  // ── Création (soumise aux vérifications de profil / KYC) ───────────────
  const goToNewListing = useCallback(() => router.push('/dashboard/annonces/nouvelle'), [router]);
  const { gateState, trigger, complete, cancel } = useGatedAction(goToNewListing);

  const prenom = user?.prenom?.trim() ?? '';
  const nom = user?.nom?.trim() ?? '';
  const initials = `${prenom[0] ?? user?.email?.[0] ?? '?'}${nom[0] ?? ''}`.toUpperCase();

  return (
    <header className="sticky top-0 z-40 px-6 pt-4">
      {/* Barre flottante : même largeur que le contenu (max 1440 px moins ses marges) */}
      <div className="mx-auto flex h-[68px] max-w-[1392px] items-center gap-5 rounded-[26px] border border-border/70 bg-background-card/85 px-3 shadow-[0_10px_30px_rgba(4,25,18,0.06)] backdrop-blur-xl supports-[backdrop-filter]:bg-background-card/70">
        {/* ── Marque ─────────────────────────────────────────────────────── */}
        <Link href="/dashboard" className="flex shrink-0 items-center pl-2" aria-label="Paixi, accueil hôte">
          <PaixiLogo className="text-[1.6rem]" />
        </Link>

        {/* ── Onglets ───────────────────────────────────────────────────── */}
        <nav aria-label="Espace hôte" className="min-w-0 flex-1">
          <ul
            ref={tabsRef}
            className="relative mx-auto flex w-fit items-center gap-0.5 rounded-pill border border-border/80 bg-background-alt/80 p-1"
          >
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="absolute top-1 bottom-1 left-0 w-0 rounded-pill bg-forest-950 opacity-0 shadow-[0_6px_18px_rgba(4,25,18,0.18)] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
            {TABS.map((tab) => {
              const active = isActive(pathname, tab);
              const count = tab.badge ? counts[tab.badge] : 0;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    data-tab
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative z-10 flex items-center gap-2 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background-alt',
                      active ? 'text-neutral-50' : 'text-foreground-muted hover:text-foreground',
                    )}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={cn(
                          'min-w-[1.25rem] rounded-pill px-1.5 py-px text-center text-[0.6875rem] font-bold tabular-nums',
                          active ? 'bg-gold-400 text-gold-800' : 'bg-gold-400/90 text-gold-800',
                        )}
                      >
                        {count > 99 ? '99+' : count}
                        <span className="sr-only"> à décider</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={trigger}
            className="inline-flex h-10 items-center gap-2 rounded-pill bg-action px-4 text-[13px] font-bold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
            <span className="hidden xl:inline">Publier un bien</span>
            <span className="xl:hidden">Publier</span>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => (m === 'notif' ? 'none' : 'notif'))}
              aria-expanded={menu === 'notif'}
              aria-haspopup="menu"
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-pill border border-border bg-background-card text-foreground transition-colors hover:bg-background-alt"
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
            {menu === 'notif' && (
              <div role="menu" className="absolute top-full right-0 z-50 mt-3 w-80 overflow-hidden rounded-[20px] border border-border bg-background-card shadow-xl">
                <p className="border-b border-border px-5 py-4 font-display text-[15px] font-semibold text-foreground">Notifications</p>
                {decisions.length > 0 ? (
                  <Link
                    href="/dashboard/reservations?statut=PAID"
                    role="menuitem"
                    className="flex items-center gap-3 px-5 py-4 text-sm transition-colors hover:bg-background-alt"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-gold-100 text-sm font-bold text-gold-800">
                      {decisions.length}
                    </span>
                    <span className="text-foreground">
                      {decisions.length > 1 ? 'demandes attendent' : 'demande attend'} votre réponse
                    </span>
                  </Link>
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-foreground-muted">Vous êtes à jour.</p>
                )}
              </div>
            )}
          </div>

          {/* Compte */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => (m === 'account' ? 'none' : 'account'))}
              aria-expanded={menu === 'account'}
              aria-haspopup="menu"
              aria-label="Menu du compte"
              className="flex h-10 items-center gap-1.5 rounded-pill border border-border bg-background-card pr-2.5 pl-1 transition-colors hover:bg-background-alt"
            >
              <span className="grid h-8 w-8 place-items-center rounded-pill bg-forest-600 text-xs font-bold text-neutral-0">
                {initials}
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-foreground-muted transition-transform', menu === 'account' && 'rotate-180')} aria-hidden="true" />
            </button>
            {menu === 'account' && (
              <div role="menu" className="absolute top-full right-0 z-50 mt-3 w-72 overflow-hidden rounded-[20px] border border-border bg-background-card shadow-xl">
                <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-forest-600 text-sm font-bold text-neutral-0">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{[prenom, nom].filter(Boolean).join(' ') || 'Votre compte'}</p>
                    <p className="truncate text-xs text-foreground-muted">{user?.email}</p>
                  </div>
                </div>
                <div className="p-2">
                  {[
                    { href: '/dashboard/profil', label: 'Mon profil', Icon: UserRound },
                    { href: '/dashboard/wallet', label: 'Solde et retraits', Icon: Wallet },
                    { href: '/dashboard/parametres', label: 'Paramètres', Icon: Settings },
                  ].map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background-alt"
                    >
                      <Icon className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isSwitching}
                    onClick={() => {
                      setMenu('none');
                      switchRole('LOCATAIRE');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                    {isSwitching ? 'Basculement…' : 'Passer en mode voyageur'}
                  </button>
                  <div className="my-1.5 h-px bg-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu('none');
                      logout();
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error-700 transition-colors hover:bg-error-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {gateState.open && (
        <ActionGateModal steps={gateState.steps} block={gateState.block} onComplete={complete} onCancel={cancel} />
      )}
    </header>
  );
}
