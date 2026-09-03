import React, { useState } from 'react';
import Image from 'next/image';
import { Banknote, CheckCircle2, Clock, AlertTriangle, Plus, ShieldAlert, CreditCard, Loader2, Gavel, Check } from 'lucide-react';
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
  hasResolvedDispute?: boolean;
  onRefresh?: () => void;
  onOpenDisputeWithMotif?: (motif: string, description: string) => void;
}

type PillTone = 'warning' | 'forest' | 'success' | 'error';

const PILL_TONE_CLASSES: Record<PillTone, string> = {
  warning: 'border-warning-500/30 bg-warning-100 text-warning-800',
  forest: 'border-forest-500/40 bg-forest-100 text-forest-800',
  success: 'border-success-500/30 bg-success-100 text-success-800',
  error: 'border-error-500/30 bg-error-100 text-error-800',
};

function StatusPill({
  tone,
  icon: Icon,
  children,
}: {
  tone: PillTone;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[0.6875rem] font-semibold',
        PILL_TONE_CLASSES[tone],
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

export function ExtraFeesCard({
  reservationId,
  demandesFrais = [],
  isOwner = false,
  hasResolvedDispute = false,
  onRefresh,
  onOpenDisputeWithMotif,
}: ExtraFeesCardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [feeToPay, setFeeToPay] = useState<DemandeFraisItem | null>(null);
  const [feeToRefuse, setFeeToRefuse] = useState<DemandeFraisItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'ORANGE_MONEY' | 'CARD'>('WAVE');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [titre, setTitre] = useState('');
  const [montantInput, setMontantInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const formatMontant = (n: number | string) =>
    `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

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

  const handlePayFee = async (fraisId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_PAYER(reservationId, fraisId), {
        method: 'POST',
        body: JSON.stringify({ methodePaiement: paymentMethod }),
      });
      setFeeToPay(null);
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du paiement du supplément';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayFeeLiquide = async (fraisId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_PAYER_LIQUIDE(reservationId, fraisId), {
        method: 'POST',
      });
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation du paiement en espèces';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefuseFee = async (fraisItem: DemandeFraisItem) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await nestFetch(NEST_API.RESERVATIONS.DEMANDE_FRAIS_REFUSER(reservationId, fraisItem.id), {
        method: 'POST',
        body: JSON.stringify({ raison: `Refus du supplément ${fraisItem.titre}` }),
      });
      setFeeToRefuse(null);
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
      {/* ── Entête ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-background-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-forest-50 text-forest-700">
            <Banknote className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Frais & suppléments séjour</h3>
            <p className="text-xs text-foreground-muted">
              {demandesFrais.length === 0
                ? 'Aucun supplément demandé pour ce séjour'
                : `${demandesFrais.length} supplément${demandesFrais.length > 1 ? 's' : ''} au dossier`}
            </p>
          </div>
        </div>

        {isOwner && !hasResolvedDispute && (
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

      {/* ── État vide ───────────────────────────────────────────────────── */}
      {demandesFrais.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-border bg-background-alt/40 px-4 py-8 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 text-forest-600">
            <Banknote className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-xs text-foreground-muted">
            {isOwner
              ? "Vous pourrez demander un supplément si des frais imprévus surviennent pendant le séjour."
              : "Aucun frais supplémentaire n'a été demandé pour ce séjour."}
          </p>
        </div>
      )}

      {/* ── Liste des suppléments ───────────────────────────────────────── */}
      {demandesFrais.map((item) => {
        const isPending = item.statut === 'EN_ATTENTE';
        const isPaid = item.statut === 'PAYE';
        const isRefused = item.statut === 'REFUSE' || item.statut === 'CONTESTE';
        const isFromAdminArbitration =
          item.methodePaiement === 'ARBITRAGE_ADMIN' ||
          item.titre.toLowerCase().includes('litige') ||
          (item.description && item.description.toLowerCase().includes('arbitrage'));

        return (
          <div
            key={item.id}
            className={cn(
              'space-y-3 rounded-card border p-4.5 transition-colors',
              isPending && !isFromAdminArbitration && 'border-warning-500/30 bg-warning-50/50 shadow-2xs',
              isPending && isFromAdminArbitration && 'border-forest-500/40 bg-forest-50/30 shadow-2xs',
              isPaid && !isFromAdminArbitration && 'border-success-500/30 bg-success-50/40',
              isPaid && isFromAdminArbitration && 'border-forest-500/30 bg-forest-50/40 shadow-2xs',
              isRefused && 'border-error-500/30 bg-error-50/40',
            )}
          >
            {/* Titre + statut */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  {item.titre}
                </span>
                {item.description && !isFromAdminArbitration && (
                  <p className="mt-0.5 text-xs text-foreground">{item.description}</p>
                )}
              </div>

              {isPending && !isFromAdminArbitration && (
                <StatusPill tone="warning" icon={Clock}>En attente de règlement</StatusPill>
              )}
              {isPending && isFromAdminArbitration && (
                <StatusPill tone="warning" icon={Gavel}>Requis par arbitrage Admin</StatusPill>
              )}
              {isPaid && isFromAdminArbitration && (
                <StatusPill tone="forest" icon={Gavel}>Réglé (arbitrage Admin)</StatusPill>
              )}
              {isPaid && !isFromAdminArbitration && (
                <StatusPill tone="success" icon={CheckCircle2}>
                  Réglé ({item.methodePaiement === 'ESPECES' ? 'En espèces' : item.methodePaiement === 'WAVE' ? 'Wave' : item.methodePaiement === 'ORANGE_MONEY' ? 'Orange Money' : item.methodePaiement || 'Mobile Money'})
                </StatusPill>
              )}
              {isRefused && (
                <StatusPill tone="error" icon={AlertTriangle}>Refusé / contesté</StatusPill>
              )}
            </div>

            {/* Décision d'arbitrage */}
            {isFromAdminArbitration && item.description && (
              <div className="flex items-start gap-2.5 rounded-inner border border-forest-200/70 bg-forest-50/70 p-3 text-xs text-forest-900">
                <Gavel className="h-4 w-4 shrink-0 text-forest-700 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-forest-900">Décision d&apos;arbitrage Klef Support</p>
                  <p className="text-[0.75rem] leading-relaxed text-forest-800">{item.description}</p>
                </div>
              </div>
            )}

            {/* Montant */}
            <div className="flex items-baseline justify-between border-t border-border/50 pt-2.5">
              <span className="text-xs text-foreground-muted">Montant du supplément</span>
              <span className="font-display text-lg font-bold tabular-nums text-foreground">
                {formatMontant(item.montant)}
              </span>
            </div>

            {/* Actions locataire — plusieurs frais en attente possibles : jamais de lime ici */}
            {!isOwner && isPending && (
              <div className="flex gap-2 border-t border-border/50 pt-2">
                <button
                  type="button"
                  onClick={() => setFeeToPay(item)}
                  className="btn-primary flex-1 items-center justify-center gap-2 text-xs"
                >
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Régler ce supplément
                </button>

                <button
                  type="button"
                  onClick={() => handleRefuseFee(item)}
                  className="inline-flex items-center justify-center gap-1 rounded-pill border border-error-200 bg-error-50/60 px-3.5 py-2.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-100"
                >
                  Contester
                </button>
              </div>
            )}

            {/* Actions propriétaire */}
            {isOwner && isPending && (
              <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePayFeeLiquide(item.id)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-forest-600/30 bg-forest-50 px-3.5 py-2 text-xs font-semibold text-forest-800 transition-all hover:bg-forest-100"
                >
                  <Banknote className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
                  💵 Reçu en liquide (marquer réglé)
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setFeeToRefuse(item)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-error-200 bg-error-50 px-3.5 py-2 text-xs font-semibold text-error-700 transition-colors hover:border-error-300 hover:bg-error-100"
                >
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                  Signaler un refus de paiement
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Modale paiement (locataire) — seul CTA lime, un seul frais à la fois ── */}
      {feeToPay && (
        <Modal title="Règlement du supplément" onClose={() => setFeeToPay(null)}>
          <div className="space-y-4 p-6">
            <div className="space-y-2 rounded-card border border-border bg-background-alt p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Récapitulatif</span>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold text-foreground">{feeToPay.titre}</p>
                <p className="font-display text-lg font-bold tabular-nums text-foreground">
                  {formatMontant(feeToPay.montant)}
                </p>
              </div>
              {feeToPay.description && (
                <p className="text-xs text-foreground-muted">{feeToPay.description}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-foreground">Choisissez un mode de paiement</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'WAVE' as const, label: 'Wave', logo: '/wavelogo.jpeg' },
                  { id: 'ORANGE_MONEY' as const, label: 'Orange Money', logo: '/orangeMoneylogo.png' },
                  { id: 'CARD' as const, label: 'Carte bancaire', icon: CreditCard },
                ].map((m) => {
                  const selected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-1.5 rounded-inner border py-3 px-2 text-xs font-semibold transition-all',
                        selected
                          ? 'border-forest-600 bg-forest-50 text-forest-800 shadow-2xs'
                          : 'border-border bg-background-alt text-foreground-muted hover:text-foreground',
                      )}
                    >
                      {selected && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-forest-600 text-white">
                          <Check className="h-2.5 w-2.5" aria-hidden="true" />
                        </span>
                      )}
                      {m.logo ? (
                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-white">
                          <Image src={m.logo} alt={m.label} width={24} height={24} className="object-contain" />
                        </span>
                      ) : m.icon ? (
                        <m.icon className="h-4 w-4" aria-hidden="true" />
                      ) : null}
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod !== 'CARD' && (
              <div>
                <label htmlFor="phone-pay" className="mb-1 block text-xs font-semibold text-foreground">
                  Numéro Mobile Money (Sénégal)
                </label>
                <input
                  id="phone-pay"
                  type="tel"
                  placeholder="Ex: 77 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-field border border-border bg-background px-3.5 py-2.5 text-base text-foreground tabular-nums focus:border-forest-600 focus:outline-none"
                />
              </div>
            )}

            {feedback && (
              <p className={cn('text-xs font-medium', feedback.type === 'error' ? 'text-error-600' : 'text-success-600')}>
                {feedback.message}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => setFeeToPay(null)} className="btn-ghost h-10 px-4 text-xs">
                Annuler
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePayFee(feeToPay.id)}
                className="btn-action inline-flex h-10 items-center justify-center gap-2 px-6 text-xs font-semibold disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  `Payer ${formatMontant(feeToPay.montant)}`
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modale refus de paiement (propriétaire) ─────────────────────── */}
      {feeToRefuse && (
        <Modal title="Déclarer un refus de paiement" onClose={() => setFeeToRefuse(null)}>
          <div className="space-y-4 p-6">
            <div className="space-y-2 rounded-inner border border-error-200 bg-error-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-error-800">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                <span>Signalement au Support Klef</span>
              </div>
              <p className="text-xs leading-relaxed text-error-700">
                Vous vous apprêtez à signaler le refus de paiement du supplément{' '}
                <strong>&quot;{feeToRefuse.titre}&quot;</strong> d&apos;un montant de{' '}
                <strong>{formatMontant(feeToRefuse.montant)}</strong> par le voyageur.
              </p>
              <p className="text-xs leading-relaxed text-error-700">
                Cette action ouvrira immédiatement un dossier de litige pour non-paiement transmis à l&apos;équipe d&apos;arbitrage Klef.
              </p>
            </div>

            {feedback && <p className="text-xs font-medium text-error-600">{feedback.message}</p>}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => setFeeToRefuse(null)} className="btn-ghost h-10 px-4 text-xs">
                Annuler
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRefuseFee(feeToRefuse)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-pill border border-error-600 bg-error-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                    Confirmer et ouvrir le litige
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modale création de demande (propriétaire) ────────────────────── */}
      {showCreateModal && (
        <Modal title="Demander un supplément" onClose={() => setShowCreateModal(false)}>
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
                className="w-full rounded-field border border-border bg-background px-3.5 py-2.5 text-base text-foreground focus:border-forest-600 focus:outline-none"
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
                className="w-full rounded-field border border-border bg-background px-3.5 py-2.5 text-base text-foreground tabular-nums focus:border-forest-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="desc-frais" className="mb-1 block text-xs font-semibold text-foreground">
                Explication / détails
              </label>
              <textarea
                id="desc-frais"
                rows={3}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="Précisez la raison pour votre voyageur..."
                className="w-full resize-none rounded-field border border-border bg-background px-3.5 py-2.5 text-base text-foreground focus:border-forest-600 focus:outline-none"
              />
            </div>

            {feedback && (
              <p className={cn('text-xs font-medium', feedback.type === 'error' ? 'text-error-600' : 'text-success-600')}>
                {feedback.message}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost h-9 px-4 text-xs">
                Annuler
              </button>

              <button type="submit" disabled={isSubmitting} className="btn-primary h-9 px-5 text-xs">
                {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}