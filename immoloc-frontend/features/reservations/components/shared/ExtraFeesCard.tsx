'use client';

import React, { useState } from 'react';
import { Banknote, CheckCircle2, Clock, AlertTriangle, Plus, ShieldAlert, CreditCard, Smartphone, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { Modal } from '../tenant/reservation-ui';

export interface DemandeFraisItem {
  id: string;
  reservationId: string;
  titre: string;
  description?: string | null;
  montant: number | string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'REFUSE' | 'CONTESTE';
  methodePaiement?: string | null;
  creeLe: string;
  payeLe?: string | null;
  refuseLe?: string | null;
}

interface ExtraFeesCardProps {
  reservationId: string;
  demandesFrais?: DemandeFraisItem[];
  isOwner?: boolean;
  onRefresh?: () => void;
  onOpenDisputeWithMotif?: (motif: string, description: string) => void;
}

export function ExtraFeesCard({
  reservationId,
  demandesFrais = [],
  isOwner = false,
  onRefresh,
  onOpenDisputeWithMotif,
}: ExtraFeesCardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<DemandeFraisItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'ORANGE_MONEY' | 'CARD'>('WAVE');

  // Form states (Create)
  const [titre, setTitre] = useState('');
  const [montantInput, setMontantInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const formatMontant = (n: number | string) =>
    `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

  // Action: Create Extra Fee (Owner)
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(montantInput.replace(/\D/g, ''));
    if (!titre.trim() || val <= 0) {
      setFeedback({ type: 'error', message: 'Veuillez saisir un titre et un montant valide.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_CREATE(reservationId), {
        method: 'POST',
        body: JSON.stringify({
          titre: titre.trim(),
          montant: val,
          description: descriptionInput.trim() || undefined,
        }),
      });
      setShowCreateModal(false);
      setTitre('');
      setMontantInput('');
      setDescriptionInput('');
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création du supplément';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Pay Extra Fee (Tenant)
  const handlePayFee = async (fraisId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_PAYER(reservationId, fraisId), {
        method: 'POST',
        body: JSON.stringify({ methodePaiement: paymentMethod }),
      });
      setSelectedFeeToPay(null);
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du paiement du supplément';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Refuse / Contest Extra Fee (Owner or Tenant)
  const handleRefuseFee = async (fraisItem: DemandeFraisItem) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_REFUSER(reservationId, fraisItem.id), {
        method: 'POST',
        body: JSON.stringify({ raison: `Refus du supplément ${fraisItem.titre}` }),
      });
      if (onOpenDisputeWithMotif) {
        const isDepassement = fraisItem.titre.toLowerCase().includes('personne') || fraisItem.titre.toLowerCase().includes('surnombre');
        onOpenDisputeWithMotif(
          isDepassement ? 'DEPASSEMENT_PERSONNES' : 'NON_PAIEMENT',
          `Refus du supplément "${fraisItem.titre}" d'un montant de ${formatMontant(fraisItem.montant)}.`,
        );
      }
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du traitement du refus';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Entête & Bouton Demande (Owner) ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-background-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-forest-50 text-forest-700">
            <Banknote className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Frais & Suppléments Séjour</h3>
            <p className="text-xs text-foreground-muted">
              {demandesFrais.length === 0
                ? 'Aucun supplément demandé pour ce séjour'
                : `${demandesFrais.length} supplément${demandesFrais.length > 1 ? 's' : ''} au dossier`}
            </p>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => { setShowCreateModal(true); setFeedback(null); }}
            className="inline-flex items-center gap-1.5 rounded-pill border border-forest-600/30 bg-forest-50 px-3.5 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-forest-100"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Demander un supplément
          </button>
        )}
      </div>

      {/* ── Liste des suppléments ───────────────────────────────────────── */}
      {demandesFrais.map((item) => {
        const isPending = item.statut === 'EN_ATTENTE';
        const isPaid = item.statut === 'PAYE';
        const isRefused = item.statut === 'REFUSE' || item.statut === 'CONTESTE';

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-card border p-4.5 transition-all space-y-3',
              isPending ? 'border-warning-500/30 bg-warning-50/50 shadow-2xs' : '',
              isPaid ? 'border-success-500/30 bg-success-50/40' : '',
              isRefused ? 'border-error-500/30 bg-error-50/40' : '',
            )}
          >
            {/* Top row: Title + Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  {item.titre}
                </span>
                {item.description && (
                  <p className="mt-0.5 text-xs text-foreground">{item.description}</p>
                )}
              </div>

              {/* Status Pastille */}
              {isPending && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-warning-500/30 bg-warning-100 px-2.5 py-1 text-[0.6875rem] font-semibold text-warning-800">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  En attente
                </span>
              )}
              {isPaid && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-success-500/30 bg-success-100 px-2.5 py-1 text-[0.6875rem] font-semibold text-success-800">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Réglé ({item.methodePaiement || 'Mobile Money'})
                </span>
              )}
              {isRefused && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-error-500/30 bg-error-100 px-2.5 py-1 text-[0.6875rem] font-semibold text-error-800">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Refusé / Contesté
                </span>
              )}
            </div>

            {/* Montant */}
            <div className="flex items-baseline justify-between border-t border-border/50 pt-2.5">
              <span className="text-xs text-foreground-muted">Montant du supplément</span>
              <span className="font-display text-lg font-bold tabular-nums text-foreground">
                {formatMontant(item.montant)}
              </span>
            </div>

            {/* Actions Côté LOCATAIRE */}
            {!isOwner && isPending && (
              <div className="space-y-3 pt-2">
                <div className="rounded-inner bg-background-card p-3 border border-border space-y-2">
                  <p className="text-xs font-semibold text-foreground">Mode de paiement :</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'WAVE' as const, label: 'Wave', icon: '📲' },
                      { id: 'ORANGE_MONEY' as const, label: 'Orange Money', icon: '📱' },
                      { id: 'CARD' as const, label: 'Carte Bancaire', icon: '💳' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-inner border py-2 px-2 text-xs font-semibold transition-colors',
                          paymentMethod === m.id
                            ? 'border-forest-600 bg-forest-50 text-forest-800 shadow-2xs'
                            : 'border-border bg-background-alt text-foreground-muted hover:text-foreground',
                        )}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePayFee(item.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-pill bg-action py-3 text-xs font-semibold text-on-action shadow-action transition-all hover:bg-action-hover disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <>Régler {formatMontant(item.montant)} par {paymentMethod.replace('_', ' ')}</>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleRefuseFee(item)}
                    className="inline-flex items-center justify-center gap-1 rounded-pill border border-error-200 bg-error-50/60 px-3 py-3 text-xs font-semibold text-error-700 hover:bg-error-100"
                  >
                    Contester
                  </button>
                </div>
              </div>
            )}

            {/* Actions Côté PROPRIÉTAIRE */}
            {isOwner && isPending && (
              <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleRefuseFee(item)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-error-300 bg-error-50 px-3.5 py-1.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-100"
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  Déclarer un refus de paiement
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Modal Création de Demande (Owner) ──────────────────────────── */}
      {showCreateModal && (
        <Modal
          title="Demander un supplément"
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateFee} className="space-y-4 p-6">
            <div>
              <label htmlFor="titre-frais" className="mb-1 block text-xs font-semibold text-foreground">
                Motif du supplément <span className="text-error-600">*</span>
              </label>
              <select
                id="titre-frais"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                className="w-full rounded-field border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-forest-600 focus:outline-none"
              >
                <option value="" disabled>Sélectionnez un motif</option>
                <option value="Dépassement du nombre de personnes">Dépassement du nombre de personnes</option>
                <option value="Consommation électricité / eau">Consommation électricité / eau</option>
                <option value="Ménage spécial ou dégradation mineure">Ménage spécial ou dégradation mineure</option>
                <option value="Check-out tardif non convenu">Check-out tardif non convenu</option>
                <option value="Autre supplément">Autre supplément</option>
              </select>
            </div>

            <div>
              <label htmlFor="montant-frais" className="mb-1 block text-xs font-semibold text-foreground">
                Montant en FCFA <span className="text-error-600">*</span>
              </label>
              <input
                id="montant-frais"
                type="text"
                inputMode="numeric"
                required
                value={montantInput}
                onChange={(e) => setMontantInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 15000"
                className="w-full rounded-field border border-border bg-background px-3.5 py-2.5 text-xs text-foreground tabular-nums focus:border-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="desc-frais" className="mb-1 block text-xs font-semibold text-foreground">
                Explication / Détails
              </label>
              <textarea
                id="desc-frais"
                rows={3}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Précisez la raison pour votre voyageur..."
                className="w-full resize-none rounded-field border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-forest-600 focus:outline-none"
              />
            </div>

            {feedback && (
              <p className={cn('text-xs font-medium', feedback.type === 'error' ? 'text-error-600' : 'text-success-600')}>
                {feedback.message}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-ghost h-9 px-4 text-xs"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary h-9 px-5 text-xs"
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
