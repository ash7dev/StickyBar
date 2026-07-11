'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  Eye,
  EyeOff,
  Wallet,
  LogOut,
  Settings,
  ArrowLeftRight,
  ArrowRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { dashboardApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();
  const onboardingDraft = useRoleStore((s) => s.onboardingDraft);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [amountVisible, setAmountVisible] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // ── User (optimisé avec React Query + cache partagé) ───────────────────
  const { data: user } = useCurrentUser();

  // ── Stats (React Query : cache + pas de refetch inutile) ────────────────
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'owner-stats'],
    queryFn: () => dashboardApi.getOwnerStats(),
  });

  // ── Click outside ───────────────────────────────────────────────────────
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

  // ── Logout ──────────────────────────────────────────────────────────────
  async function handleLogout() {
    setDropdownOpen(false);
    clearSession();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  // ── Données ─────────────────────────────────────────────────────────────
  const displayName = user?.prenom || onboardingDraft?.prenom || 'Utilisateur';
  const initials = displayName[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  const formatFCFA = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k';
    return n.toLocaleString('fr-FR');
  };

  // Uniquement des données réelles renvoyées par l'API — aucun KPI estimé.
  const revenueMonth = Number(stats?.bookings?.revenue ?? 0);
  const totalBookings = stats?.bookings?.total ?? 0;
  const withdrawableBalance = Number(stats?.wallet?.balance ?? 0);

  return (
    <header className="rounded-b-3xl bg-emerald-800 pb-6">

      {/* ── Barre : salutation + notifications + avatar ─────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="font-sans text-base font-semibold text-white">
          Bonjour, {displayName}
        </h1>

        <div className="flex items-center gap-2">

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/15"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-background-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <button className="text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700">
                    Tout marquer lu
                  </button>
                </div>
                <div className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background-alt">
                    <Bell className="h-5 w-5 text-foreground-muted" />
                  </div>
                  <p className="mb-1 text-sm font-semibold text-foreground">Aucune notification</p>
                  <p className="text-xs text-foreground-muted">Vous êtes à jour !</p>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Menu du compte"
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 pl-1 pr-2.5 transition-colors hover:bg-white/15"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-emerald-700">
                {initials}
              </span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-white transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-background-card shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="mb-1 text-xs font-medium text-foreground-muted">Connecté en tant que</p>
                  <p className="truncate text-sm font-semibold text-foreground">{user?.email}</p>
                </div>

                <div className="space-y-1 p-2">
                  <button
                    onClick={() => { setDropdownOpen(false); switchRole('LOCATAIRE'); }}
                    disabled={isSwitching}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Mode Locataire
                  </button>

                  <Link
                    href="/dashboard/parametres"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background-alt"
                  >
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>

                  <div className="my-1 h-px bg-border" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
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

      {/* ── Carte revenus — le montant est le héros ─────────────────────── */}
      <div className="px-4 pt-1">
        {isLoading ? (
          <div className="animate-pulse rounded-2xl bg-emerald-900/60 p-5">
            <div className="mb-3 h-3.5 w-28 rounded bg-white/10" />
            <div className="mb-2 h-9 w-44 rounded bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-900/60 p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-200">
                Revenus du mois
              </p>
              <button
                onClick={() => setAmountVisible((v) => !v)}
                aria-label={amountVisible ? 'Masquer le montant' : 'Afficher le montant'}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
              >
                {amountVisible
                  ? <Eye className="h-4 w-4 text-emerald-200" />
                  : <EyeOff className="h-4 w-4 text-emerald-200" />}
              </button>
            </div>

            <p className="text-[32px] font-semibold leading-none text-white tabular-nums" data-price>
              {amountVisible ? revenueMonth.toLocaleString('fr-FR') : '••••••'}
              <span className="ml-1.5 text-[14px] font-medium text-emerald-200">FCFA</span>
            </p>

            {totalBookings > 0 && (
              <p className="mt-2.5 text-[13px] text-emerald-100/80">
                {totalBookings} réservation{totalBookings > 1 ? 's' : ''} ce mois-ci
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Retrait — visible uniquement si solde disponible ────────────── */}
      {!isLoading && withdrawableBalance > 0 && (
        <div className="px-4 pt-3">
          <Link
            href="/dashboard/wallet"
            className="flex w-full items-center justify-between rounded-xl bg-success-500 hover:bg-success-600 px-5 py-3.5 transition-all active:scale-[0.98] shadow-lg"
          >
            <span className="flex items-center gap-2.5 text-sm font-bold text-white">
              <Wallet className="h-4 w-4" />
              Faire un retrait
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-white tabular-nums">
              {formatFCFA(withdrawableBalance)} FCFA
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}
