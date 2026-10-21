'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lightbulb, Star } from 'lucide-react';
import type { OwnerOverviewResponse } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { formatShort } from '@/features/calendar/lib/days';
import { monthLong, percent } from '../lib/format';
import { Tile, TileTitle } from './Tile';

// ── Solde & versements ──────────────────────────────────────────────────────

export function WalletTile({ wallet }: { wallet: OwnerOverviewResponse['wallet'] }) {
  return (
    <Tile tone="lime" labelledBy="home-wallet">
      <TileTitle id="home-wallet" className="font-bold opacity-100">Solde disponible</TileTitle>
      <p className="-mt-2 whitespace-nowrap font-display text-[clamp(1.25rem,10cqi,2.25rem)] font-bold leading-tight">
        {formatFCFA(wallet.available)}
      </p>

      {wallet.upcomingPayouts.length === 0 && (
        <p className="text-[13px] opacity-80">Aucun versement en attente : il en arrive un à chaque check-in confirmé.</p>
      )}

      {wallet.upcomingPayouts.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-forest-950/[0.07] px-4 py-3">
          <p className="flex justify-between text-[11px] font-bold tracking-wide">
            <span>VERSEMENTS À VENIR</span>
            <span>{formatFCFA(wallet.upcomingTotal)}</span>
          </p>
          <ul className="space-y-1.5">
            {wallet.upcomingPayouts.slice(0, 3).map((p) => (
              <li key={p.reservationId} className="flex justify-between gap-3 text-[13px]">
                <span className="truncate">
                  {formatShort(p.date)} · {p.locatairePrenom}
                </span>
                <strong className="shrink-0">{formatFCFA(p.amount)}</strong>
              </li>
            ))}
          </ul>
          <p className="text-[11px] opacity-80">Libérés au check-in de chaque voyageur.</p>
        </div>
      )}

      <Link
        href="/dashboard/wallet"
        className="mt-auto self-start rounded-pill bg-forest-950 px-5 py-2.5 text-[13px] font-bold text-neutral-50 transition-opacity hover:opacity-90"
      >
        Retirer mes fonds
      </Link>
    </Tile>
  );
}

// ── Performance par bien ────────────────────────────────────────────────────

export function PerformanceTile({ logements, month }: { logements: OwnerOverviewResponse['logements']; month: string }) {
  if (logements.length === 0) return null;
  const sorted = [...logements].sort((a, b) => b.revenueNet - a.revenueNet);

  return (
    <Tile span={2} labelledBy="home-performance">
      <div className="flex items-center justify-between gap-3">
        <TileTitle id="home-performance">Performance par bien · {monthLong(month)}</TileTitle>
        <Link href="/dashboard/stats" className="text-[13px] font-semibold text-link hover:text-link-hover">
          Revenus détaillés →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-foreground-muted">
              <th scope="col" className="whitespace-nowrap pb-2.5 font-semibold">BIEN</th>
              <th scope="col" className="whitespace-nowrap pb-2.5 font-semibold">OCCUPATION</th>
              <th scope="col" className="whitespace-nowrap pb-2.5 text-right font-semibold">NET / NUIT</th>
              <th scope="col" className="whitespace-nowrap pb-2.5 text-right font-semibold">REVENU NET</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => {
              const weak = l.occupancy.availableNights > 0 && l.occupancy.rate < 0.5;
              return (
                <tr key={l.id} className="border-t border-border">
                  <th scope="row" className="max-w-[240px] py-3 pr-3 text-left font-semibold text-foreground">
                    <Link href={`/dashboard/annonces/${l.id}`} title={l.titre} className="block truncate hover:text-link">
                      {l.titre}
                    </Link>
                  </th>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-[120px] rounded-pill bg-neutral-100">
                        <div
                          className={cn('h-1.5 rounded-pill', weak ? 'bg-gold-400' : 'bg-forest-600')}
                          style={{ width: `${Math.min(l.occupancy.rate, 1) * 100}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap tabular-nums">{percent(l.occupancy.rate)}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right tabular-nums">{l.netPerNight !== null ? formatFCFA(l.netPerNight) : '—'}</td>
                  <td className="py-3 text-right font-bold tabular-nums">{formatFCFA(l.revenueNet)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Tile>
  );
}

// ── Conseil Paixi ────────────────────────────────────────────────────────────

export function TipTile({ tips }: { tips: OwnerOverviewResponse['tips'] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const tip = tips.find((t) => !dismissed.includes(t.logementId));
  if (!tip) return null;

  return (
    <Tile tone="deep" labelledBy="home-tip">
      <span className="inline-flex items-center gap-1.5 self-start rounded-pill bg-lime-400 px-2.5 py-1 text-[11px] font-bold tracking-wide text-forest-950">
        <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
        CONSEIL PAIXI
      </span>
      <h2 id="home-tip" className="font-display text-xl font-semibold leading-snug">
        {tip.logementTitre} est libre {tip.freeNights} nuits sur les {tip.horizonDays} prochaines.
      </h2>
      <p className="text-[13px] text-forest-200">
        Une réduction pour les séjours de dernière minute ou un prix plus doux en semaine aide souvent à remplir ces nuits.
      </p>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/dashboard/annonces/${tip.logementId}/modifier`}
          className="rounded-pill bg-lime-400 px-4 py-2.5 text-[13px] font-bold text-forest-950 transition-opacity hover:opacity-90"
        >
          Ajuster le prix
        </Link>
        <button
          type="button"
          onClick={() => setDismissed((d) => [...d, tip.logementId])}
          className="rounded-pill border border-white/20 px-4 py-2.5 text-[13px] font-semibold text-neutral-50 transition-colors hover:bg-white/5"
        >
          Plus tard
        </button>
      </div>
    </Tile>
  );
}

// ── Réputation ──────────────────────────────────────────────────────────────

export function ReputationTile({ reputation }: { reputation: OwnerOverviewResponse['reputation'] }) {
  const review = reputation.lastReview;

  return (
    <Tile labelledBy="home-reputation">
      <TileTitle id="home-reputation">Votre réputation</TileTitle>
      {reputation.totalReviews === 0 ? (
        <p className="text-[13px] text-foreground-muted">
          Pas encore d’avis. Ils arriveront après les premiers séjours terminés.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <p className="font-display text-4xl font-semibold leading-none text-foreground">
              {reputation.averageRating?.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}
            </p>
            <div className="pb-0.5">
              <Stars note={Math.round(reputation.averageRating ?? 0)} />
              <p className="text-xs text-foreground-muted">
                {reputation.totalReviews} avis voyageur{reputation.totalReviews > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {review && (
            <figure className="mt-auto space-y-1.5 border-t border-border pt-3">
              {review.commentaire && (
                <blockquote className="font-display text-[15px] leading-snug text-foreground">
                  « {review.commentaire} »
                </blockquote>
              )}
              <figcaption className="flex items-center gap-2 text-xs text-foreground-muted">
                <Stars note={review.note} small />
                {review.auteurPrenom}
                {review.logementTitre ? ` · ${review.logementTitre}` : ''}
              </figcaption>
            </figure>
          )}
        </>
      )}
    </Tile>
  );
}

function Stars({ note, small }: { note: number; small?: boolean }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${note} étoiles sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(small ? 'h-3 w-3' : 'h-4 w-4', i < note ? 'fill-gold-400 text-gold-400' : 'text-neutral-300')}
        />
      ))}
    </span>
  );
}
