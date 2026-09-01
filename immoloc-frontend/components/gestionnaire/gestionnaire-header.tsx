'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  ChevronDown,
  ExternalLink,
  LogOut,
  Building,
  User,
  Search,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils/cn';

const TITRES: Array<[string, string]> = [
  ['/gestionnaire/annonces', 'Annonces gérées'],
  ['/gestionnaire/proprietaires', 'Propriétaires'],
  ['/gestionnaire/planning', 'Planning & Arrivées/Départs'],
  ['/gestionnaire/reservations', 'Réservations'],
  ['/gestionnaire/etats-des-lieux', 'États des lieux & Inspections'],
  ['/gestionnaire/finances', 'Finances & Commissions'],
  ['/gestionnaire/parametres', 'Paramètres Conciergerie'],
  ['/gestionnaire', 'Tableau de bord'],
];

interface GestionnaireHeaderProps {
  onMenuToggle: () => void;
}

export function GestionnaireHeader({ onMenuToggle }: GestionnaireHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { data: user } = useCurrentUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [recherche, setRecherche] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const titre =
    TITRES.find(([cle]) => pathname === cle || pathname.startsWith(`${cle}/`))?.[1] ??
    'Espace Gestionnaire';

  const prenom = user?.prenom?.trim();
  const nom = user?.nom?.trim();
  const initiales =
    `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() ||
    (user?.email?.[0] ?? 'G').toUpperCase();

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
    await logout('/');
  }, [logout]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-card text-foreground pt-[env(safe-area-inset-top,0px)]">
      <div className="px-3.5 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          
          {/* ── Gauche ─────────────────────────────────────────────────── */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Ouvrir le menu gestionnaire"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-lime-400 border border-forest-800 hover:bg-forest-950 active:scale-95 transition-all shadow-xs lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <span className="hidden items-center gap-1 rounded-pill border border-border bg-background-alt px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted sm:inline-flex">
                <Building className="h-3 w-3" aria-hidden="true" />
                Portail Gestionnaire
              </span>
              <h1 className="truncate font-display text-base font-semibold leading-tight text-foreground sm:text-xl">
                {titre}
              </h1>
            </div>
          </div>

          {/* ── Recherche Rapide (Optionnelle) ─────────────────────────── */}
          <div className="mx-4 hidden max-w-xs flex-1 items-center md:flex">
            <div className="relative w-full">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une annonce, réservation…"
                className="h-9 w-full rounded-pill border border-border bg-background-alt pl-10 pr-4 text-xs text-foreground placeholder:text-foreground-muted transition-colors focus:border-forest-600 focus:outline-none"
              />
            </div>
          </div>

          {/* ── Droite ─────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Menu Compte */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Menu du compte gestionnaire"
                className="flex h-9 items-center gap-2 rounded-pill border border-border bg-background-alt pl-1.5 pr-2.5 transition-colors hover:bg-background-card"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-semibold text-neutral-0">
                  {initiales}
                </span>
                <span className="hidden max-w-[100px] truncate text-xs font-semibold text-foreground md:inline">
                  {prenom || 'Gestionnaire'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-foreground-muted transition-transform',
                    menuOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
                >
                  <div className="border-b border-border bg-background-alt px-4 py-3">
                    <p className="eyebrow text-[0.6875rem]">Connecté en tant que</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
                      {user?.email ?? '—'}
                    </p>
                  </div>

                  <div className="space-y-0.5 p-2">
                    <Link
                      href="/"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-pill px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
                    >
                      <ExternalLink className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
                      Site public
                    </Link>

                    <div aria-hidden="true" className="my-1 h-px bg-border" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-pill px-3 py-2 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
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
