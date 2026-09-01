'use client';

import { Calendar, Phone } from 'lucide-react';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface BookingItem {
  id: string;
  code: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  prixTotal: number;
  netProprietaire: number;
  logementTitle: string;
  logementVille: string;
  ownerName: string;
  travelerName: string;
  travelerPhone?: string;
}

interface Props {
  bookings: BookingItem[];
}

export function GestionnaireCheckinsList({ bookings }: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-7 sm:p-8 shadow-2xs space-y-6 h-full min-h-[320px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2.5">
              <Calendar className="h-6 w-6 text-forest-600" aria-hidden="true" />
              <span>Arrivées & Séjours Imminents (7 prochains jours)</span>
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
              Suivi des voyageurs sur les logements sous votre conciergerie
            </p>
          </div>

          <span className="inline-flex items-center rounded-pill bg-forest-50 text-forest-700 border border-forest-200/60 px-3.5 py-1.5 text-xs font-semibold">
            {bookings.length} séjour{bookings.length > 1 ? 's' : ''}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-inner bg-forest-50 text-forest-700 mx-auto">
              <Calendar className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-base font-semibold text-foreground">Aucune arrivée prévue dans les 7 prochains jours</p>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
              Les nouvelles réservations confirmées s’afficheront automatiquement ici avec le détail des voyageurs et des propriétaires.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            {bookings.map((b) => {
              const startFormatted = new Date(b.dateDebut).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });
              const endFormatted = new Date(b.dateFin).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-inner border border-border bg-background-alt hover:border-forest-600/30 transition-all duration-200 shadow-2xs min-h-[96px]"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-inner bg-forest-900 text-lime-400 font-bold text-sm shadow-xs">
                      {b.travelerName[0]}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-sm font-semibold text-foreground">
                          {b.travelerName}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-pill text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-200">
                          Propriétaire : {b.ownerName}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-foreground-muted flex items-center gap-2">
                        <span className="font-semibold text-forest-900">{b.logementTitle}</span>
                        <span>· {b.logementVille}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted pt-1 font-medium">
                        <span className="text-foreground flex items-center gap-1.5 font-semibold">
                          <Calendar className="h-4 w-4 text-forest-600" aria-hidden="true" /> {startFormatted} → {endFormatted}
                        </span>
                        <span>· Total: {fcfa(b.prixTotal)} FCFA (Net proprio: {fcfa(b.netProprietaire)} FCFA)</span>
                      </div>
                    </div>
                  </div>

                  {b.travelerPhone && (
                    <a
                      href={`tel:${b.travelerPhone}`}
                      className="inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-pill border border-border bg-background-card hover:bg-neutral-100 text-xs font-semibold text-foreground transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Phone className="h-4 w-4 text-forest-600" aria-hidden="true" />
                      <span>Contacter</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
