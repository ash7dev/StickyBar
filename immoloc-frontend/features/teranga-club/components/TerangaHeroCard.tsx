'use client';

import { useMemo } from 'react';
import { Coins, TrendingUp, Key, Award, Crown, Sparkles, AlertTriangle } from 'lucide-react';
import type { TerangaAccountData } from '@/lib/nestjs';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
  /** ISO — date d'expiration des coins concernés, si l'API la fournit. */
  expiringAt?: string | null;
}

const TIER_CONFIG: Record<string, { label: string; icon: typeof Key; cashback: number }> = {
  BRONZE: { label: 'Clé de Bronze', icon: Key, cashback: 1.5 },
  SILVER: { label: 'Clé d’Argent', icon: Award, cashback: 2 },
  GOLD: { label: 'Clé d’Or', icon: Crown, cashback: 3 },
};

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const pct = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')} %`;

export function TerangaHeroCard({ data, isAuthenticated, expiringAt }: Props) {
  const tier = data?.tier ?? 'BRONZE';
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.BRONZE;
  const TierIcon = cfg.icon;

  const solde = Number(data?.soldeCoins) || 0;
  const gmv = Number(data?.gmv12Mois) || 0;
  const sejours = Number(data?.nbSejours) || 0;
  const expirants = 0;

  const resteGmv = Number(data?.gmvRemainingForNextTier) || 0;

  const progression = useMemo(() => {
    if (!data?.nextTier || resteGmv <= 0) return null;
    const cible = gmv + resteGmv;
    if (!Number.isFinite(cible) || cible <= 0) return null;
    return Math.min(100, Math.max(0, Math.round((gmv / cible) * 100)));
  }, [data?.nextTier, gmv, resteGmv]);

  const expirationLabel = expiringAt
    ? new Date(expiringAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  /* ── Visiteur non connecté ─────────────────────────────────────────── */

  if (!isAuthenticated || !data) {
    return (
      <section className="section-inverse relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-pill bg-forest-700/40 blur-3xl"
        />

        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-pill border border-gold-400/30 bg-gold-400/12 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Programme de fidélité
          </span>

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-on-inverse-display sm:text-5xl">
            Klef Teranga Club
          </h1>

          <p className="text-base leading-relaxed text-on-inverse-muted sm:text-lg">
            Cumulez des Klef Coins à chaque séjour et déduisez-les de vos prochaines
            réservations. <span className="font-semibold text-on-inverse">1 coin = 1 FCFA.</span>
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            {Object.entries(TIER_CONFIG).map(([code, t]) => {
              const Icon = t.icon;
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-2 rounded-pill border border-border-inverse bg-white/5 px-3.5 py-2 text-xs font-semibold text-on-inverse"
                >
                  <Icon className="h-4 w-4 text-on-inverse-muted" aria-hidden="true" />
                  {t.label}
                  <span className="tabular-nums text-gold-300">{pct(t.cashback)}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  /* ── Membre connecté ───────────────────────────────────────────────── */

  return (
    <section className="section-inverse relative overflow-hidden p-6 sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">

        {/* ── Solde ──────────────────────────────────────────────────── */}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold-400/30 bg-gold-400/12 px-3 py-1.5 text-xs font-semibold text-gold-300">
              <TierIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {cfg.label}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse bg-white/5 px-3 py-1.5 text-xs font-semibold text-on-inverse">
              <Sparkles className="h-3.5 w-3.5 text-on-inverse-muted" aria-hidden="true" />
              <span className="tabular-nums">{pct(cfg.cashback)}</span> de cashback
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
              Votre solde
            </p>
            <p className="mt-1 flex items-baseline gap-2.5">
              <span className="font-display text-5xl font-semibold leading-none tracking-tight tabular-nums text-gold-300 sm:text-6xl">
                {nombre(solde)}
              </span>
              <span className="text-base font-semibold text-on-inverse-muted">Klef Coins</span>
            </p>
            <p className="mt-1.5 text-sm tabular-nums text-on-inverse-muted">
              Soit <span className="font-semibold text-on-inverse">{nombre(solde)} FCFA</span> de
              réduction disponible
            </p>
          </div>

          {expirants > 0 && (
            <div className="flex items-start gap-2.5 rounded-inner border border-warning-500/25 bg-warning-500/12 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-500" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-warning-50">
                <span className="font-semibold tabular-nums">{nombre(expirants)} coins</span>{' '}
                {expirationLabel ? `expirent le ${expirationLabel}.` : 'expirent prochainement.'}{' '}
                Utilisez-les sur votre prochaine réservation.
              </p>
            </div>
          )}
        </div>

        {/* ── Activité ───────────────────────────────────────────────── */}

        <div className="space-y-4 rounded-card border border-border-inverse bg-white/5 p-5">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                <Coins className="h-3.5 w-3.5" aria-hidden="true" /> Séjours
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-on-inverse">
                {sejours}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Sur 12 mois
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold tabular-nums text-on-inverse">
                {nombre(gmv)}
                <span className="ml-1 text-xs font-normal text-on-inverse-muted">FCFA</span>
              </dd>
            </div>
          </dl>

          {progression !== null && (
            <div className="space-y-2 border-t border-border-inverse pt-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-on-inverse">Palier suivant</span>
                <span className="font-semibold tabular-nums text-gold-300">{progression} %</span>
              </div>

              <div
                role="img"
                aria-label={`Progression vers le palier suivant : ${progression} pour cent`}
                className="h-2.5 w-full overflow-hidden rounded-pill bg-white/10"
              >
                <div
                  className="h-full rounded-pill bg-gold-400 transition-[width] duration-700"
                  style={{ width: `${progression}%` }}
                />
              </div>

              {resteGmv > 0 && (
                <p className="text-xs text-on-inverse-muted">
                  Encore{' '}
                  <span className="font-semibold tabular-nums text-on-inverse">
                    {nombre(resteGmv)} FCFA
                  </span>{' '}
                  pour atteindre le palier suivant
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
