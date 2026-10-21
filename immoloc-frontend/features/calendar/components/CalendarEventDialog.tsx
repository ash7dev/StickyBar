'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Lock, Moon, Users } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { useDeleteCalendarBlock } from '../hooks/use-owner-calendar';
import { diffDays, formatLong, todayDay } from '../lib/days';
import { STATUS_META, eventStatus } from '../lib/event-styles';

interface CalendarEventDialogProps {
  event: OwnerCalendarEvent | null;
  logement: OwnerCalendarLogement | undefined;
  onClose: () => void;
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-foreground-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function CalendarEventDialog({ event, logement, onClose }: CalendarEventDialogProps) {
  const deleteBlock = useDeleteCalendarBlock();

  if (!event) return null;

  const status = STATUS_META[eventStatus(event)];
  const nights = diffDays(event.start, event.end);
  const isReservation = event.kind === 'RESERVATION';
  const isPast = event.end <= todayDay();

  return (
    <Modal
      open
      onClose={onClose}
      title={
        isReservation
          ? `${event.locataire.prenom} ${event.locataire.nomInitiale}`.trim()
          : 'Dates bloquées'
      }
      description={logement?.titre}
      icon={isReservation ? <CalendarDays className="h-5 w-5" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
      footer={
        isReservation ? (
          <Link
            href={`/dashboard/reservations/${event.id}`}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            Ouvrir la réservation
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : isPast ? null : (
          <button
            type="button"
            disabled={deleteBlock.isPending}
            onClick={() => deleteBlock.mutate(event.id, { onSuccess: onClose })}
            className="btn-ghost px-5 py-2.5 text-sm text-error-600"
          >
            {deleteBlock.isPending ? 'Déblocage…' : 'Débloquer ces dates'}
          </button>
        )
      }
    >
      <span className="inline-flex items-center gap-2 rounded-pill border border-border px-2.5 py-1 text-xs font-medium text-foreground">
        <span className={cn('h-2.5 w-2.5 rounded-pill', status.dot)} aria-hidden="true" />
        {status.label}
      </span>

      <div className="mt-3 divide-y divide-border text-sm">
        <Row
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label={isReservation ? 'Arrivée' : 'Premier jour bloqué'}
          value={formatLong(event.start)}
        />
        <Row
          icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
          label={isReservation ? 'Départ' : 'Disponible à nouveau le'}
          value={formatLong(event.end)}
        />
        <Row
          icon={<Moon className="h-4 w-4" aria-hidden="true" />}
          label="Durée"
          value={`${nights} nuit${nights > 1 ? 's' : ''}`}
        />
        {isReservation ? (
          <>
            <Row
              icon={<Users className="h-4 w-4" aria-hidden="true" />}
              label="Voyageurs"
              value={`${event.nbPersonnes} personne${event.nbPersonnes > 1 ? 's' : ''}`}
            />
            <div className="flex items-center justify-between py-3">
              <span className="text-foreground-muted">Votre revenu net</span>
              <span className="font-display text-lg font-semibold text-foreground">
                {formatFCFA(event.netProprietaire)}
              </span>
            </div>
          </>
        ) : (
          event.motif && (
            <Row icon={<Lock className="h-4 w-4" aria-hidden="true" />} label="Motif" value={event.motif} />
          )
        )}
      </div>
    </Modal>
  );
}
