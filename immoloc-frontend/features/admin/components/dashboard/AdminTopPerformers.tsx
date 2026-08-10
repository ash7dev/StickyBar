'use client';

import { Award, UserCheck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TopPerformerHost {
  id: string;
  nom: string;
  email: string;
  statutKyc: string;
  totalLogements: number;
}

interface Props {
  performers?: TopPerformerHost[];
  isLoading?: boolean;
}

export function AdminTopPerformers({ performers = [], isLoading = false }: Props) {
  if (isLoading) {
    return <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex items-center gap-2.5 border-b border-border pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-gold-200 bg-gold-50 text-gold-700">
          <Award className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-foreground">
            Hôtes les plus actifs
          </h2>
          {/* Le sous-titre annonçait « hôtes vérifiés » alors que rien ne le
             garantit : le badge n'apparaît que si le KYC est validé, donc un
             hôte non vérifié pouvait figurer dans une liste qui se présente
             comme filtrée. Et « Partenaires Klef » désignait un statut qui
             n'existe pas dans le produit. */}
          <p className="text-xs text-foreground-muted">
            Classement par nombre de logements publiés
          </p>
        </div>
      </header>

      {performers.length > 0 ? (
        <ol className="space-y-3">
          {performers.map((host, idx) => {
            const verified = host.statutKyc === 'VERIFIE';

            return (
              <li
                key={host.id}
                className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt p-3 transition-colors hover:border-border-hover"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {/* Les trois premiers se distinguent : un classement où
                     toutes les positions ont le même poids visuel n'en est
                     pas vraiment un. */}
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-inner font-display text-xs font-semibold tabular-nums',
                      idx === 0
                        ? 'bg-gold-400 text-forest-900'
                        : idx < 3
                          ? 'bg-forest-700 text-neutral-0'
                          : 'border border-border bg-background-card text-foreground-muted',
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{host.nom}</p>
                      {verified ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-1.5 py-0.5 text-xs font-semibold text-gold-700">
                          <UserCheck className="h-3 w-3" aria-hidden="true" />
                          Vérifié
                        </span>
                      ) : (
                        /* L'absence de badge ne se remarque pas dans une
                           liste : un admin doit voir qu'un hôte publie sans
                           KYC validé, c'est précisément l'anomalie à repérer. */
                        <span className="inline-flex shrink-0 items-center rounded-pill border border-warning-500/25 bg-warning-50 px-1.5 py-0.5 text-xs font-semibold text-warning-700">
                          KYC en attente
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-foreground-muted">{host.email}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {host.totalLogements}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    logement{host.totalLogements > 1 ? 's' : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt p-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill border border-border bg-background-card text-foreground-muted">
            <Inbox className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-foreground">Aucun hôte pour le moment</p>
          <p className="text-xs text-foreground-muted">
            Le classement apparaîtra dès les premières publications.
          </p>
        </div>
      )}
    </section>
  );
}