'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Home, ChevronDown, Check } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import {
  ListingCard,
  ListingCardItem,
  ListingCardSkeleton,
  ListingsEmptyState,
  ListingsErrorState,
} from '@/features/listings/components/listing-card';

/* ═══════════════════════════════════════════════════════════════════════════
   Filter Config
   ═══════════════════════════════════════════════════════════════════════════ */

const FILTERS = [
  { id: 'ALL',            label: 'Toutes'      },
  { id: 'PUBLISHED',      label: 'Publiées'    },
  { id: 'PENDING_REVIEW', label: 'En révision' },
  { id: 'DRAFT',          label: 'Brouillons'  },
  { id: 'PAUSED',         label: 'En pause'    },
  { id: 'REJECTED',       label: 'Rejetées'    },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Dropdown Custom
   ═══════════════════════════════════════════════════════════════════════════ */

function FilterDropdown({
  filters, value, onChange,
}: {
  filters: { id: string; label: string; count: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = filters.find((f) => f.id === value)?.label ?? '';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-background-card border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground shadow-sm outline-none hover:border-border-hover transition-all"
      >
        {activeLabel}
        <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-background-card border border-border rounded-2xl shadow-lg overflow-hidden z-50">
          {filters.map((f) => {
            const isActive = f.id === value;
            return (
              <button
                key={f.id}
                onClick={() => { onChange(f.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors text-left ${
                  isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-background-card text-foreground hover:bg-background-alt'
                }`}
              >
                <span>{f.label}</span>
                <div className="flex items-center gap-2">
                  {f.count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-100 text-foreground-muted'}`}>
                      {f.count}
                    </span>
                  )}
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AnnoncesPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const { data: listings, isLoading, error } = useQuery<ListingCard[]>({
    queryKey: ['listings', 'mine'],
    queryFn: () => nestFetch<ListingCard[]>(NEST_API.LISTINGS.LIST_MINE),
  });

  const filtered = listings?.filter((l) =>
    activeFilter === 'ALL' ? true : l.statut === activeFilter
  );

  const filtersWithCount = FILTERS.map((f) => ({
    ...f,
    count: f.id === 'ALL'
      ? (listings?.length ?? 0)
      : (listings?.filter((l) => l.statut === f.id).length ?? 0),
  }));

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Left: icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
            <Home className="w-[18px] h-[18px] text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">Mes annonces</h1>
            <p className="text-sm text-foreground-muted mt-0.5">
              {isLoading
                ? 'Chargement...'
                : `${filtered?.length ?? 0} annonce${(filtered?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Right: filter dropdown */}
        <FilterDropdown
          filters={filtersWithCount}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && <ListingsErrorState />}

      {/* ── Loading ───────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────── */}
      {!isLoading && filtered?.length === 0 && <ListingsEmptyState />}

      {/* ── Grid ──────────────────────────────────────────────── */}
      {!isLoading && filtered && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((listing) => (
            <ListingCardItem key={listing.id} listing={listing} />
          ))}
        </div>
      )}

    </div>
  );
}
