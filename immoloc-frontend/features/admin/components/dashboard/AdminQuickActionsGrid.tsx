'use client';

import Link from 'next/link';
import { Megaphone, Star, RefreshCw, CreditCard, Sliders, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Action {
  title: string;
  description: string;
  href: string;
  icon: typeof Megaphone;
  /* Les opérations qui touchent l'argent ou l'accès d'un utilisateur étaient
     présentées au même niveau qu'un accès au catalogue d'équipements. */
  sensitive?: boolean;
}

const ACTIONS: Action[] = [
  {
    title: 'Diffusion groupée',
    description: 'Envoyer une notification à tous les hôtes ou voyageurs',
    href: '/admin/notifications',
    icon: Megaphone,
    sensitive: true,
  },
  {
    title: 'Modération des avis',
    description: 'Inspecter et supprimer les commentaires inappropriés',
    href: '/admin/avis',
    icon: Star,
  },
  {
    title: 'Débloquer un hôte',
    /* Le lien menait à `/admin/utilisateurs` : il fallait encore chercher
       la personne. Le filtre pré-appliqué amène directement aux comptes
       concernés — à adapter au paramètre que ta page accepte. */
    description: 'Réinitialiser le compteur d’annulations et réactiver ses annonces',
    href: '/admin/utilisateurs?statut=SUSPENDU',
    icon: RefreshCw,
    sensitive: true,
  },
  {
    title: 'Ajuster un wallet',
    description: 'Créditer ou débiter manuellement un solde, avec motif',
    href: '/admin/finances?action=ajustement',
    icon: CreditCard,
    sensitive: true,
  },
  {
    title: 'Catalogue d’équipements',
    description: 'Ajouter ou modifier les équipements proposés aux hôtes',
    href: '/admin/equipements',
    icon: Sliders,
  },
];

export function AdminQuickActionsGrid() {
  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="border-b border-border pb-3">
        <h2 className="font-display text-base font-semibold text-foreground">
          Raccourcis
        </h2>
        <p className="text-xs text-foreground-muted">
          Opérations d’administration fréquentes
        </p>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ title, description, href, icon: Icon, sensitive }) => (
          <li key={title}>
            <Link
              href={href}
              className="group flex h-full items-start gap-3.5 rounded-inner border border-border bg-background-alt p-4 transition-[border-color,background-color] duration-150 hover:border-border-hover hover:bg-background-card"
            >
              <span className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border',
                /* `bg-lime-100` et `bg-purple-50` : le lime signale l'action
                   — or les cinq cartes en sont — et purple n'est pas dans la
                   palette, donc cette pastille n'avait aucune couleur.
                   Les sensibles se distinguent, les autres sont neutres. */
                sensitive
                  ? 'border-warning-500/25 bg-warning-50 text-warning-700'
                  : 'border-border bg-background-card text-foreground-muted',
              )}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  {/* L'icône n'apparaissait qu'au survol : invisible au
                     tactile, où rien n'indiquait que la carte est un lien. */}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                  {description}
                </p>
                {sensitive && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-warning-700">
                    <ShieldAlert className="h-3 w-3 shrink-0" aria-hidden="true" />
                    Action sensible
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}