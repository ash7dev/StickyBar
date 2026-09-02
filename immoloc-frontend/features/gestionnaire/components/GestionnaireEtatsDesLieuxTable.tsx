'use client';

import { useMemo, useState } from 'react';
import {
  Camera,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  Inbox,
  LogIn,
  LogOut,
  MapPin,
  ShieldAlert,
  User,
  Zap,
} from 'lucide-react';
import { type InspectionReportItem } from './GestionnaireInspectionDetailModal';
import { cn } from '@/lib/utils/cn';

/* ────────────────────────────────────────────────────────────────────────────
   Types & Constants
   ──────────────────────────────────────────────────────────────────────────── */

interface Props {
  reports: InspectionReportItem[];
  onOpenReport: (report: InspectionReportItem) => void;
}

type FilterKey = 'ALL' | 'CHECKIN' | 'CHECKOUT' | 'LITIGE';

const TABS: { id: FilterKey; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'CHECKIN', label: 'Entrées' },
  { id: 'CHECKOUT', label: 'Sorties' },
  { id: 'LITIGE', label: 'Litiges' },
];

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

export function GestionnaireEtatsDesLieuxTable({ reports, onOpenReport }: Props) {
  const [filterKey, setFilterKey] = useState<FilterKey>('ALL');

  /* ── Comptages ───────────────────────────────────────────────────────────── */
  const counts = useMemo(() => ({
    all: reports.length,
    checkins: reports.filter((r) => r.type === 'CHECKIN').length,
    checkouts: reports.filter((r) => r.type === 'CHECKOUT').length,
    litiges: reports.filter((r) => r.statut === 'LITIGE').length,
  }), [reports]);

  const filtered = useMemo(() => {
    if (filterKey === 'ALL') return reports;
    if (filterKey === 'CHECKIN') return reports.filter((r) => r.type === 'CHECKIN');
    if (filterKey === 'CHECKOUT') return reports.filter((r) => r.type === 'CHECKOUT');
    return reports.filter((r) => r.statut === 'LITIGE');
  }, [reports, filterKey]);

  const countFor = (id: FilterKey) =>
    id === 'ALL' ? counts.all
      : id === 'CHECKIN' ? counts.checkins
        : id === 'CHECKOUT' ? counts.checkouts
          : counts.litiges;

  /* ── Rendu ───────────────────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-card border overflow-hidden shadow-2xs"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Titre */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-50)' }}
            >
              <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
            </div>
            <div>
              <h3
                className="font-display text-base sm:text-lg font-bold tracking-tight"
                style={{ color: 'var(--forest-900)' }}
              >
                Registre des Inspections Conciergerie
              </h3>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                États des lieux d'entrée et de sortie certifiés, compteurs et photos horodatées.
              </p>
            </div>
          </div>

          {/* Onglets filtres */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-pill p-1 self-start lg:self-auto"
            style={{ background: 'var(--background-alt)', border: '1px solid var(--border)' }}
          >
            {TABS.map((tab) => {
              const count = countFor(tab.id);
              const active = filterKey === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterKey(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-pill transition-all cursor-pointer',
                    active ? 'shadow-2xs' : '',
                  )}
                  style={{
                    background: active ? 'var(--background-card)' : 'transparent',
                    color: active ? 'var(--forest-900)' : 'var(--foreground-muted)',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className="px-1.5 py-px text-[0.6rem] rounded-pill font-extrabold leading-tight"
                    style={{
                      background: active ? 'var(--forest-900)' : 'var(--neutral-200)',
                      color: active ? 'var(--lime-400)' : 'var(--neutral-700)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bandeau synthèse ────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-inner overflow-hidden"
          style={{ background: 'var(--border)', border: '1px solid var(--border)' }}
        >
          {/* Check-ins */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--success-50)', border: '1px solid var(--success-500)' }}
            >
              <LogIn className="w-4 h-4" style={{ color: 'var(--success-700)' }} />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                États d'Entrée
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: 'var(--forest-900)' }}
              >
                {counts.checkins}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                  check-in{counts.checkins > 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>

          {/* Check-outs */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-950)', color: 'var(--lime-400)' }}
            >
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                États de Sortie
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: 'var(--forest-950)' }}
              >
                {counts.checkouts}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                  check-out{counts.checkouts > 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>

          {/* Litiges */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: counts.litiges > 0 ? 'var(--warning-50)' : 'var(--neutral-100)',
                border: `1px solid ${counts.litiges > 0 ? 'var(--warning-500)' : 'var(--border)'}`,
              }}
            >
              <ShieldAlert className="w-4 h-4" style={{ color: counts.litiges > 0 ? 'var(--warning-700)' : 'var(--neutral-400)' }} />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Non-Conformités
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: counts.litiges > 0 ? 'var(--warning-700)' : 'var(--forest-900)' }}
              >
                {counts.litiges}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>
                  signalement{counts.litiges > 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Séparateur ─────────────────────────────────────────────────────── */}
      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* ── Contenu : Tableau ou Empty ──────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--neutral-100)' }}
          >
            <Inbox className="w-6 h-6" style={{ color: 'var(--neutral-400)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Aucun état des lieux trouvé
          </p>
          <p className="text-xs font-medium max-w-sm text-center" style={{ color: 'var(--foreground-faint)' }}>
            {filterKey === 'ALL'
              ? 'Les rapports d\u2019entrée et de sortie validés lors des séjours s\u2019afficheront ici.'
              : 'Aucun rapport correspondant à ce filtre pour la période sélectionnée.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[860px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Code & Date', 'Type & Logement', 'Acteurs', 'Pièces jointes', 'Statut', 'Rapport'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cn('px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider', i === 5 && 'text-right')}
                      style={{ color: 'var(--foreground-muted)', background: 'var(--neutral-50)' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const isCheckin = r.type === 'CHECKIN';
                const isLast = idx === filtered.length - 1;

                return (
                  <tr
                    key={r.id}
                    className="transition-colors cursor-pointer group"
                    onClick={() => onOpenReport(r)}
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      borderLeft: `3px solid ${isCheckin ? 'var(--success-500)' : 'var(--forest-700)'}`,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* ── Code & Date ───────────────────────────────────────── */}
                    <td className="px-5 py-4">
                      <span
                        className="font-mono font-bold text-[0.7rem] px-2 py-0.5 rounded-inner inline-block"
                        style={{
                          background: 'var(--background-alt)',
                          color: 'var(--forest-950)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {r.code}
                      </span>
                      <p className="text-[0.65rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        {r.dateInspection}
                      </p>
                    </td>

                    {/* ── Type & Logement ───────────────────────────────────── */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-card flex items-center justify-center shrink-0 shadow-2xs"
                          style={{
                            background: isCheckin ? 'var(--success-50)' : 'var(--forest-950)',
                            color: isCheckin ? 'var(--success-700)' : 'var(--lime-400)',
                            border: isCheckin ? '1px solid var(--success-500)' : 'none',
                          }}
                        >
                          {isCheckin ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate max-w-[200px]" style={{ color: 'var(--forest-950)' }}>
                            {r.logementTitre}
                          </p>
                          <p className="text-[0.65rem] font-medium flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                            <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--forest-600)' }} />
                            <span className="truncate max-w-[160px]">{r.logementVille}</span>
                            <span className="font-bold" style={{ color: isCheckin ? 'var(--success-700)' : 'var(--forest-800)' }}>
                              · {isCheckin ? 'Entrée' : 'Sortie'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ── Acteurs ───────────────────────────────────────────── */}
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[0.55rem] font-bold"
                            style={{ background: 'var(--forest-900)', color: 'var(--lime-400)' }}
                          >
                            {r.travelerName.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-xs truncate max-w-[140px]" style={{ color: 'var(--forest-950)' }}>
                            {r.travelerName}
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-pill"
                          style={{
                            background: 'var(--forest-50)',
                            color: 'var(--forest-800)',
                            border: '1px solid var(--forest-200)',
                          }}
                        >
                          <User className="w-2.5 h-2.5" />
                          {r.ownerName}
                        </span>
                      </div>
                    </td>

                    {/* ── Pièces jointes (Photos & Compteur) ───────────────── */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2.5 py-1 rounded-pill w-fit"
                          style={{
                            background: 'var(--background-alt)',
                            color: 'var(--forest-900)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Camera className="w-3 h-3" style={{ color: 'var(--forest-600)' }} />
                          {r.photosCount} photo{r.photosCount > 1 ? 's' : ''} certifiée{r.photosCount > 1 ? 's' : ''}
                        </span>

                        {r.releveCompteur && (
                          <span
                            className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2.5 py-1 rounded-pill w-fit"
                            style={{
                              background: 'var(--gold-50)',
                              color: 'var(--gold-800)',
                              border: '1px solid var(--gold-200)',
                            }}
                            title={r.releveCompteur}
                          >
                            <Zap className="w-3 h-3" />
                            Compteur relevé
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ── Statut ────────────────────────────────────────────── */}
                    <td className="px-5 py-4">
                      <InspectionStatutBadge statut={r.statut} />
                    </td>

                    {/* ── Action Rapport ────────────────────────────────────── */}
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReport(r);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill text-xs font-bold transition-all cursor-pointer group-hover:shadow-xs"
                        style={{
                          background: 'var(--forest-900)',
                          color: 'var(--lime-400)',
                          border: '1px solid var(--forest-700)',
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Consulter</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pied récapitulatif ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div
            className="px-6 py-3.5 flex items-center justify-between"
            style={{ background: 'var(--neutral-50)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              {filtered.length} rapport{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold tabular-nums flex items-center gap-1.5" style={{ color: 'var(--forest-900)' }}>
              <FileText className="w-3.5 h-3.5" style={{ color: 'var(--forest-600)' }} />
              Total inspections : {reports.length}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Sub-component: Statut Badge
   ──────────────────────────────────────────────────────────────────────────── */

function InspectionStatutBadge({ statut }: { statut: InspectionReportItem['statut'] }) {
  if (statut === 'VALIDE') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold"
        style={{
          background: 'var(--success-50)',
          color: 'var(--success-700)',
          border: '1px solid var(--success-500)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: 'var(--success-600)' }}
        />
        Certifié Conforme
      </span>
    );
  }

  if (statut === 'LITIGE') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-bold"
        style={{
          background: 'var(--warning-50)',
          color: 'var(--warning-700)',
          border: '1px solid var(--warning-500)',
        }}
      >
        <ShieldAlert className="w-3 h-3" />
        Réserve Signalée
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.65rem] font-medium"
      style={{
        background: 'var(--neutral-100)',
        color: 'var(--neutral-700)',
        border: '1px solid var(--border)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
        style={{ background: 'var(--neutral-400)' }}
      />
      En attente signature
    </span>
  );
}
