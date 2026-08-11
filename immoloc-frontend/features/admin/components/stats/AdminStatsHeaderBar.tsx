'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DateRangeCalendar, fmtDateFr } from './DateRangeCalendar';

export type DatePreset = 'TODAY' | '7DAYS' | '30DAYS' | 'THIS_MONTH' | 'THIS_YEAR' | 'CUSTOM';

interface AdminStatsHeaderBarProps {
  datePreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  startDate: string;
  endDate: string;
  onCustomDateChange: (start: string, end: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCsv: () => void;
  /** Villes réellement présentes en base. À défaut, la liste ci-dessous. */
  cities?: string[];
}

/* ⚠ Liste figée dans le composant : une nouvelle ville ouverte à la
   réservation n'apparaîtra pas dans le filtre tant que ce fichier n'est pas
   modifié. À alimenter depuis l'API via le prop `cities`. */
const VILLES_PAR_DEFAUT = ['Dakar', 'Saly', 'Cap Skirring', 'Saint-Louis', 'Somone', 'Mbour'];

const TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'APPARTEMENT', label: 'Appartement' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'CHAMBRE', label: 'Chambre' },
  { value: 'MAISON', label: 'Maison' },
];

/* Six boutons copiés-collés à l'identique, à un libellé près. */
const PERIODES: { id: Exclude<DatePreset, 'CUSTOM'>; label: string }[] = [
  { id: 'TODAY', label: "Aujourd'hui" },
  { id: '7DAYS', label: '7 jours' },
  { id: '30DAYS', label: '30 jours' },
  { id: 'THIS_MONTH', label: 'Ce mois' },
  { id: 'THIS_YEAR', label: 'Cette année' },
];

export function AdminStatsHeaderBar({
  datePreset,
  onPresetChange,
  startDate,
  endDate,
  onCustomDateChange,
  selectedCity,
  onCityChange,
  selectedType,
  onTypeChange,
  onRefresh,
  isRefreshing,
  onExportCsv,
  cities,
}: AdminStatsHeaderBarProps) {
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  /* `showCustomCalendar` existait mais le panneau s'affichait sur
     `datePreset === 'CUSTOM'` : le second clic sur « Personnalisé » basculait
     un état que personne ne lisait, et le panneau restait ouvert. Un seul
     état pilote désormais l'ouverture. */
  useEffect(() => {
    if (!calendrierOuvert) return;
    const auClic = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setCalendrierOuvert(false);
    };
    document.addEventListener('mousedown', auClic);
    return () => document.removeEventListener('mousedown', auClic);
  }, [calendrierOuvert]);

  const villes = cities?.length ? cities : VILLES_PAR_DEFAUT;

  const chip =
    'rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors';
  const chipInactif =
    'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground';
  const chipActif = 'border-forest-600 bg-forest-600 text-neutral-0';

  const champ =
    'h-9 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-foreground transition-colors focus:border-forest-600 focus:outline-none';

  return (
    <div className="space-y-4">
      {/* ── Titre et actions ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Revenus et performance
          </h1>
          <p className="mt-1 max-w-xl text-xs text-foreground-muted">
            Commissions perçues, pénalités retenues et volume brut des transactions.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Recharger les données"
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} aria-hidden />
            Actualiser
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            aria-label="Exporter le rapport financier au format CSV"
            className="btn-primary h-9 px-4 text-xs"
          >
            <Download className="h-4 w-4" aria-hidden />
            {/* « Rapport Financial » : anglicisme. */}
            <span className="hidden sm:inline">Exporter le rapport</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Période">
            <span className="eyebrow mr-1 flex items-center gap-1.5 text-[0.6875rem]">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Période
            </span>

            {PERIODES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                aria-pressed={datePreset === id}
                onClick={() => {
                  onPresetChange(id);
                  setCalendrierOuvert(false);
                }}
                className={cn(chip, datePreset === id ? chipActif : chipInactif)}
              >
                {label}
              </button>
            ))}

            {/* ── Calendrier personnalisé ──────────────────────────────── */}
            <div className="relative" ref={zone}>
              <button
                type="button"
                aria-pressed={datePreset === 'CUSTOM'}
                aria-expanded={calendrierOuvert}
                aria-haspopup="dialog"
                onClick={() => {
                  onPresetChange('CUSTOM');
                  setCalendrierOuvert((v) => !v);
                }}
                className={cn(
                  chip,
                  'inline-flex items-center gap-1.5',
                  datePreset === 'CUSTOM' ? chipActif : chipInactif,
                )}
              >
                {/* Le panneau affichait les dates ISO brutes
                    (« du 2026-08-01 au 2026-08-11 »). */}
                {datePreset === 'CUSTOM' && startDate && endDate
                  ? `${fmtDateFr(startDate)} – ${fmtDateFr(endDate)}`
                  : 'Personnalisé'}
                <ChevronDown
                  className={cn('h-3 w-3 transition-transform', calendrierOuvert && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {calendrierOuvert && (
                <div
                  role="dialog"
                  aria-label="Choisir une plage de dates"
                  className="absolute left-0 top-full z-50 mt-2 w-[min(38rem,calc(100vw-2rem))] rounded-card border border-border bg-background-card p-4 shadow-xl"
                >
                  <DateRangeCalendar
                    start={startDate}
                    end={endDate}
                    onChange={(d, f) => {
                      onCustomDateChange(d, f);
                      setCalendrierOuvert(false);
                    }}
                    onClose={() => setCalendrierOuvert(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="filtre-ville" className="sr-only">Filtrer par ville</label>
            <select
              id="filtre-ville"
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className={champ}
            >
              <option value="">Toutes les villes</option>
              {villes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <label htmlFor="filtre-type" className="sr-only">Filtrer par type de logement</label>
            <select
              id="filtre-type"
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className={champ}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}