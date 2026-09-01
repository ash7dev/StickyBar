/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Building,
  CalendarDays,
  Settings,
  LogOut,
  User,
  Loader2,
  Coins,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useIsAuthenticated, useRoleStore } from '@/stores/role.store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { createClient } from '@/lib/supabase/client';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { CurrencySelector } from '@/components/layout/currency-selector';

const LINKS = [
  { href: '/',                 label: 'Accueil'           },
  { href: '/explorer',         label: 'Explorer'          },
  { href: '/comment-ca-marche', label: 'Comment ça marche' },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { activeRole } = useRoleStore();
  const { logout } = useAuth();
  const { switchRole, isSwitching } = useSwitchRole();

  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, any> } | null>(null);

  const isAdmin = activeRole === 'ADMIN' || (user?.email?.toLowerCase().endsWith('@admin.com') ?? false);
  const isGestionnaire = activeRole === 'GESTIONNAIRE' || (user?.email?.toLowerCase().endsWith('@gestionnaire.com') ?? false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // ── Chargement des données de l'utilisateur Supabase ──────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fermeture du dropdown au changement de route ou clic extérieur / Échap
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handlePublierClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent('/become-host')}`);
    } else {
      router.push('/become-host');
    }
  };

  const handleSwitchRoleToOwner = async () => {
    setDropdownOpen(false);
    if (activeRole === 'PROPRIETAIRE') {
      router.push('/dashboard');
    } else {
      try {
        await switchRole('PROPRIETAIRE');
      } catch (error) {
        console.error('[Navbar] Échec du changement de rôle vers PROPRIETAIRE:', error);
      }
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout('/');
  };

  // ── Scroll : listener passif, throttle rAF, lecture initiale ─────────────
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setIsScrolled(window.scrollY > 20);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const isActive = useCallback(
    (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
    [pathname],
  );

  // ── Indicateur glissant ──────────────────────────────────────────────────
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>('[data-active="true"]');
    if (!el) {
      setPill(null);
      return;
    }
    setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, pathname]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [measure]);

  const prenom = user?.user_metadata?.prenom;
  const nom = user?.user_metadata?.nom;
  const initials = prenom
    ? (prenom[0] + (nom ? nom[0] : '')).toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? null);

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className={`nav-float glass mx-auto w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-[1120px] px-2.5 sm:px-4 transition-shadow duration-200 ${
          isScrolled ? 'shadow-lg' : 'shadow-float'
        }`}
      >
        <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between h-14 md:h-16 gap-2 sm:gap-3">

          {/* ── Logo ───────────────────────────────────────────────────────── */}
          <div className="flex justify-start shrink-0">
            <Link
              href="/"
              aria-label="Klef — accueil"
              className="flex items-baseline rounded-pill focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span className="font-display text-[1.375rem] sm:text-2xl md:text-[1.75rem] font-semibold tracking-tight text-forest-800">
                klef
              </span>
              <span className="font-display text-[1.375rem] sm:text-2xl md:text-[1.75rem] font-semibold text-lime-600" aria-hidden="true">
                .
              </span>
            </Link>
          </div>

          {/* ── Onglets — desktop uniquement ───────────────────────────────── */}
          <div ref={listRef} className="relative hidden md:flex items-center gap-1">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 rounded-pill bg-lime-100 transition-[left,width,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={
                pill
                  ? { left: pill.left, width: pill.width, opacity: 1 }
                  : { left: 0, width: 0, opacity: 0 }
              }
            />
            {LINKS.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                  className={`relative z-10 rounded-pill px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                    active ? 'text-forest-800' : 'text-foreground-muted hover:text-forest-700'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Actions — visibles sur toutes les tailles ──────────────────── */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Sélecteur de devise (FCFA, EUR, USD) */}
            <CurrencySelector />

            {isAuthenticated ? (
              <div ref={dropdownRef} className="relative">
                {/* Trigger Avatar */}
                <button
                  id="navbar-user-dropdown-trigger"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="Menu utilisateur"
                  className={`flex items-center gap-1.5 p-1 rounded-full border transition-all duration-200 ${
                    dropdownOpen
                      ? 'bg-lime-50 border-forest-300 ring-2 ring-ring/20 shadow-sm'
                      : 'bg-white/80 border-forest-100 hover:bg-lime-50/60 hover:border-forest-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-forest-800 text-on-inverse-marker flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                    {initials || <User className="w-4 h-4" />}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-forest-700 transition-transform duration-200 mr-0.5 ${
                      dropdownOpen ? 'rotate-180 text-forest-900' : ''
                    }`}
                  />
                </button>

                {/* Menu Dropdown */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-forest-100/80 bg-white/95 backdrop-blur-md shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    {/* Header infos utilisateur */}
                    <div className="px-4 py-2.5 border-b border-forest-100/60 bg-forest-50/30">
                      <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">Connecté en tant que</p>
                      <p className="text-sm font-semibold text-forest-900 truncate">
                        {prenom ? `${prenom} ${nom ?? ''}`.trim() : (user?.email ?? 'Mon compte')}
                      </p>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {/* Bouton Mode Admin si compte Admin */}
                      {isAdmin && (
                        <Link
                          role="menuitem"
                          href="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-bold text-forest-900 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200/60 transition-colors mb-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-forest-900 flex items-center justify-center text-lime-300 shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <span className="truncate">Passer en mode Admin 🛡️</span>
                        </Link>
                      )}

                      {/* Bouton Portail Gestionnaire si compte Gestionnaire */}
                      {isGestionnaire && (
                        <Link
                          role="menuitem"
                          href="/gestionnaire"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-bold text-forest-900 rounded-xl bg-forest-50 hover:bg-forest-100 border border-forest-200/60 transition-colors mb-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-forest-900 flex items-center justify-center text-lime-400 shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <span className="truncate">Espace Gestionnaire 🔑</span>
                        </Link>
                      )}

                      {/* 1. Passer en Mode propriétaire */}
                      <button
                        role="menuitem"
                        onClick={handleSwitchRoleToOwner}
                        disabled={isSwitching}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-semibold text-forest-800 rounded-xl hover:bg-lime-50 hover:text-forest-900 transition-colors disabled:opacity-50"
                      >
                        <div className="w-7 h-7 rounded-lg bg-lime-100/70 flex items-center justify-center text-forest-700 shrink-0">
                          {isSwitching ? (
                            <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
                          ) : (
                            <Building className="w-4 h-4" />
                          )}
                        </div>
                        <span className="truncate">
                          {isSwitching
                            ? 'Changement…'
                            : activeRole === 'PROPRIETAIRE'
                            ? 'Tableau de bord'
                            : 'Passer en Mode propriétaire'}
                        </span>
                      </button>

                      {/* 2. Mes Réservations */}
                      <Link
                        role="menuitem"
                        href="/reservations"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium text-forest-800 rounded-xl hover:bg-lime-50 hover:text-forest-900 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                          <CalendarDays className="w-4 h-4" />
                        </div>
                        <span>Mes Réservations</span>
                      </Link>

                      {/* 3. Klef Teranga Club */}
                      <Link
                        role="menuitem"
                        href="/teranga-club"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-semibold text-forest-800 rounded-xl hover:bg-lime-50 hover:text-forest-900 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                          <Coins className="w-4 h-4" />
                        </div>
                        <span>Klef Teranga Club 🪙</span>
                      </Link>

                      {/* 4. Paramètres */}
                      <Link
                        role="menuitem"
                        href="/parametres"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium text-forest-800 rounded-xl hover:bg-lime-50 hover:text-forest-900 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700 shrink-0">
                          <Settings className="w-4 h-4" />
                        </div>
                        <span>Paramètres</span>
                      </Link>

                      <div className="h-px bg-forest-100/60 my-1" />

                      {/* 4. Déconnexion */}
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-ghost !px-3 !py-2 !text-[0.8125rem] sm:!px-4 sm:!text-sm whitespace-nowrap"
              >
                Se connecter
              </Link>
            )}

            <Link
              href="/become-host"
              onClick={handlePublierClick}
              className="btn-action !px-3 !py-2 !text-[0.8125rem] sm:!px-4 sm:!text-sm whitespace-nowrap hidden sm:inline-flex"
            >
              <span>
                Publier un bien
              </span>
            </Link>
          </div>
        </div>
      </nav>

      <MobileBottomNav />
    </>
  );
}