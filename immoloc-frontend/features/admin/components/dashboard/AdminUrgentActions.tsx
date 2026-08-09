'use client';

import Link from 'next/link';
import { ShieldCheck, Building2, Wallet, Scale, LifeBuoy, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PendingSummary {
  pendingKyc: number;
  pendingListings: number;
  pendingWithdrawals: number;
  pendingDisputes: number;
  urgentTickets: number;
  totalUrgentActions: number;
}

interface AdminUrgentActionsProps {
  summary?: PendingSummary;
  isLoading?: boolean;
}

export function AdminUrgentActions({ summary, isLoading }: AdminUrgentActionsProps) {
  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  const urgentItems = [
    {
      title: 'Dossiers KYC à vérifier',
      count: summary?.pendingKyc ?? 0,
      href: '/admin/kyc',
      icon: ShieldCheck,
      colorClass: 'border-forest-200 bg-forest-50 text-forest-800',
      description: 'Pièces d’identité et selfies faciaux en attente',
    },
    {
      title: 'Annonces à modérer',
      count: summary?.pendingListings ?? 0,
      href: '/admin/annonces',
      icon: Building2,
      colorClass: 'border-lime-200 bg-lime-100 text-forest-900',
      description: 'Nouvelles annonces créées en PENDING_REVIEW',
    },
    {
      title: 'Retraits Mobile Money',
      count: summary?.pendingWithdrawals ?? 0,
      href: '/admin/finances',
      icon: Wallet,
      colorClass: 'border-purple-200 bg-purple-50 text-purple-800',
      description: 'Demandes de retraits hôtes (Wave / OM)',
    },
    {
      title: 'Litiges à arbitrer',
      count: summary?.pendingDisputes ?? 0,
      href: '/admin/litiges',
      icon: Scale,
      colorClass: 'border-error-200 bg-error-50 text-error-700',
      description: 'Litiges déclarés sur réservation active',
    },
    {
      title: 'Tickets support urgents',
      count: summary?.urgentTickets ?? 0,
      href: '/admin/support',
      icon: LifeBuoy,
      colorClass: 'border-warning-200 bg-warning-50 text-warning-700',
      description: 'Demandes prioritaires assistance voyageurs/hôtes',
    },
  ];

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-600">
            <AlertTriangle className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Actions urgentes requises
            </h2>
            <p className="text-xs text-foreground-muted">
              {summary?.totalUrgentActions ?? 0} élément(s) nécessitant une intervention d'administration
            </p>
          </div>
        </div>

        {summary && summary.totalUrgentActions > 0 && (
          <span className="rounded-pill bg-error-600 px-3 py-1 text-xs font-bold text-neutral-0 tabular-nums">
            {summary.totalUrgentActions} en attente
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {urgentItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex flex-col justify-between rounded-inner border border-border bg-background-alt/50 p-4 transition-all duration-150 hover:border-border-hover hover:bg-background-alt hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('flex h-8 w-8 items-center justify-center rounded-inner border', item.colorClass)}>
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <span
                  className={cn(
                    'rounded-pill px-2.5 py-0.5 text-xs font-bold tabular-nums border',
                    item.count > 0
                      ? 'bg-error-50 text-error-700 border-error-200'
                      : 'bg-background-card text-foreground-muted border-border',
                  )}
                >
                  {item.count}
                </span>
              </div>

              <h3 className="mt-3 text-xs font-semibold text-foreground group-hover:text-forest-800">
                {item.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[0.75rem] text-foreground-muted">
                {item.description}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1 text-[0.75rem] font-semibold text-forest-700 transition-transform group-hover:translate-x-1">
              <span>Traiter maintenant</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
