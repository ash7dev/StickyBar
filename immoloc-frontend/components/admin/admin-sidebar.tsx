'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Home,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users,
  CalendarDays,
  Scale,
  Wallet,
  Star,
  Megaphone,
  Sliders,
  Settings,
  X,
  LogOut,
  ArrowLeft,
  ExternalLink,
  UserCheck,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuth } from '@/features/auth/hooks/use-auth';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Vue d’ensemble',
    items: [
      { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
      { href: '/admin/statistiques', label: 'Revenus & Stats Klef', icon: TrendingUp },
    ],
  },
  {
    title: 'Modération & Contrôle',
    items: [
      { href: '/admin/kyc', label: 'Vérification KYC', icon: ShieldCheck },
      { href: '/admin/annonces', label: 'Modération Annonces', icon: Building2 },
      { href: '/admin/litiges', label: 'Litiges & Arbitrage', icon: Scale },
      { href: '/admin/support', label: 'Tickets & Assistance', icon: Headphones },
      { href: '/admin/avis', label: 'Modération Avis', icon: Star },
    ],
  },
  {
    title: 'Gestion & Supervision',
    items: [
      { href: '/admin/utilisateurs', label: 'Tous les Utilisateurs', icon: Users, exact: true },
      { href: '/admin/hotes', label: 'Hôtes & Propriétaires', icon: Home },
      { href: '/admin/locataires', label: 'Locataires & Voyageurs', icon: UserCheck },
      { href: '/admin/logements', label: 'Tous les Logements', icon: Building2 },
      { href: '/admin/reservations', label: 'Réservations', icon: CalendarDays },
      { href: '/admin/finances', label: 'Retraits & Finances', icon: Wallet },
    ],
  },
  {
    title: 'Système & Diffusion',
    items: [
      { href: '/admin/notifications', label: 'Notifications Broadcast', icon: Megaphone },
      { href: '/admin/equipements', label: 'Catalogue Équipements', icon: Sliders },
      { href: '/admin/parametres', label: 'Paramètres Admin', icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center justify-between rounded-inner px-3.5 py-2.5 text-xs font-medium transition-colors duration-150',
        active
          ? 'bg-forest-50 font-semibold text-forest-800'
          : 'text-foreground-muted hover:bg-background-alt hover:text-forest-800',
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-pill transition-colors duration-150',
            active ? 'bg-forest-600' : 'bg-transparent',
          )}
        />
        <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-forest-700' : 'text-foreground-muted group-hover:text-forest-700')} aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </div>
      {item.badge && (
        <span className="rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-semibold text-error-700 tabular-nums">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  /* Accessibilité clavier et piège de focus sur tiroir mobile */
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

  const prenom = user?.prenom ?? '';
  const nom = user?.nom ?? '';
  const initials = ((prenom[0] ?? '') + (nom[0] ?? user?.email?.[0] ?? 'A')).toUpperCase() || 'AD';

  async function handleLogout() {
    setIsLoggingOut(true);
    try { await logout(); }
    finally { setIsLoggingOut(false); onClose(); }
  }

  return (
    <>
      {/* Arrière-plan flouté mobile */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-surface-inverse-alt/60 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Barre latérale d'administration */}
      <aside
        ref={panelRef}
        aria-label="Navigation du portail d'administration"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col',
          'border-r border-border bg-background-card shadow-lg',
          'transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:shadow-none',
        )}
      >
        {/* Entête de la Sidebar */}
        <div className="shrink-0 space-y-4 border-b border-border p-5">
          <div className="flex items-center justify-between gap-2">
            <Link href="/admin/dashboard" className="flex items-baseline">
              <span className="font-display text-2xl font-semibold tracking-tight text-forest-800">klef</span>
              <span className="font-display text-2xl font-semibold text-lime-600" aria-hidden="true">.</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="rounded-pill bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-purple-800">
                Admin
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
        </div>

        {/* Liens de navigation groupes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <h3 className="px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
                {group.title}
              </h3>
              <nav className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink key={item.href} item={item} onClose={onClose} />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Pied de la Sidebar — Carte utilisateur Admin & Déconnexion */}
        <div className="shrink-0 border-t border-border p-4 space-y-3 bg-background-alt/50">
          <div className="flex items-center gap-3 rounded-inner border border-border bg-background-card p-3 shadow-xs">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-semibold text-neutral-0">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {prenom ? `${prenom} ${nom}`.trim() : 'Super Administrateur'}
              </p>
              <p className="truncate text-[0.6875rem] text-foreground-muted">{user?.email ?? 'admin@klef.sn'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-inner border border-border bg-background-card px-2.5 py-2 text-[0.75rem] font-medium text-foreground transition-colors hover:bg-background-alt"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-foreground-muted" />
              <span>Hôte</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center justify-center gap-1.5 rounded-inner border border-error-200 bg-error-50 px-2.5 py-2 text-[0.75rem] font-medium text-error-700 transition-colors hover:bg-error-100 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sortir</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
