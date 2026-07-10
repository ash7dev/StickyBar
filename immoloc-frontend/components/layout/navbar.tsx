'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, Home, Search, HelpCircle, Building2,
  LayoutDashboard, LogIn, LogOut,
  CalendarDays, Settings, ChevronDown,
  Building, Sparkles, Mail
} from 'lucide-react';
import { BRAND } from '@/lib/config';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { cn } from '@/lib/utils/cn';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const PUBLIC_LINKS: NavLink[] = [
  { href: '/', label: 'Accueil', icon: <Home className="h-4 w-4" /> },
  { href: '/logements', label: 'Logements', icon: <Search className="h-4 w-4" /> },
  { href: '/comment-ca-marche', label: 'Comment ça marche', icon: <HelpCircle className="h-4 w-4" /> },
  { href: '/contact', label: 'Contact', icon: <Mail className="h-4 w-4" /> },
];

// Sur mobile, le bottom nav couvre Accueil/Explorer/Séjours/Paramètres
// → le hamburger n'affiche que les liens secondaires
const MOBILE_SECONDARY_LINKS: NavLink[] = [
  { href: '/comment-ca-marche', label: 'Comment ça marche', icon: <HelpCircle className="h-4 w-4" /> },
  { href: '/contact', label: 'Contact', icon: <Mail className="h-4 w-4" /> },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { logout } = useAuth();
  const { activeRole, estProprietaire, hasAnnonce, userId } = useRoleStore();
  const { switchRole, isSwitching } = useSwitchRole();

  const [user, setUser] = useState<{ email?: string; user_metadata?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Track scroll for glass intensity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer le menu au changement de route
  useEffect(() => { 
    setIsOpen(false); 
    setDropdownOpen(false);
  }, [pathname]);

  // Clic extérieur pour le dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prenom = user?.user_metadata?.prenom;
  const initials = prenom ? prenom[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <>
      {/* ── Navbar Styles ─────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes navbar-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes dropdown-enter {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mobile-menu-enter {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes avatar-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(77, 150, 255, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(77, 150, 255, 0); }
        }
        .navbar-glass {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .navbar-glass-scrolled {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          box-shadow:
            0 1px 3px rgba(12, 73, 192, 0.06),
            0 8px 32px rgba(12, 73, 192, 0.08),
            inset 0 -1px 0 rgba(255, 255, 255, 0.5);
        }
        .dropdown-glass {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          animation: dropdown-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mobile-menu-glass {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px) saturate(200%);
          -webkit-backdrop-filter: blur(24px) saturate(200%);
          animation: mobile-menu-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nav-link-active {
          background: linear-gradient(135deg, rgba(77, 150, 255, 0.12), rgba(12, 73, 192, 0.08));
          box-shadow: inset 0 0 0 1px rgba(77, 150, 255, 0.15);
        }
        .nav-link-hover:hover {
          background: rgba(77, 150, 255, 0.06);
        }
        .avatar-ring {
          background: linear-gradient(135deg, var(--primary-400), var(--primary-700));
          padding: 2px;
        }
        .avatar-ring:hover {
          animation: avatar-pulse 2s ease-in-out infinite;
        }
        .cta-shimmer {
          background-size: 200% 100%;
          background-image: linear-gradient(
            110deg,
            var(--primary-700) 0%,
            var(--primary-700) 40%,
            var(--primary-500) 50%,
            var(--primary-700) 60%,
            var(--primary-700) 100%
          );
          animation: navbar-shimmer 3s ease-in-out infinite;
        }
        .dropdown-item {
          transition: all 0.15s ease;
        }
        .dropdown-item:hover {
          transform: translateX(4px);
          background: rgba(77, 150, 255, 0.06);
        }
      `}</style>

      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-500 border-b',
          scrolled
            ? 'navbar-glass-scrolled border-white/30'
            : 'navbar-glass border-transparent'
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ─────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
                <Building2 className="h-[18px] w-[18px] text-white drop-shadow-sm" />
                {/* Subtle glow */}
                <div className="absolute inset-0 rounded-xl bg-primary-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
                {BRAND.name}
              </span>
            </Link>

            {/* ── Navigation desktop ──────────────────────────── */}
            <nav className="hidden md:flex items-center gap-1 bg-neutral-100/60 rounded-full px-1.5 py-1 border border-neutral-200/50">
              {PUBLIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300',
                    pathname === link.href
                      ? 'nav-link-active text-primary-700 shadow-sm'
                      : 'text-foreground-muted hover:text-neutral-800 nav-link-hover',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* ── Actions desktop ──────────────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-neutral-100 animate-pulse" />
                  <div className="h-4 w-20 bg-neutral-100 rounded-md animate-pulse" />
                </div>
              ) : user ? (
                <div ref={dropdownRef} className="relative">
                  {/* ── Profile Avatar Button ── */}
                  <button
                    id="navbar-profile-trigger"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={cn(
                      'flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-all duration-300',
                      'border border-transparent hover:border-border/80',
                      'hover:bg-background-card/60 hover:shadow-md',
                      dropdownOpen && 'bg-background-card/70 shadow-md border-border/80'
                    )}
                    aria-label="Menu profil"
                  >
                    {/* Avatar with gradient ring */}
                    <div className="avatar-ring rounded-full">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                        {initials}
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 text-foreground-muted transition-transform duration-300',
                      dropdownOpen && 'rotate-180 text-primary-500'
                    )} />
                  </button>

                  {/* ── Dropdown Panel ── */}
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2.5 w-60 rounded-2xl border border-white/40 shadow-xl overflow-hidden dropdown-glass">
                      {/* Header */}
                      <div className="px-4 py-3.5 border-b border-neutral-100/80 bg-gradient-to-r from-primary-50/50 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="avatar-ring rounded-full flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-sm font-bold">
                              {initials}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-neutral-800 truncate">
                              {prenom ?? user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-1.5 space-y-0.5">
                        {/* Lien spécifique au rôle */}
                        {activeRole === 'PROPRIETAIRE' ? (
                          <Link
                            href={hasAnnonce ? "/dashboard" : "/become-host"}
                            className="dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary-700 rounded-xl"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                              <LayoutDashboard className="h-4 w-4 text-primary-600" />
                            </div>
                            Tableau de bord
                          </Link>
                        ) : estProprietaire ? (
                          <button
                            onClick={() => switchRole('PROPRIETAIRE')}
                            disabled={isSwitching}
                            className="w-full dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary-700 rounded-xl disabled:opacity-60"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                              <Building className="h-4 w-4 text-primary-600" />
                            </div>
                            {isSwitching ? 'Changement…' : 'Espace Propriétaire'}
                          </button>
                        ) : (
                          <Link
                            href="/become-host"
                            className="dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-primary-700 rounded-xl"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-primary-600" />
                            </div>
                            Devenir hôte
                          </Link>
                        )}

                        <Link
                          href="/reservations"
                          className="dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <CalendarDays className="h-4 w-4 text-foreground-muted" />
                          </div>
                          Mes réservations
                        </Link>
                        
                        <Link
                          href="/parametres"
                          className="dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-600 rounded-xl"
                        >
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <Settings className="h-4 w-4 text-foreground-muted" />
                          </div>
                          Paramètres
                        </Link>

                        <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent my-1.5" />
                        
                        <button
                          onClick={logout}
                          className="w-full dropdown-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:!bg-red-50/60"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <LogOut className="h-4 w-4 text-red-400" />
                          </div>
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 hover:bg-background-card/60 rounded-full transition-all duration-300 border border-transparent hover:border-neutral-200/60 hover:shadow-sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="cta-shimmer flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 hover:scale-[1.02]"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </div>

            {/* ── Actions mobile ───────── */}
            <div className="flex md:hidden items-center gap-2">

              {!loading && !user && (
                <Link
                  href="/register"
                  className="cta-shimmer px-4 py-1.5 text-xs font-semibold text-white rounded-full shadow-sm transition-all duration-300"
                >
                  Commencer
                </Link>
              )}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                  'hover:bg-background-card/60 hover:shadow-sm border border-transparent hover:border-neutral-200/60',
                  isOpen && 'bg-background-card/70 shadow-sm border-neutral-200/60'
                )}
                aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {isOpen ? <X className="h-5 w-5 text-neutral-700" /> : <Menu className="h-5 w-5 text-neutral-700" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Menu mobile déroulant ──────────────────────────────── */}
        {isOpen && (
          <div className="md:hidden border-t border-white/30 mobile-menu-glass">
            <nav className="max-w-6xl mx-auto px-4 py-4 space-y-1">

              {/* Liens secondaires uniquement (Accueil/Logements/Séjours/Paramètres → bottom nav) */}
              {MOBILE_SECONDARY_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'nav-link-active text-primary-700 shadow-sm'
                      : 'text-neutral-600 hover:bg-background-card/60',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    pathname === link.href ? 'bg-primary-100/60' : 'bg-neutral-100/80'
                  )}>
                    {link.icon}
                  </div>
                  {link.label}
                </Link>
              ))}

              <div className="h-px bg-gradient-to-r from-transparent via-neutral-200/60 to-transparent my-3" />

              {loading ? null : user ? (
                <>
                  {/* Profil */}
                  <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-primary-50/40 to-transparent border border-primary-100/30">
                    <div className="avatar-ring rounded-full flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center text-white text-sm font-bold">
                        {initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800 truncate">{prenom ?? user.email}</p>
                    </div>
                  </div>

                  {/* Lien rôle-spécifique */}
                  {activeRole === 'PROPRIETAIRE' ? (
                    <Link
                      href={hasAnnonce ? "/dashboard" : "/become-host"}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-700 nav-link-active"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-100/60 flex items-center justify-center">
                        <LayoutDashboard className="h-4 w-4 text-primary-600" />
                      </div>
                      Tableau de bord
                    </Link>
                  ) : estProprietaire ? (
                    <button
                      onClick={() => switchRole('PROPRIETAIRE')}
                      disabled={isSwitching}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-700 nav-link-active disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-100/60 flex items-center justify-center">
                        <Building className="h-4 w-4 text-primary-600" />
                      </div>
                      {isSwitching ? 'Changement…' : 'Espace Propriétaire'}
                    </button>
                  ) : (
                    <Link
                      href="/become-host"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-700 nav-link-active"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary-600" />
                      </div>
                      Devenir hôte
                    </Link>
                  )}

                  <div className="h-px bg-gradient-to-r from-transparent via-neutral-200/60 to-transparent my-2" />

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/40 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50/80 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-red-400" />
                    </div>
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="space-y-2 pt-1">
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 hover:bg-background-card/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100/80 flex items-center justify-center">
                      <LogIn className="h-4 w-4 text-foreground-muted" />
                    </div>
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="cta-shimmer flex items-center justify-center gap-2 mx-2 py-3 rounded-xl text-sm font-semibold text-white shadow-md transition-all duration-300"
                  >
                    Commencer
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
