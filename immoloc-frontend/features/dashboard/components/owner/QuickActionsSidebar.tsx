'use client';

import { CalendarCheck, MessageSquareWarning, PlusCircle, Wallet, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

const ACTIONS = [
  {
    icon: CalendarCheck,
    label: 'Confirmer réservations',
    sub: 'Accepter les demandes payées',
    href: '/dashboard/reservations?statut=PENDING',
  },
  {
    icon: MessageSquareWarning,
    label: 'Déclarer un litige',
    sub: 'Signaler un problème sur un séjour',
    href: '/dashboard/litiges/nouveau',
  },
  {
    icon: PlusCircle,
    label: 'Ajouter un bien',
    sub: 'Mettre un nouveau bien en ligne',
    href: '/dashboard/annonces/nouvelle',
  },
  {
    icon: Wallet,
    label: 'Retirer des fonds',
    sub: 'Accéder au portefeuille',
    href: '/dashboard/wallet',
  },
];

export function QuickActionsSidebar() {
  return (
    <div className="klef-rise bg-background-card rounded-card p-5 lg:p-6 border border-border/80 shadow-sm hover:border-forest-600/30 hover:shadow-md transition-[box-shadow,border-color] duration-200 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/60">
        <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-lime-400" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-forest-950">Actions rapides</h3>
          <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Raccourcis essentiels</p>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="space-y-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-between p-3.5 rounded-inner bg-background-alt border border-border/80 hover:bg-background-card hover:border-forest-600/30 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-lime-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display text-xs font-bold text-forest-950 truncate">
                    {action.label}
                  </h4>
                  <p className="text-[10px] text-foreground-muted font-medium truncate">
                    {action.sub}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
