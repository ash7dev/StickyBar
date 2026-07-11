'use client';

import { useState } from 'react';
import { DayPicker, useDayPicker, type DateRange, type MonthCaptionProps } from 'react-day-picker';
import { fr } from 'react-day-picker/locale';
import { ChevronLeft, ChevronRight, CalendarDays, Check } from 'lucide-react';
import 'react-day-picker/style.css';

function CompactMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useDayPicker();
  const label = calendarMonth.date.toLocaleDateString('fr-FR', {
    month: 'long', year: 'numeric',
  });
  return (
    <div className="flex items-center justify-between px-1 pb-3">
      <button
        type="button"
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-foreground-muted hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        aria-label="Mois précédent"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-black text-foreground capitalize tracking-tight">
        {label}
      </span>
      <button
        type="button"
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-foreground-muted hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
        aria-label="Mois suivant"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

interface Props {
  onRangeChange?: (range: DateRange | undefined) => void;
  disabledDates?: Date[];
  minNights?: number;
  /** Mode single-mois pour la bottom sheet mobile */
  compact?: boolean;
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function AvailabilityCalendar({
  onRangeChange,
  disabledDates = [],
  minNights = 1,
  compact = false,
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleSelect(r: DateRange | undefined) {
    setRange(r);
    onRangeChange?.(r);
  }

  const nights =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  const hasRange = !!(range?.from && range?.to);

  /* ── Mode compact (bottom sheet mobile) ── */
  if (compact) {
    return (
      <div className="rdp-compact">

        {/* Pills DÉPART / RETOUR */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 transition-colors ${
            range?.from
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-background-alt border-border'
          }`}>
            <CalendarDays className={`w-4 h-4 shrink-0 ${range?.from ? 'text-emerald-500' : 'text-foreground-muted'}`} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground-muted leading-none mb-0.5">DÉPART</p>
              <p className={`text-sm font-bold leading-none ${range?.from ? 'text-emerald-800' : 'text-foreground-muted'}`}>
                {range?.from ? fmtShort(range.from) : '—'}
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-border shrink-0" />

          <div className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 transition-colors ${
            range?.to
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-neutral-50 border-neutral-200'
          }`}>
            <CalendarDays className={`w-4 h-4 shrink-0 ${range?.to ? 'text-emerald-500' : 'text-foreground-muted'}`} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-foreground-muted leading-none mb-0.5">RETOUR</p>
              <p className={`text-sm font-bold leading-none ${range?.to ? 'text-emerald-800' : 'text-foreground-muted'}`}>
                {range?.to ? fmtShort(range.to) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Message confirmation */}
        {hasRange ? (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold text-emerald-700">
              {nights} nuit{nights > 1 ? 's' : ''} sélectionnée{nights > 1 ? 's' : ''} — modifiez si besoin
            </p>
          </div>
        ) : (
          <p className="text-xs text-foreground-muted font-medium mb-3 px-1">
            Sélectionnez vos dates d&apos;arrivée et de départ
          </p>
        )}

        {/* Calendrier single-month */}
        <DayPicker
          mode="range"
          locale={fr}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={1}
          startMonth={today}
          disabled={[{ before: today }, ...disabledDates]}
          showOutsideDays={false}
          components={{ MonthCaption: CompactMonthCaption }}
        />

        {/* Légende */}
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2">
          {[
            { color: 'bg-border opacity-40', label: 'Indisponible' },
            { color: 'bg-emerald-500', label: 'Départ / Retour' },
            { color: 'bg-emerald-100', label: 'Plage réservée' },
            { color: 'bg-background-card border border-emerald-400', label: "Aujourd'hui" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3.5 h-3.5 rounded-sm shrink-0 ${color}`} />
              <span className="text-[10px] font-semibold text-foreground-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Effacer les dates */}
        {range?.from && (
          <button
            onClick={() => handleSelect(undefined)}
            className="mt-3 text-xs font-bold text-foreground-muted hover:text-emerald-500 transition-colors underline underline-offset-2"
          >
            Effacer les dates
          </button>
        )}

        <style>{`
          .rdp-compact {
            width: 100%;
          }
          .rdp-compact .rdp-root {
            --rdp-accent-color: #2076F5;
            --rdp-accent-background-color: #EDF4FF;
            font-family: var(--font-sans, Inter, sans-serif);
            width: 100%;
          }
          .rdp-compact .rdp-months {
            display: flex;
            width: 100%;
          }
          .rdp-compact .rdp-month {
            width: 100%;
          }
          .rdp-compact .rdp-month_caption {
            display: none;
          }
          .rdp-compact .rdp-nav {
            display: none;
          }
          .rdp-compact .rdp-table,
          .rdp-compact .rdp-week_number_header,
          .rdp-compact table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .rdp-compact .rdp-weekdays {
            display: flex;
            justify-content: space-between;
            padding: 0 0 0.5rem;
          }
          .rdp-compact .rdp-weekday {
            flex: 1;
            text-align: center;
            font-size: 0.625rem;
            font-weight: 800;
            color: var(--foreground-muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
          .rdp-compact .rdp-weeks {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .rdp-compact .rdp-week {
            display: flex;
            justify-content: space-between;
          }
          .rdp-compact .rdp-day {
            flex: 1;
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--foreground);
            cursor: pointer;
            position: relative;
            border-radius: 0.5rem;
            transition: background 120ms, color 120ms;
          }
          .rdp-compact .rdp-day_button {
            width: 2.25rem;
            height: 2.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }
          .rdp-compact .rdp-day:not(.rdp-disabled):not(.rdp-selected):hover .rdp-day_button {
            background: var(--background-alt);
          }
          /* Sélectionné (start/end) */
          .rdp-compact .rdp-selected:not(.rdp-range_middle) {
            background: transparent;
          }
          .rdp-compact .rdp-selected:not(.rdp-range_middle) .rdp-day_button {
            background: var(--emerald-500);
            color: #fff;
            font-weight: 800;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(32,118,245,0.35);
          }
          /* Range middle */
          .rdp-compact .rdp-range_middle {
            background: var(--emerald-50);
            border-radius: 0;
            color: #1a56c4;
          }
          .rdp-compact .rdp-range_middle .rdp-day_button {
            color: #1a56c4;
            font-weight: 600;
          }
          .rdp-compact .rdp-range_start {
            border-radius: 50% 0 0 50%;
            background: var(--emerald-50);
          }
          .rdp-compact .rdp-range_end {
            border-radius: 0 50% 50% 0;
            background: var(--emerald-50);
          }
          .rdp-compact .rdp-range_start.rdp-range_end {
            border-radius: 50%;
            background: transparent;
          }
          /* Aujourd'hui */
          .rdp-compact .rdp-today:not(.rdp-selected) .rdp-day_button {
            border: 2px solid var(--emerald-500);
            color: var(--emerald-500);
            font-weight: 800;
            border-radius: 50%;
          }
          /* Désactivé */
          .rdp-compact .rdp-disabled {
            opacity: 0.25;
            cursor: not-allowed;
          }
          .rdp-compact .rdp-disabled .rdp-day_button {
            cursor: not-allowed;
          }
          /* Outside days */
          .rdp-compact .rdp-outside {
            opacity: 0;
            pointer-events: none;
          }
        `}</style>
      </div>
    );
  }

  /* ── Mode standard (desktop widget) ── */
  return (
    <div className="bg-background-card rounded-[1.5rem] border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 mb-1">
          <CalendarDays className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-black text-foreground">Disponibilités</span>
        </div>
        {range?.from ? (
          <p className="text-xs font-medium text-foreground-muted">
            {range.from.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            {range.to && range.to !== range.from
              ? ` → ${range.to.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} · `
              : ' — '}
            {nights > 0 && (
              <span className="font-black text-emerald-600">{nights} nuit{nights > 1 ? 's' : ''}</span>
            )}
          </p>
        ) : (
          <p className="text-xs font-medium text-foreground-muted">Sélectionnez vos dates d&apos;arrivée et de départ</p>
        )}
      </div>

      {/* Calendar */}
      <div className="p-4 rdp-immoloc">
        <DayPicker
          mode="range"
          locale={fr}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          startMonth={today}
          disabled={[{ before: today }, ...disabledDates]}
          showOutsideDays={false}
          components={{
            Chevron: ({ orientation }) =>
              orientation === 'left'
                ? <ChevronLeft className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />,
          }}
        />
      </div>

      {minNights > 1 && (
        <div className="px-6 pb-5 pt-2 border-t border-border">
          <p className="text-xs font-medium text-foreground-muted">
            Séjour minimum : <span className="font-black text-foreground">{minNights} nuits</span>
          </p>
        </div>
      )}

      {range?.from && (
        <div className="px-6 pb-5">
          <button
            onClick={() => handleSelect(undefined)}
            className="text-xs font-bold text-foreground-muted hover:text-emerald-500 transition-colors underline underline-offset-2"
          >
            Effacer les dates
          </button>
        </div>
      )}

      <style>{`
        .rdp-immoloc .rdp-root {
          --rdp-accent-color: var(--emerald-500);
          --rdp-accent-background-color: var(--emerald-50);
          font-family: var(--font-sans, Inter, sans-serif);
          width: 100%;
          overflow: hidden;
        }
        .rdp-immoloc .rdp-months {
          display: flex;
          flex-direction: row;
          gap: 1.5rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }
        .rdp-immoloc .rdp-months::-webkit-scrollbar { display: none; }
        .rdp-immoloc .rdp-month { min-width: 100%; scroll-snap-align: start; }
        .rdp-immoloc .rdp-table { width: 100%; max-width: 100%; }
        .rdp-immoloc .rdp-day {
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 500;
          width: 2.25rem;
          height: 2.25rem;
          transition: background 150ms, color 150ms;
        }
        .rdp-immoloc .rdp-day_button {
          width: 100%; height: 100%;
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
        }
        .rdp-immoloc .rdp-selected:not(.rdp-range_middle) .rdp-day_button,
        .rdp-immoloc .rdp-selected:not(.rdp-range_middle) {
          background: var(--emerald-500); color: #fff; font-weight: 700; border-radius: 0.5rem;
        }
        .rdp-immoloc .rdp-range_middle { background: var(--emerald-50); color: var(--emerald-700); border-radius: 0; }
        .rdp-immoloc .rdp-range_start { border-radius: 0.5rem 0 0 0.5rem !important; }
        .rdp-immoloc .rdp-range_end   { border-radius: 0 0.5rem 0.5rem 0 !important; }
        .rdp-immoloc .rdp-range_start.rdp-range_end { border-radius: 0.5rem !important; }
        .rdp-immoloc .rdp-today .rdp-day_button { border: 1.5px solid var(--emerald-400); color: var(--emerald-500); font-weight: 700; }
        .rdp-immoloc .rdp-disabled .rdp-day_button { opacity: 0.3; cursor: not-allowed; }
        .rdp-immoloc .rdp-caption_label { font-size: 0.8125rem; font-weight: 800; color: var(--foreground); letter-spacing: -0.025em; }
        .rdp-immoloc .rdp-weekday { font-size: 0.625rem; font-weight: 700; color: var(--foreground-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .rdp-immoloc .rdp-nav_button {
          border: 1px solid var(--border); border-radius: 0.5rem;
          width: 1.75rem; height: 1.75rem;
          display: flex; align-items: center; justify-content: center;
          color: var(--foreground-muted); transition: border-color 150ms, color 150ms;
        }
        .rdp-immoloc .rdp-nav_button:hover { border-color: var(--emerald-400); color: var(--emerald-500); }
        @media (max-width: 640px) {
          .rdp-immoloc .rdp-months { flex-direction: column; gap: 2rem; }
          .rdp-immoloc .rdp-day { width: 2.5rem; height: 2.5rem; font-size: 0.875rem; }
        }
      `}</style>
    </div>
  );
}
