'use client';

import { Users, Building2, Wallet, CheckCircle2 } from 'lucide-react';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface OwnerItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  logementsCount: number;
  soldeDisponible: number;
}

interface Props {
  owners: OwnerItem[];
}

export function GestionnaireProprietairesStatsHeader({ owners }: Props) {
  const totalProprietaires = owners.length;
  const totalLogements = owners.reduce((sum, o) => sum + (o.logementsCount || 0), 0);
  const totalSolde = owners.reduce((sum, o) => sum + Number(o.soldeDisponible || 0), 0);
  const activeOwners = owners.filter((o) => o.soldeDisponible > 0).length;

  const cards = [
    {
      title: 'Propriétaires Partenaires',
      value: `${totalProprietaires} bailleur${totalProprietaires > 1 ? 's' : ''}`,
      icon: Users,
      sub: 'Comptes sous mandat',
      color: 'bg-forest-50 text-forest-700 border-forest-200/60',
    },
    {
      title: 'Logements Sous Mandat',
      value: `${totalLogements} bien${totalLogements > 1 ? 's' : ''}`,
      icon: Building2,
      sub: 'Gestion déléguée',
      color: 'bg-lime-50 text-forest-900 border-lime-300/60',
    },
    {
      title: 'Solde Cumulé à Reverser',
      value: `${fcfa(totalSolde)} FCFA`,
      icon: Wallet,
      sub: 'Portefeuilles propriétaires',
      color: 'bg-success-50 text-success-700 border-success-200/60',
    },
    {
      title: 'Bailleurs à Reverser',
      value: `${activeOwners} compte${activeOwners > 1 ? 's' : ''}`,
      icon: CheckCircle2,
      sub: 'Solde disponible > 0 FCFA',
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
