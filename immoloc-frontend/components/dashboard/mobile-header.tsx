'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight, ArrowRight, BarChart3, Bell, ChevronDown, ChevronRight, Eye, EyeOff,
  Hourglass, LogOut, Settings,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { cn } from '@/lib/utils/cn';
import { useCurrentUser } from '@/hooks/use-current-user';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { useOwnerOverview } from '@/features/owner-home/hooks/use-owner-overview';
import { usePendingDecisions } from '@/features/calendar/hooks/use-pending-decisions';
import { formatExpiry } from '@/features/calendar/lib/agenda';
import { formatLong, todayDay } from '@/features/calendar/lib/days';

const HIDDEN = '••••••';

/** « MAGATH » ou « magath » → « Magath » ; un prénom déjà bien écrit n'est pas modifié. */
function displayFirstName(name: string): string {
  const trimmed = name.trim();
  if (trimmed !== trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (c) => c.toUpperCase());
}

/**
 * En-tête de l'accueil hôte sur mobile : salutation, solde disponible (chiffre
 * principal, masquable), revenus du mois et séquestre, demandes à décider.
 * Mêmes données que les tuiles de la page (GET /dashboard/owner/overview).
 */
export function MobileHeader() {
  const clearSession = useRoleStore((s) => s.clearSession);
  const onboardingDraft = useRoleStore((s) => s.onboardingDraft);
  const { switchRole, isSwitching } = useSwitchRole();
  const { data: user } = useCurrentUser();
  const { data: overview } = useOwnerOverview();
  const { data: decisions = [] } = usePendingDecisions();

  const [menu, setMenu] = useState<'account' | 'notif' | null>(null);
  const [amountVisible, setAmountVisible] = useState(true);
  const accountRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      const inside = accountRef.current?.contains(e.target as Node) || notifRef.current?.contains(e.target as Node);
      if (!inside) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
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
    await createClient().auth.signOut();
    window.location.href = '/';
  }

  const firstName = displayFirstName(user?.prenom || onboardingDraft?.prenom || '');
  const initials = `${firstName[0] ?? user?.email?.[0] ?? '?'}${user?.nom?.[0] ?? ''}`.toUpperCase();

  const available = overview?.wallet.available ?? 0;
  const escrow = overview?.wallet.upcomingTotal ?? 0;
  const monthRevenue = overview?.revenue.currentMonth ?? 0;
  const change = overview?.revenue.changePct ?? null;
  const show = (amount: number) => (amountVisible ? formatFCFA(amount) : HIDDEN);
  const urgent = decisions[0];

  const menuItem =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:bg-background-alt';

  return (
    <header className="rounded-b-[32px] bg-[radial-gradient(90%_70%_at_20%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_65%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] text-neutral-50">
      {/* ── Salutation + actions ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => (m === 'account' ? null : 'account'))}
            aria-label="Menu du compte"
            aria-expanded={menu === 'account'}
            aria-haspopup="menu"
            className="relative grid h-11 w-11 place-items-center rounded-pill bg-lime-400 text-sm font-bold text-forest-950 ring-2 ring-white/15"
          >
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-pill bg-forest-950 ring-1 ring-white/20">
              <ChevronDown className={cn('h-3 w-3 text-neutral-50 transition-transform', menu === 'account' && 'rotate-180')} aria-hidden="true" />
            </span>
          </button>

          {menu === 'account' && (
            <div role="menu" className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-[20px] border border-border bg-background-card p-1.5 text-foreground shadow-xl">
              <p className="truncate border-b border-border px-3 pb-2.5 pt-1.5 text-xs text-foreground-muted">{user?.email}</p>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setMenu(null); switchRole('LOCATAIRE'); }}
                disabled={isSwitching}
                className={cn(menuItem, 'mt-1 disabled:opacity-50')}
              >
                <ArrowLeftRight className="h-4 w-4 text-forest-600" aria-hidden="true" />
                Passer en mode voyageur
              </button>
              <Link href="/dashboard/parametres" role="menuitem" onClick={() => setMenu(null)} className={menuItem}>
                <Settings className="h-4 w-4 text-forest-600" aria-hidden="true" />
                Paramètres
              </Link>
              <div className="my-1 h-px bg-border" />
              <button type="button" role="menuitem" onClick={handleLogout} className={cn(menuItem, 'text-error-600 hover:bg-error-50')}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold leading-tight">
            Bonjour{firstName ? ` ${firstName}` : ''}
          </p>
          <p className="truncate text-xs capitalize text-forest-200">{formatLong(todayDay())}</p>
        </div>

        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setMenu((m) => (m === 'notif' ? null : 'notif'))}
            aria-label={decisions.length > 0 ? `Notifications, ${decisions.length} demande(s) à décider` : 'Notifications'}
            aria-expanded={menu === 'notif'}
            aria-haspopup="menu"
            className="relative grid h-11 w-11 place-items-center rounded-pill border border-white/10 bg-white/10 transition-colors hover:bg-white/15"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            {decisions.length > 0 && (
              <span aria-hidden="true" className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-pill bg-gold-400 ring-2 ring-forest-900" />
            )}
          </button>
          {menu === 'notif' && (
            <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[20px] border border-border bg-background-card text-foreground shadow-xl">
              <p className="border-b border-border px-4 py-3 text-sm font-semibold">Notifications</p>
              {decisions.length > 0 ? (
                <Link href="/dashboard/reservations?statut=PAID" role="menuitem" onClick={() => setMenu(null)} className="flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-background-alt">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-gold-100 font-bold text-gold-800">{decisions.length}</span>
                  {decisions.length > 1 ? 'demandes attendent' : 'demande attend'} votre réponse
                </Link>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-foreground-muted">Vous êtes à jour.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Carte solde ──────────────────────────────────────────────────── */}
      <section aria-labelledby="mobile-balance" className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.06] p-[18px] backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 id="mobile-balance" className="text-xs font-semibold text-forest-200">
            Solde disponible
          </h2>
          <button
            type="button"
            onClick={() => setAmountVisible((v) => !v)}
            aria-label={amountVisible ? 'Masquer les montants' : 'Afficher les montants'}
            aria-pressed={!amountVisible}
            className="grid h-8 w-8 place-items-center rounded-pill bg-white/10 text-forest-200 transition-colors hover:bg-white/15 hover:text-neutral-50"
          >
            {amountVisible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>

        <p className="mt-1 whitespace-nowrap font-display text-[clamp(1.9rem,9vw,2.5rem)] font-semibold leading-tight tracking-tight">
          {show(available)}
        </p>

        <dl className="mt-3.5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/[0.06] px-3.5 py-3">
            <dt className="flex items-center justify-between gap-2 text-[11px] text-forest-200">
              Ce mois-ci
              {change !== null && amountVisible && (
                <span className={cn('rounded-pill px-1.5 py-px text-[10px] font-bold', change >= 0 ? 'bg-lime-400/20 text-lime-300' : 'bg-error-500/25 text-error-50')}>
                  {change >= 0 ? '+' : ''}{change} %
                </span>
              )}
            </dt>
            <dd className="mt-1 whitespace-nowrap text-[15px] font-bold">{show(monthRevenue)}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.06] px-3.5 py-3">
            <dt className="text-[11px] text-forest-200">En séquestre</dt>
            <dd className="mt-1 whitespace-nowrap text-[15px] font-bold">{show(escrow)}</dd>
          </div>
        </dl>

        <div className="mt-3.5 flex gap-2.5">
          <Link
            href="/dashboard/wallet"
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-pill bg-lime-400 text-sm font-bold text-forest-950 transition-opacity hover:opacity-90"
          >
            Retirer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard/stats"
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-pill border border-white/20 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Revenus
          </Link>
        </div>
      </section>

      {/* ── Demandes à décider ───────────────────────────────────────────── */}
      {urgent && (
        <Link
          href="/dashboard/reservations?statut=PAID"
          className="mt-3 flex items-center gap-3 rounded-[20px] bg-gold-400 px-4 py-3 text-gold-800"
        >
          <Hourglass className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-[13px] leading-snug">
            <strong>
              {decisions.length} demande{decisions.length > 1 ? 's' : ''} à décider
            </strong>
            <span className="block truncate">
              {urgent.locataire?.prenom ?? 'Voyageur'} · {formatExpiry(urgent.delaiConfirmation)}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </header>
  );
}
