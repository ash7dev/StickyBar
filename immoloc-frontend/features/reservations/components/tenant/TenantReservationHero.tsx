'use client';

import Image from 'next/image';
import {
  Moon, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa, dateLong } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

/* ═══════════════════════════════════════════════════════════════════════════
   Statuts — classes complètes, jamais interpolées.

   ⚠️ Corrigé : `warning-400`, `error-400` et `neutral-700/800` n'existent pas
   dans la palette Klef (warning et error s'arrêtent à 50/500/600/700, et les
   neutres du système sont verts, pas ceux de Tailwind). Les badges PENDING,
   CANCELLED, DISPUTED, COMPLETED et EXPIRED rendaient donc sans couleur de
   texte ni de pastille — c'est-à-dire cinq statuts sur huit.
   ═══════════════════════════════════════════════════════════════════════════ */

type StatutStyle = {
  label: string;
  badge: string;
  dot: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** Une pastille qui pulse signale « en cours ». Pas « terminé ». */
  live?: boolean;
};

const STATUT_CFG: Record<string, StatutStyle> = {
  PENDING: {
    label: 'En attente',
    badge: 'border-warning-500/30 bg-warning-500/12 text-warning-50',
    dot: 'bg-warning-500',
    Icon: Clock,
    live: true,
  },
  PAID: {
    label: 'Sous séquestre',
    badge: 'border-border-inverse bg-white/8 text-on-inverse',
    dot: 'bg-lime-300',
    Icon: ShieldCheck,
  },
  CONFIRMED: {
    label: 'Confirmée',
    badge: 'border-border-inverse bg-white/8 text-on-inverse',
    dot: 'bg-lime-300',
    Icon: CheckCircle2,
  },
  CHECKED_IN: {
    label: 'Séjour en cours',
    badge: 'border-lime-400/40 bg-lime-400/12 text-on-inverse',
    dot: 'bg-lime-300',
    Icon: CheckCircle2,
    live: true,
  },
  COMPLETED: {
    label: 'Terminée',
    badge: 'border-border-inverse bg-white/5 text-on-inverse-muted',
    dot: 'bg-forest-300',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Annulée',
    badge: 'border-error-500/35 bg-error-500/15 text-error-50',
    dot: 'bg-error-500',
    Icon: AlertTriangle,
  },
  DISPUTED: {
    label: 'Litige',
    badge: 'border-error-500/35 bg-error-500/15 text-error-50',
    dot: 'bg-error-500',
    Icon: AlertTriangle,
    live: true,
  },
  EXPIRED: {
    label: 'Expirée',
    badge: 'border-border-inverse bg-white/5 text-on-inverse-muted',
    dot: 'bg-forest-300',
    Icon: Clock,
  },
};

/* Même piège que dans CheckInTimeCard : `dateDebut` / `dateFin` arrivent
   souvent en date seule. `new Date('2026-08-14')` est lu à minuit UTC, donc
   `toLocaleTimeString()` affichait « 00:00 » depuis Dakar et « 02:00 » depuis
   Paris — présenté comme l'heure d'arrivée confirmée par l'hôte.
   On n'affiche une heure que si la chaîne en contient réellement une. */
function timeOrNull(iso: string) {
  if (!/\d{2}:\d{2}/.test(iso)) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function TenantReservationHero({ res }: { res: ReservationDetail }) {
  const cfg = STATUT_CFG[res.statut] ?? STATUT_CFG.PENDING;
  const { Icon } = cfg;

  const mainPhoto =
    res.logement?.photos.find((p) => p.estPrincipale)?.url ?? res.logement?.photos[0]?.url;

  const heureArrivee = res.confirmeeLe ? timeOrNull(res.dateDebut) : null;
  const heureDepart = res.confirmeeLe ? timeOrNull(res.dateFin) : null;

  const lieu = [res.logement?.type, res.logement?.ville, res.logement?.quartier]
    .filter(Boolean)
    .join(' · ');

  return (
    <section className="section-inverse relative overflow-hidden p-6 md:p-8">
      {/* Un seul halo, dans le vert de la marque. Le lime n'est pas une
          texture de fond : c'est le signal d'action. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-start">

        {/* ── Colonne gauche ───────────────────────────────────────────── */}

        <div className="min-w-0 flex-1 space-y-4">

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold',
                cfg.badge,
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot, cfg.live && 'animate-pulse')}
              />
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>
            <span className="text-xs text-on-inverse-muted">
              Créée le {dateLong(res.creeLe)}
            </span>
          </div>

          <div>
            {lieu && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                {lieu}
              </p>
            )}
            <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-on-inverse-display md:text-3xl">
              {res.logement?.titre ?? 'Votre réservation'}
            </h1>
          </div>

          {/* ── Dates ──────────────────────────────────────────────────── */}

          <div className="flex w-full max-w-sm items-stretch overflow-hidden rounded-inner border border-border-inverse bg-white/5">
            <div className="flex-1 px-4 py-3 text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                Arrivée
              </p>
              <p className="text-sm font-semibold text-on-inverse">
                <time dateTime={res.dateDebut.slice(0, 10)}>{dateLong(res.dateDebut)}</time>
              </p>
              {heureArrivee && (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs tabular-nums text-on-inverse-muted">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {heureArrivee}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-x border-border-inverse bg-white/[0.04] px-4">
              <Moon className="h-4 w-4 text-on-inverse-marker" aria-hidden="true" />
              <span className="mt-0.5 text-base font-semibold leading-none tabular-nums text-on-inverse">
                {res.nbNuits}
              </span>
              <span className="text-xs uppercase text-on-inverse-muted">
                nuit{res.nbNuits > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex-1 px-4 py-3 text-center">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
                Départ
              </p>
              <p className="text-sm font-semibold text-on-inverse">
                <time dateTime={res.dateFin.slice(0, 10)}>{dateLong(res.dateFin)}</time>
              </p>
              {heureDepart && (
                <p className="mt-1 flex items-center justify-center gap-1 text-xs tabular-nums text-on-inverse-muted">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {heureDepart}
                </p>
              )}
            </div>
          </div>

          <p className="flex items-center gap-2 text-xs font-semibold text-on-inverse-muted">
            <Users className="h-4 w-4" aria-hidden="true" />
            {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Colonne droite ───────────────────────────────────────────── */}

        <div className="flex shrink-0 flex-col gap-3 md:w-56">
          {mainPhoto && (
            <div className="relative h-36 w-full overflow-hidden rounded-inner border border-border-inverse bg-white/5 md:h-40">
              <Image
                src={mainPhoto}
                alt={res.logement?.titre ?? ''}
                fill
                sizes="(min-width: 768px) 224px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-1 rounded-inner border border-border-inverse bg-white/[0.07] p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
              Total réglé
            </p>
            <p className="font-display text-2xl font-semibold leading-none tabular-nums text-on-inverse">
              {fcfa(res.totalLocataire)}
            </p>
            <p className="text-xs font-semibold text-on-inverse-muted">FCFA</p>
          </div>
        </div>
      </div>
    </section>
  );
}