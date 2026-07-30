'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Plus, LogOut, ChevronDown, Settings, ArrowLeftRight, Menu, Search
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils/cn';

const PAGE_TITLES: Array<[string, string]> = [
  ['/dashboard/annonces/nouvelle', 'Nouvelle annonce'],
  ['/dashboard/reservations', 'Réservations'],
  ['/dashboard/favoris', 'Favoris'],
  ['/dashboard/wallet', 'Wallet'],
  ['/dashboard/profil', 'Mon profil'],
  ['/dashboard/parametres', 'Paramètres'],
  ['/dashboard/annonces', 'Mes annonces'],
  ['/dashboard', "Vue d'ensemble"],
];

interface DesktopHeaderProps {
  onMenuToggle: () => void;
}

export function DesktopHeader({ onMenuToggle }: DesktopHeaderProps) {
  const pathname = usePathname();
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();
  const { data: user } = useCurrentUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

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
  const prenom = user?.prenom;
  const nom = user?.nom;
  const initials = prenom ? prenom[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? '?');

  const fullName = prenom && nom ? `${prenom} ${nom}` : (prenom || title);
  const greeting = prenom ? `Bonjour, ${fullName}` : title;

  return (
    <header className="sticky top-0 z-40 bg-background-card/95 backdrop-blur-md border-b border-border/80 text-forest-950 shadow-2xs">
      <div className="px-5 sm:px-8 py-4.5">
        <div className="flex items-center justify-between gap-4">

          {/* Gauche : Bouton Hamburger Mobile + Titre */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={onMenuToggle}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2.5 rounded-inner bg-background-alt border border-border/80 text-forest-950 hover:bg-background-card transition-all"
            >
              <Menu className="h-5 w-5 text-forest-950" />
            </button>

            <div>
              {/* Titre principal */}
              <h1 className="font-display text-lg sm:text-xl font-extrabold text-forest-950 tracking-tight leading-none">
                {greeting}
              </h1>
            </div>
          </div>

          {/* Centre : Barre de Recherche Rapide (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Rechercher une réservation, un bien..."
                className="w-full h-10 pl-10 pr-9 bg-background-alt border border-border/80 rounded-pill text-xs font-semibold text-forest-950 placeholder:text-foreground-faint focus:outline-none focus:border-forest-600/50 transition-all shadow-2xs"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-background-card border border-border/80 text-[9px] font-extrabold text-foreground-muted">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Droite : Notifications + Créer annonce + Avatar Dropdown */}
          <div className="flex items-center gap-3">

            {/* Notification Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex items-center justify-center w-10 h-10 rounded-inner bg-background-alt border border-border/80 hover:bg-background-card text-forest-950 transition-all shadow-2xs"
              >
                <Bell className="h-4.5 w-4.5 text-forest-950" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-80 rounded-card border border-border/80 bg-background-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3.5 border-b border-border flex justify-between items-center bg-background-alt">
                    <p className="font-display text-xs font-bold text-forest-950">Notifications</p>
                    <button className="text-[10px] font-extrabold text-lime-600 hover:text-lime-700 transition-colors">
                      Tout marquer lu
                    </button>
                  </div>

                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center mx-auto shadow-2xs">
                      <Bell className="h-5 w-5 text-lime-400" />
                    </div>
                    <p className="font-display text-sm font-bold text-forest-950">Aucune notification non lue</p>
                    <p className="text-xs text-foreground-muted">Toutes vos alertes apparaîtront ici.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Créer une annonce */}
            <Link
              href="/dashboard/annonces/nouvelle"
              className="inline-flex items-center gap-2 h-10 px-4.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 text-forest-950" />
              <span className="hidden sm:inline">Créer une annonce</span>
              <span className="sm:hidden">Créer</span>
            </Link>

            {/* Avatar avec dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center h-10 gap-2.5 pl-1.5 pr-3 rounded-pill bg-background-alt hover:bg-background-card border border-border/80 transition-all shadow-2xs"
              >
                <div className="w-7.5 h-7.5 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center font-display font-extrabold text-xs shadow-2xs">
                  {initials}
                </div>
                <ChevronDown className={cn('h-3.5 w-3.5 text-foreground-muted transition-transform', dropdownOpen && 'rotate-180')} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2.5 w-64 rounded-card border border-border/80 bg-background-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3.5 border-b border-border bg-background-alt">
                    <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider mb-0.5">Connecté en tant que</p>
                    <p className="text-xs font-bold text-forest-950 truncate">{user?.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => { setDropdownOpen(false); switchRole('LOCATAIRE'); }}
                      disabled={isSwitching}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-forest-950 hover:bg-background-alt rounded-inner transition-colors disabled:opacity-50"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-lime-600" />
                      <span>Mode Locataire</span>
                    </button>

                    <Link
                      href="/dashboard/parametres"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-forest-950 hover:bg-background-alt rounded-inner transition-colors"
                    >
                      <Settings className="h-4 w-4 text-foreground-muted" />
                      <span>Paramètres</span>
                    </Link>

                    <div className="h-px bg-border/60 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-error-700 hover:bg-error-50 rounded-inner transition-all"
                    >
                      <LogOut className="h-4 w-4 text-error-600" />
                      <span>Déconnexion</span>
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
