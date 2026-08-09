'use client';

import Link from 'next/link';
import { Megaphone, Star, RefreshCw, CreditCard, Sliders, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function AdminQuickActionsGrid() {
  const actions = [
    {
      title: 'Diffusion Broadcast',
      description: 'Envoyer une notification Push/SMS groupée à tous les hôtes ou voyageurs',
      href: '/admin/notifications',
      icon: Megaphone,
      iconBg: 'bg-forest-50 border-forest-200 text-forest-800',
    },
    {
      title: 'Modération des Avis',
      description: 'Inspecter les commentaires récents et supprimer les avis inappropriés',
      href: '/admin/avis',
      icon: Star,
      iconBg: 'bg-gold-50 border-gold-200 text-gold-700',
    },
    {
      title: 'Réinitialisation Fautes',
      description: 'Réinitialiser le compteur d’annulations d’un hôte et débloquer ses annonces',
      href: '/admin/utilisateurs',
      icon: RefreshCw,
      iconBg: 'bg-lime-100 border-lime-200 text-forest-900',
    },
    {
      title: 'Ajustement Wallet',
      description: 'Créditer ou débiter manuellement le solde d’un utilisateur avec motif',
      href: '/admin/finances',
      icon: CreditCard,
      iconBg: 'bg-purple-50 border-purple-200 text-purple-800',
    },
    {
      title: 'Catalogue Équipements',
      description: 'Ajouter ou modifier les équipements disponibles pour les logements',
      href: '/admin/equipements',
      icon: Sliders,
      iconBg: 'bg-background-alt border-border text-foreground-muted',
    },
  ];

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Raccourcis Administrateur
        </h2>
        <p className="text-xs text-foreground-muted">
          Accès direct aux opérations fréquentes d'administration
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex items-start gap-3.5 rounded-inner border border-border bg-background-alt/40 p-4 transition-all duration-150 hover:border-border-hover hover:bg-background-alt hover:shadow-xs"
          >
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border shadow-2xs', action.iconBg)}>
              <action.icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <h3 className="truncate text-xs font-semibold text-foreground group-hover:text-forest-800">
                  {action.title}
                </h3>
                <ArrowUpRight className="h-3.5 w-3.5 text-foreground-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-1 line-clamp-2 text-[0.75rem] text-foreground-muted">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
