'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, Plus, LogOut, ChevronDown, Settings, ArrowLeftRight, Menu, Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGatedAction } from '@/features/gate/hooks/use-gated-action';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { cn } from '@/lib/utils/cn';

const PAGE_TITLES: Array<[string, string]> = [
  ['/dashboard/annonces/nouvelle', 'Nouvelle annonce'],
  ['/dashboard/reservations', 'Réservations'],
  ['/dashboard/favoris', 'Favoris'],
  ['/dashboard/wallet', 'Wallet'],
  ['/dashboard/profil', 'Mon profil'],
  ['/dashboard/parametres', 'Paramètres'],
  ['/dashboard/annonces', 'Mes annonces'],
  ['/dashboard', 'Vue d’ensemble'],
];

interface DesktopHeaderProps {
  onMenuToggle: () => void;
  /** Nombre de notifications non lues. Sans valeur, aucune pastille. */
  unreadCount?: number;
}

export function DesktopHeader({ onMenuToggle, unreadCount = 0 }: DesktopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const clearSession = useRoleStore((s) => s.clearSession);
  const activeRole = useRoleStore((s) => s.activeRole);
  const { switchRole, isSwitching } = useSwitchRole();
  const { data: user } = useCurrentUser();

  const [menuOpen, setMenuOpen] = useState<'none' | 'notif' | 'account'>('none');
  const [searchValue, setSearchValue] = useState('');
  const [isMac, setIsMac] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* `createClient()` était appelé à chaque rendu : un nouveau client Supabase
     par frappe dans le champ de recherche. */
  const supabase = useMemo(() => createClient(), []);

  /* Le raccourci affiché doit correspondre à la plateforme : « ⌘K » sur un
     PC Windows ne dit rien à personne. */
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  /* ── Fermeture des menus ─────────────────────────────────────────────── */

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

  /* Les menus restaient ouverts après une navigation. */
  useEffect(() => setMenuOpen('none'), [pathname]);

  /* ── Raccourci de recherche ──────────────────────────────────────────── */

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
    router.push(`/dashboard/reservations?q=${encodeURIComponent(q)}`);
    searchRef.current?.blur();
  }, [searchValue, router]);

  /* ── Déconnexion ─────────────────────────────────────────────────────── */

  const handleLogout = useCallback(async () => {
    setMenuOpen('none');
    try {
      await supabase.auth.signOut();
    } catch {
      /* Même si l'appel échoue, on vide la session locale et on sort :
         l'ordre inverse laissait l'utilisateur bloqué sur le dashboard avec
         une session locale déjà effacée. */
    } finally {
      clearSession();
      window.location.href = '/';
    }
  }, [supabase, clearSession]);

  /* ── Dérivés ─────────────────────────────────────────────────────────── */

  const title =
    PAGE_TITLES.find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1]
    ?? 'Dashboard';

  const prenom = user?.prenom?.trim();
  const nom = user?.nom?.trim();
  const initials =
    (prenom?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  const roleCible = activeRole === 'PROPRIETAIRE' ? 'LOCATAIRE' : 'PROPRIETAIRE';
  const roleLabel = roleCible === 'LOCATAIRE' ? 'Passer en mode locataire' : 'Passer en mode propriétaire';
  const goToNouvelleAnnonce = useCallback(() => {
    router.push('/dashboard/annonces/nouvelle');
  }, [router]);

  const { gateState, trigger: triggerCreateGate, complete: completeCreateGate, cancel: cancelCreateGate } =
    useGatedAction(goToNouvelleAnnonce);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-card/95 text-foreground backdrop-blur-md">
      <div className="px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* ── Gauche ───────────────────────────────────────────────────── */}

          <div className="flex min-w-0 items-center gap-3.5">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Ouvrir le menu"
              className="rounded-inner border border-border bg-background-alt p-2.5 text-foreground transition-colors hover:bg-background-card lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              {prenom && (
                <p className="truncate text-xs text-foreground-muted">
                  Bonjour {nom ? `${prenom} ${nom}` : prenom}
                </p>
              )}
              <h1 className="truncate font-display text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                {title}
              </h1>
            </div>
          </div>

          {/* ── Recherche ────────────────────────────────────────────────── */}

          <div className="mx-6 hidden max-w-sm flex-1 items-center md:flex">
            <form onSubmit={handleSearchSubmit} role="search" className="relative w-full">
              <label htmlFor="dashboard-search" className="sr-only">
                Rechercher une réservation ou un bien
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
              <input
                id="dashboard-search"
                ref={searchRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Rechercher une réservation, un bien…"
                className="h-10 w-full rounded-pill border border-border bg-background-alt pr-14 pl-10 text-sm text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
              />
              <kbd
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-pill border border-border bg-background-card px-2 py-0.5 text-xs font-semibold text-foreground-muted"
              >
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </form>
          </div>

          {/* ── Droite ───────────────────────────────────────────────────── */}

          <div className="flex shrink-0 items-center gap-3">

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((m) => (m === 'notif' ? 'none' : 'notif'))}
                aria-expanded={menuOpen === 'notif'}
                aria-haspopup="menu"
                aria-label={
                  unreadCount > 0
                    ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
                    : 'Notifications'
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-inner border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-error-600 px-1 text-[0.625rem] font-semibold text-neutral-0 tabular-nums"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {menuOpen === 'notif' && (
                <div
                  role="menu"
                  className="absolute top-full right-0 z-50 mt-2.5 w-80 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-border bg-background-alt px-4 py-3.5">
                    <p className="font-display text-sm font-semibold text-foreground">
                      Notifications
                    </p>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-link transition-colors hover:underline"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 p-6 text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-inner border border-border bg-background-alt">
                      <Bell className="h-5 w-5 text-foreground-muted" aria-hidden="true" />
                    </span>
                    <p className="font-display text-sm font-semibold text-foreground">
                      Aucune notification
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Vos alertes apparaîtront ici.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ★ Le seul aplat lime du header : l'action de création. */}
            <button
              type="button"
              onClick={triggerCreateGate}
              className="inline-flex h-10 items-center gap-2 rounded-pill bg-action px-4 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Créer une annonce</span>
              <span className="sm:hidden">Créer</span>
            </button>

            {/* Compte */}
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((m) => (m === 'account' ? 'none' : 'account'))}
                aria-expanded={menuOpen === 'account'}
                aria-haspopup="menu"
                aria-label="Menu du compte"
                className="flex h-10 items-center gap-2.5 rounded-pill border border-border bg-background-alt pr-3 pl-1.5 transition-colors hover:bg-background-card"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-semibold text-neutral-50">
                  {initials}
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
                  <div className="border-b border-border bg-background-alt px-4 py-3.5">
                    <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                      Connecté en tant que
                    </p>
                    <p className="truncate text-xs font-semibold text-foreground">{user?.email}</p>
                  </div>

                  <div className="space-y-1 p-2">
                    {/* Le bouton proposait toujours « Mode Locataire », même
                        à un utilisateur déjà en mode locataire. Il bascule
                        maintenant vers le rôle opposé. */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setMenuOpen('none'); switchRole(roleCible); }}
                      disabled={isSwitching}
                      className="flex w-full items-center gap-3 rounded-inner px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      {roleLabel}
                    </button>

                    <Link
                      href="/dashboard/parametres"
                      role="menuitem"
                      onClick={() => setMenuOpen('none')}
                      className="flex items-center gap-3 rounded-inner px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                    >
                      <Settings className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      Paramètres
                    </Link>

                    <div className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-inner px-3 py-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
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

      {gateState.open && (
        <ActionGateModal
          steps={gateState.steps}
          block={gateState.block}
          onComplete={completeCreateGate}
          onCancel={cancelCreateGate}
        />
      )}
    </header>
  );
}