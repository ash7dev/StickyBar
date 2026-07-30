'use client';

import { CheckCircle2, Clock, Banknote, AlertTriangle, XCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { dateTime } from '@/features/reservations/utils';
import type { ReservationDetail } from '@/lib/nestjs/types';

type Historique = ReservationDetail['historique'];

interface Props {
  historique: Historique;
  variant?: 'light' | 'dark';
  isOwner?: boolean;
}

interface StatusConfigItem {
  labelTenant: string;
  labelOwner: string;
  icon: typeof CheckCircle2;
  accentLight: string;
  accentDark: string;
}

const CFG: Record<string, StatusConfigItem> = {
  PENDING: {
    labelTenant: 'Réservation créée',
    labelOwner: 'Réservation créée par le locataire',
    icon: Clock,
    accentLight: 'text-warning-700 bg-warning-50 border-warning-200',
    accentDark: 'text-warning-400 bg-warning-500/20 border-warning-400/30',
  },
  PAID: {
    labelTenant: 'Paiement confirmé (séquestre)',
    labelOwner: 'Paiement confirmé & sécurisé sous séquestre',
    icon: Banknote,
    accentLight: 'text-forest-800 bg-forest-50 border-forest-200',
    accentDark: 'text-lime-300 bg-lime-400/10 border-lime-400/30',
  },
  CONFIRMED: {
    labelTenant: 'Réservation confirmée par l\'hôte',
    labelOwner: 'Réservation confirmée par vos soins',
    icon: CheckCircle2,
    accentLight: 'text-forest-800 bg-forest-50 border-forest-200',
    accentDark: 'text-lime-300 bg-lime-400/10 border-lime-400/30',
  },
  CHECKED_IN: {
    labelTenant: 'Check-in (Entrée dans les lieux)',
    labelOwner: 'Check-in locataire effectué',
    icon: CheckCircle2,
    accentLight: 'text-forest-800 bg-forest-50 border-forest-200',
    accentDark: 'text-lime-300 bg-lime-400/10 border-lime-400/30',
  },
  COMPLETED: {
    labelTenant: 'Séjour terminé',
    labelOwner: 'Séjour terminé & fonds débloqués',
    icon: CheckCircle2,
    accentLight: 'text-forest-800 bg-forest-50 border-forest-200',
    accentDark: 'text-lime-300 bg-lime-400/10 border-lime-400/30',
  },
  CANCELLED: {
    labelTenant: 'Réservation annulée',
    labelOwner: 'Réservation annulée',
    icon: XCircle,
    accentLight: 'text-error-700 bg-error-50 border-error-200',
    accentDark: 'text-error-400 bg-error-500/20 border-error-400/30',
  },
  DISPUTED: {
    labelTenant: 'Litige déclaré',
    labelOwner: 'Litige en cours d\'examen',
    icon: AlertTriangle,
    accentLight: 'text-error-700 bg-error-50 border-error-200',
    accentDark: 'text-error-400 bg-error-500/20 border-error-400/30',
  },
  EXPIRED: {
    labelTenant: 'Demande expirée',
    labelOwner: 'Demande expirée',
    icon: Clock,
    accentLight: 'text-foreground-muted bg-background-alt border-border',
    accentDark: 'text-neutral-400 bg-neutral-800/60 border-neutral-700/50',
  },
};

export function ReservationTimeline({
  historique,
  variant = 'light',
  isOwner = false,
}: Props) {
  if (!historique || historique.length === 0) return null;

  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'rounded-card border p-6 space-y-5 shadow-2xs',
        isDark
          ? 'bg-forest-950 border-forest-800/90 text-white'
          : 'bg-background-card border-border/80 text-forest-950',
      )}
    >
      {/* En-tête */}
      <div
        className={cn(
          'flex items-center gap-3 pb-4 border-b',
          isDark ? 'border-forest-800/80' : 'border-border/60',
        )}
      >
        <div
          className={cn(
            'w-9 h-9 rounded-inner flex items-center justify-center shrink-0 shadow-2xs',
            isDark
              ? 'bg-forest-900 border border-forest-800 text-lime-400'
              : 'bg-forest-950 border border-lime-400/20 text-lime-400',
          )}
        >
          <History className="w-4 h-4 text-lime-400" />
        </div>
        <h4 className={cn('font-display text-base font-bold', isDark ? 'text-white' : 'text-forest-950')}>
          Chronologie de la réservation
        </h4>
      </div>

      {/* Liste d'événements */}
      <div className="space-y-0 pt-1">
        {historique.map((event, i) => {
          const cfg = CFG[event.nouveauStatut];
          if (!cfg) return null;

          const Icon = cfg.icon;
          const isLast = i === historique.length - 1;
          const label = isOwner ? cfg.labelOwner : cfg.labelTenant;
          const accent = isDark ? cfg.accentDark : cfg.accentLight;

          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-inner border flex items-center justify-center shrink-0 shadow-2xs',
                    accent,
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-px flex-1 my-1.5',
                      isDark ? 'bg-forest-800/80' : 'bg-border',
                    )}
                  />
                )}
              </div>

              <div className={cn('pb-5', isLast && 'pb-0')}>
                <p className={cn('font-display text-sm font-bold', isDark ? 'text-white' : 'text-forest-950')}>
                  {label}
                </p>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-forest-300' : 'text-foreground-muted')}>
                  {dateTime(event.modifieLe)}
                </p>
                {event.raison && (
                  <p
                    className={cn(
                      'text-xs mt-1.5 italic leading-relaxed p-2.5 rounded-inner border',
                      isDark
                        ? 'bg-forest-900/60 border-forest-800/80 text-forest-200'
                        : 'bg-background-alt border-border/60 text-foreground-muted',
                    )}
                  >
                    « {event.raison} »
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
