'use client';

import { AlertCircle, Clock, ArrowRight, Zap, ShieldAlert, CalendarClock, Activity } from 'lucide-react';
import Link from 'next/link';

interface Props {
  confirmations: number;
  disputes: number;
  recentBookings?: Array<{
    id: string;
    statut: string;
    logement: { titre: string };
    locataire: { prenom: string; nom: string };
    dateFin: string;
  }>;
}

export function PendingActions({ confirmations, disputes, recentBookings = [] }: Props) {
  const total = confirmations + disputes;
  const urgent = disputes;
  const toHandle = confirmations;
  const checkedInBookings = recentBookings.filter(b => b.statut === 'CHECKED_IN');

  const hasUrgent = urgent > 0;

  return (
    <div className="klef-rise bg-background-card rounded-card p-4 sm:p-5 lg:p-6 border border-border/80 h-full min-h-[280px] sm:min-h-[380px] flex flex-col shadow-sm hover:border-forest-600/30 hover:shadow-md transition-[box-shadow,border-color] duration-200">

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-inner flex items-center justify-center border
              ${hasUrgent
                ? 'bg-error-50 border-error-200 text-error-600'
                : 'bg-forest-950 border-lime-400/20 text-lime-400'}`}>
              <Zap className="w-4 h-4 text-lime-400" />
            </div>
            {total > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                  ${hasUrgent ? 'bg-error-500' : 'bg-lime-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-background-card
                  ${hasUrgent ? 'bg-error-600' : 'bg-lime-500'}`}></span>
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">À faire</p>
            <h3 className="font-display text-sm sm:text-base font-bold text-forest-950 truncate">Actions requises</h3>
          </div>
        </div>

        {total > 0 && (
          <Link
            href="/dashboard/reservations"
            className="px-3 py-1.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5 text-forest-950" />
          </Link>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-3.5">
        <div className="p-3 sm:p-3.5 rounded-inner bg-background-alt border border-border/80 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-error-600 shrink-0" />
            <span className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider truncate">Urgents</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-extrabold text-forest-950">{urgent}</p>
        </div>

        <div className="p-3 sm:p-3.5 rounded-inner bg-background-alt border border-border/80 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-lime-600 shrink-0" />
            <span className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider truncate">À traiter</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-extrabold text-forest-950">{toHandle}</p>
        </div>
      </div>

      {/* Action List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
        {/* Litiges */}
        {disputes > 0 && (
          <Link
            href="/dashboard/litiges"
            className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-inner bg-error-50 border border-error-200 hover:bg-error-100 transition-all group"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-inner bg-error-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-bold text-error-900 truncate">
                  {disputes} litige{disputes > 1 ? 's' : ''} en attente
                </p>
                <p className="text-[10px] font-bold text-error-700 truncate">Réponse requise immédiatement</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-error-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Confirmations */}
        {confirmations > 0 && (
          <Link
            href="/dashboard/reservations?statut=PENDING"
            className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-inner bg-background-alt border border-border/80 hover:bg-background-card transition-all group"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-bold text-forest-950 truncate">
                  {confirmations} réservation{confirmations > 1 ? 's' : ''} à confirmer
                </p>
                <p className="text-[10px] text-foreground-muted font-medium truncate">Accepter les demandes payées</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Checked-In Bookings */}
        {checkedInBookings.map(b => (
          <Link
            key={b.id}
            href={`/dashboard/reservations/${b.id}`}
            className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-inner bg-background-alt border border-border/80 hover:bg-background-card transition-all group"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs font-bold text-forest-950 truncate">
                  {b.logement.titre}
                </p>
                <p className="text-[10px] text-forest-700 font-bold truncate">
                  En cours • Fin le {new Date(b.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-foreground-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}

        {/* Empty State */}
        {total === 0 && checkedInBookings.length === 0 && (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-lime-400" />
            </div>
            <p className="font-display text-xs sm:text-sm font-bold text-forest-950">Tout est à jour</p>
            <p className="text-[11px] sm:text-xs text-foreground-muted">Aucune action requise pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}