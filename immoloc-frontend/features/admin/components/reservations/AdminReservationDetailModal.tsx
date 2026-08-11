'use client';

import { useEffect, useState } from 'react';
import { X, CalendarDays, User, MapPin, CreditCard, Clock, Camera, FileText, Loader2, ShieldCheck, Scale, History, DollarSign } from 'lucide-react';
import { ReservationItem } from './AdminReservationsTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface AdminReservationDetailModalProps {
  reservation: ReservationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onForceCancel: (reservation: ReservationItem) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null || Number.isNaN(Number(amount))) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(Number(amount)))} FCFA`;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminReservationDetailModal({
  reservation,
  isOpen,
  onClose,
  onForceCancel,
}: AdminReservationDetailModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!reservation?.id || !isOpen) {
      setDetails(null);
      return;
    }
    setIsLoading(true);
    adminApi.getReservationDetails(reservation.id)
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setIsLoading(false));
  }, [reservation?.id, isOpen]);

  if (!isOpen || !reservation) return null;

  const data = details ?? reservation;
  const loc = data.locataire;
  const prop = data.proprietaire;
  const log = data.logement;
  const paiement = data.paiement;
  const photos: Array<{ id: string; url: string; type?: string }> = data.photosEtatLieu ?? [];
  const historique: Array<{ id: string; ancienStatut?: string; nouveauStatut: string; modifieLe: string; raison?: string }> = data.historique ?? [];
  const canForceCancel = data.statut !== 'CANCELLED' && data.statut !== 'COMPLETED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Détails de la Réservation
              </h2>
              <p className="text-xs text-foreground-muted">
                Créée le {formatDate(data.creeLe)} | Statut : <span className="font-bold text-foreground">{data.statut}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
          </div>
        ) : (
          <>
            {/* Dates & Logement Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Période du séjour
                </p>
                <p className="text-xs font-bold text-foreground">{formatDate(data.dateDebut)} → {formatDate(data.dateFin)}</p>
                <p className="text-[0.6875rem] text-foreground-muted">{data.nbNuits} nuit(s) | {data.nbPersonnes} voyageur(s)</p>
              </div>

              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Logement réservé
                </p>
                <p className="text-xs font-bold text-foreground">{log?.titre ?? "—"}</p>
                <p className="text-[0.6875rem] text-foreground-muted">{log?.ville ?? "—"} ({log?.type ?? "Logement"})</p>
              </div>

              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-forest-600" /> Montant & Paiement
                </p>
                <p className="font-display text-sm font-bold text-foreground tabular-nums">{formatPrice(data.totalLocataire)}</p>
                <p className="text-[0.6875rem] text-foreground-muted">Paiement : {paiement?.statut ?? "Non effectué"}</p>
              </div>
            </div>

            {/* Répartition Financière & Option de Paiement */}
            <div className="rounded-inner border border-border bg-background-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-forest-600" /> Ventilation Financière & Option de Paiement
                </h3>
                {data.typePaiement === 'DEPOSIT' ? (
                  <span className="inline-flex items-center rounded-pill border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-900">
                    Acompte 30% en ligne (+ 70% au check-in)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-pill border border-forest-300 bg-forest-50 px-3 py-1 text-xs font-bold text-forest-900">
                    100% Réglé intégralement en ligne
                  </span>
                )}
              </div>

              {data.typePaiement === 'DEPOSIT' ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-inner border border-border bg-background-alt/30">
                    <p className="text-foreground-muted text-[0.6875rem]">Total de la réservation :</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{formatPrice(data.totalLocataire)}</p>
                  </div>
                  <div className="p-3 rounded-inner border border-purple-200 bg-purple-50/50">
                    <p className="text-purple-800 text-[0.6875rem] font-semibold">Acompte (30%) payé en ligne :</p>
                    <p className="font-bold text-purple-900 text-sm mt-0.5">{formatPrice((data.totalLocataire ?? 0) * 0.3)}</p>
                  </div>
                  <div className="p-3 rounded-inner border border-warning-200 bg-warning-50/50">
                    <p className="text-warning-800 text-[0.6875rem] font-semibold">Solde (70%) à payer sur place :</p>
                    <p className="font-bold text-warning-900 text-sm mt-0.5">{formatPrice((data.totalLocataire ?? 0) * 0.7)}</p>
                  </div>
                  <div className="p-3 rounded-inner border border-forest-200 bg-forest-50/50">
                    <p className="text-forest-800 text-[0.6875rem] font-semibold">Commission Klef (Revenu) :</p>
                    <p className="font-bold text-forest-900 text-sm mt-0.5">{formatPrice(data.montantCommission)}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-inner border border-border bg-background-alt/30">
                    <p className="text-foreground-muted text-[0.6875rem]">Total payé par le locataire :</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{formatPrice(data.totalLocataire)}</p>
                  </div>
                  <div className="p-3 rounded-inner border border-forest-200 bg-forest-50/50">
                    <p className="text-forest-800 text-[0.6875rem] font-semibold">Commission Klef (Revenu) :</p>
                    <p className="font-bold text-forest-900 text-sm mt-0.5">{formatPrice(data.montantCommission)}</p>
                  </div>
                  <div className="p-3 rounded-inner border border-border bg-background-alt/30">
                    <p className="text-foreground-muted text-[0.6875rem]">Net reversé au propriétaire :</p>
                    <p className="font-bold text-foreground text-sm mt-0.5">{formatPrice(data.netProprietaire)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Les Parties : Locataire vs Propriétaire */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-inner border border-border bg-background-card p-4 space-y-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" /> Locataire (Voyageur)
                </p>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-foreground">{loc?.prenom} {loc?.nom}</p>
                  <p className="text-foreground-muted">{loc?.email}</p>
                  {loc?.telephone && <p className="text-foreground-muted">{loc.telephone}</p>}
                </div>
              </div>

              <div className="rounded-inner border border-border bg-background-card p-4 space-y-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-purple-600" /> Propriétaire (Hôte)
                </p>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-foreground">{prop?.prenom} {prop?.nom}</p>
                  <p className="text-foreground-muted">{prop?.email}</p>
                  {prop?.telephone && <p className="text-foreground-muted">{prop.telephone}</p>}
                </div>
              </div>
            </div>

            {/* Timeline / Historique des modifications */}
            {historique.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4 text-foreground-muted" /> Chronologie du Statut
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                  {historique.map((h) => (
                    <div key={h.id} className="rounded-inner border border-border bg-background-alt/40 p-3 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">Passage à : {h.nouveauStatut}</p>
                        {h.raison && <p className="text-foreground-muted text-[0.6875rem]">{h.raison}</p>}
                      </div>
                      <span className="text-[0.6875rem] text-foreground-muted">{formatDate(h.modifieLe)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos état des lieux */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-foreground-muted" /> Photos de l'état des lieux ({photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative h-24 overflow-hidden rounded-inner border border-border bg-background-alt">
                      <img src={p.url} alt="État des lieux" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
            Fermer
          </button>

          {canForceCancel && (
            <button
              type="button"
              onClick={() => { onClose(); onForceCancel(reservation); }}
              className="h-9 rounded-inner bg-error-600 px-4 text-xs font-semibold text-neutral-0 hover:bg-error-700"
            >
              Annulation administrative forcée
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
