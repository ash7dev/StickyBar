'use client';

import { Award, Building2, UserCheck, Inbox } from 'lucide-react';

export interface TopPerformerHost {
  id: string;
  nom: string;
  email: string;
  statutKyc: string;
  totalLogements: number;
}

interface AdminTopPerformersProps {
  performers?: TopPerformerHost[];
  isLoading?: boolean;
}

export function AdminTopPerformers({ performers = [], isLoading = false }: AdminTopPerformersProps) {
  if (isLoading) {
    return (
      <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-gold-50 border border-gold-200 text-gold-700">
            <Award className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Top Hôtes Performants
            </h2>
            <p className="text-xs text-foreground-muted">
              Hôtes vérifiés possédant le plus grand nombre de logements actifs
            </p>
          </div>
        </div>

        <span className="rounded-pill bg-gold-50 border border-gold-200 px-2.5 py-0.5 text-xs font-semibold text-gold-800">
          Partenaires Klef
        </span>
      </div>

      {performers.length > 0 ? (
        <div className="space-y-3">
          {performers.map((host, idx) => (
            <div
              key={host.id}
              className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt/40 p-3 transition-colors hover:bg-background-alt"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-bold text-neutral-0">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">{host.nom}</p>
                    {host.statutKyc === 'VERIFIE' && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-1.5 py-0.2 rounded-pill">
                        <UserCheck className="h-3 w-3" /> Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-[0.75rem] text-foreground-muted truncate">
                    {host.email}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-foreground">
                  {host.totalLogements} logement{host.totalLogements > 1 ? 's' : ''}
                </p>
                <span className="text-[0.6875rem] font-medium text-forest-700">
                  Annonces actives
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-background-alt text-foreground-muted">
            <Inbox className="h-5 w-5" />
          </span>
          <p className="text-xs font-semibold text-foreground">Aucun hôte enregistré</p>
          <p className="text-[0.75rem] text-foreground-muted">Les partenaires hôtes s'afficheront ici au fur et à mesure.</p>
        </div>
      )}
    </div>
  );
}
