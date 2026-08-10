'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Accessibility, Armchair, ArrowLeft, Bath, Bed, Calendar, CalendarCheck,
  Check, ChefHat, ChevronLeft, ChevronRight, CheckCircle2, Copy, Eye,
  FileText, Grid2x2, Home, ImageOff, Info, KeyRound, Lock, MapPin, Moon,
  Pause, Pencil, Play, Send, Settings, Share2, Shield, ShieldAlert, Sliders,
  Star, Tag, Trees, TrendingDown, TrendingUp, Users, Wifi, X, ZoomIn,
} from 'lucide-react';
import type { ListingDetail } from '@/lib/nestjs/types';
import type { Reservation } from '@/features/reservations/components/reservation-card';
import { ListingStatusBadge } from '@/features/listings/components/listing-status-badge';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';
import {
  buildDonutPath, buildMonthlyRevenue, CAT_LABELS, catRank, DONUT_SEGMENTS,
  fcfa, fmtDateShort, fmtNote, STATUT_CFG, trendPercent, TYPE_LABELS,
} from '@/lib/dashboard/owner-tokens';

const CAT_ICONS: Record<string, typeof Armchair> = {
  CONFORT: Armchair, CUISINE: ChefHat, CONNECTIVITE: Wifi,
  SECURITE: Shield, EXTERIEUR: Trees, ACCESSIBILITE: Accessibility,
};

/* ── Revenus ──────────────────────────────────────────────────────────────
   Les six barres viennent maintenant des réservations réelles, agrégées
   par mois. L'ancienne version appliquait la suite [0, .05, .12, .25, .5, 1]
   au revenu total et étiquetait les barres avec des mois écrits en dur, de
   décembre à mai — un graphique décoratif présenté comme une mesure.
   ────────────────────────────────────────────────────────────────────── */

