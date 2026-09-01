'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Building2,
  CalendarDays,
  KeyRound,
  MessageSquare,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useRoleStore } from '@/stores/role.store';
import { createClient } from '@/lib/supabase/client';

export function GestionnaireNavbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { activeRole } = useRoleStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, any> } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const prenom = user?.user_metadata?.prenom ?? 'Gestionnaire';
  const nom = user?.user_metadata?.nom ?? 'Klef';
  const initials = prenom ? (prenom[0] + (nom ? nom[0] : '')).toUpperCase() : 'G';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-forest-100/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo Klef & Badge */}
        <div className="flex items-center gap-4">
          <Link href="/gestionnaire" className="flex items-baseline gap-0.5">
            <span className="font-display text-2xl font-bold tracking-tight text-forest-900">
              klef
            </span>
            <span className="font-display text-2xl font-bold text-forest-600">.</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-pill bg-forest-900 px-3 py-1 text-xs font-bold text-white shadow-xs">
            <Building className="h-3.5 w-3.5 text-lime-400" />
            Portail Gestionnaire
          </span>
        </div>

        {/* Desktop Quick Nav Links / Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded-full text-foreground-muted hover:text-forest-900 hover:bg-forest-50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          {/* User Menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1.5 rounded-full border border-forest-100 hover:bg-forest-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-forest-900 text-lime-400 flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-forest-900">
                {prenom} {nom}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-forest-700" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-forest-100 bg-white shadow-xl py-1.5 z-50">
                <div className="px-4 py-2 border-b border-forest-100/60 bg-forest-50/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-faint">Connecté en gestionnaire</p>
                  <p className="text-xs font-semibold text-forest-900 truncate">{user?.email ?? 'gestionnaire@klef.sn'}</p>
                </div>

                <div className="p-1 space-y-0.5">
                  <Link
                    href="/"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-forest-800 rounded-xl hover:bg-forest-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-forest-600" />
                    <span>Retour au site principal</span>
                  </Link>

                  <button
                    onClick={() => logout('/')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-forest-100/60 bg-forest-50/40 px-4 py-2 scrollbar-hide gap-2">
        {[
          { href: '/gestionnaire', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/gestionnaire/annonces', label: 'Annonces', icon: Building2 },
          { href: '/gestionnaire/planning', label: 'Planning', icon: CalendarDays },
          { href: '/gestionnaire/reservations', label: 'Réservations', icon: KeyRound },
          { href: '/gestionnaire/messages', label: 'Messages', icon: MessageSquare },
        ].map((link) => {
          const Icon = link.icon;
          const active = link.href === '/gestionnaire' ? pathname === '/gestionnaire' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-forest-900 text-white' : 'bg-white text-forest-800 border border-forest-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
