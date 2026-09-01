'use client';

import { Calendar, CheckCircle2, TrendingUp, KeyRound } from 'lucide-react';
import type { Reservation } from '@/features/reservations/components/reservation-card';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface Props {
  reservations: Reservation[];
}

export function GestionnaireReservationsStatsHeader({ reservations }: Props) {
  const total = reservations.length;
  const inHouse = reservations.filter((r) => r.statut === 'CHECKED_IN').length;
  const confirmed = reservations.filter((r) => r.statut === 'CONFIRMED' || r.statut === 'PAID').length;
  const totalCa = reservations.reduce((sum, r) => sum + Number(r.totalLocataire || 0), 0);

  const cards = [
    {
      title: 'Total Réservations Gérées',
      value: `${total} séjour${total > 1 ? 's' : ''}`,
      icon: KeyRound,
      sub: 'Historique sous conciergerie',
      color: 'bg-forest-50 text-forest-700 border-forest-200/60',
    },
    {
      title: 'Voyageurs Actuellement en Séjour',
      value: `${inHouse} occupé${inHouse > 1 ? 's' : ''}`,
      icon: CheckCircle2,
      sub: 'Logements occupés',
      color: 'bg-success-50 text-success-700 border-success-200/60',
    },
    {
      title: 'Séjours Confirmés à Venir',
      value: `${confirmed} à venir`,
      icon: Calendar,
      sub: 'Check-ins futurs',
      color: 'bg-lime-50 text-forest-900 border-lime-300/60',
    },
    {
      title: 'Volume Voyageurs Cumulé',
      value: `${fcfa(totalCa)} FCFA`,
      icon: TrendingUp,
      sub: 'Revenu total généré',
      color: 'bg-neutral-100 text-foreground border-border',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="rounded-card border border-border bg-background-card p-5 shadow-2xs space-y-2.5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted">{c.title}</span>
              <span className={`grid h-8 w-8 place-items-center rounded-inner border text-xs font-bold ${c.color}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>

            <div>
              <div className="font-display text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-foreground tabular-nums">
                {c.value}
              </div>
              <p className="text-[0.6875rem] text-foreground-muted font-medium mt-1">
                {c.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
