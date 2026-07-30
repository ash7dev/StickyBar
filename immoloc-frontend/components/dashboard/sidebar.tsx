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
        'flex items-center gap-3 px-4 py-3 rounded-inner text-xs transition-all duration-200 group relative',
        active
          ? 'bg-lime-400 text-forest-950 font-extrabold shadow-sm border border-lime-500/20'
          : 'text-foreground-muted hover:bg-background-alt hover:text-forest-950 font-semibold',
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0 transition-all duration-200', active ? 'text-forest-950' : 'text-foreground-muted group-hover:text-forest-950')} />
      <span className="truncate">{item.label}</span>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-forest-950 ml-auto shrink-0 animate-pulse" />
      )}
    </Link>
  );
}

export function DashboardSidebar({ isOpen, onClose }: SidebarProps) {
  const { switchRole, isSwitching } = useSwitchRole();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const onboardingDraft = useRoleStore((state) => state.onboardingDraft);

  const { data: user } = useCurrentUser();

  const userInitials = user?.prenom && user?.nom
    ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase()
    : (onboardingDraft?.prenom?.[0]?.toUpperCase() || 'KL');

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
      {/* Backdrop mobile */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-overlay backdrop-blur-xs transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panneau sidebar Mode Light Premium */}
      <aside
        className={cn(
          'w-64 flex flex-col shrink-0',
          'fixed inset-y-0 left-0 z-50',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:inset-auto lg:z-auto',
          'bg-background-card border-r border-border/80 shadow-2xs',
        )}
      >
        {/* Header avec Logo */}
        <div className="p-5 border-b border-border/60 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-0.5">
              <span className="font-display text-2xl font-extrabold text-forest-950 tracking-tight">klef</span>
              <span className="font-display text-2xl font-extrabold text-lime-600">.</span>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-forest-950 text-lime-400 text-[9px] font-extrabold uppercase tracking-widest border border-lime-400/20">
              Hôte
            </span>
            <button
              onClick={onClose}
              aria-label="Fermer le menu"
              className="lg:hidden p-1.5 rounded-inner text-foreground-muted hover:bg-background-alt transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="bg-background-alt border border-border/80 rounded-inner p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-inner bg-forest-950 border border-lime-400/20 text-lime-400 font-display font-extrabold text-sm flex items-center justify-center shrink-0 shadow-2xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xs font-extrabold text-forest-950 truncate">{userName}</p>
              <p className="text-[10px] text-foreground-muted font-bold truncate mt-0.5">Espace Propriétaire</p>
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClose={onClose} />
          ))}

          <div className="my-3 border-t border-border/60" />

          {BOTTOM_NAV.map((item) => (
            <NavLink key={item.href} item={item} onClose={onClose} />
          ))}
        </nav>

        {/* Actions du bas */}
        <div className="p-3 border-t border-border/60 space-y-2 shrink-0">
          {/* Switch Role */}
          <button
            onClick={() => {
              switchRole('LOCATAIRE');
              onClose();
            }}
            disabled={isSwitching}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-pill bg-forest-950 hover:bg-forest-900 text-lime-400 font-extrabold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 border border-lime-400/20"
          >
            <ArrowLeftRight className="h-4 w-4 text-lime-400 shrink-0" />
            <span className="truncate">Passer en Mode Locataire</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-pill bg-error-50 hover:bg-error-100 border border-error-200 text-xs font-extrabold text-error-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-error-600 shrink-0" />
            <span className="truncate">{isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
