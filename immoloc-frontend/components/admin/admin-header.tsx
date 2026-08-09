'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  ArrowLeftRight,
  ShieldAlert,
  ExternalLink,
  Megaphone,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils/cn';

const ADMIN_PAGE_TITLES: Array<[string, string]> = [
  ['/admin/dashboard', 'Vue d’ensemble Administrateur'],
  ['/admin/kyc', 'Vérification KYC & Identité'],
  ['/admin/annonces', 'Modération du Catalogue d’Annonces'],
  ['/admin/litiges', 'Centre de Résolution des Litiges'],
  ['/admin/avis', 'Modération des Avis & Notes'],
  ['/admin/utilisateurs', 'Gestion des Utilisateurs & Hôtes'],
  ['/admin/reservations', 'Supervision des Réservations'],
  ['/admin/finances', 'Finance, Retraits & Webhooks'],
  ['/admin/notifications', 'Diffusion de Notifications Broadcast'],
  ['/admin/equipements', 'Référentiel des Équipements'],
  ['/admin/parametres', 'Paramètres d’Administration'],
  ['/admin', 'Portail Administration'],
];

interface AdminHeaderProps {
  onMenuToggle: () => void;
  /** Nombre d'actions urgentes en attente (KYC, Annonces, Retraits, Litiges) */
  urgentCount?: number;
}

