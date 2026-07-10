'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'react-day-picker/locale';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  value?: string;  // YYYY-MM-DD
  onChange: (val: string) => void;
  error?: boolean;
}

const TODAY     = new Date();
const MAX_DATE  = new Date(TODAY.getFullYear() - 18, TODAY.getMonth(), TODAY.getDate());
const MIN_YEAR  = TODAY.getFullYear() - 100;

const MOIS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function BirthdatePicker({ value, onChange, error }: Props) {
  const [open, setOpen]               = useState(false);
  const ref                           = useRef<HTMLDivElement>(null);
  const selected                      = value ? parseIso(value) : undefined;
  const [currentMonth, setCurrentMonth] = useState<Date>(selected ?? MAX_DATE);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  /* ── Helpers ── */
  const monthIdx = currentMonth.getMonth();
  const year     = currentMonth.getFullYear();

  const years = Array.from(
    { length: MAX_DATE.getFullYear() - MIN_YEAR + 1 },
    (_, i) => MAX_DATE.getFullYear() - i,
  );

  const canGoPrev = new Date(year, monthIdx - 1, 1) >= new Date(MIN_YEAR, 0, 1);
  const canGoNext = new Date(year, monthIdx + 1, 1) <= new Date(MAX_DATE.getFullYear(), MAX_DATE.getMonth(), 1);

  function prevMonth() { if (canGoPrev) setCurrentMonth(new Date(year, monthIdx - 1)); }
  function nextMonth() { if (canGoNext) setCurrentMonth(new Date(year, monthIdx + 1)); }

  function handleSelect(date: Date | undefined) {
    if (date) { onChange(toIso(date)); setOpen(false); }
  }

  const displayDate = selected?.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <div ref={ref} className="relative">

      {/* ── Trigger ─────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-3 rounded-xl border px-4 py-3 bg-white text-left',
          'transition-all duration-200',
          open
            ? 'border-primary-400 ring-2 ring-primary-100 shadow-sm'
            : error
            ? 'border-rose-300 ring-1 ring-rose-100'
            : 'border-border hover:border-neutral-300 hover:shadow-sm',
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200',
          selected ? 'bg-primary-50 text-primary-500' : 'bg-neutral-100 text-neutral-400',
        )}>
          <CalendarDays className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {displayDate ? (
            <>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-0.5">
                Date de naissance
              </p>
              <p className="text-sm font-bold text-neutral-900 capitalize">{displayDate}</p>
            </>
          ) : (
            <p className="text-sm text-neutral-400">Sélectionnez votre date de naissance</p>
          )}
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 shrink-0 text-neutral-400 transition-transform duration-200',
          open && 'rotate-180',
        )} />
      </button>

      {/* ── Popover ──────────────────────────────────────────────────────── */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-2xl shadow-black/10">

          {/* ── Dark header ── */}
          <div className="flex items-center gap-2 bg-neutral-900 px-4 py-3.5">

            {/* Month select */}
            <div className="relative flex items-center">
              <select
                value={monthIdx}
                onChange={e => setCurrentMonth(new Date(year, Number(e.target.value)))}
                className={cn(
                  'appearance-none bg-transparent text-white font-black text-base',
                  'cursor-pointer outline-none border-0 pr-5 py-0 leading-tight',
                )}
              >
                {MOIS_FR.map((m, i) => (
                  <option key={i} value={i} className="bg-white text-neutral-900 font-normal text-sm">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            </div>

            {/* Year select */}
            <div className="relative flex items-center">
              <select
                value={year}
                onChange={e => setCurrentMonth(new Date(Number(e.target.value), monthIdx))}
                className={cn(
                  'appearance-none bg-transparent text-white/65 font-semibold text-sm',
                  'cursor-pointer outline-none border-0 pr-5 py-0 leading-tight',
                )}
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white text-neutral-900 font-normal">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 w-3 h-3 text-white/35 pointer-events-none" />
            </div>

            {/* Navigation */}
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canGoPrev}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  'text-white/60 hover:text-white hover:bg-white/10',
                  'disabled:opacity-20 disabled:cursor-not-allowed',
                  'transition-all duration-150',
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={!canGoNext}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  'text-white/60 hover:text-white hover:bg-white/10',
                  'disabled:opacity-20 disabled:cursor-not-allowed',
                  'transition-all duration-150',
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Calendar grid ── */}
          <DayPicker
            mode="single"
            locale={fr}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selected}
            onSelect={handleSelect}
            hideNavigation
            disabled={{ after: MAX_DATE }}
            classNames={{
              root:          'px-4 pb-4 pt-3',
              months:        '',
              month:         '',
              month_caption: 'hidden',
              nav:           'hidden',
              month_grid:    'w-full',
              weekdays:      'flex mb-2',
              weekday:       'flex-1 text-center text-[10px] font-black text-neutral-400 uppercase tracking-wider py-1',
              weeks:         'flex flex-col gap-0.5',
              week:          'flex',
              day:           'flex-1 flex items-center justify-center p-px',
              day_button:    '',
              selected:      '',
              today:         '',
              outside:       '',
              disabled:      '',
              focused:       '',
              hidden:        'invisible',
            }}
            components={{
              DayButton: ({ modifiers, children, ...props }) => (
                <button
                  {...props}
                  className={cn(
                    'w-full h-9 rounded-xl text-sm transition-all duration-100',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
                    modifiers.selected
                      ? 'bg-primary-500 text-white font-black shadow-md shadow-primary-500/30 scale-[1.08]'
                      : modifiers.disabled
                      ? 'text-neutral-300 cursor-not-allowed'
                      : modifiers.outside
                      ? 'text-neutral-300 hover:bg-neutral-50 font-medium'
                      : modifiers.today
                      ? 'text-primary-600 font-black ring-2 ring-primary-200 ring-inset hover:bg-primary-50'
                      : 'text-neutral-700 font-medium hover:bg-neutral-100 active:scale-95',
                  )}
                >
                  {children}
                </button>
              ),
            }}
          />

        </div>
      )}
    </div>
  );
}