function RevenueCard({ revenue, reservations }: { revenue: number; reservations: Reservation[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, []);

  const bars = useMemo(() => buildMonthlyRevenue(reservations), [reservations]);
  const trend = useMemo(() => trendPercent(bars), [bars]);
  const maxBar = Math.max(...bars.map((b) => b.value), 1);
  const hasRevenue = bars.some((b) => b.value > 0);

  const segments = DONUT_SEGMENTS.map((s) => {
    const matching = reservations.filter((r) => r.statut === s.key);
    return {
      ...s,
      value: matching.reduce((sum, r) => sum + Number(r.netProprietaire ?? r.totalLocataire ?? 0), 0),
      count: matching.length,
    };
  }).filter((s) => s.value > 0);

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const isEmpty = segments.length === 0;

  const CX = 70, CY = 70, R = 56, INNER = 35, GAP = 0.05;
  let angle = -Math.PI / 2;
  const arcs = (isEmpty
    ? [{ key: 'empty', label: '', color: 'rgba(255,255,255,0.07)', value: 1, count: 0 }]
    : segments
  ).map((seg, idx) => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const startA = angle + (isEmpty ? 0 : GAP / 2);
    const endA = angle + sweep - (isEmpty ? 0 : GAP / 2);
    angle += sweep;
    return { ...seg, startA, endA, idx };
  });

  return (
    <section className="section-inverse relative overflow-hidden p-5 sm:p-6">
      <header className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="marker marker--onDark">
            <TrendingUp className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Performance</p>
            {/* font-black valait 900, font-extrabold 800 : le système
                plafonne à 600. Au-delà, Fraunces se ferme. */}
            <h3 className="font-display text-base font-semibold text-neutral-50">
              Évolution des revenus
            </h3>
          </div>
        </div>
        <span className="rounded-pill border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-forest-200">
          6 derniers mois
        </span>
      </header>

      <div className="grid gap-6 sm:grid-cols-[1fr_1px_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Cumul</p>
            <p className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tabular-nums text-neutral-50">{fcfa(revenue)}</span>
              <span className="text-xs text-forest-200">FCFA</span>
            </p>
          </div>

          {hasRevenue ? (
            <>
              <div className="flex h-32 items-end gap-2 pt-2">
                {bars.map((b, i) => (
                  <div key={b.label + i} className="flex h-full flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className={cn(
                          'w-full rounded-inner',
                          b.isCurrent ? 'bg-action' : 'bg-white/12',
                        )}
                        style={{
                          height: visible ? `${Math.max((b.value / maxBar) * 100, 4)}%` : '0%',
                          transition: `height 320ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                        }}
                      />
                    </div>
                    <span className={cn('text-[0.6875rem]', b.isCurrent ? 'text-on-inverse-marker' : 'text-forest-200')}>
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Le « +100% » était écrit en dur. Il est calculé, et masqué
                  quand il n'y a pas assez d'historique pour le calculer. */}
              {trend !== null && (
                <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold',
                    trend >= 0
                      ? 'bg-marker-bg text-on-inverse-marker'
                      : 'bg-error-500/15 text-error-500',
                  )}>
                    {trend >= 0
                      ? <TrendingUp className="h-3 w-3" aria-hidden="true" />
                      : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
                    {trend >= 0 ? '+' : ''}{trend}%
                  </span>
                  <span className="text-xs text-forest-200">sur la période</span>
                </div>
              )}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-forest-200">
              Aucun revenu enregistré sur les six derniers mois.
            </p>
          )}
        </div>

        <div className="hidden bg-white/10 sm:block" />

        <div className="space-y-4">
          <p className="eyebrow">Répartition par statut</p>
          <div className="flex justify-center">
            <svg viewBox="0 0 160 160" className="h-32 w-32" role="img" aria-label={`${reservations.length} réservations`}>
              {arcs.map((arc) => (
                <path
                  key={arc.key}
                  d={buildDonutPath(CX, CY, R, INNER, arc.startA, arc.endA)}
                  fill={arc.color}
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: `opacity 320ms ${arc.idx * 80}ms`,
                  }}
                />
              ))}
              <circle cx={CX} cy={CY} r={INNER - 2} fill="var(--forest-950)" />
              <text x={CX} y={CY - 6} textAnchor="middle" fill="var(--neutral-50)" fontSize="15" fontWeight="600">
                {reservations.length}
              </text>
              <text x={CX} y={CY + 8} textAnchor="middle" fill="var(--forest-200)" fontSize="7" letterSpacing="1">
                RÉSERV.
              </text>
            </svg>
          </div>

          <ul className="space-y-2">
            {isEmpty ? (
              <li className="py-2 text-center text-xs text-forest-200">Aucune donnée</li>
            ) : segments.map((seg) => (
              <li key={seg.key} className="flex items-center gap-2.5 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-pill" style={{ background: seg.color }} />
                <span className="flex-1 truncate text-forest-200">{seg.label}</span>
                <span className="tabular-nums text-neutral-50">{seg.count}</span>
                <span className="rounded-pill bg-white/5 px-2 py-0.5 text-[0.6875rem] tabular-nums text-forest-200">
                  {Math.round((seg.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Calendrier ────────────────────────────────────────────────────────── */

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

type Indispo = { id: string; dateDebut: string; dateFin: string; motif?: string | null };

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function ListingCalendar({ listingId, reservations }: { listingId: string; reservations: Reservation[] }) {
  const qc = useQueryClient();
  const today = new Date();
  const todayStr = isoDay(today);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const { data: calData } = useQuery<{ indisponibilites: Indispo[] }>({
    queryKey: ['calendrier', listingId],
    // L'URL était construite avec un repli en dur sur localhost:4000, qui
    // serait parti en production si la variable manquait.
    queryFn: () => nestFetch(NEST_API.CALENDRIER.LIST(listingId)),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (body: { dateDebut: string; dateFin: string; motif?: string }) =>
      nestFetch(NEST_API.CALENDRIER.CREATE(listingId), { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendrier', listingId] });
      setSelectStart(null); setSelectEnd(null); setMotif(''); setBlockError(null);
    },
    onError: (err: unknown) =>
      setBlockError(err instanceof Error ? err.message : 'Erreur lors du blocage'),
  });

  const deleteMutation = useMutation({
    mutationFn: (indispoId: string) =>
      nestFetch(NEST_API.CALENDRIER.DELETE(listingId, indispoId), { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendrier', listingId] }),
    onError: (err: unknown) =>
      setBlockError(err instanceof Error ? err.message : 'Erreur lors du déblocage'),
  });

  const reservedSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of reservations) {
      if (['CANCELLED', 'DISPUTED'].includes(r.statut)) continue;
      const cur = new Date(r.dateDebut);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(r.dateFin);
      end.setHours(0, 0, 0, 0);
      while (cur < end) { s.add(isoDay(cur)); cur.setDate(cur.getDate() + 1); }
    }
    return s;
  }, [reservations]);

  const blockedMap = useMemo(() => {
    const m = new Map<string, Indispo>();
    for (const ind of calData?.indisponibilites ?? []) {
      const cur = new Date(ind.dateDebut);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(ind.dateFin);
      end.setHours(0, 0, 0, 0);
      while (cur < end) { m.set(isoDay(cur), ind); cur.setDate(cur.getDate() + 1); }
    }
    return m;
  }, [calData]);

  const dayKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  function handleDayClick(day: number) {
    const key = dayKey(day);
    if (blockedMap.has(key)) { setSelectStart(null); setSelectEnd(null); return; }
    if (reservedSet.has(key) || new Date(year, month, day) < startOfToday) return;

    if (selectEnd) { setSelectStart(key); setSelectEnd(null); setHoverDay(null); return; }
    if (!selectStart) setSelectStart(key);
    else if (selectStart === key) { setSelectStart(null); setHoverDay(null); }
    else { setSelectEnd(key); setHoverDay(null); }
  }

  function isInSelection(key: string) {
    if (!selectStart) return false;
    const cursor = selectEnd ?? hoverDay ?? selectStart;
    const [a, b] = selectStart <= cursor ? [selectStart, cursor] : [cursor, selectStart];
    return key >= a && key <= b;
  }

  const pendingRange = !!(selectStart && selectEnd);
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <span className="marker">
            <Calendar className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-forest-900">Disponibilités</h3>
            <p className="text-xs text-foreground-muted">Cliquez pour bloquer des dates</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            aria-label="Mois précédent"
            className="grid h-8 w-8 place-items-center rounded-pill border border-border text-forest-800 transition-colors hover:bg-neutral-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-28 text-center text-xs font-semibold capitalize text-forest-900" aria-live="polite">
            {MONTHS_FR[month].slice(0, 4)}. {year}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            aria-label="Mois suivant"
            className="grid h-8 w-8 place-items-center rounded-pill border border-border text-forest-800 transition-colors hover:bg-neutral-100"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="space-y-1">
        <div className="grid grid-cols-7 py-1 text-center text-[0.6875rem] uppercase tracking-wide text-foreground-faint">
          {DAYS_FR.map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const key = dayKey(day);
            const isReserved = reservedSet.has(key);
            const isBlocked = blockedMap.has(key);
            const isPast = new Date(year, month, day) < startOfToday;

            return (
              <button
                key={day}
                type="button"
                disabled={isReserved || isPast}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => selectStart && !selectEnd && setHoverDay(key)}
                onMouseLeave={() => setHoverDay(null)}
                aria-label={`${day} ${MONTHS_FR[month]}${isReserved ? ', réservé' : isBlocked ? ', bloqué' : ''}`}
                className={cn(
                  'aspect-square select-none rounded-inner text-xs font-medium transition-colors duration-150',
                  isPast ? 'cursor-default text-foreground-faint'
                    : isReserved ? 'cursor-default bg-forest-100 font-semibold text-forest-800'
                      : isBlocked ? 'bg-warning-50 font-semibold text-warning-700'
                        : key === selectStart ? 'bg-forest-800 font-semibold text-neutral-50'
                          : isInSelection(key) ? 'bg-lime-100 text-forest-800'
                            : key === todayStr ? 'bg-neutral-100 font-semibold text-forest-900'
                              : 'text-forest-900 hover:bg-neutral-100',
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Légende : sans elle, personne ne devine ce que signifient les
          couleurs des cases. */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[0.6875rem] text-foreground-muted">
        {[
          ['bg-forest-100', 'Réservé'],
          ['bg-warning-50 border border-warning-500/30', 'Bloqué'],
          ['bg-lime-100', 'Sélection'],
        ].map(([cls, label]) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded-[4px]', cls)} />
            {label}
          </li>
        ))}
      </ul>

      {selectStart && (
        <div className="space-y-3 rounded-inner bg-background-alt p-4">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-forest-900">
            <span>
              {pendingRange
                ? `Du ${selectStart} au ${selectEnd}`
                : `Début ${selectStart} — choisissez la fin`}
            </span>
            <button
              type="button"
              onClick={() => { setSelectStart(null); setSelectEnd(null); setHoverDay(null); }}
              aria-label="Annuler la sélection"
              className="text-foreground-muted transition-colors hover:text-forest-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {pendingRange && (
            <div className="space-y-2">
              <input
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Motif (optionnel) — ex. Travaux"
                aria-label="Motif du blocage"
                className="w-full rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25"
              />
              {blockError && (
                <p role="alert" className="rounded-inner bg-error-50 p-2.5 text-xs text-error-700">
                  {blockError}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  const end = selectEnd ?? selectStart;
                  const [a, b] = selectStart <= end ? [selectStart, end] : [end, selectStart];
                  createMutation.mutate({ dateDebut: a, dateFin: b, motif: motif.trim() || undefined });
                }}
                disabled={createMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-50"
              >
                <Lock className="h-4 w-4" aria-hidden="true" />
                {createMutation.isPending ? 'Blocage…' : 'Bloquer la période'}
              </button>
            </div>
          )}
        </div>
      )}

      {(calData?.indisponibilites ?? []).length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="eyebrow">Créneaux bloqués ({calData!.indisponibilites.length})</p>
          {calData!.indisponibilites.map((ind) => (
            <div key={ind.id} className="flex items-center justify-between gap-3 rounded-inner bg-background-alt p-3 text-xs">
              <div className="min-w-0">
                <p className="font-semibold text-forest-900">
                  {fmtDateShort(ind.dateDebut)}
                  {ind.dateDebut !== ind.dateFin && <> → {fmtDateShort(ind.dateFin)}</>}
                </p>
                {ind.motif && <p className="truncate text-foreground-muted">{ind.motif}</p>}
              </div>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(ind.id)}
                disabled={deleteMutation.isPending}
                aria-label="Débloquer ce créneau"
                className="rounded-pill p-1.5 text-foreground-muted transition-colors hover:bg-error-50 hover:text-error-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Description et consignes ──────────────────────────────────────────── */

function DescriptionSection({ description, reglesMaison, instructionsAcces }: {
  description: string;
  reglesMaison?: string | null;
  instructionsAcces?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-sm">
      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="marker">
          <FileText className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
        </span>
        <h3 className="font-display text-lg font-semibold text-forest-900">Description et consignes</h3>
      </header>

      <div>
        <p className="eyebrow mb-2">Présentation</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">{description}</p>
      </div>

      <div className="grid gap-5 border-t border-border pt-5 md:grid-cols-2">
        <div className="space-y-2.5">
          <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">
            <ShieldAlert className="h-4 w-4 text-forest-600" aria-hidden="true" />
            Règles de la maison
          </p>
          {reglesMaison ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">{reglesMaison}</p>
          ) : (
            <p className="text-sm text-foreground-faint">Aucune règle spécifique définie.</p>
          )}
          {/* Les pastilles « Non-fumeur » et « Fêtes non autorisées » étaient
              affichées sur toutes les annonces, sans condition. Retirées :
              elles doivent venir d'un champ, sinon elles mentent. */}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <KeyRound className="h-4 w-4 text-forest-600" aria-hidden="true" />
              Instructions d&apos;accès
            </p>
            {instructionsAcces && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(instructionsAcces);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  } catch { /* contexte non sécurisé */ }
                }}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 text-xs font-medium text-forest-800 transition-colors hover:bg-neutral-100"
              >
                {copied
                  ? <Check className="h-3 w-3 text-success-600" aria-hidden="true" />
                  : <Copy className="h-3 w-3" aria-hidden="true" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            )}
          </div>
          {instructionsAcces ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground-muted">{instructionsAcces}</p>
          ) : (
            <p className="text-sm text-foreground-faint">
              Transmises au voyageur après confirmation de la réservation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Équipements ───────────────────────────────────────────────────────── */

function EquipementsSection({ equipements }: { equipements: { id: string; nom: string; categorie: string }[] }) {
  const grouped = equipements.reduce<Record<string, typeof equipements>>((acc, eq) => {
    const key = eq.categorie.toUpperCase();
    (acc[key] ??= []).push(eq);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => catRank(a) - catRank(b));

  return (
    <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker">
            <Tag className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <h3 className="font-display text-lg font-semibold text-forest-900">Équipements</h3>
        </div>
        <span className="text-sm tabular-nums text-foreground-faint">{equipements.length}</span>
      </header>

      {/*
        Avant : chaque équipement dans une boîte bordée, dans une carte de
        catégorie bordée, elle-même dans une section bordée. Trois niveaux de
        décor autour d'un libellé de deux mots.
        Ici la catégorie n'est qu'un intertitre et les éléments se lisent
        comme une liste.
      */}
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {categories.map((cat) => {
          const Icon = CAT_ICONS[cat] ?? Tag;
          return (
            <div key={cat}>
              <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                <Icon className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                {CAT_LABELS[cat] ?? cat}
              </p>
              <ul className="space-y-2">
                {grouped[cat].map((eq) => (
                  <li key={eq.id} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-forest-500" aria-hidden="true" />
                    {eq.nom}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Tarification ──────────────────────────────────────────────────────── */

function TarificationSection({ prixBase, personnesBase, capaciteMax, nuitesMinimum, tarifsNuits }: {
  prixBase: number; personnesBase: number; capaciteMax: number; nuitesMinimum: number;
  tarifsNuits: { nuitsMin: number; nuitsMax: number | null; prix: number }[];
}) {
  const maxReduction = tarifsNuits.length
    ? Math.max(...tarifsNuits.map((t) => Math.round(((prixBase - t.prix) / prixBase) * 100)))
    : 0;

  return (
    <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker">
            <TrendingDown className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <h3 className="font-display text-lg font-semibold text-forest-900">Grille tarifaire</h3>
        </div>
        {maxReduction > 0 && (
          <span className="rounded-pill bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">
            Jusqu&apos;à -{maxReduction}%
          </span>
        )}
      </header>

      <div className="flex items-center justify-between gap-4 rounded-inner bg-background-alt p-5">
        <div>
          <p className="eyebrow">Prix de référence</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-[-0.02em] text-forest-900">
              {fcfa(prixBase)}
            </span>
            <span className="text-sm text-foreground-muted">FCFA / nuit</span>
          </p>
          <p className="mt-1 text-xs text-foreground-muted">
            {personnesBase} pers. incluses · min. {nuitesMinimum} nuit{nuitesMinimum > 1 ? 's' : ''}
          </p>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-2xl font-semibold tabular-nums text-forest-900">{capaciteMax}</p>
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">pers. max</p>
        </div>
      </div>

      {tarifsNuits.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aucun tarif dégressif configuré.</p>
      ) : (
        <ul className="space-y-2">
          {tarifsNuits.map((t, i) => {
            const reduction = Math.round(((prixBase - t.prix) / prixBase) * 100);
            return (
              <li key={i} className="flex items-center justify-between gap-3 rounded-inner bg-background-alt px-4 py-3 text-sm">
                <span className="flex items-center gap-2.5 font-medium text-forest-900">
                  <Moon className="h-4 w-4 text-forest-600" aria-hidden="true" />
                  {t.nuitsMin}{t.nuitsMax ? `–${t.nuitsMax}` : '+'} nuits
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums text-forest-900">{fcfa(t.prix)} FCFA</span>
                  <span className="rounded-pill bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
                    -{reduction}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ── Squelette ─────────────────────────────────────────────────────────── */

export function ListingOwnerDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-hidden="true">
      <div className="h-9 w-40 rounded-pill bg-background-alt" />
      <div className="h-[24rem] rounded-card bg-background-alt" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-card bg-background-alt" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="h-64 rounded-card bg-background-alt" />
        <div className="h-40 rounded-card bg-background-alt" />
      </div>
    </div>
  );
}

/* ── Composant principal ───────────────────────────────────────────────── */

export function ListingOwnerDetail({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [openLightbox, setOpenLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const [emblaRef, embla] = useEmblaCarousel({ loop: true });

  const photos = listing.photos ?? [];
  const mainPhoto = photos.find((p) => p.estPrincipale) ?? photos[0];
  const secondaryPhotos = photos.filter((p) => p.id !== mainPhoto?.id).slice(0, 4);

  useEffect(() => {
    if (!embla) return;
    const sync = () => setLightboxIndex(embla.selectedScrollSnap());
    embla.on('select', sync); embla.on('reInit', sync); sync();
    return () => { embla.off('select', sync); embla.off('reInit', sync); };
  }, [embla]);

  useEffect(() => {
    if (openLightbox && embla && pendingIndex !== null) {
      embla.scrollTo(pendingIndex, true);
      setPendingIndex(null);
    }
  }, [openLightbox, embla, pendingIndex]);

  // La visionneuse n'avait ni Échap, ni flèches, ni verrou de défilement.
  useEffect(() => {
    if (!openLightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenLightbox(false);
      if (e.key === 'ArrowLeft') embla?.scrollPrev();
      if (e.key === 'ArrowRight') embla?.scrollNext();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [openLightbox, embla]);

  const openAt = useCallback((i: number) => {
    setPendingIndex(i); setLightboxIndex(i); setOpenLightbox(true);
  }, []);

  const pauseMutation = useMutation({
    mutationFn: () => nestFetch(NEST_API.LISTINGS.PAUSE(listing.id), { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] }),
  });
  const resumeMutation = useMutation({
    mutationFn: () => nestFetch(NEST_API.LISTINGS.RESUME(listing.id), { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] }),
  });

  const { data: allReservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations', 'mine'],
    queryFn: () => nestFetch<Reservation[]>(NEST_API.RESERVATIONS.MINE()),
    staleTime: 60_000,
  });

  const reservations = allReservations.filter((r) => r.logement?.id === listing.id);
  const recentRes = [...reservations]
    .sort((a, b) => new Date(b.creeLe ?? b.dateDebut).getTime() - new Date(a.creeLe ?? a.dateDebut).getTime())
    .slice(0, 5);

  const revenue = reservations
    .filter((r) => ['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID'].includes(r.statut))
    .reduce((sum, r) => sum + Number(r.netProprietaire ?? r.totalLocataire ?? 0), 0);

  const specs = [
    { icon: Bed, value: listing.nombreChambres, label: listing.nombreChambres > 1 ? 'chambres' : 'chambre' },
    { icon: Bath, value: listing.nombreSallesBain, label: listing.nombreSallesBain > 1 ? 'salles d\u2019eau' : 'salle d\u2019eau' },
    { icon: Users, value: listing.capaciteMax, label: 'pers. max' },
    { icon: Moon, value: listing.nuitesMinimum, label: 'nuits min.' },
    { icon: Home, value: listing.nombrePieces, label: listing.nombrePieces > 1 ? 'pièces' : 'pièce' },
  ];

  const kpis = [
    { icon: CalendarCheck, value: String(listing.totalSejours), label: 'Locations' },
    { icon: TrendingUp, value: fcfa(revenue), sub: 'FCFA', label: 'Revenus' },
    { icon: Star, value: fmtNote(listing.note), sub: '/ 5', label: 'Note' },
    { icon: CheckCircle2, value: String(listing.totalAvis), label: 'Avis' },
  ];

  const isPublished = listing.statut === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-24">

      {/* 1 · Barre de navigation top bar responsive & sticky sur mobile */}
      <div className="sticky top-0 sm:relative z-40 bg-background-card/90 sm:bg-transparent backdrop-blur-md border-b border-border/80 py-3 sm:pb-3 -mx-4 px-4 sm:mx-0 transition-all shadow-xs sm:shadow-none">
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-6xl mx-auto">
          <Link
            href="/dashboard/annonces"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-forest-950 hover:text-forest-700 transition-colors"
          >
            <span className="w-8 h-8 rounded-pill bg-background-card border border-border/80 flex items-center justify-center shadow-2xs shrink-0">
              <ArrowLeft className="w-4 h-4 text-forest-950" />
            </span>
            <span className="hidden xs:inline">Retour aux annonces</span>
            <span className="xs:hidden text-xs">Retour</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {isPublished && (
              <Link
                href={`/logements/${listing.id}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border/80 bg-background-card px-3 sm:px-4 text-xs font-bold text-forest-950 hover:bg-background-alt transition-colors shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-forest-950" />
                <span className="hidden sm:inline">Fiche publique</span>
              </Link>
            )}

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true); setTimeout(() => setCopied(false), 2500);
                } catch { /* contexte non sécurisé */ }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-pill border border-border/80 bg-background-card px-3 sm:px-4 text-xs font-bold text-forest-950 hover:bg-background-alt transition-colors shadow-2xs"
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-lime-600" />
                : <Share2 className="w-3.5 h-3.5 text-forest-950" />}
              <span className="hidden sm:inline">{copied ? 'Lien copié' : 'Partager'}</span>
              <span className="sm:hidden text-xs">{copied ? 'Copié' : 'Partager'}</span>
            </button>

            <Link
              href={`/dashboard/annonces/${listing.id}/modifier`}
              className="btn-action inline-flex h-9 items-center gap-1.5 rounded-pill px-3.5 sm:px-4 text-xs font-bold text-forest-950 shadow-action transition-all active:scale-95"
            >
              <Pencil className="w-3.5 h-3.5 text-forest-950" />
              <span>Modifier</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2 · Rejet */}
      {listing.statut === 'REJECTED' && listing.rejectionReason && (
        <div role="alert" className="flex items-start gap-3 rounded-card bg-error-50 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-error-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-error-700">Annonce non approuvée</p>
            <p className="mt-1 text-sm text-error-600">{listing.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* 3 · En-tête et galerie */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ListingStatusBadge statut={listing.statut} size="sm" />
              <span className="eyebrow">{listing.sousType ?? TYPE_LABELS[listing.type] ?? listing.type}</span>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-forest-900 sm:text-3xl">
              {listing.titre}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-muted">
              <MapPin className="h-4 w-4 text-foreground-faint" aria-hidden="true" />
              {listing.ville}
            </p>
          </div>

          <p className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums tracking-[-0.02em] text-forest-900">
              {fcfa(listing.prixBase)}
            </span>
            <span className="text-sm text-foreground-muted">FCFA / nuit</span>
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-neutral-100">
          {photos.length > 0 ? (
            <div className="grid h-[19rem] grid-cols-1 gap-2 sm:h-[24rem] md:grid-cols-2 lg:h-[26rem]">
              <button
                type="button"
                onClick={() => openAt(0)}
                aria-label={`Ouvrir la galerie, ${photos.length} photos`}
                className="group relative h-full w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
              >
                {mainPhoto && (
                  <>
                    <Image
                      src={mainPhoto.url}
                      alt=""
                      fill priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
                    />
                    <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-200 group-hover:bg-forest-950/10" />
                    <span className="glass-dark absolute bottom-4 left-4 hidden rounded-inner p-2.5 opacity-0 transition-opacity group-hover:opacity-100 md:block">
                      <ZoomIn className="h-4 w-4 text-neutral-50" aria-hidden="true" />
                    </span>
                  </>
                )}
                {photos.length > 1 && (
                  <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-pill border border-white/60 bg-white/90 px-3.5 py-2 text-xs font-semibold text-forest-800 backdrop-blur-md md:hidden">
                    <Grid2x2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {photos.length} photos
                  </span>
                )}
              </button>

              <div className="relative hidden grid-cols-2 grid-rows-2 gap-2 md:grid">
                {Array.from({ length: 4 }).map((_, i) => {
                  const photo = secondaryPhotos[i];
                  const at = photo ? photos.findIndex((p) => p.id === photo.id) : 0;
                  return photo ? (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => openAt(at)}
                      aria-label={`Photo ${i + 2} sur ${photos.length}`}
                      className="group relative h-full w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring"
                    >
                      <Image src={photo.url} alt="" fill sizes="25vw"
                        className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transform-none" />
                      <span className="absolute inset-0 bg-forest-950/0 transition-colors duration-200 group-hover:bg-forest-950/10" />
                    </button>
                  ) : (
                    <div key={`empty-${i}`} className="h-full w-full bg-neutral-200" aria-hidden="true" />
                  );
                })}

                <button
                  type="button"
                  onClick={() => openAt(0)}
                  className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-pill border border-white/60 bg-white/90 px-4 py-2.5 text-sm font-semibold text-forest-800 shadow-md backdrop-blur-md transition-colors hover:bg-white"
                >
                  <Grid2x2 className="h-4 w-4" aria-hidden="true" />
                  Voir les {photos.length} photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid h-64 place-items-center gap-2 text-foreground-muted">
              <ImageOff className="h-8 w-8 text-neutral-300" aria-hidden="true" />
              <p className="text-sm">Aucune photo</p>
            </div>
          )}
        </div>
      </section>

      {/* 4 · KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map(({ icon: Icon, value, sub, label }) => (
          <div key={label} className="space-y-2 rounded-card border border-border bg-background-card p-5 shadow-sm">
            <span className="grid h-9 w-9 place-items-center rounded-inner bg-neutral-100 text-forest-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="flex items-baseline gap-1">
                <span className="text-xl font-semibold tabular-nums text-forest-900 sm:text-2xl">{value}</span>
                {sub && <span className="text-xs text-foreground-muted">{sub}</span>}
              </p>
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 5 · Revenus, calendrier, réservations */}
      <RevenueCard revenue={revenue} reservations={reservations} />

      <div className="grid gap-6 md:grid-cols-2">
        <ListingCalendar listingId={listing.id} reservations={reservations} />

        <section className="section-inverse flex flex-col p-5 sm:p-6">
          <header className="mb-4 flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center gap-3">
              <span className="marker marker--onDark">
                <CalendarCheck className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
              </span>
              <h3 className="font-display text-base font-semibold text-neutral-50">Réservations récentes</h3>
            </div>
            <Link
              href={`/dashboard/reservations?logementId=${listing.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-on-inverse-marker transition-colors hover:text-on-inverse-marker"
            >
              Tout voir
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </header>

          <div className="flex-1 space-y-2.5">
            {recentRes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-pill bg-white/5 text-forest-200">
                  <CalendarCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-neutral-50">Aucune réservation</p>
                <p className="max-w-xs text-xs text-forest-200">
                  Les séjours réservés par vos voyageurs s&apos;afficheront ici.
                </p>
              </div>
            ) : recentRes.map((r) => {
              const cfg = STATUT_CFG[r.statut] ?? STATUT_CFG.COMPLETED;
              const initials = `${r.locataire.prenom?.[0] ?? ''}${r.locataire.nom?.[0] ?? ''}`.toUpperCase() || 'L';
              const duration = Math.max(1, Math.round(
                (new Date(r.dateFin).getTime() - new Date(r.dateDebut).getTime()) / 86_400_000));

              return (
                <Link
                  key={r.id}
                  href={`/dashboard/reservations/${r.id}`}
                  className="group flex items-center justify-between gap-3 rounded-inner bg-white/[0.04] p-3.5 transition-colors hover:bg-white/[0.08]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-white/10 text-xs font-semibold text-on-inverse-marker">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-50">
                        {r.locataire.prenom} {r.locataire.nom}
                      </p>
                      <p className="text-xs text-forest-200">
                        {fmtDateShort(r.dateDebut)} → {fmtDateShort(r.dateFin)} · {duration} nuit{duration > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="hidden text-right sm:block">
                      <span className="block text-sm font-semibold tabular-nums text-neutral-50">
                        {fcfa(Number(r.netProprietaire ?? r.totalLocataire ?? 0))}
                      </span>
                      <span className="block text-[0.6875rem] text-forest-200">FCFA</span>
                    </span>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[0.6875rem] font-semibold',
                      cfg.bg, cfg.text, cfg.border,
                    )}>
                      <span className={cn('h-1.5 w-1.5 rounded-pill', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      {/* 6 · Détails du bien */}
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <span className="marker">
                  <Sliders className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-semibold text-forest-900">Caractéristiques</h3>
              </div>
              <span className="eyebrow">{TYPE_LABELS[listing.type] ?? listing.type}</span>
            </header>

            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {specs.map(({ icon: Icon, value, label }) => (
                <li key={label} className="space-y-2 text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-inner bg-neutral-100 text-forest-700">
                    <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xl font-semibold tabular-nums leading-none text-forest-900">{value}</p>
                    <p className="mt-1 text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">{label}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <DescriptionSection
            description={listing.description}
            reglesMaison={listing.reglesMaison}
            instructionsAcces={listing.instructionsAcces}
          />

          {listing.equipements.length > 0 && (
            <EquipementsSection equipements={listing.equipements} />
          )}

          <TarificationSection
            prixBase={listing.prixBase}
            personnesBase={listing.personnesBase}
            capaciteMax={listing.capaciteMax}
            nuitesMinimum={listing.nuitesMinimum}
            tarifsNuits={listing.tarifsNuits}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm">
            <header className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="marker">
                  <Settings className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                </span>
                <h3 className="font-display text-sm font-semibold text-forest-900">Statut</h3>
              </div>
              <ListingStatusBadge statut={listing.statut} size="sm" />
            </header>

            <div className="space-y-2.5">
              {(listing.statut === 'DRAFT' || listing.statut === 'REJECTED') && (
                <Link
                  href={`/dashboard/annonces/${listing.id}/soumettre`}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-pill bg-forest-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-700"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Soumettre pour validation
                </Link>
              )}

              {listing.statut === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => pauseMutation.mutate()}
                  disabled={pauseMutation.isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-pill border border-border px-5 text-sm font-semibold text-forest-800 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" aria-hidden="true" />
                  {pauseMutation.isPending ? 'Mise en pause…' : 'Mettre en pause'}
                </button>
              )}

              {listing.statut === 'PAUSED' && (
                <button
                  type="button"
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-pill bg-forest-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {resumeMutation.isPending ? 'Reprise…' : 'Reprendre la publication'}
                </button>
              )}

              <Link
                href={`/dashboard/annonces/${listing.id}/modifier`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-pill bg-action hover:bg-action-hover text-on-action font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Pencil className="h-4 w-4 text-forest-950" aria-hidden="true" />
                <span>Modifier le bien</span>
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {/* Visionneuse */}
      {openLightbox && photos.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${listing.titre}`}
          onClick={() => setOpenLightbox(false)}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-forest-950/95 p-4 backdrop-blur-xl sm:p-6"
        >
          <div className="z-10 flex w-full max-w-6xl items-center justify-between">
            <span className="rounded-pill border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tabular-nums text-white/80">
              {lightboxIndex + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => setOpenLightbox(false)}
              aria-label="Fermer la galerie"
              className="grid h-10 w-10 place-items-center rounded-pill border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative my-4 flex w-full max-w-5xl flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}>
            <div ref={emblaRef} className="h-full w-full overflow-hidden">
              <div className="flex h-full">
                {photos.map((p, i) => (
                  <div key={p.id ?? i} className="relative h-full flex-[0_0_100%]">
                    <Image src={p.url} alt={`${listing.titre} — photo ${i + 1}`} fill sizes="100vw" className="object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {photos.length > 1 && (['left', 'right'] as const).map((side) => {
              const Icon = side === 'left' ? ChevronLeft : ChevronRight;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => side === 'left' ? embla?.scrollPrev() : embla?.scrollNext()}
                  aria-label={side === 'left' ? 'Photo précédente' : 'Photo suivante'}
                  className={cn(
                    'absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill border border-white/15 bg-forest-950/60 text-white backdrop-blur-md transition-colors hover:bg-forest-950/80',
                    side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}