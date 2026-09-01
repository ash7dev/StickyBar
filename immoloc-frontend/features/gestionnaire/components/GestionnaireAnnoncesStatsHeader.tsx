'use client';

import { Building2, CheckCircle2, Users, DollarSign } from 'lucide-react';
import { OwnerListing } from '@/features/listings/components/owner/OwnerListingCard';

const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

interface Props {
  listings: OwnerListing[];
}

export function GestionnaireAnnoncesStatsHeader({ listings }: Props) {
  const total = listings.length;
  const actifs = listings.filter((l) => l.statut === 'PUBLISHED').length;

  // Calcul du nombre de propriétaires uniques
  const ownersSet = new Set<string>();
  listings.forEach((l) => {
    if ((l as any).proprietaireId) ownersSet.add((l as any).proprietaireId);
    else if ((l as any).proprietaire?.id) ownersSet.add((l as any).proprietaire.id);
  });

  const totalProprietaires = ownersSet.size;

  // Prix moyen par nuitée
  const sumPrix = listings.reduce((sum, l) => sum + Number(l.prixBase || 0), 0);
  const prixMoyen = total > 0 ? Math.round(sumPrix / total) : 0;

  const cards = [
    {
      title: 'Total sous Gestion',
      value: `${total} bien${total > 1 ? 's' : ''}`,
      icon: Building2,
      sub: 'Mandats conciergerie',
      color: 'bg-forest-50 text-forest-700 border-forest-200/60',
    },
    {
      title: 'Biens en Ligne',
      value: `${actifs} publié${actifs > 1 ? 's' : ''}`,
      icon: CheckCircle2,
      sub: `${total > 0 ? Math.round((actifs / total) * 100) : 0}% du parc actif`,
      color: 'bg-success-50 text-success-700 border-success-200/60',
    },
    {
      title: 'Propriétaires Déléguants',
      value: `${totalProprietaires} partenaire${totalProprietaires > 1 ? 's' : ''}`,
      icon: Users,
      sub: 'Comptes propriétaires',
      color: 'bg-lime-50 text-forest-900 border-lime-300/60',
    },
    {
      title: 'Tarif Moyen Nuitée',
      value: `${fcfa(prixMoyen)} FCFA`,
      icon: DollarSign,
      sub: 'Moyenne du portefeuille',
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
