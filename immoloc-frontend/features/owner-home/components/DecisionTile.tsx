'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Check, Hourglass } from 'lucide-react';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { usePendingDecisions, type PendingDecision } from '@/features/calendar/hooks/use-pending-decisions';
import { formatExpiry } from '@/features/calendar/lib/agenda';
import { diffDays, formatShort } from '@/features/calendar/lib/days';
import { DEFAULT_CHECKIN_LABEL, useAcceptReservation } from '../hooks/use-owner-overview';
import { initials } from '../lib/format';
import { Tile } from './Tile';

/** Délai de réponse total accordé au propriétaire (create-reservation.use-case : 48 h standard). */
const RESPONSE_WINDOW_MS = 48 * 3_600_000;
const URGENT_MS = 6 * 3_600_000;
/** Le bouton « Accepter » demande une seconde pression pendant ce délai. */
const CONFIRM_ARM_MS = 4_000;

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * « À décider » — la demande la plus urgente en carte de décision complète,
 * les suivantes en lignes compactes. Masquée quand rien n'attend.
 */
export function DecisionTile() {
  const { data = [], isLoading } = usePendingDecisions();
  const now = useNow();

  if (isLoading || data.length === 0) return null;
  const [first, ...rest] = data;

  return (
    <Tile tone="gold" span={2} labelledBy="home-decisions">
      <header className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400 text-gold-800">
          <Hourglass className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <h2 id="home-decisions" className="text-base font-bold text-gold-800">
          À décider
        </h2>
        <span className="rounded-pill bg-gold-200 px-2.5 py-0.5 text-xs font-bold text-gold-800">
          {data.length} demande{data.length > 1 ? 's' : ''}
        </span>
        <Link
          href="/dashboard/reservations?statut=PAID"
          className="ml-auto text-[13px] font-semibold text-gold-700 hover:text-gold-800"
        >
          Tout voir →
        </Link>
      </header>

      <DecisionCard decision={first} now={now} />

      {rest.length > 0 && (
        <ul className="space-y-2">
          {rest.map((d) => (
            <li key={d.id}>
              <Link
                href={`/dashboard/reservations/${d.id}`}
                className="flex items-center gap-3 rounded-2xl border border-gold-200 bg-background-card/70 px-4 py-3 transition-colors hover:border-gold-400"
              >
                <Avatar decision={d} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                  <strong>{d.locataire?.prenom ?? 'Voyageur'}</strong> · {d.logement?.titre} ·{' '}
                  {formatShort(d.dateDebut.slice(0, 10))} → {formatShort(d.dateFin.slice(0, 10))} ·{' '}
                  {formatFCFA(d.netProprietaire)}
                </span>
                <span className="shrink-0 text-xs font-semibold text-gold-700">
                  {formatExpiry(d.delaiConfirmation, now)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

function Avatar({ decision, size }: { decision: PendingDecision; size: 'sm' | 'lg' }) {
  const px = size === 'lg' ? 52 : 36;
  const prenom = decision.locataire?.prenom ?? '?';
  return decision.locataire?.avatarUrl ? (
    <Image
      src={decision.locataire.avatarUrl}
      alt=""
      width={px}
      height={px}
      className="shrink-0 rounded-pill object-cover"
      style={{ width: px, height: px }}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-pill bg-gold-100 font-bold text-gold-700',
        size === 'lg' ? 'h-[52px] w-[52px] text-base' : 'h-9 w-9 text-xs',
      )}
    >
      {initials(prenom, decision.locataire?.nom)}
    </span>
  );
}

function DecisionCard({ decision, now }: { decision: PendingDecision; now: number }) {
  const accept = useAcceptReservation();
  const [armed, setArmed] = useState(false);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
  }, []);

  const start = decision.dateDebut.slice(0, 10);
  const end = decision.dateFin.slice(0, 10);
  const nights = diffDays(start, end);
  const remainingMs = new Date(decision.delaiConfirmation).getTime() - now;
  const remainingRatio = Math.min(Math.max(remainingMs / RESPONSE_WINDOW_MS, 0), 1);
  const urgent = remainingMs < URGENT_MS;
  const deadline = new Date(decision.delaiConfirmation).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const verified = decision.locataire?.statutKyc === 'VERIFIE';

  /** Première pression : armer ; seconde pression dans les 4 s : accepter. */
  const handleAccept = () => {
    if (!armed) {
      setArmed(true);
      disarmTimer.current = setTimeout(() => setArmed(false), CONFIRM_ARM_MS);
      return;
    }
    if (disarmTimer.current) clearTimeout(disarmTimer.current);
    setArmed(false);
    accept.mutate(decision.id);
  };

  return (
    <article className="flex flex-col gap-4 rounded-[22px] border border-gold-200 bg-background-card p-5">
      <div className="flex flex-wrap items-center gap-3.5">
        <Avatar decision={decision} size="lg" />
        <div className="min-w-[180px] flex-1">
          <p className="flex flex-wrap items-center gap-2 text-base font-bold text-foreground">
            {decision.locataire?.prenom ?? 'Voyageur'} {decision.locataire?.nom?.charAt(0)}.
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-pill bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Identité vérifiée
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[12.5px] text-foreground-muted">
            Paiement reçu, sécurisé en séquestre jusqu’au check-in
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-foreground-muted">Votre revenu net</p>
          <p className="whitespace-nowrap font-display text-2xl font-semibold text-foreground">{formatFCFA(decision.netProprietaire)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-2xl bg-background-alt px-3.5 py-3">
          <dt className="text-[11px] text-foreground-muted">Logement</dt>
          <dd className="mt-0.5 truncate text-[13px] font-semibold text-foreground">{decision.logement?.titre}</dd>
        </div>
        <div className="rounded-2xl bg-background-alt px-3.5 py-3">
          <dt className="text-[11px] text-foreground-muted">Séjour</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
            {formatShort(start)} → {formatShort(end)} · {nights} nuit{nights > 1 ? 's' : ''}
          </dd>
        </div>
        <div className="rounded-2xl bg-background-alt px-3.5 py-3">
          <dt className="text-[11px] text-foreground-muted">Voyageurs</dt>
          <dd className="mt-0.5 text-[13px] font-semibold text-foreground">
            {decision.nbPersonnes} personne{decision.nbPersonnes > 1 ? 's' : ''}
          </dd>
        </div>
      </dl>

      <div className="space-y-1.5">
        <div className="flex flex-wrap justify-between gap-2 text-xs">
          <span className={cn('font-semibold', urgent ? 'text-error-700' : 'text-gold-700')}>
            {formatExpiry(decision.delaiConfirmation, now)} · avant {deadline}
          </span>
          <span className="text-foreground-muted">Sans réponse, la demande expire et le voyageur est remboursé</span>
        </div>
        <div
          className="h-1.5 rounded-pill bg-background-alt"
          role="progressbar"
          aria-label="Temps restant pour répondre"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(remainingRatio * 100)}
        >
          <div
            className={cn('h-1.5 rounded-pill transition-[width]', urgent ? 'bg-error-500' : 'bg-gold-400')}
            style={{ width: `${remainingRatio * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleAccept}
          disabled={accept.isPending}
          className={cn(
            'btn-primary h-12 flex-[1_1_220px] px-5 text-sm',
            armed && 'bg-forest-800 hover:bg-forest-800',
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {accept.isPending
            ? 'Acceptation…'
            : armed
              ? 'Appuyez encore pour confirmer'
              : `Accepter · arrivée ${DEFAULT_CHECKIN_LABEL}`}
        </button>
        <Link href={`/dashboard/reservations/${decision.id}`} className="btn-ghost h-12 flex-[0_1_160px] px-5 text-sm">
          Refuser ou ajuster
        </Link>
      </div>
      <p className="-mt-1 text-[11.5px] text-foreground-muted">
        Les horaires d’arrivée et de départ restent modifiables dans la réservation.
      </p>
    </article>
  );
}
