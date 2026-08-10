'use client';

import Link from 'next/link';
import { Sparkles, Coins, Building2 } from 'lucide-react';
import type { TerangaAccountData } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TIER_CONFIG: Record<string, { label: string; badgeClass: string; icon: string }> = {
  BRONZE: { label: 'Clé de Bronze', badgeClass: 'bg-forest-900/80 text-forest-200 border-forest-700/60', icon: '🗝️' },
  SILVER: { label: 'Clé d’Argent', badgeClass: 'bg-forest-800/80 text-neutral-100 border-forest-600/60', icon: '🔑' },
  GOLD: { label: 'Clé d’Or Teranga', badgeClass: 'bg-gold-500/30 text-gold-200 border-gold-400/50', icon: '👑' },
};

export function TerangaClubHeader({ data, isAuthenticated, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="card p-6 sm:p-8 animate-pulse space-y-4">
        <div className="h-6 bg-background-alt rounded-pill w-1/3" />
        <div className="h-10 bg-background-alt rounded-card w-1/2" />
        <div className="h-4 bg-background-alt rounded-pill w-full" />
      </div>
    );
  }

  // 1. Mode Déconnecté : Hero section avec globals.css section-inverse & CTA Réserver
  if (!isAuthenticated || !data) {
    return (
      <section className="section-inverse relative overflow-hidden p-6 sm:p-10 shadow-xl transition-all duration-300">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 border border-white/20 text-xs font-semibold text-on-inverse-marker">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Programme Privilège Klef Teranga Club</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-on-inverse-display tracking-tight leading-tight">
              Cumulez des Klef Coins à chaque location <br className="hidden sm:inline" />
              <span className="text-on-inverse-marker font-semibold">1 Klef Coin = 1 FCFA de réduction !</span>
            </h1>

            <p className="text-sm text-on-inverse-muted leading-relaxed">
              Rejoignez le club d’exception : gagnez entre 1.5% et 3% de cashback sur vos séjours et déduisez vos Klef Coins directement lors de vos prochaines réservations.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/logements"
              className="btn-action shadow-action hover:shadow-action-hover w-full md:w-auto justify-center"
            >
              <Building2 className="w-4 h-4" />
              <span>Réserver un logement</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 2. Mode Connecté : Dashboard Teranga Personnalisé avec section-inverse & CTA Réserver
  const tierCfg = TIER_CONFIG[data.tier] ?? TIER_CONFIG.BRONZE;
  const progressPct = data.nextTier && data.gmvRemainingForNextTier > 0
    ? Math.min(100, Math.round(((data.gmv12Mois) / (data.gmv12Mois + data.gmvRemainingForNextTier)) * 100))
    : 100;

  return (
    <section className="section-inverse relative overflow-hidden p-6 sm:p-8 shadow-xl transition-all duration-300">
      <div className="relative z-10 space-y-6">
        {/* Ligne 1 : Statut + Solde Coins + CTA Réserver */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={cn('px-3 py-1 rounded-pill border text-xs font-semibold flex items-center gap-1.5', tierCfg.badgeClass)}>
                <span>{tierCfg.icon}</span>
                <span>{tierCfg.label}</span>
              </span>
              <span className="text-xs text-on-inverse-muted">
                {data.nbSejours} séjour{data.nbSejours > 1 ? 's' : ''} effectué{data.nbSejours > 1 ? 's' : ''}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-on-inverse-display">
              Vos Avantages Teranga
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            {/* Carte Solde Coins */}
            <div className="rounded-card bg-forest-950/80 border border-border-inverse p-4 flex items-center gap-4">
              <div className="marker-box shrink-0 bg-lime-400/20 text-lime-300 border border-lime-400/30">
                <Coins className="w-5 h-5 text-on-inverse-marker" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-on-inverse-muted">
                  Solde Klef Coins
                </p>
                <p className="font-display text-2xl font-bold text-on-inverse-marker tabular-nums">
                  {data.soldeCoins.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-on-inverse">Coins</span>
                </p>
                <p className="text-[10px] text-on-inverse-muted font-medium">
                  = {data.soldeCoins.toLocaleString('fr-FR')} FCFA de réduction
                </p>
              </div>
            </div>

            {/* CTA Réserver */}
            <Link
              href="/logements"
              className="btn-action shadow-action hover:shadow-action-hover justify-center shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>Réserver un logement</span>
            </Link>
          </div>
        </div>

        {/* Ligne 2 : Jauge de progression */}
        {data.nextTier && (
          <div className="space-y-2 pt-2 border-t border-border-inverse">
            <div className="flex items-center justify-between text-xs text-on-inverse-muted">
              <span>Niveau actuel : <strong className="text-on-inverse font-semibold">{tierCfg.label}</strong></span>
              <span>
                Encore <strong className="text-on-inverse-marker font-semibold tabular-nums">{data.gmvRemainingForNextTier.toLocaleString('fr-FR')} FCFA</strong> de réservations pour passer {data.nextTier}
              </span>
            </div>
            <div className="w-full h-3 rounded-pill bg-forest-950 border border-border-inverse overflow-hidden p-0.5">
              <div
                className="h-full rounded-pill bg-action shadow-action transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
