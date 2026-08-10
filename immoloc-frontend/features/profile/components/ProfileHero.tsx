'use client';

import Link from 'next/link';
import { CheckCircle2, Home, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { UserProfile } from '../types';
import { KYC_CONFIG } from '../types';
import { useTerangaClub } from '@/features/teranga-club/hooks/use-teranga-club';

interface Props {
  user: UserProfile;
  onKycClick?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  PROPRIETAIRE: 'Mode propriétaire',
  LOCATAIRE: 'Mode locataire',
  ADMIN: 'Administrateur',
};

const KYC_DOT: Record<string, { dot: string; live?: boolean }> = {
  VERIFIE: { dot: 'bg-success-500' },
  EN_ATTENTE: { dot: 'bg-warning-500', live: true },
  REFUSE: { dot: 'bg-error-500' },
  NON_SOUMIS: { dot: 'bg-forest-400' },
};

const TIER_LABELS: Record<string, { label: string; icon: string }> = {
  BRONZE: { label: 'Clé de Bronze', icon: '🗝️' },
  SILVER: { label: 'Clé d’Argent', icon: '🔑' },
  GOLD: { label: 'Clé d’Or', icon: '👑' },
};

export function ProfileHero({ user, onKycClick }: Props) {
  const kyc = KYC_CONFIG[user.statutKyc];
  const isVerified = user.statutKyc === 'VERIFIE';
  const dot = KYC_DOT[user.statutKyc] ?? { dot: 'bg-forest-400' };
  const { data: teranga } = useTerangaClub();

  const initials =
    `${user.prenom?.charAt(0) ?? ''}${user.nom?.charAt(0) ?? ''}`.toUpperCase() || '?';
  const fullName = [user.prenom, user.nom].filter(Boolean).join(' ') || 'Votre profil';

  const tierInfo = TIER_LABELS[teranga?.tier ?? 'BRONZE'] ?? TIER_LABELS.BRONZE;

  return (
    <section className="section-inverse relative overflow-hidden p-6 sm:p-8">
      {/* Un seul halo, dans le vert de la marque. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">

        <div className="flex min-w-0 items-center gap-5">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-inner border border-border-inverse bg-forest-800 font-display text-2xl font-semibold text-neutral-50">
              {initials}
            </div>
            {isVerified && (
              <span className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-pill border-2 border-surface-inverse bg-gold-400 text-forest-900">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Compte vérifié</span>
              </span>
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-on-inverse-display sm:text-3xl">
                {fullName}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-gold-400/30 bg-gold-400/12 px-2.5 py-0.5 text-xs font-semibold text-gold-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Compte vérifié
                </span>
              )}
            </div>

            {user.email && (
              <p className="truncate text-xs text-on-inverse-muted">{user.email}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3 py-1 text-xs font-semibold text-on-inverse">
                <Home className="h-3.5 w-3.5 text-on-inverse-muted" aria-hidden="true" />
                {ROLE_LABELS[user.activeRole] ?? user.activeRole}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3 py-1 text-xs font-semibold text-on-inverse-muted">
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 rounded-pill', dot.dot, dot.live && 'animate-pulse')}
                />
                {kyc.label}
              </span>

              {/* Badge Teranga Club intégré dans le Header */}
              <Link
                href="/teranga-club"
                className="inline-flex items-center gap-1.5 rounded-pill border border-lime-400/40 bg-lime-400/15 px-3 py-1 text-xs font-bold text-lime-300 hover:bg-lime-400/25 transition-all shadow-2xs"
              >
                <span>{tierInfo.icon}</span>
                <span>{tierInfo.label}</span>
                {teranga && (
                  <span className="text-on-inverse-muted font-normal">• {teranga.soldeCoins.toLocaleString('fr-FR')} Coins</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Action KYC */}
        {kyc.cta && (
          <button
            type="button"
            onClick={onKycClick}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-action px-6 py-3 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {kyc.cta}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}