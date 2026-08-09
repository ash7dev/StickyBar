'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Scale, LifeBuoy, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  statusBadge?: string;
  statusColor?: string;
  link: string;
}

interface RecentActivityData {
  recentUsers?: Array<{ id: string; prenom: string; nom: string; email: string; estProprietaire: boolean; statutKyc: string; creeLe: string }>;
  recentReservations?: Array<{ id: string; statut: string; totalLocataire: number; creeLe: string; locataire: { prenom: string; nom: string }; logement: { titre: string } }>;
  recentDisputes?: Array<{ id: string; statut: string; motif: string; creeLe: string; reservationId: string }>;
  recentTickets?: Array<{ id: string; code: string; sujet: string; priorite: string; statut: string; creeLe: string }>;
}

interface AdminRecentActivityFeedProps {
  activity?: RecentActivityData;
  isLoading?: boolean;
}

export function AdminRecentActivityFeed({ activity, isLoading }: AdminRecentActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<'reservations' | 'users' | 'disputes' | 'tickets'>('reservations');

  if (isLoading) {
    return (
      <div className="h-72 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  const tabs = [
    { id: 'reservations', label: 'Réservations', icon: CalendarDays, count: activity?.recentReservations?.length ?? 0 },
    { id: 'users', label: 'Inscriptions', icon: Users, count: activity?.recentUsers?.length ?? 0 },
    { id: 'disputes', label: 'Litiges', icon: Scale, count: activity?.recentDisputes?.length ?? 0 },
    { id: 'tickets', label: 'Tickets Support', icon: LifeBuoy, count: activity?.recentTickets?.length ?? 0 },
  ] as const;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-card border border-border bg-background-card p-5 shadow-xs sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-forest-700" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Fil d'Activités Récentes
          </h2>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-pill border border-border bg-background-alt p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
                activeTab === tab.id
                  ? 'bg-background-card text-forest-800 shadow-xs'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="rounded-pill bg-forest-50 px-1.5 py-0.5 text-[0.625rem] font-bold text-forest-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="divide-y divide-border">
        {activeTab === 'reservations' && (
          activity?.recentReservations?.length ? (
            activity.recentReservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 transition-colors hover:bg-background-alt/50 rounded-inner">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">{res.logement?.titre ?? 'Logement'}</p>
                    <span className="rounded-pill bg-forest-50 border border-forest-200 px-2 py-0.5 text-[0.625rem] font-bold text-forest-800 uppercase">
                      {res.statut}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">
                    Réglé par {res.locataire?.prenom} {res.locataire?.nom} · <span className="font-semibold text-foreground">{res.totalLocataire?.toLocaleString('fr-FR')} FCFA</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6875rem] text-foreground-muted">{formatDate(res.creeLe)}</span>
                  <Link href={`/admin/reservations`} className="rounded-pill p-1.5 text-foreground-muted hover:bg-background-alt hover:text-forest-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Aucune réservation récente</p>
          )
        )}

        {activeTab === 'users' && (
          activity?.recentUsers?.length ? (
            activity.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 transition-colors hover:bg-background-alt/50 rounded-inner">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">{user.prenom} {user.nom}</p>
                    {user.estProprietaire ? (
                      <span className="rounded-pill bg-purple-50 border border-purple-200 px-2 py-0.5 text-[0.625rem] font-bold text-purple-800 uppercase">
                        Hôte
                      </span>
                    ) : (
                      <span className="rounded-pill bg-background-alt border border-border px-2 py-0.5 text-[0.625rem] font-bold text-foreground-muted uppercase">
                        Voyageur
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6875rem] text-foreground-muted">{formatDate(user.creeLe)}</span>
                  <Link href={`/admin/utilisateurs`} className="rounded-pill p-1.5 text-foreground-muted hover:bg-background-alt hover:text-forest-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Aucune nouvelle inscription récente</p>
          )
        )}

        {activeTab === 'disputes' && (
          activity?.recentDisputes?.length ? (
            activity.recentDisputes.map((dispute) => (
              <div key={dispute.id} className="flex items-center justify-between p-3 transition-colors hover:bg-background-alt/50 rounded-inner">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">Motif: {dispute.motif}</p>
                    <span className="rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-bold text-error-700 uppercase">
                      {dispute.statut}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">Réservation #{dispute.reservationId.substring(0, 8)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6875rem] text-foreground-muted">{formatDate(dispute.creeLe)}</span>
                  <Link href={`/admin/litiges`} className="rounded-pill p-1.5 text-foreground-muted hover:bg-background-alt hover:text-forest-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Aucun litige récent à afficher</p>
          )
        )}

        {activeTab === 'tickets' && (
          activity?.recentTickets?.length ? (
            activity.recentTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 transition-colors hover:bg-background-alt/50 rounded-inner">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">[{ticket.code}] {ticket.sujet}</p>
                    <span className="rounded-pill bg-warning-50 border border-warning-200 px-2 py-0.5 text-[0.625rem] font-bold text-warning-700 uppercase">
                      {ticket.priorite}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">Statut: {ticket.statut}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6875rem] text-foreground-muted">{formatDate(ticket.creeLe)}</span>
                  <Link href={`/admin/support`} className="rounded-pill p-1.5 text-foreground-muted hover:bg-background-alt hover:text-forest-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-foreground-muted">Aucun ticket support récent</p>
          )
        )}
      </div>
    </div>
  );
}
