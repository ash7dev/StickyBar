'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoleStore } from '@/stores/role.store';
import { Bookmark, ChevronDown, Check } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import {
  ReservationCardItem,
  ReservationCardSkeleton,
  ReservationsEmptyState,
  ReservationsErrorState,
  type Reservation,
} from '@/features/reservations/components/reservation-card';

/* ═══════════════════════════════════════════════════════════════════════════
   Filter Config
   ═══════════════════════════════════════════════════════════════════════════ */

const FILTERS = [
  { id: 'ALL',        label: 'Toutes'     },
  { id: 'PENDING',    label: 'En attente' },
  { id: 'CONFIRMED',  label: 'Confirmées' },
  { id: 'CHECKED_IN', label: 'En cours'   },
  { id: 'COMPLETED',  label: 'Terminées'  },
  { id: 'CANCELLED',  label: 'Annulées'   },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Filter Dropdown
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
        className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-700 shadow-sm outline-none hover:border-neutral-300 transition-all"
      >
        {activeLabel}
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-2xl shadow-xl shadow-neutral-200/60 overflow-hidden z-50">
          {filters.map((f) => {
            const isActive = f.id === value;
            return (
              <button
                key={f.id}
                onClick={() => { onChange(f.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors text-left ${
                  isActive ? 'bg-primary-50 text-primary-600' : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{f.label}</span>
                <div className="flex items-center gap-2">
                  {f.count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500'}`}>
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
   Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ReservationsPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const { activeRole } = useRoleStore();

  const { data: allReservations, isLoading, error } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine', activeRole],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
  });

  const reservations = allReservations?.filter((r) => r.statut !== 'EXPIRED');

  const filteredReservations = reservations?.filter((r) =>
    activeFilter === 'ALL' ? true : r.statut === activeFilter
  );

  const pendingCount = reservations?.filter((r) => r.statut === 'PENDING').length ?? 0;

  const filtersWithCount = FILTERS.map((f) => ({
    ...f,
    count: f.id === 'ALL'
      ? (reservations?.length ?? 0)
      : (reservations?.filter((r) => r.statut === f.id).length ?? 0),
  }));

  return (
    <div className="space-y-6">

      {/* ── Header + Filter (same row) ────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Left: icon + title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm shrink-0">
            <Bookmark className="w-[18px] h-[18px] text-primary-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900">Réservations</h1>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black shrink-0">
                  {pendingCount} en attente
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">
              {isLoading
                ? 'Chargement...'
                : `${filteredReservations?.length ?? 0} résultat${(filteredReservations?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Right: dropdown filter */}
        <FilterDropdown
          filters={filtersWithCount}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && <ReservationsErrorState />}

      {/* ── Loading Skeletons ─────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <ReservationCardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────── */}
      {!isLoading && filteredReservations?.length === 0 && <ReservationsEmptyState />}

      {/* ── List ──────────────────────────────────────────────── */}
      {!isLoading && filteredReservations && filteredReservations.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredReservations.map((reservation) => (
            <ReservationCardItem key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}

    </div>
  );
}
