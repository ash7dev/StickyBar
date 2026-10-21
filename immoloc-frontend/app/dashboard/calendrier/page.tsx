'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Building2, ChevronLeft, ChevronRight, Lock, Plus } from 'lucide-react';
import type { OwnerCalendarEvent } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { OwnerCalendarTimeline } from '@/features/calendar/components/OwnerCalendarTimeline';
import { BlockDatesDialog, type BlockDraft } from '@/features/calendar/components/BlockDatesDialog';
import { CalendarEventDialog } from '@/features/calendar/components/CalendarEventDialog';
import { useOwnerCalendar } from '@/features/calendar/hooks/use-owner-calendar';
import { addDays, formatShort, startOfWeek, todayDay, type Day } from '@/features/calendar/lib/days';
import { LEGEND_ORDER, STATUS_META } from '@/features/calendar/lib/event-styles';

/** 4 semaines affichées, navigation par 2 semaines. */
const DAY_COUNT = 28;
const STEP_DAYS = 14;

export default function OwnerCalendarPage() {
  const today = todayDay();
  const [start, setStart] = useState<Day>(() => startOfWeek(today));
  const end = addDays(start, DAY_COUNT);

  const { data, isLoading, isError, error, refetch, isFetching } = useOwnerCalendar(start, end);

  // `null` = fenêtre fermée ; `key` force un état neuf à chaque ouverture
  const [blockDialog, setBlockDialog] = useState<{ key: number; draft: BlockDraft | null } | null>(null);
  const [openedEvent, setOpenedEvent] = useState<OwnerCalendarEvent | null>(null);

  const openBlockDialog = useCallback((draft: BlockDraft | null) => {
    setBlockDialog({ key: Date.now(), draft });
  }, []);

  const handleSelectRange = useCallback(
    (logementId: string, rangeStart: Day, rangeEnd: Day) =>
      openBlockDialog({ logementIds: [logementId], start: rangeStart, end: rangeEnd }),
    [openBlockDialog],
  );

  const logements = useMemo(() => data?.logements ?? [], [data]);
  const openedLogement = useMemo(
    () => logements.find((l) => l.id === openedEvent?.logementId),
    [logements, openedEvent],
  );

  const isCurrentPeriod = start === startOfWeek(today);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-1.5 text-foreground-muted">Gestion</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Calendrier
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Tous vos logements sur une seule vue. Glissez sur des jours libres pour les bloquer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openBlockDialog(null)}
          disabled={logements.length === 0}
          className="btn-primary self-start px-5 py-2.5 text-sm sm:self-auto"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Bloquer des dates
        </button>
      </header>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStart((s) => addDays(s, -STEP_DAYS))}
            className="btn-ghost h-10 w-10 p-0"
            aria-label="Deux semaines plus tôt"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setStart((s) => addDays(s, STEP_DAYS))}
            className="btn-ghost h-10 w-10 p-0"
            aria-label="Deux semaines plus tard"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setStart(startOfWeek(today))}
            disabled={isCurrentPeriod}
            className="btn-ghost h-10 px-4 text-sm"
          >
            Aujourd’hui
          </button>
          <p className="ml-1 text-sm font-medium text-foreground" aria-live="polite">
            {formatShort(start)} – {formatShort(addDays(end, -1))}
            {isFetching && !isLoading && (
              <span className="ml-2 text-xs text-foreground-muted">Mise à jour…</span>
            )}
          </p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label="Légende">
          {LEGEND_ORDER.map((status) => (
            <li key={status} className="flex items-center gap-1.5 text-xs text-foreground-muted">
              <span className={cn('h-2.5 w-2.5 rounded-pill', STATUS_META[status].dot)} aria-hidden="true" />
              {STATUS_META[status].label}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <CalendarSkeleton />
      ) : isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-card border border-border bg-background-card p-10 text-center"
        >
          <AlertCircle className="h-8 w-8 text-error-500" aria-hidden="true" />
          <p className="text-sm text-foreground">
            {error instanceof Error ? error.message : 'Impossible de charger le calendrier.'}
          </p>
          <button type="button" onClick={() => refetch()} className="btn-ghost px-5 py-2.5 text-sm">
            Réessayer
          </button>
        </div>
      ) : logements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-background-card p-10 text-center">
          <Building2 className="h-8 w-8 text-foreground-muted" aria-hidden="true" />
          <div>
            <p className="font-semibold text-foreground">Aucun logement pour l’instant</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Publiez votre première annonce pour gérer ses disponibilités ici.
            </p>
          </div>
          <Link href="/dashboard/annonces/nouvelle" className="btn-primary px-5 py-2.5 text-sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer une annonce
          </Link>
        </div>
      ) : (
        <OwnerCalendarTimeline
          logements={logements}
          events={data?.events ?? []}
          start={start}
          dayCount={DAY_COUNT}
          today={today}
          onSelectRange={handleSelectRange}
          onEventClick={setOpenedEvent}
        />
      )}

      {blockDialog && (
        <BlockDatesDialog
          key={blockDialog.key}
          onClose={() => setBlockDialog(null)}
          logements={logements}
          draft={blockDialog.draft}
        />
      )}
      <CalendarEventDialog
        event={openedEvent}
        logement={openedLogement}
        onClose={() => setOpenedEvent(null)}
      />
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-card border border-border bg-background-card"
      aria-busy="true"
      aria-label="Chargement du calendrier"
    >
      <div className="h-[4.25rem] border-b border-border bg-neutral-50" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-3 border-b border-border px-3 last:border-b-0">
          <div className="h-10 w-10 animate-pulse rounded-inner bg-neutral-100" />
          <div className="h-3 w-32 animate-pulse rounded-pill bg-neutral-100" />
          <div
            className="ml-auto h-10 animate-pulse rounded-inner bg-neutral-100"
            style={{ width: `${30 + ((i * 17) % 40)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
