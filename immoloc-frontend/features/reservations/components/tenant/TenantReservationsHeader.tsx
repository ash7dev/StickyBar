'use client';

import {
  CalendarDays, ShieldCheck, Sparkles, MapPin,
  Clock, Compass, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ReservationTabId = 'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface TenantReservationsHeaderProps {
  activeTab: ReservationTabId;
  onTabChange: (tab: ReservationTabId) => void;
  totalCount: number;
  confirmedCount: number;
  checkedInCount: number;
  completedCount: number;
  cancelledCount: number;
  nextCheckInDays?: number | null;
}

const TABS: Array<{ id: ReservationTabId; label: string; countKey: 'totalCount' | 'confirmedCount' | 'checkedInCount' | 'completedCount' | 'cancelledCount'; dot: string }> = [
  { id: 'ALL', label: 'Toutes', countKey: 'totalCount', dot: 'bg-forest-500' },
  { id: 'CONFIRMED', label: 'Confirmées', countKey: 'confirmedCount', dot: 'bg-blue-600' },
  { id: 'CHECKED_IN', label: 'En cours', countKey: 'checkedInCount', dot: 'bg-emerald-500 animate-pulse' },
  { id: 'COMPLETED', label: 'Terminées', countKey: 'completedCount', dot: 'bg-slate-400' },
  { id: 'CANCELLED', label: 'Annulées', countKey: 'cancelledCount', dot: 'bg-rose-500' },
];

export function TenantReservationsHeader({
  activeTab,
  onTabChange,
  totalCount,
  confirmedCount,
  checkedInCount,
  completedCount,
  cancelledCount,
  nextCheckInDays,
}: TenantReservationsHeaderProps) {
  const counts = {
    totalCount,
    confirmedCount,
    checkedInCount,
    completedCount,
    cancelledCount,
  };

  return (
    <div className="space-y-6 pt-1 pb-2">
      {/* ── 1. En-tête Principal avec Titre & Badge Séquestre ──────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/70">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold tracking-wide">
            <Compass className="w-3.5 h-3.5 text-forest-600" />
            <span>Espace Locataire · Mes Séjours</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-forest-950 leading-tight">
            Mes Séjours & Voyages
          </h1>

          <p className="text-sm text-foreground-muted leading-relaxed font-sans">
            Gérez vos réservations, accédez à vos instructions d'arrivée et bénéficiez de la protection complète du séquestre Klef.
          </p>
        </div>

        {/* Badge réassurance Séquestre flottant */}
        <div className="bg-background-card rounded-card border border-border p-4 shadow-sm flex items-center gap-3.5 shrink-0 self-start md:self-auto">
          <div className="w-10 h-10 rounded-inner bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 shrink-0">
            <ShieldCheck className="w-5 h-5 text-forest-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-forest-900 uppercase tracking-wider">
                Garantie Séquestre Klef
              </span>
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Paiement débloqué uniquement à la remise des clés
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Cartes de Métriques Rapides (Statistiques) ───────────────────── */}
      <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:grid-cols-3 gap-4 pb-2 sm:pb-0 no-scrollbar">
        {/* Carte 1 : Total Séjours */}
        <div className="shrink-0 w-72 sm:w-auto snap-center bg-background-card rounded-card border border-border p-5 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-forest-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground-muted">
              Total Séjours
            </span>
            <div className="w-8.5 h-8.5 rounded-inner bg-forest-950 flex items-center justify-center text-on-inverse-marker shadow-2xs border border-action-edge">
              <CalendarDays className="w-4 h-4 text-on-inverse-marker" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-forest-950">
            {totalCount} <span className="text-xs font-sans font-medium text-foreground-muted">réservation{totalCount > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Carte 2 : Séjour Actif / Prochain Départ */}
        <div className="shrink-0 w-72 sm:w-auto snap-center bg-background-card rounded-card border border-border p-5 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-forest-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground-muted">
              Statut Séjour
            </span>
            <div className="w-8.5 h-8.5 rounded-inner bg-forest-950 flex items-center justify-center text-on-inverse-marker shadow-2xs border border-action-edge">
              <Sparkles className="w-4 h-4 text-on-inverse-marker" />
            </div>
          </div>
          <div className="font-display text-2xl font-bold text-forest-950 truncate">
            {checkedInCount > 0 ? (
              <span className="text-forest-700 flex items-center gap-1.5 text-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-ping" />
                Séjour en cours
              </span>
            ) : confirmedCount > 0 ? (
              <span className="text-forest-900 text-lg">
                {confirmedCount} séjour{confirmedCount > 1 ? 's' : ''} à venir
              </span>
            ) : (
              <span className="text-foreground-faint text-base font-sans font-semibold">
                Aucun séjour actif
              </span>
            )}
          </div>
        </div>

        {/* Carte 3 : Protection & Reçus */}
        <div className="shrink-0 w-72 sm:w-auto snap-center bg-background-card rounded-card border border-border p-5 shadow-2xs space-y-1.5 relative overflow-hidden group hover:border-forest-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-foreground-muted">
              Paiement & Contrats
            </span>
            <div className="w-8.5 h-8.5 rounded-inner bg-forest-950 flex items-center justify-center text-on-inverse-marker shadow-2xs border border-action-edge">
              <CheckCircle2 className="w-4 h-4 text-on-inverse-marker" />
            </div>
          </div>
          <div className="font-display text-lg font-bold text-forest-950 flex items-center gap-1">
            100% Vérifiés
            <span className="text-xs font-sans font-normal text-foreground-muted">· Contrats PDF</span>
          </div>
        </div>
      </div>

      {/* ── 3. Barre de Filtres Segmentée (Pilules) ─────────────────────────── */}
      <div className="bg-background-alt p-1.5 rounded-pill border border-border/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.countKey];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-pill text-xs font-bold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer',
                isActive
                  ? 'bg-forest-900 text-on-inverse-marker shadow-md'
                  : 'text-foreground-muted hover:text-forest-900 hover:bg-background-card/80',
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', tab.dot)} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-pill text-[10px] font-extrabold tabular-nums',
                    isActive
                      ? 'bg-forest-800 text-on-inverse-marker'
                      : 'bg-background-card border border-border text-foreground-muted',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
