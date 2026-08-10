'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PendingDisputeItem {
  id: string;
  reservationId: string;
  declarePar: string;
  motif: string;
  description: string;
  coutEstime: number | null;
  creeLe: string;
  logementTitre: string;
  locataireNom: string;
}

interface Props {
  disputes?: PendingDisputeItem[];
  isLoading?: boolean;
}

/* Les motifs bruts (`DEPASSEMENT_PERSONNES`, `LOGEMENT_NON_CONFORME`)
   s'affichaient en majuscules avec des underscores. Même table que sur les
   panneaux de réservation. */
const MOTIFS: Record<string, string> = {
  DEPASSEMENT_PERSONNES: 'Dépassement voyageurs',
  DEGRADATION: 'Dégradation',
  LOGEMENT_NON_CONFORME: 'Non conforme',
  NON_PAIEMENT: 'Non-paiement',
  NUISANCES: 'Nuisances',
  AUTRE: 'Autre motif',
};

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

/** Jours écoulés depuis l'ouverture, en dates civiles. */
function joursDepuis(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function AdminDisputesOverviewCard({ disputes = [], isLoading = false }: Props) {
  /* Les dossiers les plus anciens remontent : c'est l'ordre d'urgence,
     et rien ne garantissait le tri côté API. */
  const { sorted, enRetard } = useMemo(() => {
    const withAge = disputes.map((d) => ({ ...d, jours: joursDepuis(d.creeLe) ?? 0 }));
    return {
      sorted: [...withAge].sort((a, b) => b.jours - a.jours),
      enRetard: withAge.filter((d) => d.jours >= 7).length,
    };
  }, [disputes]);

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border',
            sorted.length > 0
              ? 'border-error-500/25 bg-error-50 text-error-600'
              : 'border-border bg-background-alt text-foreground-muted',
          )}>
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              Litiges à arbitrer
              {sorted.length > 0 && (
                <span className="ml-2 font-normal tabular-nums text-foreground-muted">
                  {sorted.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-foreground-muted">
              Dossiers en attente de décision
            </p>
          </div>
        </div>

        <Link
          href="/admin/litiges"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-link hover:underline"
        >
          Tous les litiges
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </header>

      {/* L'engagement de 7 jours ouvrés est dans tes CGU : un admin doit voir
         qu'il est en train de le rompre. */}
      {enRetard > 0 && (
        <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-error-700">
            <span className="font-semibold tabular-nums">{enRetard}</span> dossier
            {enRetard > 1 ? 's' : ''} ouvert{enRetard > 1 ? 's' : ''} depuis plus de 7 jours.
            Le délai annoncé dans les CGU est dépassé.
          </p>
        </div>
      )}

      {sorted.length > 0 ? (
        <ul className="space-y-2.5">
          {sorted.map((item) => {
            const urgent = item.jours >= 7;
            const attention = item.jours >= 3 && item.jours < 7;

            return (
              <li
                key={item.id}
                className={cn(
                  'flex flex-col gap-3 rounded-inner border p-3.5 sm:flex-row sm:items-center sm:justify-between',
                  urgent ? 'border-error-500/25 bg-error-50' : 'border-border bg-background-alt',
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="shrink-0 rounded-pill border border-error-500/25 bg-background-card px-2 py-0.5 text-xs font-semibold text-error-700">
                      {MOTIFS[item.motif] ?? item.motif.replace(/_/g, ' ').toLowerCase()}
                    </span>

                    <span className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold tabular-nums',
                      urgent
                        ? 'bg-error-600 text-neutral-0'
                        : attention
                          ? 'border border-warning-500/25 bg-warning-50 text-warning-700'
                          : 'border border-border bg-background-card text-foreground-muted',
                    )}>
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {item.jours === 0 ? 'Aujourd’hui' : `${item.jours} j`}
                    </span>

                    <p className="truncate text-xs text-foreground-muted">
                      par {item.declarePar}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {item.logementTitre}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-foreground-muted">
                    {item.locataireNom} — {item.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {/* `item.coutEstime &&` masquait le montant quand il vaut 0,
                     ce qui n'est pas la même chose qu'absent. */}
                  {item.coutEstime !== null && (
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {fcfa(item.coutEstime)} FCFA
                    </span>
                  )}

                  {/* Le lien menait à la liste complète : il fallait
                     retrouver le dossier à la main. */}
                  <Link
                    href={`/admin/litiges/${item.id}`}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Arbitrer
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt p-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill border border-forest-100 bg-forest-50 text-forest-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">Aucun litige en attente</p>
          {/* « Les relations se déroulent sans aucun conflit répertorié » :
             une file vide dit seulement qu'il n'y a rien à arbitrer
             maintenant, pas que tout se passe bien. */}
          <p className="text-xs text-foreground-muted">
            Les dossiers à arbitrer apparaîtront ici.
          </p>
        </div>
      )}
    </section>
  );
}