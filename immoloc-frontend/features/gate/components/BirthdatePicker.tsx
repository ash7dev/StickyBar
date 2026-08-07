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

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-3 rounded-field border px-4 py-3 bg-background-alt text-left font-semibold transition-all duration-200 cursor-pointer',
          open
            ? 'border-forest-600 ring-2 ring-forest-500/20 shadow-xs'
            : error
            ? 'border-error-500/50 ring-1 ring-error-500/20'
            : 'border-border hover:border-border-hover hover:bg-background-card',
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-inner flex items-center justify-center shrink-0 transition-colors',
          selected ? 'bg-forest-950 text-on-inverse-marker border border-action-edge' : 'bg-background-card text-foreground-muted border border-border',
        )}>
          <CalendarDays className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {displayDate ? (
            <>
              <p className="eyebrow text-[10px] leading-none mb-0.5">
                Date de naissance
              </p>
              <p className="text-sm font-bold text-foreground capitalize">{displayDate}</p>
            </>
          ) : (
            <p className="text-sm text-foreground-faint font-medium">Sélectionnez votre date de naissance</p>
          )}
        </div>

        <ChevronDown className={cn(
          'w-4 h-4 shrink-0 text-foreground-muted transition-transform duration-200',
          open && 'rotate-180',
        )} />
      </button>

      {/* Popover (Ouverture vers le haut au-dessus du champ pour éviter d'être masqué par la modale) */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-[120] mb-2 overflow-hidden rounded-card border border-border bg-background-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Dark header */}
          <div className="flex items-center gap-2 bg-forest-950 px-4 py-3.5 border-b border-forest-800">
            {/* Month select */}
            <div className="relative flex items-center">
              <select
                value={monthIdx}
                onChange={e => setCurrentMonth(new Date(year, Number(e.target.value)))}
                className="appearance-none bg-transparent text-on-inverse-marker font-display font-bold text-sm cursor-pointer outline-none border-0 pr-5 py-0 leading-tight"
              >
                {MOIS_FR.map((m, i) => (
                  <option key={i} value={i} className="bg-forest-950 text-white font-normal text-sm">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-on-inverse-marker/60 pointer-events-none" />
            </div>

            {/* Year select */}
            <div className="relative flex items-center">
              <select
                value={year}
                onChange={e => setCurrentMonth(new Date(Number(e.target.value), monthIdx))}
                className="appearance-none bg-transparent text-on-inverse-muted font-semibold text-xs cursor-pointer outline-none border-0 pr-5 py-0 leading-tight"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-forest-950 text-white font-normal">
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-0 w-3 h-3 text-on-inverse-muted/60 pointer-events-none" />
            </div>

            {/* Navigation */}
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="w-7 h-7 rounded-inner flex items-center justify-center text-on-inverse-muted hover:text-on-inverse-marker hover:bg-forest-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                disabled={!canGoNext}
                className="w-7 h-7 rounded-inner flex items-center justify-center text-on-inverse-muted hover:text-on-inverse-marker hover:bg-forest-800 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar grid */}
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
              weekday:       'flex-1 text-center text-[10px] font-bold text-foreground-muted uppercase tracking-wider py-1',
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
                    'w-full h-8 rounded-inner text-xs font-semibold transition-all cursor-pointer',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500',
                    modifiers.selected
                      ? 'bg-forest-600 text-on-inverse-marker font-bold shadow-xs scale-105'
                      : modifiers.disabled
                      ? 'text-foreground-faint/40 cursor-not-allowed'
                      : modifiers.outside
                      ? 'text-foreground-faint/60 hover:bg-background-alt'
                      : modifiers.today
                      ? 'text-forest-600 font-extrabold ring-1 ring-forest-500/30 hover:bg-background-alt'
                      : 'text-foreground font-semibold hover:bg-background-alt active:scale-95',
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
