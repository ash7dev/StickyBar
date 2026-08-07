'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock, ArrowLeftRight, Building2, LogIn,
  UserPlus, Loader2, ShieldCheck, ChevronRight,
  Sparkles, KeyRound, ArrowRight,
} from 'lucide-react';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { cn } from '@/lib/utils/cn';

interface TenantReservationsGuardProps {
  children: React.ReactNode;
}

export function TenantReservationsGuard({ children }: TenantReservationsGuardProps) {
  const router = useRouter();
  const { nestToken, activeRole, hasHydrated } = useRoleStore();
  const { syncFromSupabaseSession } = useNestToken();
  const { switchRole, isSwitching } = useSwitchRole();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    void (async () => {
      if (!nestToken) {
        await syncFromSupabaseSession();
      }
      if (!cancelled) {
        setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, nestToken, syncFromSupabaseSession]);

  // ── 1. Évaluation immédiate sans skeleton d'attente ───────────────────────
  if (!hasHydrated) return null;

  // ── 2. Cas : Non connecté / Token manquant / Session expirée ──────────────
  if (!nestToken) {
    const loginUrl = `/login?next=${encodeURIComponent('/reservations')}`;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="relative rounded-[28px] border border-forest-800/80 bg-forest-950 p-8 sm:p-12 shadow-2xl text-center overflow-hidden">
          {/* Halos de lumière en fond */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-marker-bg blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-forest-600/20 blur-3xl" />

          <div className="relative space-y-6">
            {/* Badge haut */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-forest-900/90 border border-forest-700/60 text-on-inverse-marker text-xs font-bold tracking-wide shadow-xs backdrop-blur-md">
              <KeyRound className="w-3.5 h-3.5 text-on-inverse-marker" />
              <span>Accès Réservé</span>
            </div>

            {/* Icône principale avec halo */}
            <div className="relative w-13 h-13 mx-auto">
              <div className="absolute inset-0 rounded-inner bg-marker-bg blur-lg animate-pulse" />
              <div className="relative w-full h-full rounded-inner bg-gradient-to-br from-forest-800 to-forest-900 border border-forest-700/80 flex items-center justify-center text-on-inverse-marker shadow-md ring-1 ring-ring/20">
                <Lock className="w-5.5 h-5.5" strokeWidth={2} />
              </div>
            </div>

            {/* Titre & Description */}
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Connectez-vous pour voir vos réservations
              </h2>
              <p className="text-sm text-forest-200/80 leading-relaxed font-sans">
                Accédez à l'historique complet de vos séjours, vos contrats de réservation et vos reçus sécurisés par le séquestre Klef.
              </p>
            </div>

            {/* Actions Horizontales */}
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 pt-3">
              <Link
                href={loginUrl}
                className="group shrink-0 inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-pill bg-action hover:bg-action-hover text-on-action font-extrabold text-sm shadow-xl shadow-action hover:shadow-action-hover transition-all duration-200 active:scale-95 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="whitespace-nowrap">Se connecter</span>
              </Link>

              <Link
                href="/register"
                className="group shrink-0 inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-pill border border-forest-800 bg-forest-900/60 hover:bg-forest-800/80 text-white font-bold text-sm backdrop-blur-md transition-all active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 text-forest-300" />
                <span className="whitespace-nowrap">Créer un compte</span>
                <ChevronRight className="w-4 h-4 text-forest-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Rassurance */}
            <div className="pt-4 border-t border-forest-900/80 text-xs text-forest-300/80 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-on-inverse-marker shrink-0" />
              <span>Garantie Séquestre Klef · Réservation 100% sécurisée</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Cas : Connecté en Mode Propriétaire (activeRole === 'PROPRIETAIRE') ─
  if (activeRole === 'PROPRIETAIRE') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="relative rounded-[28px] border border-forest-800/90 bg-gradient-to-b from-forest-950 via-[#072A20] to-forest-950 p-8 sm:p-12 shadow-2xl text-center overflow-hidden">
          {/* Halos de lumière décoratifs */}
          <div className="pointer-events-none absolute -top-28 -left-28 w-72 h-72 rounded-full bg-marker-bg blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-28 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl" />

          <div className="relative space-y-6">
            {/* Badge haut */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-pill bg-forest-900/90 border border-gold-400/30 text-gold-300 text-xs font-bold tracking-wide shadow-xs backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5 text-gold-400" />
              <span>Mode Propriétaire Actif</span>
            </div>

            {/* Icône principale avec double anneau lumineux */}
            <div className="relative w-13 h-13 mx-auto">
              <div className="absolute inset-0 rounded-inner bg-marker-bg blur-lg animate-pulse" />
              <div className="relative w-full h-full rounded-inner bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 border border-forest-700/80 flex items-center justify-center text-on-inverse-marker shadow-md ring-1 ring-ring/30">
                <ArrowLeftRight className="w-5.5 h-5.5" strokeWidth={2} />
              </div>
            </div>

            {/* Titre & Description */}
            <div className="space-y-3 max-w-lg mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Vous êtes en Mode Propriétaire
              </h2>
              <p className="text-sm text-forest-200/85 leading-relaxed font-sans">
                Pour consulter vos voyages et vos séjours personnels en tant que locataire, basculez en un clic vers le <strong className="text-on-inverse-marker font-semibold">Mode Locataire</strong>.
              </p>
            </div>

            {/* Actions Horizontales */}
            <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-3.5 pt-3">
              <button
                type="button"
                onClick={() => switchRole('LOCATAIRE', { redirectTo: null })}
                disabled={isSwitching}
                className="group shrink-0 inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-pill bg-action hover:bg-action-hover text-on-action font-extrabold text-sm shadow-xl shadow-action hover:shadow-action-hover transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 whitespace-nowrap"
              >
                {isSwitching ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> <span className="whitespace-nowrap">Changement en cours…</span></>
                ) : (
                  <>
                    <ArrowLeftRight className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
                    <span className="whitespace-nowrap">Passer en Mode Locataire</span>
                  </>
                )}
              </button>

              <Link
                href="/dashboard/reservations"
                className="group shrink-0 inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-pill border border-forest-800 bg-forest-900/60 hover:bg-forest-800/80 text-white font-bold text-sm backdrop-blur-md transition-all active:scale-95 whitespace-nowrap"
              >
                <Building2 className="w-4 h-4 text-gold-400" />
                <span className="whitespace-nowrap">Réservations Hôte</span>
                <ArrowRight className="w-3.5 h-3.5 text-forest-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Note explicative */}
            <div className="pt-4 border-t border-forest-900/80 text-xs text-forest-300/70 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>Vos annonces et votre tableau de bord hôte restent intacts à tout moment.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Session valide en Mode Locataire ───────────────────────────────────
  return <>{children}</>;
}