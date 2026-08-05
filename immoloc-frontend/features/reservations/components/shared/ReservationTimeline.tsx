'use client';

import {
  AlertTriangle, Banknote, CheckCircle2, Circle, Clock,
  History, KeyRound, LogOut, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { dateTime } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Historique = ReservationDetail['historique'];

interface Props {
  historique: Historique;
  variant?: 'light' | 'dark';
  isOwner?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chaque etape porte un TON semantique, pas une paire de classes.

   L'original definissait accentLight et accentDark par statut : seize chaines
   pour six apparences reellement distinctes. PAID, CONFIRMED, CHECKED_IN et
   COMPLETED avaient exactement les memes classes — quatre etapes visuellement
   indistinguables sur une chronologie censee montrer une progression.
   ═══════════════════════════════════════════════════════════════════════════ */

type Tone = 'wait' | 'money' | 'ok' | 'key' | 'end' | 'error' | 'muted';

const TONES: Record<Tone, { light: string; dark: string }> = {
  wait: { light: 'bg-warning-50 text-warning-700', dark: 'bg-warning-500/20 text-warning-500' },
  money: { light: 'bg-lime-100 text-forest-800', dark: 'bg-lime-400/15 text-lime-400' },
  ok: { light: 'bg-forest-100 text-forest-700', dark: 'bg-white/[0.08] text-forest-200' },
  key: { light: 'bg-lime-100 text-forest-800', dark: 'bg-lime-400/15 text-lime-400' },
  end: { light: 'bg-success-50 text-success-700', dark: 'bg-success-500/20 text-success-500' },
  error: { light: 'bg-error-50 text-error-700', dark: 'bg-error-500/20 text-error-500' },
  muted: { light: 'bg-neutral-100 text-foreground-muted', dark: 'bg-white/[0.06] text-forest-200' },
};

interface StepCfg {
  tenant: string;
  owner: string;
  icon: typeof CheckCircle2;
  tone: Tone;
  /** Précision sur l'état des fonds, affichée sous le libellé. */
  money?: string;
}

const CFG: Record<string, StepCfg> = {
  PENDING: {
    tenant: 'Demande envoyée',
    owner: 'Demande reçue',
    icon: Clock,
    tone: 'wait',
  },
  PAID: {
    tenant: 'Paiement effectué',
    owner: 'Paiement reçu',
    icon: Banknote,
    tone: 'money',
    // La chronologie ne disait jamais OU est l'argent — sur un produit dont
    // c'est le mecanisme central, c'est l'information la plus attendue.
    money: 'Les fonds sont bloqués par Klef',
  },
  CONFIRMED: {
    tenant: 'Réservation confirmée par l’hôte',
    owner: 'Vous avez confirmé la réservation',
    icon: CheckCircle2,
    tone: 'ok',
    money: 'Les fonds restent bloqués',
  },
  CHECKED_IN: {
    tenant: 'Remise des clés confirmée',
    owner: 'Le voyageur a confirmé son entrée',
    icon: KeyRound,
    tone: 'key',
    money: 'Le versement est déclenché',
  },
  CHECKED_OUT: {
    // CHECKED_OUT etait absent de CFG : l'evenement disparaissait de la
    // chronologie alors qu'il existe en base.
    tenant: 'Départ effectué',
    owner: 'Départ du voyageur',
    icon: LogOut,
    tone: 'ok',
  },
  COMPLETED: {
    tenant: 'Séjour terminé',
    owner: 'Séjour terminé',
    icon: CheckCircle2,
    tone: 'end',
    money: 'Versement effectué',
  },
  CANCELLED: {
    tenant: 'Réservation annulée',
    owner: 'Réservation annulée',
    icon: XCircle,
    tone: 'error',
  },
  DISPUTED: {
    tenant: 'Litige déclaré',
    owner: 'Litige déclaré',
    icon: AlertTriangle,
    tone: 'error',
    money: 'Les fonds sont gelés le temps de l’examen',
  },
  REFUNDED: {
    tenant: 'Remboursement effectué',
    owner: 'Remboursement effectué au voyageur',
    icon: Banknote,
    tone: 'muted',
    money: 'Fonds restitués au voyageur',
  },
  EXPIRED: {
    tenant: 'Demande expirée',
    owner: 'Demande expirée',
    icon: Clock,
    tone: 'muted',
  },
};

export function ReservationTimeline({ historique, variant = 'light', isOwner = false }: Props) {
  const isDark = variant === 'dark';

  /* Le composant retournait null sur un historique vide : la carte
     disparaissait sans explication, alors qu'une reservation qui vient
     d'etre creee en a forcement un. */
  if (!historique?.length) {
    return (
      <section className={cn(
        'rounded-card border p-6',
        isDark ? 'border-white/10 bg-[linear-gradient(180deg,#072A20_0%,#041912_100%)] text-white' : 'border-border bg-background-card',
      )}>
        <p className={cn('text-sm', isDark ? 'text-forest-200' : 'text-foreground-muted')}>
          Aucun événement enregistré pour cette réservation.
        </p>
      </section>
    );
  }

  /* Les evenements arrivaient dans l'ordre de l'API, sans garantie. Une
     chronologie doit etre chronologique. */
  const events = [...historique].sort(
    (a, b) => new Date(a.modifieLe).getTime() - new Date(b.modifieLe).getTime(),
  );

  return (
    <section className={cn(
      'rounded-card border p-6 shadow-sm',
      isDark
        ? 'border-white/10 bg-[linear-gradient(180deg,#072A20_0%,#041912_100%)] text-white'
        : 'border-border bg-background-card',
    )}>
      <header className={cn('mb-5 flex items-center gap-3 border-b pb-4', isDark ? 'border-white/10' : 'border-border')}>
        {/* En mode clair, le squircle etait en forest-950 a icone lime : le
            bloc le plus sombre d'une carte claire. */}
        <span className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
          isDark ? 'bg-white/[0.07] text-forest-200' : 'bg-neutral-100 text-forest-700',
        )}>
          <History className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </span>
        <h2 className={cn(
          'font-display text-base font-semibold tracking-[-0.015em]',
          isDark ? 'text-neutral-50' : 'text-forest-900',
        )}>
          Chronologie
        </h2>
      </header>

      {/* Une chronologie est une liste ordonnée : <ol>, pas des <div>. */}
      <ol className="space-y-0">
        {events.map((event, i) => {
          /*
            Repli au lieu de `if (!cfg) return null`.

            Tout statut absent de CFG disparaissait purement et simplement de
            la chronologie. Sur un historique qui sert de preuve en cas de
            litige, un trou silencieux est le pire comportement : l'evenement
            existe en base mais personne ne le voit.
          */
          const cfg = CFG[event.nouveauStatut] ?? {
            tenant: event.nouveauStatut,
            owner: event.nouveauStatut,
            icon: Circle,
            tone: 'muted' as Tone,
          };

          const Icon = cfg.icon;
          const isLast = i === events.length - 1;
          const label = isOwner ? cfg.owner : cfg.tenant;
          const tone = TONES[cfg.tone][isDark ? 'dark' : 'light'];

          return (
            <li key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-inner', tone)}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn('my-1.5 w-px flex-1', isDark ? 'bg-white/10' : 'bg-border')}
                  />
                )}
              </div>

              <div className={cn('min-w-0 flex-1', isLast ? 'pb-0' : 'pb-5')}>
                <p className={cn('text-sm font-semibold', isDark ? 'text-neutral-50' : 'text-forest-900')}>
                  {label}
                </p>

                {/* <time dateTime> : la date n'etait qu'un texte, non
                    interpretable par une machine. */}
                <time
                  dateTime={event.modifieLe}
                  className={cn('mt-0.5 block text-xs', isDark ? 'text-forest-200' : 'text-foreground-muted')}
                >
                  {dateTime(event.modifieLe)}
                </time>

                {cfg.money && (
                  <p className={cn(
                    'mt-1.5 inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[0.6875rem]',
                    isDark ? 'bg-white/[0.06] text-forest-200' : 'bg-neutral-100 text-foreground-muted',
                  )}>
                    <Banknote className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {cfg.money}
                  </p>
                )}

                {event.raison && (
                  /* Le motif etait en italique : sur une citation d'une ou deux
                     phrases, c'est moins lisible qu'un filet lateral. */
                  <p className={cn(
                    'mt-2 border-l-2 py-1 pl-3 text-xs leading-relaxed',
                    isDark ? 'border-white/15 text-forest-200' : 'border-border text-foreground-muted',
                  )}>
                    {event.raison}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}