'use client';

import { useCallback, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, LogOut, Moon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Event {
  id: string;
  dateDebut?: string;
  dateFin?: string;
  locataire: { prenom: string; nom: string };
  logement: { titre: string };
}

interface Props {
  checkins: Event[];
  checkouts: Event[];
}

/* Semaine au lundi. `getDay()` renvoie 0 pour dimanche : sans décalage, le
   calendrier s'affichait à l'américaine et chaque date tombait dans la
   mauvaise colonne. */
const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
  'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Clé de date civile, insensible au fuseau. */
const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parse = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function DashboardCalendar({ checkins, checkouts }: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => key(today));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  /* Index par jour : arrivées, départs, et jours occupés entre les deux. */
  const index = useMemo(() => {
    const arrivals = new Map<string, Event[]>();
    const departures = new Map<string, Event[]>();
    const occupied = new Set<string>();

    const push = (map: Map<string, Event[]>, k: string, e: Event) => {
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    };

    for (const e of checkins) {
      const start = parse(e.dateDebut);
      if (!start) continue;
      push(arrivals, key(start), e);

      /* Occupation continue : le calendrier ne montrait que les deux
         extrémités, donc un séjour de dix nuits apparaissait comme deux
         points isolés. */
      const end = parse(e.dateFin);
      if (end) {
        const cursor = new Date(start);
        while (cursor < end) {
          occupied.add(key(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }
      }
    }

    for (const e of checkouts) {
      const end = parse(e.dateFin);
      if (end) push(departures, key(end), e);
    }

    return { arrivals, departures, occupied };
  }, [checkins, checkouts]);

  /* Le compteur additionnait tous les mois confondus. */
  const occupiedThisMonth = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return [...index.occupied].filter((k) => k.startsWith(prefix)).length;
  }, [index.occupied, year, month]);

  const cells = useMemo(() => {
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array<null>(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
  }, [year, month]);

  const goToday = useCallback(() => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(key(today));
  }, [today]);

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);

  const dayArrivals = index.arrivals.get(selected) ?? [];
  const dayDepartures = index.departures.get(selected) ?? [];
  const isTodaySelected = selected === key(today);

  return (
    <section className="klef-rise space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm lg:p-6">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">Agenda</h2>
            <p className="text-xs text-foreground-muted">
              <span className="tabular-nums">{occupiedThisMonth}</span> nuit
              {occupiedThisMonth > 1 ? 's' : ''} occupée{occupiedThisMonth > 1 ? 's' : ''} ce mois
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isTodaySelected && (
            <button
              type="button"
              onClick={goToday}
              className="rounded-pill border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt"
            >
              Aujourd’hui
            </button>
          )}
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            aria-label="Mois précédent"
            className="flex h-8 w-8 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            aria-live="polite"
            className="min-w-[120px] text-center font-display text-sm font-semibold text-foreground"
          >
            {MONTHS_FR[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            aria-label="Mois suivant"
            className="flex h-8 w-8 items-center justify-center rounded-pill border border-border bg-background-alt text-foreground transition-colors hover:bg-background-card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px]">

        {/* ── Grille ─────────────────────────────────────────────────────── */}

        <div>
          <div className="mb-2 grid grid-cols-7">
            {DAYS_FR.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} aria-hidden="true" />;

              const date = new Date(year, month, day);
              const k = key(date);
              const isToday = k === key(today);
              const isSelected = k === selected;
              const arrivals = index.arrivals.has(k);
              const departures = index.departures.has(k);
              const occupied = index.occupied.has(k);

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  aria-pressed={isSelected}
                  aria-label={`${day} ${MONTHS_FR[month]}${arrivals ? ', arrivée' : ''}${departures ? ', départ' : ''}`}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center rounded-inner text-xs font-semibold tabular-nums transition-colors',
                    isSelected
                      ? 'bg-forest-800 text-neutral-50'
                      : isToday
                        ? 'border-2 border-forest-600 text-foreground'
                        : occupied
                          ? 'bg-forest-50 text-forest-800 hover:bg-forest-100'
                          : 'text-foreground hover:bg-background-alt',
                  )}
                >
                  {day}
                  <span className="mt-0.5 flex h-1.5 gap-1">
                    {arrivals && (
                      <span className={cn('h-1.5 w-1.5 rounded-pill', isSelected ? 'bg-neutral-50' : 'bg-forest-600')} />
                    )}
                    {departures && (
                      <span className={cn('h-1.5 w-1.5 rounded-pill', isSelected ? 'bg-neutral-50/60' : 'bg-warning-500')} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-forest-600" />
              Arrivée
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-pill bg-warning-500" />
              Départ
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="h-3 w-3 rounded-[4px] bg-forest-50 ring-1 ring-forest-100" />
              Occupé
            </span>
          </div>
        </div>

        {/* ── Détail du jour ─────────────────────────────────────────────── */}

        <div className="space-y-3 border-t border-border pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {isTodaySelected ? 'Aujourd’hui' : 'Jour sélectionné'}
            </p>
            <p className="font-display text-sm font-semibold text-foreground">
              {selectedDate.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </p>
          </div>

          <DayList icon={LogIn} tone="forest" label="Arrivées" events={dayArrivals} />
          <DayList icon={LogOut} tone="warning" label="Départs" events={dayDepartures} />

          {index.occupied.has(selected) && !dayArrivals.length && !dayDepartures.length && (
            <p className="flex items-center gap-1.5 rounded-inner border border-border bg-background-alt p-3 text-xs text-foreground-muted">
              <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Séjour en cours, aucun mouvement prévu
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function DayList({
  icon: Icon, tone, label, events,
}: {
  icon: typeof LogIn;
  tone: 'forest' | 'warning';
  label: string;
  events: Event[];
}) {
  return (
    <div className="space-y-1.5 rounded-inner border border-border bg-background-alt p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
        <Icon
          className={cn('h-3.5 w-3.5 shrink-0', tone === 'forest' ? 'text-forest-600' : 'text-warning-600')}
          aria-hidden="true"
        />
        {label}
        <span className="ml-auto tabular-nums text-foreground-muted">{events.length}</span>
      </p>

      {events.length === 0 ? (
        <p className="text-xs text-foreground-muted">Aucun</p>
      ) : (
        <ul className="space-y-1.5">
          {events.map((e) => (
            <li key={e.id} className="pt-1">
              <p className="truncate font-display text-xs font-semibold text-foreground">
                {e.logement.titre}
              </p>
              <p className="text-xs text-foreground-muted">
                {e.locataire.prenom} {e.locataire.nom?.charAt(0)}.
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}