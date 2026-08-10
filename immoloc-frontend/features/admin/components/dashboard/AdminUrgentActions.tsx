'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Building2, Wallet, Scale, LifeBuoy, ArrowRight,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PendingSummary {
  pendingKyc: number;
  pendingListings: number;
  pendingWithdrawals: number;
  pendingDisputes: number;
  urgentTickets: number;
  totalUrgentActions: number;
}

interface Props {
  summary?: PendingSummary;
  isLoading?: boolean;
}

export function AdminUrgentActions({ summary, isLoading }: Props) {
  const { items, total } = useMemo(() => {
    const list = [
      {
        key: 'kyc',
        title: 'Dossiers KYC',
        count: summary?.pendingKyc ?? 0,
        href: '/admin/kyc',
        icon: ShieldCheck,
        description: 'Pièces d’identité en attente de vérification',
      },
      {
        key: 'listings',
        title: 'Annonces à modérer',
        count: summary?.pendingListings ?? 0,
        href: '/admin/annonces?statut=PENDING_REVIEW',
        icon: Building2,
        description: 'Nouvelles publications en attente de validation',
      },
      {
        key: 'withdrawals',
        title: 'Retraits à traiter',
        count: summary?.pendingWithdrawals ?? 0,
        href: '/admin/finances?onglet=retraits',
        icon: Wallet,
        description: 'Demandes de versement Wave et Orange Money',
      },
      {
        key: 'disputes',
        title: 'Litiges à arbitrer',
        count: summary?.pendingDisputes ?? 0,
        href: '/admin/litiges',
        icon: Scale,
        description: 'Fonds gelés en attente de décision',
      },
      {
        key: 'tickets',
        title: 'Tickets prioritaires',
        count: summary?.urgentTickets ?? 0,
        href: '/admin/support?priorite=URGENTE',
        icon: LifeBuoy,
        description: 'Demandes d’assistance à traiter en priorité',
      },
    ];

    /* Ce qui demande une action remonte : cinq blocs identiques obligeaient
       à lire chaque compteur pour savoir où intervenir. */
    return {
      items: [...list].sort((a, b) => b.count - a.count),
      /* `totalUrgentActions` venait de l'API sans garantie de correspondre
         à la somme des cinq compteurs affichés juste en dessous. */
      total: list.reduce((sum, i) => sum + i.count, 0),
    };
  }, [summary]);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  const rien = total === 0;

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border',
            rien
              ? 'border-forest-100 bg-forest-50 text-forest-700'
              : 'border-error-500/25 bg-error-50 text-error-600',
          )}>
            {rien
              ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              File d’attente
            </h2>
            <p className="text-xs text-foreground-muted">
              {rien
                ? 'Rien en attente de traitement'
                : `${total} élément${total > 1 ? 's' : ''} à traiter`}
            </p>
          </div>
        </div>

        {!rien && (
          <span className="shrink-0 rounded-pill bg-error-600 px-3 py-1 text-xs font-semibold tabular-nums text-neutral-0">
            {total}
          </span>
        )}
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, title, count, href, icon: Icon, description }) => {
          const actif = count > 0;

          return (
            <li key={key}>
              <Link
                href={href}
                className={cn(
                  'group flex h-full flex-col justify-between rounded-inner border p-4 transition-[border-color,background-color] duration-150',
                  actif
                    ? 'border-error-500/25 bg-error-50 hover:border-error-500/40'
                    : 'border-border bg-background-alt hover:border-border-hover hover:bg-background-card',
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    {/* `purple` absent de la palette, `lime-100` sur une
                       carte sans conversion, et cinq couleurs différentes
                       qui ne portaient aucune information : la seule qui
                       compte est « il y a quelque chose ou non ». */}
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border',
                      actif
                        ? 'border-error-500/25 bg-background-card text-error-600'
                        : 'border-border bg-background-card text-foreground-muted',
                    )}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <span className={cn(
                      'font-display text-2xl font-semibold tabular-nums',
                      actif ? 'text-error-700' : 'text-foreground-muted',
                    )}>
                      {count}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-foreground-muted">
                    {description}
                  </p>
                </div>

                {/* « Traiter maintenant » sur une carte à zéro n'a pas de sens. */}
                <p className={cn(
                  'mt-4 flex items-center gap-1 text-xs font-semibold',
                  actif ? 'text-error-700' : 'text-foreground-muted',
                )}>
                  {actif ? 'Traiter' : 'Ouvrir'}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}