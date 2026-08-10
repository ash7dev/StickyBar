'use client';

import { useState } from 'react';
import {
  Calendar,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Home,
  Check,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
}

const CITIES = ['Toutes les villes', 'Dakar', 'Saly', 'Cap Skirring', 'Saint-Louis', 'Somone', 'Mbour'];
const TYPES = [
  { value: '', label: 'Tous les types de logement' },
  { value: 'APPARTEMENT', label: 'Appartement' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'CHAMBRE', label: 'Chambre' },
  { value: 'MAISON', label: 'Maison' },
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
}: AdminStatsHeaderBarProps) {
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  return (
    <div className="space-y-4">
      {/* Title & Main Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Revenus & Performance Financière Klef
          </h1>
          <p className="text-xs text-foreground-muted">
            Analyse comptable des commissions sur séjours, pénalités perçues et volume global des transactions (GMV).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-pill bg-forest-700 px-4 text-xs font-semibold text-neutral-0 shadow-2xs hover:bg-forest-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Exporter Rapport Financial (CSV)</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center gap-2 rounded-pill border border-border bg-background-card px-4 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Toolbar / Filtres de Période & Custom Calendar */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-forest-700" /> Période :
            </span>

            <button
              type="button"
              onClick={() => { onPresetChange('TODAY'); setShowCustomCalendar(false); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border',
                datePreset === 'TODAY'
                  ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              Aujourd'hui
            </button>

            <button
              type="button"
              onClick={() => { onPresetChange('7DAYS'); setShowCustomCalendar(false); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border',
                datePreset === '7DAYS'
                  ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              7 Derniers Jours
            </button>

            <button
              type="button"
              onClick={() => { onPresetChange('30DAYS'); setShowCustomCalendar(false); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border',
                datePreset === '30DAYS'
                  ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              30 Derniers Jours
            </button>

            <button
              type="button"
              onClick={() => { onPresetChange('THIS_MONTH'); setShowCustomCalendar(false); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border',
                datePreset === 'THIS_MONTH'
                  ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              Ce Mois-ci
            </button>

            <button
              type="button"
              onClick={() => { onPresetChange('THIS_YEAR'); setShowCustomCalendar(false); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border',
                datePreset === 'THIS_YEAR'
                  ? 'border-forest-600 bg-forest-50 text-forest-900 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              Cette Année
            </button>

            <button
              type="button"
              onClick={() => { onPresetChange('CUSTOM'); setShowCustomCalendar(!showCustomCalendar); }}
              className={cn(
                'rounded-pill px-3 py-1 text-xs font-semibold transition-all border inline-flex items-center gap-1',
                datePreset === 'CUSTOM'
                  ? 'border-forest-600 bg-forest-600 text-neutral-0 font-bold'
                  : 'border-border bg-background-card text-foreground-muted hover:bg-background-alt'
              )}
            >
              <span>Personnalisé (Calendrier)</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Location & Property Type Selects */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => onCityChange(e.target.value)}
              className="h-8 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-foreground focus:border-forest-600 focus:outline-hidden"
            >
              {CITIES.map((c) => (
                <option key={c} value={c === 'Toutes les villes' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="h-8 rounded-pill border border-border bg-background-card px-3 text-xs font-semibold text-foreground focus:border-forest-600 focus:outline-hidden"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Calendar Pickers Panel */}
        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-4 bg-background-alt/60 p-3 rounded-inner border border-border text-xs animate-fade-in">
            <div className="flex items-center gap-2">
              <label className="font-bold text-foreground uppercase text-[0.6875rem]">Du :</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onCustomDateChange(e.target.value, endDate)}
                className="h-8 rounded-inner border border-border bg-background-card px-2.5 text-xs text-foreground focus:border-forest-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-bold text-foreground uppercase text-[0.6875rem]">Au :</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onCustomDateChange(startDate, e.target.value)}
                className="h-8 rounded-inner border border-border bg-background-card px-2.5 text-xs text-foreground focus:border-forest-600 focus:outline-hidden"
              />
            </div>

            <span className="text-[0.6875rem] text-foreground-muted italic">
              Période sélectionnée : du {startDate || '—'} au {endDate || '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
