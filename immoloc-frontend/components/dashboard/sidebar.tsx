'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight, BarChart3, Building2, CalendarDays, CalendarRange, LayoutDashboard,
  LogOut, Plus, Settings, Wallet, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRoleStore } from '@/stores/role.store';
import { useCurrentUser } from '@/hooks/use-current-user';
import { usePendingDecisions } from '@/features/calendar/hooks/use-pending-decisions';
import { PaixiLogo } from '@/components/brand/PaixiLogo';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  /** Clé du compteur affiché en pastille */
  badge?: 'decisions';
};

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: 'Gestion',
    items: [
      { href: '/dashboard', label: 'Aujourd’hui', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/calendrier', label: 'Calendrier', icon: CalendarRange },
      { href: '/dashboard/reservations', label: 'Réservations', icon: CalendarDays, badge: 'decisions' },
      { href: '/dashboard/annonces', label: 'Mes biens', icon: Building2 },
    ],
  },
  {
    title: 'Finances',
    items: [
      { href: '/dashboard/stats', label: 'Revenus', icon: BarChart3 },
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
    ],
  },
];

const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, onClose, count = 0 }: { item: NavItem; onClose: () => void; count?: number }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const countLabel = count > 99 ? '99+' : String(count);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      // aria-current : l'état actif est annoncé aux lecteurs d'écran, pas seulement coloré.
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-inner px-4 py-3 text-sm transition-colors duration-150',
        // Actif en lime-100 : même teinte que la pastille active de la navbar publique.
        active
          ? 'bg-lime-100 font-semibold text-forest-800'
          : 'text-foreground-muted hover:bg-background-alt hover:text-forest-800',
      )}
    >
      {/* Repère latéral : second signal, en plus de la couleur. */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-pill transition-colors duration-150',
          active ? 'bg-lime-500' : 'bg-transparent',
        )}
      />
      <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden="true" />
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <span className="rounded-pill bg-gold-400 px-2 py-0.5 text-[0.6875rem] font-bold tabular-nums text-gold-800">
          {countLabel}
          <span className="sr-only"> à traiter</span>
        </span>
      )}
    </Link>
  );
}

export function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const { switchRole, isSwitching } = useSwitchRole();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [switchError, setSwitchError] = useState(false);
  const onboardingDraft = useRoleStore((s) => s.onboardingDraft);
  const { data: user, isLoading } = useCurrentUser();
  const { data: decisions = [] } = usePendingDecisions();
  const counts = { decisions: decisions.length };

  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  /*
    Tiroir mobile : ni Echap, ni piege de focus, ni verrou de defilement.
    Ouvert, la tabulation continuait derriere le panneau et la page defilait
    sous le doigt.
  */
  useEffect(() => {
    if (!isOpen) return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;

    restore.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restore.current?.focus();
    };
  }, [isOpen, onClose]);

  /* Le repli du nom etait BRAND.name : un utilisateur dont le profil n'avait
     pas encore charge voyait « Paixi » comme son propre nom, avec « KL » en
     initiales. */
  const prenom = user?.prenom ?? onboardingDraft?.prenom ?? '';
  const nom = user?.nom ?? onboardingDraft?.nom ?? '';
  const userName = [prenom, nom].filter(Boolean).join(' ');
  const initials = ((prenom[0] ?? '') + (nom[0] ?? '')).toUpperCase() || '—';

  async function handleSwitch() {
    setSwitchError(false);
    try {
      // switchRole n'etait ni attendu ni gere : en cas d'echec, onClose()
      // avait deja ferme le panneau et rien ne se passait.
      await switchRole('LOCATAIRE');
      onClose();
    } catch { setSwitchError(true); }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logout(); }
    finally { setIsLoggingOut(false); onClose(); }
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          // bg-overlay suppose que --overlay soit expose en utilitaire de
          // couleur dans @theme. Valeur explicite pour eviter la surprise.
          'fixed inset-0 z-40 bg-[rgba(4,25,18,0.55)] backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        ref={panelRef}
        aria-label="Navigation du tableau de bord"
        className={cn(
          // Tiroir sous 1024 px ; sur desktop, la navigation horizontale (OwnerTopNav) prend le relais
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col lg:hidden',
          'border-r border-border bg-background-card shadow-lg',
          'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="shrink-0 space-y-4 border-b border-border p-5">
          {/*
            Le conteneur en justify-between avait TROIS enfants : logo, badge
            « Hote » et bouton de fermeture en lg:hidden. Sur desktop le
            bouton disparait, donc deux elements aux extremites ; sur mobile,
            les trois s'ecartent et le badge flotte au milieu.
            Badge et bouton sont maintenant groupes.
          */}
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center">
              <PaixiLogo className="text-2xl" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="rounded-pill bg-neutral-100 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-forest-700">
                Hôte
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer le menu"
                className="grid h-9 w-9 place-items-center rounded-pill text-foreground-muted transition-colors hover:bg-background-alt lg:hidden"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-inner bg-background-alt p-3.5">
            {isLoading ? (
              <>
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-inner bg-neutral-200" aria-hidden="true" />
                <div className="h-4 flex-1 animate-pulse rounded bg-neutral-200" aria-hidden="true" />
              </>
            ) : (
              <>
                {/* Le carre etait en forest-950 a initiales lime. */}
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-forest-100 text-sm font-semibold text-forest-700">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-900">
                    {userName || 'Votre compte'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-foreground-muted">Espace propriétaire</p>
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3">
          <Link
            href="/dashboard/annonces/nouvelle"
            onClick={onClose}
            className="btn-primary w-full gap-2 px-4 py-3 text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            Publier un bien
          </Link>

          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-4 pb-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
                {group.title}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  onClose={onClose}
                  count={item.badge ? counts[item.badge] : 0}
                />
              ))}
            </div>
          ))}

          <div className="space-y-1 border-t border-border pt-3">
            {BOTTOM_NAV.map((item) => (
              <NavLink key={item.href} item={item} onClose={onClose} />
            ))}
          </div>
        </nav>

        <div className="shrink-0 space-y-2 border-t border-border p-3">
          {switchError && (
            <p role="alert" className="rounded-inner bg-error-50 px-3 py-2 text-xs text-error-700">
              Basculement impossible. Réessayez.
            </p>
          )}

          {/* Le bouton de bascule etait l'element le plus lourd de la barre :
              forest-950, texte lime, ombre portee. Or changer de mode est une
              action occasionnelle — elle ne doit pas dominer la navigation. */}
          <button
            type="button"
            onClick={handleSwitch}
            disabled={isSwitching}
            className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-border py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-background-alt disabled:opacity-50"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{isSwitching ? 'Basculement…' : 'Mode locataire'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-medium text-error-600 transition-colors duration-150 hover:bg-error-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
