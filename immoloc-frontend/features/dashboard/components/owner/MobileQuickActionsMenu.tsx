'use client';

import Link from 'next/link';
import {
  Plus,
  CalendarDays,
  Building2,
  Wallet,
  BarChart3,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isPrimary?: boolean;
}

const ACTIONS: QuickActionItem[] = [
  {
    id: 'create-listing',
    title: 'Publier un bien',
    subtitle: 'Ajoutez un nouveau logement à la plateforme',
    icon: Plus,
    href: '/dashboard/annonces/nouvelle',
    isPrimary: true,
  },
  {
    id: 'view-bookings',
    title: 'Voir mes réservations',
    subtitle: 'Gérez vos demandes et séjours en cours',
    icon: CalendarDays,
    href: '/dashboard/reservations',
  },
  {
    id: 'view-listings',
    title: 'Voir mes biens',
    subtitle: 'Ajustez les tarifs, photos et disponibilités',
    icon: Building2,
    href: '/dashboard/annonces',
  },
  {
    id: 'view-wallet',
    title: 'Consulter mon solde',
    subtitle: 'Solde disponible, retraits et historique',
    icon: Wallet,
    href: '/dashboard/wallet',
  },
  {
    id: 'view-stats',
    title: 'Voir mes stats & activités',
    subtitle: 'Taux d\'occupation, revenus et performance',
    icon: BarChart3,
    href: '/dashboard/stats',
  },
  {
    id: 'view-data',
    title: 'Mes données',
    subtitle: 'Compte, sécurité et paramètres du profil',
    icon: ShieldCheck,
    href: '/dashboard/parametres',
  },
];

export function MobileQuickActionsMenu() {
  return (
    <section className="space-y-3">
      <h2 className="eyebrow text-xs font-black uppercase tracking-wider text-foreground-muted px-0.5">
        Actions rapides
      </h2>

      <div className="space-y-2.5">
        {ACTIONS.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className="group flex items-center justify-between rounded-card bg-background-card border border-border/80 p-3.5 sm:p-4 shadow-sm hover:border-forest-600/30 hover:shadow-md transition-[box-shadow,border-color] duration-200 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
                  action.isPrimary
                    ? 'bg-action text-on-action font-black'
                    : 'bg-forest-950 text-on-inverse-marker border border-forest-800'
                )}
              >
                <action.icon className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="font-sans text-sm font-bold text-foreground group-hover:text-forest-700 transition-colors truncate">
                  {action.title}
                </h3>
                <p className="text-xs text-foreground-muted truncate font-medium mt-0.5">
                  {action.subtitle}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4.5 h-4.5 text-foreground-faint group-hover:text-forest-600 transition-colors shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </section>
  );
}
