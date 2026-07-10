'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Plus, LogOut, ChevronDown, Settings, ArrowLeftRight
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { cn } from '@/lib/utils/cn';

const PAGE_TITLES: Array<[string, string]> = [
  ['/dashboard/annonces/nouvelle', 'Nouvelle annonce'],
  ['/dashboard/reservations', 'Réservations'],
  ['/dashboard/favoris', 'Favoris'],
  ['/dashboard/wallet', 'Wallet'],
  ['/dashboard/profil', 'Mon profil'],
  ['/dashboard/parametres', 'Paramètres'],
  ['/dashboard/annonces', 'Mes annonces'],
  ['/dashboard', "Dashboard"],
];

interface DesktopHeaderProps {
  onMenuToggle: () => void;
}

export function DesktopHeader({ onMenuToggle }: DesktopHeaderProps) {
  const pathname = usePathname();
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    clearSession();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const title = PAGE_TITLES.find(([key]) => pathname === key || pathname.startsWith(key + '/'))?.[1] ?? 'Dashboard';
  const prenom = user?.user_metadata?.prenom;
  const nom = user?.user_metadata?.nom;
  const initials = prenom ? prenom[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? '?');

  // Format: "Bonjour, Prénom Nom" ou "Dashboard" si pas de données
  const fullName = prenom && nom ? `${prenom} ${nom}` : (prenom || title);
  const greeting = prenom ? `Bonjour, ${fullName}` : title;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border rounded-b-3xl shadow-sm">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">

          {/* ── Gauche : Bonjour, Prénom Nom ───────────────── */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {greeting}
            </h1>
          </div>

          {/* ── Droite : Notifications + Créer annonce + Avatar ──── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Notification */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background-alt hover:bg-neutral-200 text-foreground transition-all"
              >
                <Bell className="h-5 w-5" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-border bg-background-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                    <p className="text-sm font-bold text-foreground">Notifications</p>
                    <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                      Tout marquer lu
                    </button>
                  </div>

                  <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center mx-auto mb-3">
                      <Bell className="h-5 w-5 text-foreground-muted" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">Aucune notification</p>
                    <p className="text-xs text-foreground-muted">Vous êtes à jour !</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Créer une annonce */}
            <Link
              href="/dashboard/annonces/nouvelle"
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Créer une annonce</span>
            </Link>

            {/* Avatar avec dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center h-10 gap-2 pl-1 pr-3 rounded-full bg-background-alt hover:bg-neutral-200 border border-border transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {initials}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-foreground-muted transition-transform', dropdownOpen && 'rotate-180')} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-background-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-semibold text-foreground-muted mb-1">Connecté en tant que</p>
                    <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { setDropdownOpen(false); switchRole('LOCATAIRE'); }}
                      disabled={isSwitching}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-background-alt rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Mode Locataire
                    </button>

                    <Link
                      href="/dashboard/parametres"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-background-alt rounded-lg transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </Link>

                    <div className="h-px bg-border my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 rounded-lg transition-all"
                    >
                      <LogOut className="h-4 w-4" />
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
