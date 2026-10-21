'use client';

import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { useOwnerCalendar } from '@/features/calendar/hooks/use-owner-calendar';
import { addDays, eachDay, formatWeekday, dayOfMonth, todayDay, type Day } from '@/features/calendar/lib/days';
import { OCCUPYING_STATUSES } from '@/features/calendar/lib/event-styles';
import { Tile, TileSkeleton, TileTitle } from './Tile';

const HORIZON = 14;

/** Même requête pour les deux tuiles (React Query déduplique). */
function useUpcoming() {
  const today = todayDay();
  const end = addDays(today, HORIZON);
  return { today, end, ...useOwnerCalendar(today, end) };
}

// ── Aujourd'hui ─────────────────────────────────────────────────────────────

const STAY_STATUSES = new Set(['CONFIRMED', 'CHECKED_IN', 'COMPLETED']);

export function TodayTile() {
  const { today, data, isLoading } = useUpcoming();
  if (isLoading) return <TileSkeleton />;

  const titles = new Map((data?.logements ?? []).map((l) => [l.id, l.titre]));
  const stays = (data?.events ?? []).filter(
    (e): e is Extract<OwnerCalendarEvent, { kind: 'RESERVATION' }> =>
      e.kind === 'RESERVATION' && STAY_STATUSES.has(e.statut),
  );
  const arrivals = stays.filter((e) => e.start === today);
  const departures = stays.filter((e) => e.end === today);
  const moves = [
    ...departures.map((e) => ({ e, kind: 'DEPARTURE' as const })),
    ...arrivals.map((e) => ({ e, kind: 'ARRIVAL' as const })),
  ];

  return (
    <Tile labelledBy="home-today">
      <TileTitle id="home-today">Aujourd’hui</TileTitle>
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl bg-forest-50 px-4 py-3">
          <p className="font-display text-3xl font-semibold text-forest-700">{arrivals.length}</p>
          <p className="text-xs text-forest-700">arrivée{arrivals.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-success-50 px-4 py-3">
          <p className="font-display text-3xl font-semibold text-success-700">{departures.length}</p>
          <p className="text-xs text-success-700">départ{departures.length > 1 ? 's' : ''}</p>
        </div>
      </div>
      {moves.length === 0 ? (
        <p className="text-[13px] text-foreground-muted">Aucun mouvement aujourd’hui. Profitez-en.</p>
      ) : (
        <ul className="space-y-2">
          {moves.map(({ e, kind }) => (
            <li key={`${kind}-${e.id}`}>
              <Link
                href={`/dashboard/reservations/${e.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2.5 transition-colors hover:border-border-hover"
              >
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-pill',
                    kind === 'ARRIVAL' ? 'bg-forest-50 text-forest-700' : 'bg-success-50 text-success-700',
                  )}
                >
                  {kind === 'ARRIVAL' ? <LogIn className="h-4 w-4" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {e.locataire.prenom} {kind === 'ARRIVAL' ? 'arrive' : 'part'}
                  </span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {titles.get(e.logementId)}
                    {kind === 'DEPARTURE' ? ' · état des lieux de sortie' : ''}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  );
}

// ── Planning 14 jours ───────────────────────────────────────────────────────

type CellState = 'free' | 'booked' | 'pending' | 'blocked';

const CELL_STYLE: Record<CellState, string> = {
  free: 'bg-neutral-100',
  booked: 'bg-forest-600',
  pending: 'bg-gold-400',
  blocked: 'calendar-block-stripes border border-neutral-300',
};

const CELL_LABEL: Record<CellState, string> = {
  free: 'libre',
  booked: 'réservé',
  pending: 'demande à décider',
  blocked: 'bloqué',
};

function nightState(events: OwnerCalendarEvent[], day: Day): CellState {
  for (const e of events) {
    if (e.start > day || e.end <= day) continue;
    if (e.kind === 'BLOCK') return 'blocked';
    if (e.statut === 'PAID' || e.statut === 'PENDING') return 'pending';
    if (OCCUPYING_STATUSES.has(e.statut) || e.statut === 'COMPLETED') return 'booked';
  }
  return 'free';
}

export function PlanningTile() {
  const { today, data, isLoading } = useUpcoming();
  if (isLoading) return <TileSkeleton span={2} />;

  const days = eachDay(today, HORIZON);
  const logements: OwnerCalendarLogement[] = data?.logements ?? [];
  const events = data?.events ?? [];

  return (
    <Tile span={2} labelledBy="home-planning">
      <div className="flex items-center justify-between gap-3">
        <TileTitle id="home-planning">Vos {HORIZON} prochains jours</TileTitle>
        <Link href="/dashboard/calendrier" className="text-[13px] font-semibold text-link hover:text-link-hover">
          Ouvrir le calendrier →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th scope="col" className="w-36"><span className="sr-only">Logement</span></th>
              {days.map((day) => (
                <th
                  key={day}
                  scope="col"
                  className={cn('text-center text-[10px] font-medium', day === today ? 'text-forest-700' : 'text-foreground-muted')}
                >
                  <span className="block capitalize">{formatWeekday(day).slice(0, 2)}</span>
                  <span className="block text-xs font-semibold">{dayOfMonth(day)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logements.map((l) => {
              const own = events.filter((e) => e.logementId === l.id);
              return (
                <tr key={l.id}>
                  <th scope="row" title={l.titre} className="truncate pr-2 text-left text-[13px] font-semibold text-foreground">
                    {l.titre}
                  </th>
                  {days.map((day) => {
                    const state = nightState(own, day);
                    return (
                      <td key={day} className="p-0">
                        <span className={cn('block h-7 rounded-md', CELL_STYLE[state])} title={`${l.titre} · ${CELL_LABEL[state]}`}>
                          <span className="sr-only">{CELL_LABEL[state]}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted" aria-label="Légende">
        {(['booked', 'pending', 'blocked', 'free'] as CellState[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', CELL_STYLE[s])} aria-hidden="true" />
            <span className="first-letter:uppercase">{CELL_LABEL[s]}</span>
          </li>
        ))}
      </ul>
    </Tile>
  );
}
