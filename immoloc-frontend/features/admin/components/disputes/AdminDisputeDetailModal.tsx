'use client';

import { useEffect, useState } from 'react';
import { X, Scale, User, MapPin, Calendar, FileText, Camera, CreditCard, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { DisputeItem } from './AdminDisputesTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface AdminDisputeDetailModalProps {
  dispute: DisputeItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (dispute: DisputeItem) => void;
}

const MOTIF_LABELS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Logement inaccessible',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
  DOMMAGES: 'Dommages',
  AUTRE: 'Autre',
};

function formatPrice(amount?: number | null) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AdminDisputeDetailModal({
  dispute,
  isOpen,
  onClose,
  onResolve,
}: AdminDisputeDetailModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!dispute?.id || !isOpen) {
      setDetails(null);
      return;
    }
    setIsLoading(true);
    adminApi.getDisputeDetails(dispute.id)
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setIsLoading(false));
  }, [dispute?.id, isOpen]);

  if (!isOpen || !dispute) return null;

  const data = details ?? dispute;
  const res = data.reservation;
  const photos: Array<{ id: string; url: string; type?: string; categorie?: string }> = res?.photosEtatLieu ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800">
              <Scale className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Litige : {MOTIF_LABELS[data.motif] ?? data.motif}
              </h2>
              <p className="text-xs text-foreground-muted">
                Déclaré par le {data.declarePar === 'LOCATAIRE' ? 'Locataire' : 'Propriétaire'} le {formatDate(data.creeLe)}
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
            {/* Statut & Décision si résolu */}
            <div className={cn(
              'rounded-inner border p-4 space-y-2',
              data.statut === 'EN_ATTENTE' ? 'bg-warning-50/50 border-warning-200' :
              data.statut === 'FONDE' ? 'bg-forest-50/50 border-forest-200' : 'bg-error-50/50 border-error-200'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Statut du litige</span>
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
                  data.statut === 'EN_ATTENTE' ? 'bg-warning-50 border-warning-200 text-warning-800' :
                  data.statut === 'FONDE' ? 'bg-forest-50 border-forest-200 text-forest-800' : 'bg-error-50 border-error-200 text-error-800'
                )}>
                  {data.statut === 'EN_ATTENTE' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {data.statut === 'FONDE' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {data.statut === 'NON_FONDE' && <XCircle className="h-3.5 w-3.5" />}
                  {data.statut === 'EN_ATTENTE' ? 'En attente d\'arbitrage' : data.statut === 'FONDE' ? 'Litige Fondé' : 'Litige Non Fondé'}
                </span>
              </div>
              {data.decisionAdmin && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[0.6875rem] font-semibold text-foreground-muted uppercase">Décision de l'administrateur :</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{data.decisionAdmin}</p>
                </div>
              )}
            </div>

            {/* Description de la réclamation */}
            <div className="space-y-1 rounded-inner border border-border bg-background-alt/40 p-4">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-foreground-muted" /> Description des faits déclarés
              </h3>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-line mt-2">{data.description}</p>
            </div>

            {/* Informations sur la Réservation et les Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Locataire */}
              <div className="rounded-inner border border-border bg-background-card p-4 space-y-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-600" /> Locataire
                </p>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-foreground">{res?.locataire?.prenom} {res?.locataire?.nom}</p>
                  <p className="text-foreground-muted">{res?.locataire?.email}</p>
                  {res?.locataire?.telephone && <p className="text-foreground-muted">{res.locataire.telephone}</p>}
                </div>
              </div>

              {/* Propriétaire */}
              <div className="rounded-inner border border-border bg-background-card p-4 space-y-2">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-purple-600" /> Propriétaire
                </p>
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-foreground">{res?.proprietaire?.prenom} {res?.proprietaire?.nom}</p>
                  <p className="text-foreground-muted">{res?.proprietaire?.email}</p>
                  {res?.proprietaire?.telephone && <p className="text-foreground-muted">{res.proprietaire.telephone}</p>}
                </div>
              </div>
            </div>

            {/* Logement & Paiement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-inner border border-border bg-background-card p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-forest-600" /> Logement concerné
                </p>
                <p className="text-xs font-bold text-foreground">{res?.logement?.titre ?? '—'}</p>
                <p className="text-[0.6875rem] text-foreground-muted">{res?.logement?.ville}</p>
              </div>

              <div className="rounded-inner border border-border bg-background-card p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-forest-600" /> Paiement & Montant
                </p>
                <p className="text-xs font-bold text-foreground">
                  Total : {formatPrice(res?.paiement?.montantTotal ?? res?.montantTotal)}
                </p>
                <p className="text-[0.6875rem] text-foreground-muted">
                  Statut Paiement : {res?.paiement?.statut ?? '—'}
                </p>
              </div>
            </div>

            {/* Photos de l'état des lieux / Pièces jointes */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-foreground-muted" /> Photos de l'état des lieux ({photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="relative h-28 overflow-hidden rounded-inner border border-border bg-background-alt group">
                      <img src={p.url} alt="État des lieux" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      {p.type && (
                        <span className="absolute bottom-1 left-1 rounded-pill bg-forest-950/70 px-2 py-0.5 text-[0.625rem] font-semibold text-neutral-0">
                          {p.type}
                        </span>
                      )}
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

          {data.statut === 'EN_ATTENTE' && (
            <button
              type="button"
              onClick={() => { onClose(); onResolve(dispute); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
            >
              <Scale className="h-4 w-4" />
              <span>Rendre une décision</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
