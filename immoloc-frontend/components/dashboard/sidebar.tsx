'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Building2, CalendarDays,
  Wallet, Settings, X, ArrowLeftRight, LogOut
} from 'lucide-react';
import { BRAND } from '@/lib/config';
import { cn } from '@/lib/utils/cn';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRoleStore } from '@/stores/role.store';
import { useCurrentUser } from '@/hooks/use-current-user';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: '/dashboard/annonces', label: 'Mes annonces', icon: Building2 },
  { href: '/dashboard/reservations', label: 'Réservations', icon: CalendarDays },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
];

const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard/parametres', label: 'Paramètres', icon: Settings },
];

interface SidebarProps {
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
      className={cn(
        'flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden',
        active
          ? 'bg-emerald-600 text-background-card shadow-lg'
          : 'text-foreground-muted hover:bg-emerald-50 hover:text-emerald-700',
      )}
    >
      {/* Glow effect on active */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent pointer-events-none" />
      )}

      <item.icon className={cn('h-4 w-4 flex-shrink-0 transition-all duration-300 relative z-10', active ? 'text-background-card' : 'text-foreground-muted group-hover:text-emerald-700')} />
      <span className="truncate relative z-10">{item.label}</span>
    </Link>
  );
}

export function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const { switchRole, isSwitching } = useSwitchRole();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const onboardingDraft = useRoleStore((state) => state.onboardingDraft);

  // ── User (optimisé avec React Query + cache partagé) ───────────────────
  const { data: user } = useCurrentUser();

  const userInitials = user?.prenom && user?.nom
    ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    : (onboardingDraft?.prenom?.[0]?.toUpperCase() || 'IM');

  const userName = user?.prenom && user?.nom
    ? `${user.prenom} ${user.nom}`
    : (onboardingDraft?.prenom && onboardingDraft?.nom
      ? `${onboardingDraft.prenom} ${onboardingDraft.nom}`
      : BRAND.name);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  return (
    <>
      {/* ── Backdrop mobile ───────────────────────────────────── */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-overlay transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Panneau sidebar ───────────────────────────────────── */}
      <aside
        className={cn(
          // Dimensions + layout
          'w-64 flex flex-col flex-shrink-0',
          // Mobile : fixed overlay avec transition
          'fixed inset-y-0 left-0 z-50',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop : toujours visible, dans le flux normal
          'lg:relative lg:translate-x-0 lg:inset-auto lg:z-auto',
          // Fond
          'bg-background-card border-r border-border',
        )}
      >
        {/* ── Header avec Logo ──────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">{BRAND.name}</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-premium-600 font-medium mt-0.5">ADMINISTRATION</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer le menu"
              className="lg:hidden p-1.5 rounded-lg text-foreground-muted hover:bg-background-alt transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── User Profile Card ─────────────────────────────── */}
          <div className="bg-background-alt rounded-xl p-3 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-background-card font-bold text-sm">{userInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-bold text-xs truncate">{userName}</p>
                <p className="text-foreground-muted text-[10px]">Administration</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation principale ─────────────────────────── */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClose={onClose} />
          ))}

          <div className="pt-3 pb-2">
            <div className="h-px bg-border" />
          </div>

          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* ── Bottom Actions ────────────────────────────────── */}
        <div className="px-3 pb-5 pt-3 flex-shrink-0 border-t border-border space-y-2">
          {/* Switch Role */}
          <button
            onClick={() => {
              switchRole('LOCATAIRE');
              onClose();
            }}
            disabled={isSwitching}
            className={cn(
              'w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group',
              'bg-background-alt text-foreground hover:bg-emerald-50 hover:text-emerald-700 border border-border',
              isSwitching && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ArrowLeftRight className="h-4 w-4 flex-shrink-0 text-emerald-600 transition-transform group-hover:rotate-180 duration-300" />
            <span className="truncate">Mode locataire</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              'w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300',
              'text-error-600 hover:bg-error-50 border border-border',
              isLoggingOut && 'opacity-50 cursor-not-allowed'
            )}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
