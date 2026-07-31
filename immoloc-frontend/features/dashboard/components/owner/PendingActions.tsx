'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarCheck, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

interface StayInProgress {
  id: string;
  statut: string;
  logement: { titre: string };
  dateFin: string;
}

interface Props {
  confirmations: number;
  disputes: number;
  /** `locataire` était requis dans le type mais jamais lu. */
  recentBookings?: StayInProgress[];
  isLoading?: boolean;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="klef-rise flex h-full min-h-[20rem] flex-col rounded-card border border-border bg-background-card p-5 shadow-sm sm:min-h-[22rem] lg:p-6">
      {children}
    </section>
  );
}

export function PendingActions({ confirmations, disputes, recentBookings = [], isLoading = false }: Props) {
  const inProgress = recentBookings.filter((b) => b.statut === 'CHECKED_IN');
  const actionCount = disputes + confirmations;
  const hasUrgent = disputes > 0;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-10 w-48 rounded-inner bg-neutral-100" />
          <div className="h-16 rounded-inner bg-neutral-100" />
          <div className="h-16 rounded-inner bg-neutral-100" />
        </div>
        <span className="sr-only" role="status">Chargement des actions</span>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 sm:flex-nowrap">
        <div className="flex min-w-0 items-center gap-3">
          {/*
            L'icone portait text-lime-400 EN DUR, ce qui ecrasait la couleur
            du parent : en etat d'urgence, on obtenait une icone lime sur un
            fond rouge clair. La couleur vient maintenant du conteneur seul.

            Le squircle etait aussi en forest-950 dans l'etat normal — l'un
            des quatre blocs sombres de cette carte claire.
          */}
          <span className={cn(
            'grid h-10 w-10 shrink-0 place-items-center rounded-inner',
            hasUrgent ? 'bg-error-500/15 text-error-600' : 'bg-neutral-100 text-forest-700',
          )}>
            <ListChecks className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">À faire</p>
            <h2 className="truncate font-display text-base font-semibold tracking-[-0.015em] text-forest-900">
              Actions requises
            </h2>
          </div>
        </div>

        {/* Le compteur remplace le point en animate-ping, qui clignotait sans
            fin. Un nombre dit combien ; un point clignotant ne dit rien. */}
        {actionCount > 0 && (
          <span className={cn(
            'inline-flex shrink-0 items-center rounded-pill px-2.5 py-1 text-xs font-semibold tabular-nums',
            hasUrgent ? 'bg-error-50 text-error-700' : 'bg-warning-50 text-warning-700',
          )}>
            {actionCount} en attente
          </span>
        )}
      </header>

      {/*
        La grille « Urgents / À traiter » a ete supprimee.

        Elle affichait « 2 Urgents » et « 3 À traiter » juste au-dessus de
        « 2 litiges en attente » et « 3 réservations à confirmer » : la meme
        information deux fois, dans une carte de 380 px de haut.
      */}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {disputes > 0 && (
          <Link
            href="/dashboard/reservations?statut=DISPUTED"
            /* Pointait vers /dashboard/litiges, route absente du reste du
               produit — le reste utilise le filtre de statut. */
            className="group flex items-center gap-3 rounded-inner border border-error-500/30 bg-error-50 p-3.5 transition-colors duration-150 hover:bg-error-100"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-error-600 text-white">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-error-700">
                {disputes} litige{disputes > 1 ? 's' : ''} ouvert{disputes > 1 ? 's' : ''}
              </span>
              <span className="block truncate text-xs text-error-600">
                Les fonds restent bloqués tant que ce n’est pas résolu
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-error-600 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}

        {confirmations > 0 && (
          <Link
            href="/dashboard/reservations?statut=PENDING"
            className="group flex items-center gap-3 rounded-inner border border-warning-500/30 bg-warning-50 p-3.5 transition-colors duration-150 hover:bg-warning-100"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-warning-500/20 text-warning-700">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-warning-700">
                {confirmations} réservation{confirmations > 1 ? 's' : ''} à confirmer
              </span>
              <span className="block truncate text-xs text-warning-600">
                Un voyageur qui attend trop longtemps annule
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-warning-700 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}

        {/* Aucune action en attente, mais des séjours en cours */}
        {actionCount === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            {/* ShieldAlert servait a dire « tout va bien » : un ecusson
                d'alerte pour annoncer l'absence d'alerte. */}
            <span className="grid h-11 w-11 place-items-center rounded-inner bg-success-50 text-success-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-forest-900">Rien à traiter</p>
            <p className="max-w-[16rem] text-xs leading-relaxed text-foreground-muted">
              {inProgress.length > 0
                ? `${inProgress.length} séjour${inProgress.length > 1 ? 's' : ''} en cours, aucune demande en attente.`
                : 'Aucune demande en attente pour le moment.'}
            </p>
          </div>
        )}
      </div>

      {/*
        Les séjours en cours quittent la liste d'actions.

        Un séjour qui se déroule ne demande rien : le mélanger aux litiges et
        aux confirmations faisait que le compteur du haut ne correspondait
        jamais au nombre de lignes affichées.
      */}
      {inProgress.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2.5 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
            Séjours en cours
          </p>
          <ul className="space-y-1">
            {inProgress.slice(0, 3).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/dashboard/reservations/${b.id}`}
                  className="group flex items-center gap-2.5 rounded-inner p-2 transition-colors duration-150 hover:bg-background-alt"
                >
                  <Clock className="h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{b.logement.titre}</span>
                    <span className="block text-xs text-foreground-muted">
                      Départ le {fmtDate(b.dateFin)}
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-foreground-faint transition-colors group-hover:text-forest-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {inProgress.length > 3 && (
            <p className="mt-2 text-center text-xs text-foreground-muted">
              <Link href="/dashboard/reservations?statut=CHECKED_IN" className="font-medium text-forest-700 hover:underline">
                {inProgress.length - 3} autre{inProgress.length - 3 > 1 ? 's' : ''}
              </Link>
            </p>
          )}
        </div>
      )}
    </Shell>
  );
}