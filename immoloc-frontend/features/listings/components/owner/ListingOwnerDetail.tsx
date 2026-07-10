'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Pencil, Eye, Pause, Play, Send, Star,
  MapPin, Bed, Bath, Users, Moon, Home,
  TrendingUp, TrendingDown, CalendarCheck, ImageOff, Sparkles,
  ChevronLeft, ChevronRight, Info, Clock, DoorOpen,
  Calendar, Activity, Share2, CheckCircle2, Zap,
  Armchair, ChefHat, Wifi, Shield, Trees, Accessibility,
  Percent, UserPlus, BadgePercent, Tag, Camera, X, Lock,
} from 'lucide-react';
import type { ListingDetail } from '@/lib/nestjs/types';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { ListingStatusBadge } from '@/features/listings/components/listing-status-badge';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function noteStr(n: unknown): string {
  const v = Number(n);
  return isNaN(v) ? '—' : v.toFixed(1);
}

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement', VILLA: 'Villa', CHAMBRE: 'Chambre', AUTRES: 'Autres',
};

/* ─── Statut reservations ─────────────────────────────────────────────────── */

const STATUT_CFG: Record<string, { label: string; dot: string; text: string }> = {
  PENDING:    { label: 'En attente', dot: 'bg-amber-400',   text: 'text-amber-600' },
  PAID:       { label: 'Payée',      dot: 'bg-emerald-400', text: 'text-emerald-600' },
  CONFIRMED:  { label: 'Confirmée',  dot: 'bg-blue-400',    text: 'text-blue-600' },
  CHECKED_IN: { label: 'En cours',   dot: 'bg-emerald-500', text: 'text-emerald-700' },
  COMPLETED:  { label: 'Terminée',   dot: 'bg-neutral-400', text: 'text-neutral-500' },
  CANCELLED:  { label: 'Annulée',    dot: 'bg-rose-400',    text: 'text-rose-600' },
  DISPUTED:   { label: 'Litige',     dot: 'bg-rose-600',    text: 'text-rose-700' },
};

/* ─── Donut chart ─────────────────────────────────────────────────────────── */

const DONUT_SEGMENTS = [
  { key: 'COMPLETED',  label: 'Terminées',  color: '#10b981' },
  { key: 'CHECKED_IN', label: 'En cours',   color: '#3b82f6' },
  { key: 'CONFIRMED',  label: 'Confirmées', color: '#8b5cf6' },
  { key: 'PAID',       label: 'Payées',     color: '#f59e0b' },
];

