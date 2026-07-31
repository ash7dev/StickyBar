'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight, ArrowRight, Bell, ChevronDown, Eye, EyeOff,
  LogOut, Settings, TrendingUp, Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { dashboardApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

interface MobileHeaderProps {
  onMenuToggle?: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps = {}) {
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();
  const onboardingDraft = useRoleStore((s) => s.onboardingDraft);

  const [menu, setMenu] = useState<'account' | 'notif' | null>(null);
  const [amountVisible, setAmountVisible] = useState(true);

  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const { data: user } = useCurrentUser();

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'owner-stats'],
    queryFn: () => dashboardApi.getOwnerStats(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  // L'ecouteur restait monte en permanence, meme les deux menus fermes.
  // Et aucun des deux ne se fermait a la touche Echap.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      const inAccount = accountRef.current?.contains(e.target as Node);
      const inNotif = notifRef.current?.contains(e.target as Node);
      if (!inAccount && !inNotif) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  async function handleLogout() {
    setMenu(null);
    clearSession();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  const displayName = user?.prenom || onboardingDraft?.prenom || 'Propriétaire';
  const initials = (displayName[0] || user?.email?.[0] || 'H').toUpperCase();

  const revenue = Number(stats?.bookings?.revenue ?? 0);
  const totalBookings = stats?.bookings?.total ?? 0;
  const balance = Number(stats?.wallet?.balance ?? 0);
  const canWithdraw = balance > 0;

  const menuItem =
    'flex w-full items-center gap-2.5 rounded-inner px-3 py-2.5 text-sm text-foreground ' +
    'transition-colors duration-150 hover:bg-neutral-100 text-left';

  return (
    <header className="rounded-b-card border-b border-white/10 bg-[radial-gradient(80%_60%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-white sm:p-5">

      {/* -- Barre supérieure ------------------------------------------- */}
      <div className="flex items-center justify-between gap-3">
        {/*
          L'avatar apparaissait DEUX fois : une pastille d'initiales a gauche,
          et les memes initiales dans le declencheur du menu a 40px de la.
          Une seule suffit, et c'est celle qui est cliquable.
        */}
        <div className="min-w-0">
          <p className="text-xs text-forest-200">Bonjour</p>
          {/* Etait un <h1> : present sur toutes les pages du tableau de bord,
              il volait le titre principal de chacune. */}
          <p className="truncate text-base font-semibold text-neutral-50">{displayName}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => (m === 'notif' ? null : 'notif'))}
              aria-label="Notifications"
              aria-expanded={menu === 'notif'}
              aria-haspopup="menu"
              className="grid h-9 w-9 place-items-center rounded-pill border border-white/10 bg-white/10 text-white transition-colors duration-150 hover:bg-white/15"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </button>

            {menu === 'notif' && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-border bg-background-card text-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                {/*
                  Ce panneau affiche « Aucune notification · Vous etes a jour »
                  en dur, sans etre relie a quoi que ce soit. Tant que la
                  source n'existe pas, autant le dire plutot que d'affirmer
                  que tout est lu.
                */}
                <p className="px-4 py-8 text-center text-sm text-foreground-muted">
                  Les notifications arrivent bientôt.
                </p>
              </div>
            )}
          </div>

          {/* Compte */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => (m === 'account' ? null : 'account'))}
              aria-label="Menu du compte"
              aria-expanded={menu === 'account'}
              aria-haspopup="menu"
              className="flex h-9 items-center gap-1.5 rounded-pill border border-white/10 bg-white/10 pl-1 pr-2.5 transition-colors duration-150 hover:bg-white/15"
            >
              <span className="grid h-7 w-7 place-items-center rounded-pill bg-lime-400 text-xs font-semibold text-forest-800">
                {initials}
              </span>
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform duration-200', menu === 'account' && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {menu === 'account' && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 space-y-0.5 overflow-hidden rounded-card border border-border bg-background-card p-1.5 text-foreground shadow-lg">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
                    Connecté en tant que
                  </p>
                  <p className="mt-0.5 truncate text-sm font-medium">{user?.email}</p>
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenu(null); switchRole('LOCATAIRE'); }}
                  disabled={isSwitching}
                  className={cn(menuItem, 'disabled:opacity-50')}
                >
                  <ArrowLeftRight className="h-4 w-4 text-forest-600" aria-hidden="true" />
                  Passer en mode locataire
                </button>

                <Link href="/dashboard/parametres" role="menuitem" onClick={() => setMenu(null)} className={menuItem}>
                  <Settings className="h-4 w-4 text-forest-600" aria-hidden="true" />
                  Paramètres
                </Link>

                <div className="my-1 h-px bg-border" />

                <button type="button" role="menuitem" onClick={handleLogout} className={cn(menuItem, 'text-error-600 hover:bg-error-50')}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -- Revenus ----------------------------------------------------- */}
      {/* p-4.5 : l'echelle Tailwind n'a pas de 4.5, la carte n'avait donc
          aucun padding. */}
      <div className="mt-4 rounded-card border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            {/* Premiere touche de lime : le marqueur du chiffre principal. */}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-inner border border-lime-400/20 bg-lime-400/15 text-lime-400">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-forest-200">
              Revenus
            </span>
          </span>

          <button
            type="button"
            onClick={() => setAmountVisible((v) => !v)}
            aria-label={amountVisible ? 'Masquer les montants' : 'Afficher les montants'}
            aria-pressed={!amountVisible}
            className="grid h-8 w-8 place-items-center rounded-pill bg-white/10 text-forest-200 transition-colors duration-150 hover:bg-white/15 hover:text-neutral-50"
          >
            {amountVisible
              ? <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>

        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums tracking-[-0.02em] text-neutral-50">
            {amountVisible ? nf.format(revenue) : '••••••'}
          </span>
          <span className="text-sm text-forest-200">FCFA</span>
        </p>

        {totalBookings > 0 && (
          /* « ce mois-ci » etait accole a stats.bookings.total, qui est un
             cumul. Le libelle est neutralise tant que l'API n'expose pas un
             compteur mensuel. */
          <p className="mt-1 text-xs text-forest-200">
            {totalBookings} réservation{totalBookings > 1 ? 's' : ''} au total
          </p>
        )}

        {/*
          Seconde touche de lime, et la seule action de l'en-tete.
          withdrawableBalance etait calcule puis jete : c'est pourtant le
          chiffre qu'un hote vient chercher en premier.
        */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3.5">
          <span className="min-w-0">
            <span className="block text-[0.6875rem] uppercase tracking-[0.14em] text-forest-200">
              Solde retirable
            </span>
            <span className="mt-0.5 block truncate text-lg font-semibold tabular-nums text-neutral-50">
              {amountVisible ? `${nf.format(balance)} FCFA` : '••••••'}
            </span>
          </span>

          {canWithdraw ? (
            <Link
              href="/dashboard/wallet"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-[rgba(122,158,26,0.35)] bg-lime-400 px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-lime-300"
            >
              Retirer
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link
              href="/dashboard/wallet"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-white/15 px-4 py-2.5 text-sm font-medium text-forest-200 transition-colors duration-150 hover:bg-white/10"
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Wallet
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}