export function AdminHeader({ onMenuToggle, urgentCount = 0 }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const clearSession = useRoleStore((s) => s.clearSession);
  const { data: user } = useCurrentUser();

  const [menuOpen, setMenuOpen] = useState<'none' | 'notif' | 'account'>('none');
  const [searchValue, setSearchValue] = useState('');
  const [isMac, setIsMac] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  /* Fermeture des menus contextuels au clic extérieur ou touche Échap */
  useEffect(() => {
    if (menuOpen === 'none') return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const ref = menuOpen === 'notif' ? notifRef : accountRef;
      if (ref.current && !ref.current.contains(target)) setMenuOpen('none');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen('none');
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen('none'), [pathname]);

  /* Raccourci clavier de recherche (⌘K ou Ctrl K) */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/admin/utilisateurs?search=${encodeURIComponent(q)}`);
    searchRef.current?.blur();
  }, [searchValue, router]);

  const handleLogout = useCallback(async () => {
    setMenuOpen('none');
    try {
      await supabase.auth.signOut();
    } finally {
      clearSession();
      window.location.href = '/';
    }
  }, [supabase, clearSession]);

  const title =
    ADMIN_PAGE_TITLES.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1]
    ?? 'Administration Klef';

  const prenom = user?.prenom?.trim();
  const nom = user?.nom?.trim();
  const initials = (prenom?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-card/95 text-foreground backdrop-blur-md">
      <div className="px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Gauche : Bouton menu mobile + Titre de section admin */}
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Ouvrir le menu d'administration"
              className="rounded-inner border border-border bg-background-alt p-2 text-foreground transition-colors hover:bg-background-card lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 rounded-pill bg-purple-50 border border-purple-200/80 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-purple-800">
                  <ShieldAlert className="h-3 w-3" />
                  Portail Administrateur
                </span>
              </div>
              <h1 className="truncate font-display text-base font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
            </div>
          </div>

          {/* Recherche Admin (Desktop) */}
          <div className="mx-4 hidden max-w-md flex-1 items-center md:flex">
            <form onSubmit={handleSearchSubmit} role="search" className="relative w-full">
              <label htmlFor="admin-search" className="sr-only">
                Rechercher un utilisateur, un logement ou une réservation
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
              <input
                id="admin-search"
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Rechercher un utilisateur, un logement, un code..."
                className="h-9.5 w-full rounded-pill border border-border bg-background-alt pr-14 pl-10 text-xs text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
              />
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-pill border border-border bg-background-card px-2 py-0.5 text-[0.6875rem] font-semibold text-foreground-muted"
              >
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </form>
          </div>

          {/* Droite : Broadcast Quick CTA + Notifications Urgentes + Menu Compte Admin */}
          <div className="flex shrink-0 items-center gap-3">

            {/* CTA Broadcast Notification */}
            <Link
              href="/admin/notifications"
              className="hidden sm:inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-alt px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-card"
            >
              <Megaphone className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
              <span>Broadcast</span>
            </Link>

            {/* Menu Alertes Urgences Admin */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((m) => (m === 'notif' ? 'none' : 'notif'))}
                aria-expanded={menuOpen === 'notif'}
                aria-haspopup="menu"
                aria-label="Actions urgentes admin"
                className="relative flex h-9 w-9 items-center justify-center rounded-inner border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {urgentCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-error-600 px-1 text-[0.625rem] font-bold text-neutral-0 tabular-nums shadow-xs"
                  >
                    {urgentCount > 9 ? '9+' : urgentCount}
                  </span>
                )}
              </button>

              {menuOpen === 'notif' && (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-2.5 w-80 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-border bg-background-alt px-4 py-3">
                    <p className="font-display text-xs font-semibold text-foreground uppercase tracking-wider">
                      Actions urgentes en attente
                    </p>
                    {urgentCount > 0 && (
                      <span className="rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-bold text-error-700">
                        {urgentCount} urgence{urgentCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-border">
                    <Link
                      href="/admin/kyc"
                      className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-background-alt"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-forest-600" />
                        <span className="font-medium text-foreground">Dossiers KYC à valider</span>
                      </div>
                      <span className="font-semibold text-forest-700">Consulter</span>
                    </Link>

                    <Link
                      href="/admin/annonces"
                      className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-background-alt"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="h-4 w-4 text-warning-600" />
                        <span className="font-medium text-foreground">Annonces à modérer</span>
                      </div>
                      <span className="font-semibold text-forest-700">Consulter</span>
                    </Link>

                    <Link
                      href="/admin/finances"
                      className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-background-alt"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-foreground">Retraits Mobile Money</span>
                      </div>
                      <span className="font-semibold text-forest-700">Valider</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Compte Administrateur */}
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((m) => (m === 'account' ? 'none' : 'account'))}
                aria-expanded={menuOpen === 'account'}
                aria-haspopup="menu"
                aria-label="Menu administrateur"
                className="flex h-9 items-center gap-2 rounded-pill border border-border bg-background-alt pr-2.5 pl-1.5 transition-colors hover:bg-background-card"
              >
                <span className="flex h-6.5 w-6.5 items-center justify-center rounded-inner bg-forest-800 font-display text-[0.6875rem] font-bold text-neutral-0">
                  {initials}
                </span>
                <span className="hidden md:inline text-xs font-semibold text-foreground max-w-[100px] truncate">
                  {prenom ? prenom : 'Admin'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-foreground-muted transition-transform',
                    menuOpen === 'account' && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {menuOpen === 'account' && (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-2.5 w-64 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="border-b border-border bg-background-alt px-4 py-3">
                    <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
                      Compte Administrateur
                    </p>
                    <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
                  </div>

                  <div className="space-y-1 p-2">
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setMenuOpen('none')}
                      className="flex items-center gap-3 rounded-inner px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      Tableau de bord Hôte
                    </Link>

                    <Link
                      href="/"
                      role="menuitem"
                      onClick={() => setMenuOpen('none')}
                      className="flex items-center gap-3 rounded-inner px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                    >
                      <ExternalLink className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      Site public Klef
                    </Link>

                    <Link
                      href="/admin/parametres"
                      role="menuitem"
                      onClick={() => setMenuOpen('none')}
                      className="flex items-center gap-3 rounded-inner px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                    >
                      <Settings className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      Paramètres d’Admin
                    </Link>

                    <div className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-inner px-3 py-2 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                    >
                      <LogOut className="h-4 w-4 text-error-600" aria-hidden="true" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
