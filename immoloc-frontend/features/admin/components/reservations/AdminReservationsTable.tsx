'use client';

import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import {
  Ban, CalendarDays, CheckCheck, CheckCircle2, ChevronDown, Clock, Eye, History,
  MapPin, Scale, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ReservationItem {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;
  totalLocataire: number;
  montantCommission: number;
  netProprietaire: number;
  typePaiement?: string;
  statut: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
  creeLe?: string;
  locataire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
  proprietaire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
  logement?: { id: string; titre?: string; ville?: string; type?: string };
  paiement?: { statut?: string; fournisseur?: string; montant?: number };
  litige?: { id: string; statut?: string; motif?: string } | null;
}

interface AdminReservationsTableProps {
  reservations: ReservationItem[];
  isLoading?: boolean;
  activeTab?: string;
  onInspect: (reservation: ReservationItem) => void;
  onForceCancel: (reservation: ReservationItem) => void;
}

/* ⚠ `blue-*`, `purple-*`, `warning-200/300/800/900`, `error-200/800/100`
   n'existent pas dans globals.css. Les badges PENDING, CHECKED_IN, CANCELLED
   et le badge de litige rendaient sans couleur de texte ni bordure. */
const STATUS_CONFIG: Record<
  ReservationItem['statut'],
  { label: string; Icon: ComponentType<{ className?: string }>; badge: string }
> = {
  PENDING: { label: 'En attente', Icon: Clock, badge: 'border-warning-500/25 bg-warning-50 text-warning-700' },
  CONFIRMED: { label: 'Confirmée', Icon: CheckCircle2, badge: 'border-forest-100 bg-forest-50 text-forest-700' },
  CHECKED_IN: { label: 'En séjour', Icon: CheckCheck, badge: 'border-info-500/25 bg-info-50 text-info-700' },
  COMPLETED: { label: 'Terminée', Icon: CheckCircle2, badge: 'border-border bg-background-alt text-foreground-muted' },
  CANCELLED: { label: 'Annulée', Icon: XCircle, badge: 'border-error-500/25 bg-error-50 text-error-700' },
};

/* Aligné sur le reste de l'app : `Intl` en style `currency` XOF rendait
   « 12 345 F CFA », partout ailleurs c'est « 12 345 FCFA ». Un modérateur qui
   compare deux écrans ne doit pas se demander si c'est la même unité. */
const fmtMontant = (n?: number | null) =>
  n == null ? '—' : `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`;

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const nomComplet = (u?: { prenom?: string; nom?: string } | null) =>
  `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || '—';

const plur = (n: number, mot: string, p = `${mot}s`) => (n > 1 ? p : mot);

/* Un paiement peut avoir échoué sur une réservation confirmée. Le champ
   existait dans le type et n'était affiché nulle part. */
const PAIEMENT_OK = ['REUSSI', 'SUCCESS', 'PAID', 'COMPLETED', 'CONFIRME'];
const PAIEMENT_KO = ['ECHOUE', 'FAILED', 'CANCELLED', 'ANNULE', 'EXPIRED'];

function tonPaiement(statut?: string) {
  const s = (statut ?? '').toUpperCase();
  if (PAIEMENT_OK.includes(s)) return 'text-forest-700';
  if (PAIEMENT_KO.includes(s)) return 'text-error-700';
  return 'text-warning-700';
}

/* ─── En-tête, factorisé ──────────────────────────────────────────────────
   Les six colonnes étaient recopiées trois fois. Une divergence entre deux
   copies passe inaperçue jusqu'à ce qu'une colonne se décale. */

const COLONNES = ['Séjour', 'Logement', 'Parties', 'Montants', 'Statut', 'Actions'];

function Tableau({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="no-scrollbar overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              {COLONNES.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    'px-4 py-3.5',
                    i === 0 && 'sm:px-6',
                    i === COLONNES.length - 1 && 'text-right sm:px-6',
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          {children}
        </table>
      </div>
    </div>
  );
}

/* ─── Lignes ──────────────────────────────────────────────────────────────── */

function ReservationRows({
  items,
  onInspect,
  onForceCancel,
}: {
  items: ReservationItem[];
  onInspect: (r: ReservationItem) => void;
  onForceCancel: (r: ReservationItem) => void;
}) {
  const bouton =
    'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors';

  return (
    <tbody className="divide-y divide-border">
      {items.map((item) => {
        const cfg = STATUS_CONFIG[item.statut] ?? STATUS_CONFIG.PENDING;
        const annulable = item.statut !== 'CANCELLED' && item.statut !== 'COMPLETED';
        const enAcompte = item.typePaiement === 'DEPOSIT';
        const regleEnLigne = item.paiement?.montant;
        const reference = `${item.logement?.titre ?? 'réservation'} du ${fmtDate(item.dateDebut)}`;

        return (
          <tr key={item.id} className="transition-colors hover:bg-background-alt">
            {/* ── Séjour ──────────────────────────────────────────────── */}
            <td className="px-4 py-4 sm:px-6">
              <p className="font-semibold tabular-nums text-foreground">
                {fmtDate(item.dateDebut)} → {fmtDate(item.dateFin)}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-foreground-muted">
                {item.nbNuits} {plur(item.nbNuits, 'nuit')} · {item.nbPersonnes}{' '}
                {plur(item.nbPersonnes, 'personne')}
              </p>
              {item.creeLe && (
                <p className="mt-0.5 text-xs text-foreground-muted">
                  Réservée le {fmtDate(item.creeLe)}
                </p>
              )}
            </td>

            {/* ── Logement ────────────────────────────────────────────── */}
            <td className="px-4 py-4">
              <p className="max-w-[160px] truncate font-semibold text-foreground">
                {item.logement?.titre ?? '—'}
              </p>
              {item.logement?.ville && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  {item.logement.ville}
                </p>
              )}
            </td>

            {/* ── Parties ─────────────────────────────────────────────── */}
            <td className="px-4 py-4">
              <dl className="space-y-1.5">
                <div>
                  <dt className="text-xs text-foreground-muted">Locataire</dt>
                  <dd className="font-semibold text-foreground">{nomComplet(item.locataire)}</dd>
                </div>
                <div className="border-t border-border pt-1.5">
                  <dt className="text-xs text-foreground-muted">Hôte</dt>
                  <dd className="font-semibold text-foreground">{nomComplet(item.proprietaire)}</dd>
                </div>
              </dl>
            </td>

            {/* ── Montants ────────────────────────────────────────────────
                Le badge annonçait « Acompte 30 % en ligne » en dur, alors que
                le pourcentage est réglé par annonce et ne figure même pas dans
                ce type. On affiche le montant réellement encaissé. */}
            <td className="px-4 py-4">
              <p className="font-semibold tabular-nums text-foreground">
                {fmtMontant(item.totalLocataire)}
              </p>

              <p className="mt-1 text-xs text-foreground-muted">
                {enAcompte ? 'Acompte en ligne' : 'Réglé en totalité'}
                {regleEnLigne != null && (
                  <span className="tabular-nums"> · {fmtMontant(regleEnLigne)}</span>
                )}
              </p>

              {/* Une réservation confirmée dont le paiement a échoué était
                  indiscernable d'une réservation encaissée. */}
              {item.paiement?.statut && (
                <p className={cn('mt-0.5 text-xs font-medium', tonPaiement(item.paiement.statut))}>
                  Paiement {item.paiement.statut.toLowerCase()}
                  {item.paiement.fournisseur ? ` · ${item.paiement.fournisseur}` : ''}
                </p>
              )}

              <dl className="mt-1.5 space-y-0.5 border-t border-border pt-1.5 text-xs text-foreground-muted">
                <div className="flex justify-between gap-2">
                  <dt>Commission</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {fmtMontant(item.montantCommission)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Net hôte</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {fmtMontant(item.netProprietaire)}
                  </dd>
                </div>
              </dl>
            </td>

            {/* ── Statut ──────────────────────────────────────────────── */}
            <td className="px-4 py-4">
              <div className="space-y-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                    cfg.badge,
                  )}
                >
                  <cfg.Icon className="h-3.5 w-3.5" aria-hidden />
                  {cfg.label}
                </span>

                {/* Le badge affichait « Litige ouvert » dès qu'un litige
                    existait, y compris résolu. Le statut réel est affiché. */}
                {item.litige && (
                  <div className="space-y-0.5">
                    <span className="inline-flex items-center gap-1 rounded-pill border border-error-500/25 bg-error-50 px-2 py-0.5 text-xs font-semibold text-error-700">
                      <Scale className="h-3 w-3" aria-hidden />
                      Litige
                      {item.litige.statut && (
                        <span className="font-normal"> · {item.litige.statut.toLowerCase()}</span>
                      )}
                    </span>
                    {item.litige.motif && (
                      <p className="max-w-[170px] text-xs leading-relaxed text-foreground-muted">
                        {item.litige.motif}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </td>

            {/* ── Actions ─────────────────────────────────────────────── */}
            <td className="px-4 py-4 text-right sm:px-6">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => onInspect(item)}
                  aria-label={`Ouvrir le dossier : ${reference}`}
                  className={cn(
                    bouton,
                    'border border-border bg-background-card text-foreground hover:bg-background-alt',
                  )}
                >
                  <Eye className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
                  <span className="hidden sm:inline">Détails</span>
                </button>

                {annulable && (
                  <button
                    type="button"
                    onClick={() => onForceCancel(item)}
                    aria-label={`Annuler : ${reference}`}
                    className={cn(
                      bouton,
                      'border border-error-500/25 bg-error-50 text-error-700 hover:bg-error-50/70',
                    )}
                  >
                    <Ban className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">Annuler</span>
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminReservationsTable({
  reservations,
  isLoading = false,
  activeTab = 'ALL',
  onInspect,
  onForceCancel,
}: AdminReservationsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-card border border-dashed border-border bg-background-card p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 text-forest-700">
          <CalendarDays className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">
            Aucune réservation trouvée
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Aucune réservation ne correspond aux filtres ou à la recherche.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tableau>
      <ReservationRows items={reservations} onInspect={onInspect} onForceCancel={onForceCancel} />
    </Tableau>
  );
}