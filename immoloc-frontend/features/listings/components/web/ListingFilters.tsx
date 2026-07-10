'use client';

import { useState } from 'react';
import { useQueryStates, parseAsString, parseAsInteger, parseAsIsoDate } from 'nuqs';
import {
  SlidersHorizontal, X, ChevronDown, MapPin,
  Minus, Plus, CalendarDays,
} from 'lucide-react';
import type { ListingType } from '@/lib/nestjs';

/* ─── Data ────────────────────────────────────────────────────────────────── */

const VILLES = [
  'Dakar', 'Saly', 'Saint-Louis', 'Mbour',
  'Thiès', 'Ziguinchor', 'Somone', 'Cap Skirring',
];

const TYPES: { value: ListingType | ''; label: string }[] = [
  { value: '',            label: 'Tous'        },
  { value: 'VILLA',       label: 'Villa'       },
  { value: 'APPARTEMENT', label: 'Appartement' },
  { value: 'CHAMBRE',     label: 'Chambre'     },
  { value: 'AUTRES',      label: 'Autres'      },
];

const PRIX_PRESETS = [
  { label: '≤ 25 000',  value: 25_000  },
  { label: '≤ 50 000',  value: 50_000  },
  { label: '≤ 100 000', value: 100_000 },
  { label: '≤ 200 000', value: 200_000 },
];

/* ─── Hook partagé ────────────────────────────────────────────────────────── */

function useFilters() {
  return useQueryStates(
    {
      ville:       parseAsString.withDefault(''),
      type:        parseAsString.withDefault(''),
      dateDebut:   parseAsIsoDate,
      dateFin:     parseAsIsoDate,
      nbPersonnes: parseAsInteger.withDefault(1),
      prixMin:     parseAsInteger,
      prixMax:     parseAsInteger,
    },
    { shallow: false },
  );
}

function countActive(filters: ReturnType<typeof useFilters>[0]) {
  return [
    filters.ville,
    filters.type,
    filters.dateDebut,
    filters.dateFin,
    filters.prixMin,
    filters.prixMax,
    filters.nbPersonnes > 1 ? filters.nbPersonnes : null,
  ].filter(Boolean).length;
}

/* ─── Section label ───────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground-muted mb-2.5">
      {children}
    </p>
  );
}

/* ─── Divider ─────────────────────────────────────────────────────────────── */

function Div() {
  return <div className="border-t border-border" />;
}

/* ─── Panneau de filtres (partagé desktop/mobile) ─────────────────────────── */

