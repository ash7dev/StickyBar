'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Users, Scale, LifeBuoy, ArrowUpRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RecentActivityData {
  recentUsers?: Array<{
    id: string; prenom: string; nom: string; email: string;
    estProprietaire: boolean; statutKyc: string; creeLe: string;
  }>;
  recentReservations?: Array<{
    id: string; statut: string; totalLocataire: number; creeLe: string;
    locataire: { prenom: string; nom: string }; logement: { titre: string };
  }>;
  recentDisputes?: Array<{
    id: string; statut: string; motif: string; creeLe: string; reservationId: string;
  }>;
  recentTickets?: Array<{
    id: string; code: string; sujet: string; priorite: string; statut: string; creeLe: string;
  }>;
}

interface Props {
  activity?: RecentActivityData;
  isLoading?: boolean;
}

type TabId = 'reservations' | 'users' | 'disputes' | 'tickets';
type Tone = 'neutral' | 'forest' | 'gold' | 'warning' | 'error';

/* Une seule forme pour les quatre onglets : les blocs étaient recopiés à
   l'identique, avec déjà des écarts (préfixes « Motif: », « Statut: »,
   ponctuation collée, libellés d'état vide différents). */
interface Entry {
  id: string;
  title: string;
  subtitle: React.ReactNode;
  badge?: { label: string; tone: Tone };
  date: string;
  href: string;
}

const TONE: Record<Tone, string> = {
  neutral: 'border-border bg-background-alt text-foreground-muted',
  forest: 'border-forest-100 bg-forest-50 text-forest-700',
  gold: 'border-gold-200 bg-gold-50 text-gold-700',
  warning: 'border-warning-500/25 bg-warning-50 text-warning-700',
  error: 'border-error-500/25 bg-error-50 text-error-700',
};

const STATUT_RESERVATION: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  PAID: { label: 'Sous séquestre', tone: 'gold' },
  CONFIRMED: { label: 'Confirmée', tone: 'forest' },
  CHECKED_IN: { label: 'En séjour', tone: 'forest' },
  COMPLETED: { label: 'Terminée', tone: 'neutral' },
  CANCELLED: { label: 'Annulée', tone: 'error' },
  DISPUTED: { label: 'Litige', tone: 'error' },
  EXPIRED: { label: 'Expirée', tone: 'neutral' },
};

const STATUT_LITIGE: Record<string, { label: string; tone: Tone }> = {
  EN_ATTENTE: { label: 'En examen', tone: 'warning' },
  FONDE: { label: 'Fondé', tone: 'error' },
  NON_FONDE: { label: 'Non fondé', tone: 'forest' },
};

const PRIORITE: Record<string, { label: string; tone: Tone }> = {
  URGENTE: { label: 'Urgent', tone: 'error' },
  HAUTE: { label: 'Haute', tone: 'error' },
  NORMALE: { label: 'Normale', tone: 'warning' },
  BASSE: { label: 'Basse', tone: 'neutral' },
};

const fcfa = (n?: number) => (Number(n) || 0).toLocaleString('fr-FR');
const humanize = (s: string) => s.replace(/_/g, ' ').toLowerCase();

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function AdminRecentActivityFeed({ activity, isLoading }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('reservations');

  const entries = useMemo<Record<TabId, Entry[]>>(() => ({
    reservations: (activity?.recentReservations ?? []).map((r) => ({
      id: r.id,
      title: r.logement?.titre ?? 'Logement',
      subtitle: (
        <>
          {[r.locataire?.prenom, r.locataire?.nom].filter(Boolean).join(' ') || 'Locataire'}
          {' · '}
          <span className="font-semibold tabular-nums text-foreground">
            {fcfa(r.totalLocataire)} FCFA
          </span>
        </>
      ),
      badge: STATUT_RESERVATION[r.statut] ?? { label: humanize(r.statut), tone: 'neutral' },
      date: r.creeLe,
      /* Les liens pointaient vers la liste complète : il fallait retrouver
         l'élément à la main après avoir cliqué dessus. */
      href: `/admin/reservations/${r.id}`,
    })),

    users: (activity?.recentUsers ?? []).map((u) => ({
      id: u.id,
      title: [u.prenom, u.nom].filter(Boolean).join(' ') || 'Utilisateur',
      subtitle: u.email,
      badge: u.estProprietaire
        ? { label: 'Propriétaire', tone: 'forest' }
        : { label: 'Voyageur', tone: 'neutral' },
      date: u.creeLe,
      href: `/admin/utilisateurs/${u.id}`,
    })),

    disputes: (activity?.recentDisputes ?? []).map((d) => ({
      id: d.id,
      title: humanize(d.motif).replace(/^./, (c) => c.toUpperCase()),
      subtitle: `Réservation ${d.reservationId.slice(0, 8).toUpperCase()}`,
      badge: STATUT_LITIGE[d.statut] ?? { label: humanize(d.statut), tone: 'neutral' },
      date: d.creeLe,
      href: `/admin/litiges/${d.id}`,
    })),

    tickets: (activity?.recentTickets ?? []).map((t) => ({
      id: t.id,
      title: `${t.code} — ${t.sujet}`,
      subtitle: humanize(t.statut).replace(/^./, (c) => c.toUpperCase()),
      badge: PRIORITE[t.priorite] ?? { label: humanize(t.priorite), tone: 'neutral' },
      date: t.creeLe,
      href: `/admin/support/${t.id}`,
    })),
  }), [activity]);

  const TABS: { id: TabId; label: string; icon: typeof CalendarDays; empty: string }[] = [
    { id: 'reservations', label: 'Réservations', icon: CalendarDays, empty: 'Aucune réservation récente' },
    { id: 'users', label: 'Inscriptions', icon: Users, empty: 'Aucune inscription récente' },
    { id: 'disputes', label: 'Litiges', icon: Scale, empty: 'Aucun litige récent' },
    { id: 'tickets', label: 'Support', icon: LifeBuoy, empty: 'Aucun ticket récent' },
  ];

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-card border border-border bg-background-alt" />;
  }

  const current = entries[activeTab];
  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm sm:p-6">

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-foreground">
            Activité récente
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Type d’activité"
          className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-pill border border-border bg-background-alt p-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const count = entries[id].length;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-background-card text-forest-700 shadow-sm'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
                {count > 0 && (
                  <span className="rounded-pill bg-forest-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-forest-700">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {current.length === 0 ? (
        <p className="py-8 text-center text-xs text-foreground-muted">{currentTab.empty}</p>
      ) : (
        <ul className="divide-y divide-border">
          {current.map((entry) => (
            <li key={entry.id}>
              {/* La ligne entière est cliquable : seule la petite flèche
                 l'était, sur une zone de 16 px. */}
              <Link
                href={entry.href}
                className="group flex items-center justify-between gap-3 rounded-inner p-3 transition-colors hover:bg-background-alt"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.title}
                    </p>
                    {entry.badge && (
                      <span className={cn(
                        'shrink-0 rounded-pill border px-2 py-0.5 text-xs font-semibold',
                        TONE[entry.badge.tone],
                      )}>
                        {entry.badge.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-foreground-muted">
                    {entry.subtitle}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <time dateTime={entry.date} className="text-xs tabular-nums text-foreground-muted">
                    {formatDate(entry.date)}
                  </time>
                  <ArrowUpRight
                    className="h-4 w-4 text-foreground-muted transition-colors group-hover:text-forest-700"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}