function buildDonutPath(cx: number, cy: number, R: number, r: number, sa: number, ea: number) {
  const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
  const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
  const x3 = cx + r * Math.cos(ea), y3 = cy + r * Math.sin(ea);
  const x4 = cx + r * Math.cos(sa), y4 = cy + r * Math.sin(sa);
  const large = ea - sa > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${large} 0 ${x4} ${y4} Z`;
}

/* ─── Revenue + Donut — DARK CARD ─────────────────────────────────────────── */

function MiniRevenueChart({ revenue, reservations }: { revenue: number; reservations: Reservation[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 350); return () => clearTimeout(t); }, []);

  const segments = DONUT_SEGMENTS.map(s => ({
    ...s,
    value: reservations.filter(r => r.statut === s.key).reduce((sum, r) => sum + r.totalLocataire * 0.85, 0),
    count: reservations.filter(r => r.statut === s.key).length,
  })).filter(s => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const isEmpty = segments.length === 0;

  const CX = 70, CY = 70, R = 56, INNER = 35, GAP = 0.05;
  let angle = -Math.PI / 2;
  const arcs = (isEmpty
    ? [{ key: 'empty', label: '', color: 'rgba(255,255,255,0.08)', value: 1, count: 0 }]
    : segments
  ).map((seg, idx) => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const startA = angle + (isEmpty ? 0 : GAP / 2);
    const endA   = angle + sweep - (isEmpty ? 0 : GAP / 2);
    angle += sweep;
    return { ...seg, startA, endA, idx };
  });

  const months = ['déc.', 'jan.', 'fév.', 'mars', 'avr.', 'mai'];
  const pattern = [0, 0.05, 0.12, 0.25, 0.5, 1];
  const bars = pattern.map((r, i) => ({ label: months[i], value: Math.round(revenue * r) }));
  const maxBar = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] border border-white/[0.07] shadow-2xl">
      {/* blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.18em]">Performance</p>
            <h3 className="text-base font-black text-white leading-tight">Évolution des revenus</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.07] border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] font-bold text-white/60">6 derniers mois</span>
        </div>
      </div>

      <div className="h-px bg-white/[0.07] mx-6" />

      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_1px_1fr]">
        {/* Bar chart */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.14em]">Mensuel</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-white">{fcfa(revenue)}</span>
              <span className="text-xs font-bold text-white/40">FCFA</span>
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {bars.map((b, i) => {
              const h = (b.value / maxBar) * 100;
              const isLast = i === bars.length - 1;
              const isMid  = i === bars.length - 2;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className="w-full rounded-lg overflow-hidden relative"
                      style={{ height: visible ? `${Math.max(h, 5)}%` : '0%', transition: `height 0.65s cubic-bezier(.4,0,.2,1) ${i * 70}ms` }}
                    >
                      <div className={cn(
                        'absolute inset-0',
                        isLast ? 'bg-gradient-to-t from-blue-500 to-blue-400' :
                        isMid  ? 'bg-gradient-to-t from-blue-800 to-blue-700' :
                                 'bg-white/[0.06]',
                      )} />
                    </div>
                  </div>
                  <span className={cn('text-[10px] font-semibold', isLast ? 'text-blue-400 font-bold' : 'text-white/25')}>
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.07] flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400">+100%</span>
            </div>
            <span className="text-[11px] text-white/30">vs début de période</span>
          </div>
        </div>

        <div className="hidden sm:block bg-white/[0.05] my-5" />

        {/* Donut */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.14em] mb-4">Par étape</p>
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 160 160" className="w-36 h-36">
              {arcs.map(arc => (
                <path
                  key={arc.key}
                  d={buildDonutPath(CX, CY, R, INNER, arc.startA, arc.endA)}
                  fill={arc.color}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'scale(1)' : 'scale(0.75)',
                    transformOrigin: `${CX}px ${CY}px`,
                    transition: `opacity 0.55s ${arc.idx * 100}ms, transform 0.55s cubic-bezier(.4,0,.2,1) ${arc.idx * 100}ms`,
                  }}
                />
              ))}
              <circle cx={CX} cy={CY} r={INNER - 2} fill="#0a0a0a" />
              <text x={CX} y={CY - 8} textAnchor="middle" fill="white" fontSize="14" fontWeight="900">
                {reservations.length}
              </text>
              <text x={CX} y={CY + 7} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontWeight="700" letterSpacing="1">
                RÉSERV.
              </text>
            </svg>
          </div>
          <div className="space-y-2.5">
            {isEmpty ? (
              <p className="text-xs text-white/30 text-center py-2">Aucune donnée</p>
            ) : segments.map((seg, i) => (
              <div key={seg.key} className="flex items-center gap-2.5"
                style={{ opacity: visible ? 1 : 0, transition: `opacity 0.4s ${350 + i * 80}ms` }}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                <span className="text-xs font-medium text-white/60 flex-1 truncate">{seg.label}</span>
                <span className="text-xs font-black text-white/80">{seg.count}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-white/[0.07] text-white/50">
                  {Math.round((seg.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Calendar — LIGHT CARD (interactive owner) ──────────────────────────── */

const DAYS_FR   = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

type Indispo = { id: string; dateDebut: string; dateFin: string; motif?: string | null };

function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ListingCalendar({ listingId, reservations }: { listingId: string; reservations: Reservation[] }) {
  const qc    = useQueryClient();
  const today = new Date();
  const todayStr = isoDay(today);

  const [viewDate, setViewDate]         = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectStart, setSelectStart]   = useState<string | null>(null);
  const [selectEnd, setSelectEnd]       = useState<string | null>(null);
  const [hoverDay, setHoverDay]         = useState<string | null>(null);
  const [motif, setMotif]               = useState('');
  const [selectedIndispo, setSelectedIndispo] = useState<Indispo | null>(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  const { data: calData } = useQuery<{ indisponibilites: Indispo[] }>({
    queryKey: ['calendrier', listingId],
    queryFn:  () => nestFetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/calendrier/${listingId}`),
    staleTime: 30_000,
  });

  const [blockError, setBlockError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (body: { dateDebut: string; dateFin: string; motif?: string }) =>
      nestFetch(NEST_API.CALENDRIER.CREATE(listingId), { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendrier', listingId] });
      setSelectStart(null);
      setSelectEnd(null);
      setMotif('');
      setBlockError(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erreur lors du blocage';
      setBlockError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (indispoId: string) =>
      nestFetch(NEST_API.CALENDRIER.DELETE(listingId, indispoId), { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendrier', listingId] });
      setSelectedIndispo(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erreur lors du déblocage';
      setBlockError(msg);
    },
  });

  // Build reserved set (from reservations)
  const reservedSet = new Set<string>();
  for (const r of reservations) {
    if (['CANCELLED', 'DISPUTED'].includes(r.statut)) continue;
    const cur = new Date(r.dateDebut);
    const end = new Date(r.dateFin);
    while (cur <= end) {
      reservedSet.add(isoDay(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Build blocked set from indisponibilites
  const blockedMap = new Map<string, Indispo>();
  for (const indispo of calData?.indisponibilites ?? []) {
    const cur = new Date(indispo.dateDebut);
    const end = new Date(indispo.dateFin);
    while (cur <= end) {
      blockedMap.set(isoDay(cur), indispo);
      cur.setDate(cur.getDate() + 1);
    }
  }

  function dayKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function handleDayClick(day: number) {
    const key  = dayKey(day);
    const date = new Date(year, month, day);

    // Blocked → show unblock panel
    if (blockedMap.has(key)) {
      setSelectedIndispo(blockedMap.get(key)!);
      setSelectStart(null);
      setSelectEnd(null);
      return;
    }
    // Reserved or past → no interaction
    if (reservedSet.has(key) || date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return;

    // Si une plage est déjà confirmée → recommencer
    if (selectEnd) {
      setSelectStart(key);
      setSelectEnd(null);
      setHoverDay(null);
      setSelectedIndispo(null);
      return;
    }

    if (!selectStart) {
      // 1er clic
      setSelectStart(key);
      setSelectedIndispo(null);
    } else if (selectStart === key) {
      // Désélectionner
      setSelectStart(null);
      setHoverDay(null);
    } else {
      // 2ème clic → fixer la fin
      setSelectEnd(key);
      setHoverDay(null);
    }
  }

  function handleDayHover(day: number) {
    if (!selectStart || selectEnd) return;
    setHoverDay(dayKey(day));
  }

  function isInSelection(key: string) {
    if (!selectStart) return false;
    const cursor = selectEnd ?? hoverDay ?? selectStart;
    const [a, b] = selectStart <= cursor ? [selectStart, cursor] : [cursor, selectStart];
    return key >= a && key <= b;
  }

  const pendingRange = !!(selectStart && selectEnd);

  function submitBlock() {
    if (!selectStart) return;
    const end = selectEnd ?? selectStart;
    const [a, b] = selectStart <= end ? [selectStart, end] : [end, selectStart];
    createMutation.mutate({ dateDebut: a, dateFin: b, motif: motif.trim() || undefined });
  }

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-[24px] border border-neutral-200/60 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-neutral-900">Disponibilités</h3>
            <p className="text-[10px] text-neutral-400 font-medium">Cliquez pour bloquer des dates</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-7 h-7 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center transition-all">
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />
          </button>
          <span className="text-xs font-black text-neutral-700 uppercase tracking-wider w-28 text-center">
            {MONTHS_FR[month].slice(0, 3)}. {year}
          </span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-7 h-7 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 flex items-center justify-center transition-all">
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>
      </div>

      <div className="px-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_FR.map(d => (
            <div key={d} className="py-1 text-center text-[10px] font-black text-neutral-300 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const key        = dayKey(day);
            const isToday    = key === todayStr;
            const isReserved = reservedSet.has(key);
            const isBlocked  = blockedMap.has(key);
            const inSel      = isInSelection(key);
            const isStart    = key === selectStart;
            const isPast     = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button
                key={day}
                type="button"
                disabled={isReserved || isPast}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => handleDayHover(day)}
                onMouseLeave={() => setHoverDay(null)}
                className={cn(
                  'aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all select-none',
                  isPast     ? 'text-neutral-200 cursor-default' :
                  isReserved ? 'bg-primary-500/10 text-primary-700 font-bold border border-primary-200/50 cursor-default' :
                  isBlocked  ? 'bg-amber-100 text-amber-700 font-bold border border-amber-200' :
                  isStart    ? 'bg-primary-600 text-white font-black shadow-md shadow-primary-500/30 scale-110' :
                  inSel      ? 'bg-primary-100 text-primary-700 font-bold' :
                  isToday    ? 'bg-neutral-900 text-white font-black shadow-md' :
                               'text-neutral-600 hover:bg-neutral-100 cursor-pointer',
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-4 pt-4 border-t border-neutral-100 pb-4">
          {[
            { cls: 'bg-neutral-200',    label: 'Disponible' },
            { cls: 'bg-primary-400',    label: 'Réservé' },
            { cls: 'bg-amber-400',      label: 'Bloqué' },
            { cls: 'bg-neutral-900',    label: "Aujourd'hui" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', cls)} />
              <span className="text-xs font-medium text-neutral-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel — sélection en cours */}
      {selectStart && (
        <div className="mx-5 mb-5 p-4 rounded-2xl bg-primary-50 border border-primary-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-primary-700">
              {pendingRange
                ? `${selectStart} → ${selectEnd}`
                : `Départ : ${selectStart} — sélectionnez la date de fin`}
            </p>
            <button onClick={() => { setSelectStart(null); setSelectEnd(null); setHoverDay(null); }} className="text-primary-400 hover:text-primary-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {pendingRange && (
            <>
              <input
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Motif (optionnel) — ex. Travaux"
                className="w-full text-xs rounded-xl border border-primary-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary-400/30 placeholder:text-neutral-300"
              />
              {blockError && (
                <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2 border border-rose-100">
                  {blockError}
                </p>
              )}
              <button
                type="button"
                onClick={submitBlock}
                disabled={createMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                {createMutation.isPending ? 'Blocage…' : 'Bloquer cette période'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Liste des créneaux bloqués */}
      {(calData?.indisponibilites ?? []).length > 0 && (
        <div className="mx-5 mb-5 space-y-2">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">
            Créneaux bloqués ({calData!.indisponibilites.length})
          </p>
          {calData!.indisponibilites.map(indispo => (
            <div key={indispo.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800">
                  {new Date(indispo.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {indispo.dateDebut !== indispo.dateFin && (
                    <> → {new Date(indispo.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                  )}
                </p>
                {indispo.motif && (
                  <p className="text-[10px] text-amber-600 mt-0.5 truncate">{indispo.motif}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(indispo.id)}
                disabled={deleteMutation.isPending}
                className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-200 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
              >
                <X className="w-3.5 h-3.5 text-amber-700" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Équipements — LIGHT CARD ────────────────────────────────────────────── */

const CAT_CONFIG: Record<string, {
  label: string;
  icon: typeof Armchair;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  CONFORT:       { label: 'Confort',       icon: Armchair,      gradient: 'from-violet-500 to-violet-600', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-100', dot: 'bg-violet-400'  },
  CUISINE:       { label: 'Cuisine',       icon: ChefHat,       gradient: 'from-amber-400 to-amber-500',   bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-100',  dot: 'bg-amber-400'   },
  CONNECTIVITE:  { label: 'Connectivité',  icon: Wifi,          gradient: 'from-sky-500 to-sky-600',       bg: 'bg-sky-50',     text: 'text-sky-700',    border: 'border-sky-100',    dot: 'bg-sky-400'     },
  SECURITE:      { label: 'Sécurité',      icon: Shield,        gradient: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  EXTERIEUR:     { label: 'Extérieur',     icon: Trees,         gradient: 'from-lime-500 to-lime-600',     bg: 'bg-lime-50',    text: 'text-lime-700',   border: 'border-lime-100',   dot: 'bg-lime-400'    },
  ACCESSIBILITE: { label: 'Accessibilité', icon: Accessibility, gradient: 'from-rose-400 to-rose-500',     bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-100',   dot: 'bg-rose-400'    },
};

const FALLBACK_CFG = { label: 'Autre', icon: Tag, gradient: 'from-neutral-400 to-neutral-500', bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-100', dot: 'bg-neutral-400' };

function EquipementsSection({ equipements }: { equipements: { id: string; nom: string; categorie: string }[] }) {
  const order = ['CONFORT', 'CUISINE', 'CONNECTIVITE', 'SECURITE', 'EXTERIEUR', 'ACCESSIBILITE'];

  const grouped = equipements.reduce<Record<string, typeof equipements>>((acc, eq) => {
    const key = eq.categorie.toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) => (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99));

  return (
    <div className="bg-white rounded-[24px] border border-neutral-200/60 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900">Équipements & services</h3>
              <p className="text-xs text-neutral-400">{equipements.length} équipement{equipements.length > 1 ? 's' : ''} dans {categories.length} catégorie{categories.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          {/* Résumé des catégories */}
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end max-w-sm">
            {categories.map(cat => {
              const cfg = CAT_CONFIG[cat] ?? FALLBACK_CFG;
              const Icon = cfg.icon;
              return (
                <div key={cat} className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold', cfg.bg, cfg.text, cfg.border)}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                  <span className="opacity-50">· {grouped[cat].length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Grille par catégorie */}
      <div className="p-6 grid sm:grid-cols-2 gap-5">
        {categories.map(cat => {
          const cfg = CAT_CONFIG[cat] ?? FALLBACK_CFG;
          const Icon = cfg.icon;
          const items = grouped[cat];
          return (
            <div key={cat} className={cn('rounded-2xl border p-4', cfg.bg, cfg.border)}>
              {/* Entête catégorie */}
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('w-7 h-7 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', cfg.gradient)}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={cn('text-xs font-black uppercase tracking-widest', cfg.text)}>{cfg.label}</span>
                <span className={cn('ml-auto text-[10px] font-black px-2 py-0.5 rounded-full border', cfg.bg, cfg.text, cfg.border)}>
                  {items.length}
                </span>
              </div>
              {/* Liste des équipements */}
              <div className="space-y-1.5">
                {items.map(eq => (
                  <div key={eq.id} className="flex items-center gap-2">
                    <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                    <span className={cn('text-xs font-semibold', cfg.text)}>{eq.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Tarification — DARK CARD ────────────────────────────────────────────── */

function TarificationSection({ prixBase, personnesBase, capaciteMax, nuitesMinimum, tarifsNuits, tarifsPersonnes }: {
  prixBase: number; personnesBase: number; capaciteMax: number; nuitesMinimum: number;
  tarifsNuits: { nuitsMin: number; nuitsMax: number | null; prix: number }[];
  tarifsPersonnes: { personnesMin: number; personnesMax: number; supplement: number }[];
}) {
  const maxReduction = tarifsNuits.length > 0
    ? Math.max(...tarifsNuits.map(t => Math.round(((prixBase - t.prix) / prixBase) * 100)))
    : 0;

  return (
    <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] border border-white/[0.07] shadow-2xl">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-600/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-3 px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Tarification</h3>
            <p className="text-xs text-white/40">Structure des prix</p>
          </div>
        </div>
        {maxReduction > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-black text-emerald-400">jusqu'à -{maxReduction}%</span>
          </div>
        )}
      </div>

      <div className="h-px bg-white/[0.07] mx-6" />

      {/* Bloc prix de base */}
      <div className="relative mx-6 mt-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)] pointer-events-none" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-blue-200/70 uppercase tracking-widest mb-1">Prix de base / nuit</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight leading-none">{fcfa(prixBase)}</span>
              <span className="text-base font-bold text-blue-200">FCFA</span>
            </div>
            <p className="text-sm text-blue-200/60 mt-1.5">
              {personnesBase} pers. incluses · min. {nuitesMinimum} nuit{nuitesMinimum > 1 ? 's' : ''}
            </p>
          </div>
          <div className="shrink-0 text-center bg-white/10 border border-white/15 rounded-xl px-4 py-2.5">
            <p className="text-2xl font-black text-white leading-none">{capaciteMax}</p>
            <p className="text-[10px] font-bold text-blue-200 mt-0.5">pers. max</p>
          </div>
        </div>
      </div>

      {/* Réductions séjour */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-sm font-black text-white/80 uppercase tracking-wider">Réductions séjour</p>
        </div>

        {tarifsNuits.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-4 mb-3">
            <Percent className="w-5 h-5 text-white/20 shrink-0" />
            <p className="text-xs text-white/30">Aucun tarif dégressif configuré</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/[0.06] mb-3">
            {/* Ligne base */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03]">
              <div className="w-7 h-7 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0">
                <Moon className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/50">1 nuit</p>
                <p className="text-xs text-white/25">Tarif de référence</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-black text-white/60">{fcfa(prixBase)}</p>
                <p className="text-xs text-white/30">FCFA / nuit</p>
              </div>
              <div className="w-14 flex justify-end shrink-0">
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/[0.07] text-white/30">BASE</span>
              </div>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-white/[0.05]" />

            {/* Paliers */}
            {tarifsNuits.map((t, i) => {
              const reduction = Math.round(((prixBase - t.prix) / prixBase) * 100);
              const isLast = i === tarifsNuits.length - 1;
              return (
                <div key={i}>
                  <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Moon className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/80">
                        {t.nuitsMin}{t.nuitsMax ? `–${t.nuitsMax}` : '+'} nuit{t.nuitsMin > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-white/30">par nuit</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-white">{fcfa(t.prix)}</p>
                      <p className="text-xs text-white/40">FCFA / nuit</p>
                    </div>
                    <div className="w-16 flex justify-end shrink-0">
                      <span className="text-sm font-black px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                        -{reduction}%
                      </span>
                    </div>
                  </div>
                  {!isLast && <div className="h-px bg-white/[0.04] mx-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-white/[0.07] mx-6" />

      {/* Suppléments voyageurs */}
      <div className="px-6 pt-5 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-sm font-black text-white/80 uppercase tracking-wider">Suppléments voyageurs</p>
        </div>

        {tarifsPersonnes.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-4 py-4">
            <Users className="w-5 h-5 text-white/20 shrink-0" />
            <p className="text-xs text-white/30">Aucun supplément configuré</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
            {/* Ligne incluse */}
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03]">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white/80">
                  jusqu'à {personnesBase} pers.
                </p>
                <p className="text-xs text-white/30">personnes de base</p>
              </div>
              <span className="text-sm font-black px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shrink-0">
                Inclus
              </span>
            </div>

            <div className="h-px bg-white/[0.05]" />

            {tarifsPersonnes.map((t, i) => {
              const isLast = i === tarifsPersonnes.length - 1;
              return (
                <div key={i}>
                  <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                    <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                      t.supplement === 0 ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                    )}>
                      <UserPlus className={cn('w-3.5 h-3.5', t.supplement === 0 ? 'text-emerald-400' : 'text-amber-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white/80">
                        {t.personnesMin === t.personnesMax
                          ? `${t.personnesMin} pers.`
                          : `${t.personnesMin}–${t.personnesMax} pers.`}
                      </p>
                      <p className="text-xs text-white/30">par nuit</p>
                    </div>
                    {t.supplement === 0 ? (
                      <span className="text-sm font-black px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shrink-0">
                        Inclus
                      </span>
                    ) : (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-amber-300">+{fcfa(t.supplement)}</p>
                        <p className="text-xs text-white/30">FCFA / nuit</p>
                      </div>
                    )}
                  </div>
                  {!isLast && <div className="h-px bg-white/[0.04] mx-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

export function ListingOwnerDetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-9 rounded-2xl bg-neutral-100 w-40" />
      <div className="h-[360px] rounded-[28px] bg-neutral-100" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-[24px] bg-neutral-100" />)}
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="h-64 rounded-[24px] bg-neutral-100" />
        <div className="space-y-4">
          <div className="h-40 rounded-[24px] bg-neutral-100" />
          <div className="h-20 rounded-[24px] bg-neutral-100" />
        </div>
      </div>
      <div className="h-64 rounded-[28px] bg-neutral-100" />
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────────────────── */

export function ListingOwnerDetail({ listing }: { listing: ListingDetail }) {
  const qc             = useQueryClient();
  const principalPhoto = listing.photos.find(p => p.estPrincipale) ?? listing.photos[0];
  const otherPhotos    = listing.photos.filter(p => !p.estPrincipale).slice(0, 4);

  const [galleryOpen, setGalleryOpen]   = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const allPhotos = listing.photos.length > 0 ? listing.photos : [];

  function openGallery(index = 0) { setGalleryIndex(index); setGalleryOpen(true); }
  function closeGallery()          { setGalleryOpen(false); }
  function prevPhoto()             { setGalleryIndex(i => (i - 1 + allPhotos.length) % allPhotos.length); }
  function nextPhoto()             { setGalleryIndex(i => (i + 1) % allPhotos.length); }

  const canSubmit   = listing.statut === 'DRAFT' || listing.statut === 'REJECTED';
  const canPause    = listing.statut === 'PUBLISHED';
  const canResume   = listing.statut === 'PAUSED';
  const isPublished = listing.statut === 'PUBLISHED';

  const pauseMutation = useMutation({
    mutationFn: () => nestFetch(NEST_API.LISTINGS.PAUSE(listing.id), { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => nestFetch(NEST_API.LISTINGS.RESUME(listing.id), { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] }),
  });

  const { data: allReservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
    staleTime: 60_000,
  });

  const reservations = allReservations.filter(r => r.logement?.id === listing.id);
  const recentRes = [...reservations]
    .sort((a, b) => new Date(b.creeLe ?? b.dateDebut).getTime() - new Date(a.creeLe ?? a.dateDebut).getTime())
    .slice(0, 5);

  const revenue = reservations
    .filter(r => ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'].includes(r.statut))
    .reduce((sum, r) => sum + r.totalLocataire * 0.85, 0);

  const specs = [
    { icon: Bed,   value: listing.nombreChambres,   label: listing.nombreChambres > 1   ? 'chambres'    : 'chambre'    },
    { icon: Bath,  value: listing.nombreSallesBain,  label: listing.nombreSallesBain > 1 ? 'salles bain' : 'salle bain' },
    { icon: Users, value: listing.capaciteMax,       label: 'pers. max' },
    { icon: Moon,  value: listing.nuitesMinimum,     label: 'nuits min.' },
    { icon: Home,  value: listing.nombrePieces,      label: listing.nombrePieces > 1     ? 'pièces'      : 'pièce'      },
  ];

  const kpis = [
    { icon: CalendarCheck, gradient: 'from-blue-500 to-blue-600',       glow: 'shadow-blue-500/30',    value: String(listing.totalSejours), sub: undefined,  label: 'Locations' },
    { icon: TrendingUp,    gradient: 'from-emerald-500 to-emerald-600',  glow: 'shadow-emerald-500/30', value: fcfa(Math.round(revenue)),    sub: 'FCFA',      label: 'Revenus' },
    { icon: Star,          gradient: 'from-amber-400 to-amber-500',      glow: 'shadow-amber-500/30',   value: noteStr(listing.note),         sub: '/ 5',       label: 'Note' },
    { icon: CheckCircle2,  gradient: 'from-violet-500 to-violet-600',    glow: 'shadow-violet-500/30',  value: String(listing.totalAvis),    sub: undefined,  label: 'Avis' },
  ];

  return (
    <div className="space-y-5 pb-40 lg:pb-10 max-w-6xl mx-auto overflow-x-hidden">

      {/* ══ Top bar ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Link href="/dashboard/annonces"
          className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200 group-hover:bg-neutral-50 flex items-center justify-center shadow-sm transition-all shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline">Mes annonces</span>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {isPublished && (
            <Link href={`/logements/${listing.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-xs font-bold text-neutral-600 shadow-sm hover:shadow-md transition-all">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voir l&apos;annonce</span>
            </Link>
          )}
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-xs font-bold text-neutral-600 shadow-sm hover:shadow-md transition-all">
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </div>

      {/* ══ Rejection banner ═════════════════════════════════════════════════ */}
      {listing.statut === 'REJECTED' && listing.rejectionReason && (
        <div className="flex items-start gap-4 bg-rose-50 border border-rose-200/70 rounded-2xl p-5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Annonce rejetée</p>
            <p className="text-sm text-rose-700/80 leading-relaxed break-words min-w-0">{listing.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* ══ Hero ══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-[28px] overflow-hidden bg-neutral-100 shadow-xl shadow-neutral-900/10">
        {/* Main photo */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7]">
          {principalPhoto ? (
            <Image src={principalPhoto.url} alt={listing.titre} fill priority
              className="object-cover" sizes="(max-width: 1024px) 100vw, 80vw" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-100">
              <Camera className="w-10 h-10 text-neutral-300" />
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Aucune photo</span>
            </div>
          )}

          {/* Deep gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <ListingStatusBadge statut={listing.statut} size="md" />
            {listing.isFeatured && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-xs font-black text-white shadow-lg">
                <Sparkles className="w-3 h-3" />
                À la une
              </div>
            )}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl bg-primary-500 text-white">
                {listing.sousType ?? TYPE_LABELS[listing.type] ?? listing.type}
              </span>
              <div className="flex items-center gap-1 text-white/70 text-xs font-semibold">
                <MapPin className="w-3 h-3" />
                {listing.ville}
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight break-words">
              {listing.titre}
            </h1>
            {Number(listing.note) > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-3.5 h-3.5', s <= Math.round(Number(listing.note)) ? 'text-amber-400 fill-amber-400' : 'text-white/30 fill-white/30')} />
                  ))}
                </div>
                <span className="text-sm font-black text-white">{noteStr(listing.note)}</span>
                <span className="text-xs text-white/50">· {listing.totalAvis} avis</span>
              </div>
            )}
          </div>

          {/* Photo count / Voir plus — mobile only */}
          {allPhotos.length > 0 && (
            <button
              onClick={() => openGallery(0)}
              className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm text-xs font-bold text-white border border-white/15 hover:bg-black/70 transition-colors active:scale-95"
            >
              <Camera className="w-3 h-3" />
              <span className="sm:hidden">Voir les {allPhotos.length} photos</span>
              <span className="hidden sm:inline">{allPhotos.length}</span>
            </button>
          )}
        </div>

        {/* Secondary photos strip — desktop only */}
        {otherPhotos.length > 0 && (
          <div className={cn('hidden sm:grid gap-1', otherPhotos.length === 1 ? 'grid-cols-1' : otherPhotos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
            {otherPhotos.slice(0, 4).map((p, idx) => (
              <div key={p.id} onClick={() => openGallery(idx + 1)} className="relative aspect-[4/2.5] bg-neutral-100 cursor-pointer">
                <Image src={p.url} alt={p.categorie} fill className="object-cover hover:brightness-110 transition-all duration-300" sizes="20vw" />
                {idx === 3 && listing.photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-black text-sm">+{listing.photos.length - 5}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ KPI cards — DARK ═════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map(({ icon: Icon, gradient, glow, value, sub, label }, i) => (
          <div key={i} className="relative rounded-[22px] overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-neutral-900 border border-white/[0.07] p-4 sm:p-5 shadow-lg">
            <div className={cn('w-9 h-9 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-3', gradient, glow)}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">{value}</span>
              {sub && <span className="text-[10px] font-black text-white/40 uppercase">{sub}</span>}
            </div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ══ Main grid ════════════════════════════════════════════════════════ */}
      <div className="grid xl:grid-cols-[1fr_300px] gap-5 items-start min-w-0">

        {/* Left — Specs + Description */}
        <div className="space-y-5 min-w-0">
          {/* Specs — DARK */}
          <div className="bg-[#0a0a0a] rounded-[24px] border border-white/[0.07] p-5 shadow-xl">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.18em] mb-5">Caractéristiques</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
              {specs.map(({ icon: Icon, value, label }, i) => {
                const colors = [
                  { bg: 'from-blue-500/20 to-blue-600/10',    icon: 'text-blue-400'    },
                  { bg: 'from-violet-500/20 to-violet-600/10', icon: 'text-violet-400'  },
                  { bg: 'from-emerald-500/20 to-emerald-600/10', icon: 'text-emerald-400' },
                  { bg: 'from-amber-500/20 to-amber-600/10',  icon: 'text-amber-400'   },
                  { bg: 'from-rose-500/20 to-rose-600/10',    icon: 'text-rose-400'    },
                ];
                const c = colors[i % colors.length];
                return (
                  <div key={i} className="flex flex-col items-center gap-2.5 bg-[#111111] px-3 py-5 group hover:bg-[#161616] transition-colors duration-200">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${c.icon}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-white leading-none tabular-nums">{value}</p>
                      <p className="text-[10px] font-semibold text-white/40 mt-1 leading-tight capitalize">{label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description — LIGHT */}
          <div className="bg-white rounded-[24px] border border-neutral-200/60 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center shadow-md">
                <Info className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-neutral-900">Description</span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap break-words">{listing.description}</p>

            {listing.reglesMaison && (
              <div className="pt-5 border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Règles de la maison</p>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{listing.reglesMaison}</p>
              </div>
            )}

            {listing.instructionsAcces && (
              <div className="pt-5 border-t border-neutral-100">
                <div className="flex items-center gap-2 mb-3">
                  <DoorOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Instructions d&apos;accès</p>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{listing.instructionsAcces}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Price + Actions */}
        <div className="space-y-3 min-w-0">
          {/* Price — DARK */}
          <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-5 shadow-xl shadow-blue-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.18em] mb-3">Tarif de base</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-white tracking-tight">{fcfa(listing.prixBase)}</span>
              <span className="text-xs font-bold text-blue-200">FCFA / nuit</span>
            </div>
            <p className="text-xs text-blue-200/70">
              {listing.personnesBase} voyageur{listing.personnesBase > 1 ? 's' : ''} inclus
            </p>
            {listing.tarifsNuits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
                <span className="text-xs text-blue-200/70">Tarif dégressif</span>
                <span className="text-xs font-black text-white bg-white/10 px-2 py-1 rounded-lg">
                  {listing.tarifsNuits.length} palier{listing.tarifsNuits.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Actions — desktop only (mobile : sticky bar en bas) */}
          <div className="hidden lg:flex flex-col gap-2">
            <Link href={`/dashboard/annonces/${listing.id}/modifier`}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 rounded-2xl text-sm font-bold text-neutral-700 shadow-sm hover:shadow-md transition-all">
              <Pencil className="w-4 h-4" />
              Modifier l&apos;annonce
            </Link>

            {canSubmit && (
              <Link href={`/dashboard/annonces/${listing.id}/soumettre`}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all">
                <Send className="w-4 h-4" />
                Soumettre pour validation
              </Link>
            )}
            {canPause && (
              <button
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 transition-all disabled:opacity-50"
              >
                <Pause className="w-4 h-4" />
                {pauseMutation.isPending ? 'En cours…' : 'Mettre en pause'}
              </button>
            )}
            {canResume && (
              <button
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-2xl text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {resumeMutation.isPending ? 'En cours…' : 'Reprendre la publication'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ Revenue chart — DARK ═════════════════════════════════════════════ */}
      <MiniRevenueChart revenue={revenue} reservations={reservations} />

      {/* ══ Calendar + Reservations ══════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-5">
        <ListingCalendar listingId={listing.id} reservations={reservations} />

        {/* Reservations — DARK */}
        <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] border border-white/[0.07] shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between p-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25">
                <CalendarCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Réservations récentes</h3>
                {reservations.length > 0 && (
                  <p className="text-xs text-white/40">{reservations.length} au total</p>
                )}
              </div>
            </div>
            {isPublished && (
              <Link href={`/dashboard/reservations?logement=${listing.id}`}
                className="flex items-center gap-1 text-xs font-bold text-white/40 hover:text-white/70 transition-colors">
                Tout voir
                <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="h-px bg-white/[0.07] mx-5" />

          <div className="relative p-3">
            {recentRes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="w-8 h-8 text-white/15 mx-auto mb-2" />
                <p className="text-xs font-bold text-white/30">Aucune réservation</p>
                <p className="text-xs text-white/20 mt-0.5">Les réservations apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentRes.map(r => {
                  const cfg = STATUT_CFG[r.statut] ?? STATUT_CFG.COMPLETED;
                  return (
                    <Link key={r.id} href={`/dashboard/reservations/${r.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center shrink-0 text-xs font-black text-white/70">
                          {r.locataire.prenom?.charAt(0)}{r.locataire.nom?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white/80 truncate">
                            {r.locataire.prenom} {r.locataire.nom}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {fmtDate(r.dateDebut)} → {fmtDate(r.dateFin)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                        <span className="text-[10px] font-black text-white/50">{cfg.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Équipements — LIGHT ══════════════════════════════════════════════ */}
      {listing.equipements.length > 0 && (
        <EquipementsSection equipements={listing.equipements} />
      )}

      {/* ══ Tarification — DARK ══════════════════════════════════════════════ */}
      <TarificationSection
        prixBase={listing.prixBase}
        personnesBase={listing.personnesBase}
        capaciteMax={listing.capaciteMax}
        nuitesMinimum={listing.nuitesMinimum}
        tarifsNuits={listing.tarifsNuits}
        tarifsPersonnes={listing.tarifsPersonnes}
      />

      {/* ══ CTA toutes réservations ══════════════════════════════════════════ */}
      {isPublished && (
        <Link href={`/dashboard/reservations?logement=${listing.id}`}
          className="flex items-center justify-between px-5 py-4 bg-white border border-neutral-200/60 rounded-[22px] hover:border-primary-200 hover:bg-primary-50/30 shadow-sm hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <CalendarCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-neutral-900">Toutes les réservations</p>
              <p className="text-xs text-neutral-500">Historique complet pour ce logement</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-neutral-50 border border-neutral-200 group-hover:bg-primary-50 group-hover:border-primary-200 flex items-center justify-center transition-all">
            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
          </div>
        </Link>
      )}

      {/* ══ Galerie fullscreen ═══════════════════════════════════════════════ */}
      {galleryOpen && allPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black" onClick={closeGallery}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeGallery}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <span className="text-sm font-bold text-white/80 tabular-nums">
              {galleryIndex + 1} / {allPhotos.length}
            </span>
            <div className="w-10" />
          </div>

          {/* Photo */}
          <div className="flex-1 relative px-4" onClick={e => e.stopPropagation()}>
            <Image
              src={allPhotos[galleryIndex].url}
              alt={`Photo ${galleryIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Navigation */}
          {allPhotos.length > 1 && (
            <div className="flex items-center justify-between px-4 pt-3 pb-6 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={prevPhoto}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-1.5 overflow-hidden max-w-[60vw]">
                {allPhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryIndex(i)}
                    className={cn(
                      'rounded-full transition-all duration-200',
                      i === galleryIndex ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                    )}
                  />
                ))}
              </div>

              <button
                onClick={nextPhoto}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-90"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ Sticky action bar — mobile only ══════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-[76px] left-0 right-0 z-30 px-3">
        <div
          className="flex items-center gap-2 p-2 rounded-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <Link
            href={`/dashboard/annonces/${listing.id}/modifier`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
          >
            <Pencil className="w-4 h-4" />
            Modifier
          </Link>

          {canSubmit && (
            <Link
              href={`/dashboard/annonces/${listing.id}/soumettre`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              Soumettre
            </Link>
          )}
          {canPause && (
            <button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm font-bold text-amber-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              {pauseMutation.isPending ? '…' : 'Pause'}
            </button>
          )}
          {canResume && (
            <button
              onClick={() => resumeMutation.mutate()}
              disabled={resumeMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {resumeMutation.isPending ? '…' : 'Reprendre'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