function FiltersPanel({ onClose }: { onClose?: () => void }) {
  const [filters, setFilters] = useFilters();
  const active = countActive(filters);

  function reset() {
    setFilters({
      ville: '', type: '', dateDebut: null, dateFin: null,
      nbPersonnes: 1, prixMin: null, prixMax: null,
    });
  }

  const pill = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
      isActive
        ? 'bg-primary-900 text-white shadow-sm'
        : 'bg-background-alt text-foreground-muted hover:bg-border'
    }`;

  return (
    <div className="space-y-5">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-foreground" />
          <span className="text-sm font-black text-foreground">Filtres</span>
          {active > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center leading-none">
              {active}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {active > 0 && (
            <button
              onClick={reset}
              className="text-xs font-bold text-foreground-muted hover:text-error-500 transition-colors"
            >
              Réinitialiser
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-background-alt hover:bg-border flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-foreground-muted" />
            </button>
          )}
        </div>
      </div>

      <Div />

      {/* VILLE */}
      <div>
        <SectionLabel>Zone</SectionLabel>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
          <select
            value={filters.ville}
            onChange={(e) => setFilters({ ville: e.target.value })}
            className="w-full pl-8.5 pr-8 py-2.5 rounded-xl bg-background-alt border border-border text-sm font-semibold text-foreground appearance-none focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          >
            <option value="">Toutes les zones</option>
            {VILLES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
        </div>
      </div>

      <Div />

      {/* TYPE */}
      <div>
        <SectionLabel>Type de logement</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t.value || 'all'}
              onClick={() => setFilters({ type: t.value })}
              className={pill(filters.type === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Div />

      {/* BUDGET */}
      <div>
        <SectionLabel>Budget / nuit (FCFA)</SectionLabel>
        <div className="flex items-center gap-2 mb-2.5">
          <input
            type="number"
            placeholder="Min"
            value={filters.prixMin ?? ''}
            onChange={(e) => setFilters({ prixMin: e.target.value ? parseInt(e.target.value) : null })}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
          <span className="text-foreground-muted font-bold shrink-0">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.prixMax ?? ''}
            onChange={(e) => setFilters({ prixMax: e.target.value ? parseInt(e.target.value) : null })}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-background-alt border border-border text-sm font-semibold text-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRIX_PRESETS.map((p) => {
            const isActive = filters.prixMax === p.value && !filters.prixMin;
            return (
              <button
                key={p.value}
                onClick={() => setFilters({ prixMax: isActive ? null : p.value, prixMin: null })}
                className={pill(isActive)}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <Div />

      {/* DATES */}
      <div>
        <SectionLabel>Dates de séjour</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold text-foreground-muted mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-2.5 h-2.5" /> Arrivée
            </p>
            <input
              type="date"
              value={filters.dateDebut?.toISOString().split('T')[0] ?? ''}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilters({ dateDebut: e.target.value ? new Date(e.target.value) : null })}
              className="w-full px-2.5 py-2 rounded-xl bg-background-alt border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <p className="text-[9px] font-bold text-foreground-muted mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-2.5 h-2.5" /> Départ
            </p>
            <input
              type="date"
              value={filters.dateFin?.toISOString().split('T')[0] ?? ''}
              min={filters.dateDebut?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]}
              onChange={(e) => setFilters({ dateFin: e.target.value ? new Date(e.target.value) : null })}
              className="w-full px-2.5 py-2 rounded-xl bg-background-alt border border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>
      </div>

      <Div />

      {/* CAPACITÉ */}
      <div>
        <SectionLabel>Nombre de personnes min.</SectionLabel>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilters({ nbPersonnes: Math.max(1, filters.nbPersonnes - 1) })}
            disabled={filters.nbPersonnes <= 1}
            className="w-9 h-9 rounded-full border border-border bg-background-alt flex items-center justify-center text-foreground-muted hover:border-primary-900 hover:bg-primary-900 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-black text-foreground tabular-nums">{filters.nbPersonnes}</span>
            <span className="text-xs font-bold text-foreground-muted ml-1.5">
              {filters.nbPersonnes > 1 ? 'personnes' : 'personne'}
            </span>
          </div>
          <button
            onClick={() => setFilters({ nbPersonnes: filters.nbPersonnes + 1 })}
            className="w-9 h-9 rounded-full border border-border bg-background-alt flex items-center justify-center text-foreground-muted hover:border-primary-900 hover:bg-primary-900 hover:text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
}

/* ─── Export Desktop (sidebar) ────────────────────────────────────────────── */

export function ListingFilters() {
  return (
    <div className="bg-background-card rounded-2xl border border-border shadow-sm p-5">
      <FiltersPanel />
    </div>
  );
}

/* ─── Export Mobile (trigger + bottom sheet) ──────────────────────────────── */

export function ListingFiltersMobile() {
  const [open, setOpen] = useState(false);
  const [filters] = useFilters();
  const active = countActive(filters);

  return (
    <>
      <button className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
          active > 0
            ? 'bg-primary-900 border-primary-900 text-white shadow-sm'
            : 'bg-background-card border-border text-foreground hover:border-primary-400'
        }`}>
        <SlidersHorizontal className="w-4 h-4" />
        Filtres
        {active > 0 && (
          <span className="w-5 h-5 rounded-full bg-white/25 text-[10px] font-black flex items-center justify-center leading-none">
            {active}
          </span>
        )}
      </button>

      {/* Bottom sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-background-card rounded-t-3xl max-h-[92dvh] overflow-y-auto shadow-2xl">
            {/* Drag handle */}
            <div className="sticky top-0 bg-background-card pt-3 pb-2 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-5 pb-10">
              <FiltersPanel onClose={() => setOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
