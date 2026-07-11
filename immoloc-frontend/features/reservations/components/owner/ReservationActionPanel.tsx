/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  Shield, AlertTriangle, CheckCircle2, Camera,
  X, Users, Gavel, ChevronDown, Loader2, Clock, RefreshCw,
  LogIn, LogOut, ArrowRight, Banknote, Lock, HelpCircle, Star, UserX, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { CheckinModal, CheckoutModal } from './EtatLieuxModal';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Props {
  id: string;
  res: ReservationDetail;
  onRefetch: () => void;
}

/* ─── Modal overlay ───────────────────────────────────────────────────────── */

function Modal({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-surface-dark border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/12 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Feedback inline ─────────────────────────────────────────────────────── */

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const isError = type === 'error';
  return (
    <div className={cn(
      'flex items-start gap-2.5 rounded-xl p-3.5 border',
      isError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700',
    )}>
      {isError
        ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
        : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
      <p className="text-xs font-semibold leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────────── */

export function ReservationActionPanel({ id, res, onRefetch }: Props) {
  const { statut, dateDebut, nbPersonnes, photosEtatLieu } = res;

  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [errorMsg, setErrorMsg]                 = useState<string | null>(null);
  const [successMsg, setSuccessMsg]             = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal]   = useState(false);
  const [cancelReason, setCancelReason]         = useState('');

  const [showLitigeModal, setShowLitigeModal]         = useState(false);
  const [litigeMotif, setLitigeMotif]                 = useState('');
  const [litigeDescription, setLitigeDescription]     = useState('');

  const [showDepassement, setShowDepassement]   = useState(false);

  const [showCheckinModal, setShowCheckinModal]   = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showRulesModal, setShowRulesModal]       = useState(false);

  /* Modal horaires — affiché avant la confirmation */
  const [showTimeModal, setShowTimeModal]   = useState(false);
  const [checkinHeure, setCheckinHeure]     = useState('14:00');

  /* Notation locataire */
  const [rating, setRating]                 = useState(0);
  const [hoverRating, setHoverRating]       = useState(0);
  const [ratingComment, setRatingComment]   = useState('');

  /* Signal no-show locataire */
  const [showNoshowModal, setShowNoshowModal] = useState(false);
  const [noshowComment, setNoshowComment]     = useState('');

  // Capturé au montage pour éviter `Date.now()` dans le corps du rendu (react-hooks/purity).
  const [now] = useState(() => Date.now());

  /* ── Données dérivées ── */
  const checkinPhotos   = photosEtatLieu.filter((p) => p.type === 'CHECKIN');
  const checkoutPhotos  = photosEtatLieu.filter((p) => p.type === 'CHECKOUT');
  const hasCheckinPhotos  = checkinPhotos.length > 0;
  const hasCheckoutPhotos = checkoutPhotos.length > 0;
  const ownerCheckinDone  = !!res.checkinProprioLe;
  const ownerCheckoutDone = !!res.checkoutProprioLe;

  /*
   * Garde temporelle check-in : l'état des lieux d'entrée ne peut démarrer
   * qu'à partir de 4h avant dateDebut pour éviter qu'un propriétaire documente
   * le logement des semaines à l'avance et tente de déclencher le versement.
   */
  const CHECKIN_GUARD_MS    = 4 * 60 * 60 * 1000;
  const checkinWindowStart  = new Date(dateDebut).getTime() - CHECKIN_GUARD_MS;
  const canStartCheckin     = now >= checkinWindowStart;
  const hoursUntilCheckin   = Math.max(1, Math.ceil((checkinWindowStart - now) / 3600000));

  /* ── Sous-états CONFIRMED ── */
  type ConfirmedSub = 'locked' | 'ready' | 'photos-uploaded' | 'waiting-tenant';
  const confirmedSub: ConfirmedSub = ownerCheckinDone
    ? 'waiting-tenant'
    : hasCheckinPhotos
      ? 'photos-uploaded'
      : canStartCheckin ? 'ready' : 'locked';

  /* ── Sous-états CHECKED_IN ── */
  type CheckedInSub = 'ready' | 'photos-uploaded' | 'awaiting-completion';
  const checkedInSub: CheckedInSub = ownerCheckoutDone
    ? 'awaiting-completion'
    : hasCheckoutPhotos ? 'photos-uploaded' : 'ready';

  /* Garde temporelle annulation : bouton masqué dans les 24h précédant le check-in */
  const diffMsToCheckin    = new Date(dateDebut).getTime() - now;
  const diffDaysToCheckin  = diffMsToCheckin / (1000 * 60 * 60 * 24);
  const diffHoursToCheckin = diffMsToCheckin / 3_600_000;
  const penaliteOwner      = diffDaysToCheckin > 7 ? 5_000 : diffDaysToCheckin >= 2 ? 10_000 : 20_000;

  /* Signal no-show : visible 2h après dateDebut */
  const timeSinceStart = now - new Date(dateDebut).getTime();
  const canSignalNoshow = timeSinceStart >= 2 * 60 * 60 * 1000; // 2 hours in ms

  if (!['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED'].includes(statut)) return null;

  const clearFeedback = () => { setErrorMsg(null); setSuccessMsg(null); };
  const onError       = (e: any) => setErrorMsg(e?.message ?? 'Une erreur est survenue.');
  const onSuccess     = (msg: string) => { setSuccessMsg(msg); onRefetch(); };

  /* ── Handlers ── */

  const handleConfirm = async () => {
    setShowTimeModal(false);
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CONFIRM(id), {
        method: 'PATCH',
        body: JSON.stringify({ heureDebut: checkinHeure }),
      });
      onSuccess('Réservation confirmée avec succès.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { setErrorMsg('Veuillez indiquer un motif.'); return; }
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CANCEL(id), {
        method: 'PATCH',
        body: JSON.stringify({ raison: cancelReason }),
      });
      setShowCancelModal(false); setCancelReason('');
      onSuccess('Réservation annulée.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCheckinProprio = async () => {
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CHECKIN_PROPRIO(id), { method: 'POST' });
      onSuccess('Check-in confirmé. Le locataire peut maintenant valider son arrivée.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCheckoutProprio = async () => {
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CHECKOUT_PROPRIO(id), { method: 'POST' });
      onSuccess("État des lieux de sortie confirmé. Vous pouvez maintenant libérer les fonds.");
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCompleteCheckout = async () => {
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.COMPLETE_CHECKOUT(id), { method: 'PATCH' });
      onSuccess('Check-out finalisé. Les fonds ont été débloqués.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenLitige = async () => {
    if (!litigeMotif.trim() || !litigeDescription.trim()) {
      setErrorMsg('Veuillez renseigner le motif et la description.');
      return;
    }
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.DISPUTES.CREATE, {
        method: 'POST',
        body: JSON.stringify({ reservationId: id, motif: litigeMotif, description: litigeDescription }),
      });
      setShowLitigeModal(false); setLitigeMotif(''); setLitigeDescription('');
      onSuccess('Litige ouvert. Notre équipe vous contactera sous 48h.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setErrorMsg('Veuillez sélectionner une note (1 à 5 étoiles).');
      return;
    }
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.RATE_TENANT(id), {
        method: 'POST',
        body: JSON.stringify({ note: rating, commentaire: ratingComment }),
      });
      onSuccess(`Merci ! Votre évaluation de ${rating}/5 a été publiée.`);
      setRating(0); setRatingComment('');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleSignalNoshow = async () => {
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.SIGNAL_NOSHOW(id), {
        method: 'POST',
        body: JSON.stringify({ commentaire: noshowComment.trim() || undefined }),
      });
      setShowNoshowModal(false);
      setNoshowComment('');
      onSuccess('Absence signalée. La réservation sera annulée automatiquement si le locataire ne se présente pas dans les 3 prochaines heures.');
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  /* ── Config par statut ── */
  const stepConfig = {
    PENDING: {
      step: 1, icon: Clock,
      gradient: 'from-neutral-400 to-neutral-500',
      iconBg: 'bg-neutral-50 border-neutral-100', iconColor: 'text-neutral-500',
      badge: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
      label: 'En attente', sub: 'En attente du paiement du locataire',
    },
    PAID: {
      step: 2, icon: Shield,
      gradient: 'from-amber-500 to-amber-700',
      iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border border-amber-200',
      label: 'Décision requise', sub: 'Paiement reçu — acceptez ou refusez',
    },
    CONFIRMED: {
      step: 3, icon: LogIn,
      gradient: 'from-emerald-500 to-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      label: 'Check-in', sub: "État des lieux d'entrée",
    },
    CHECKED_IN: {
      step: 4, icon: LogOut,
      gradient: 'from-rose-500 to-rose-700',
      iconBg: 'bg-rose-50 border-rose-100', iconColor: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700 border border-rose-200',
      label: 'Check-out', sub: 'Clôture du séjour',
    },
    COMPLETED: {
      step: 5, icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      label: 'Terminée', sub: 'Séjour terminé avec succès',
    },
    DISPUTED: {
      step: 0, icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-50 border-rose-100', iconColor: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-700 border border-rose-200',
      label: 'Litige en cours', sub: 'En attente de résolution',
    },
  } as const;

  const step     = stepConfig[statut as keyof typeof stepConfig];
  const StepIcon = step.icon;

  /* ─────────────────────────────────────────────────── */
  return (
    <>
      <div className="bg-white border border-neutral-200/60 rounded-3xl overflow-hidden shadow-sm shadow-neutral-200/40">

        {/* Gradient bar */}
        <div className={cn('h-1 w-full bg-gradient-to-r', step.gradient)} />

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <div className={cn('w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5', step.iconBg)}>
            <StepIcon className={cn('w-4.5 h-4.5', step.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-neutral-900 leading-tight">{step.label}</p>
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full', step.badge)}>
                Étape {step.step}/4
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{step.sub}</p>
          </div>
          <button
            onClick={onRefetch}
            title="Actualiser"
            className="w-8 h-8 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 flex items-center justify-center transition-colors shrink-0 mt-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-neutral-100 mx-6" />

        <div className="p-6 space-y-4">

          {errorMsg   && <Feedback type="error"   message={errorMsg}   />}
          {successMsg && <Feedback type="success" message={successMsg} />}

          {/* ══ PENDING : attente paiement ══ */}
          {statut === 'PENDING' && (
            <>
              <div className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-neutral-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-neutral-700">En attente du paiement</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    Le locataire n&apos;a pas encore finalisé le paiement. Vous serez notifié dès réception.
                  </p>
                </div>
              </div>

              <div className="pt-1 border-t border-neutral-100">
                <button
                  onClick={() => { clearFeedback(); setShowCancelModal(true); }}
                  className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler la demande
                </button>
              </div>
            </>
          )}

          {/* ══ PAID : décision proprio ══ */}
          {statut === 'PAID' && (
            <>
              {/* KYC locataire */}
              {res.locataire.statutKyc !== 'VERIFIE' ? (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-amber-800">
                      Identité non vérifiée{res.locataire.statutKyc === 'EN_ATTENTE' && ' — validation en cours'}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      {res.locataire.statutKyc === 'EN_ATTENTE'
                        ? 'Documents en cours de vérification par notre équipe.'
                        : "Le locataire n'a pas encore soumis ses documents d'identité."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-800">Identité vérifiée</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Vous pouvez confirmer la réservation en toute sécurité.</p>
                  </div>
                </div>
              )}

              {/* Délai de réponse */}
              <div className="flex items-center gap-2.5 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-xs text-neutral-500">
                  Répondez avant le{' '}
                  <span className="font-bold text-neutral-700">
                    {new Date(res.delaiConfirmation).toLocaleDateString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>

              {/* Avertissement pénalité */}
              <div className="flex items-start gap-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl px-3.5 py-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-bold">Annulation après confirmation :</span> une pénalité sera déduite de votre wallet selon la politique en vigueur.
                </p>
              </div>

              {/* CTA confirmer / refuser */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => { clearFeedback(); setShowCancelModal(true); }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-xs font-black text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-2xl transition-all disabled:opacity-50"
                >
                  Refuser
                </button>
                <button
                  onClick={() => { clearFeedback(); setShowTimeModal(true); }}
                  disabled={res.locataire.statutKyc !== 'VERIFIE' || isSubmitting}
                  className={cn(
                    'flex-1 py-3 text-xs font-black text-white rounded-2xl transition-all shadow-md',
                    res.locataire.statutKyc === 'VERIFIE' && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-emerald-500/25'
                      : 'bg-neutral-200 text-neutral-400 shadow-none',
                  )}
                >
                  {isSubmitting
                    ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Confirmation…</span>
                    : 'Confirmer la réservation'}
                </button>
              </div>
            </>
          )}

          {/* ══ CONFIRMED : check-in ══ */}
          {statut === 'CONFIRMED' && (
            <>
              {/* LOCKED : trop tôt, fenêtre 4h pas encore ouverte */}
              {confirmedSub === 'locked' && (
                <div className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-neutral-700">
                      État des lieux disponible dans {hoursUntilCheckin}h
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      Pour garantir des photos fidèles à l&apos;arrivée du locataire, l&apos;état des lieux d&apos;entrée ne peut démarrer que{' '}
                      <span className="font-bold text-neutral-700">4h avant l&apos;heure d&apos;arrivée</span>.
                      Revenez le{' '}
                      <span className="font-bold text-neutral-700">
                        {new Date(checkinWindowStart).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>.
                    </p>
                  </div>
                </div>
              )}

              {/* READY : fenêtre ouverte, pas encore de photos */}
              {confirmedSub === 'ready' && (
                <>
                  <button
                    type="button"
                    onClick={() => { clearFeedback(); setShowCheckinModal(true); }}
                    className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border border-emerald-200/80 bg-white hover:bg-emerald-50/40 hover:border-emerald-300/80 hover:shadow-md hover:shadow-emerald-100/60 transition-all duration-200 text-left overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-emerald-500" />
                    <div className="w-11 h-11 rounded-2xl border bg-emerald-50 border-emerald-100 flex items-center justify-center shrink-0 ml-1">
                      <Camera className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-neutral-900 leading-tight">Démarrer l&apos;état des lieux d&apos;entrée</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Photographiez chaque pièce avant l&apos;arrivée du locataire</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </button>

                  {/* Dépassement voyageurs */}
                  {!res.litige && (
                    <div className="border border-amber-200/80 rounded-2xl overflow-hidden bg-amber-50/30">
                      <button
                        onClick={() => setShowDepassement((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-amber-800">Le locataire a plus de personnes que prévu ?</span>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-amber-500 transition-transform duration-200', showDepassement && 'rotate-180')} />
                      </button>
                      {showDepassement && (
                        <div className="px-4 pb-4 pt-1 border-t border-amber-100 space-y-3">
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Si le locataire est arrivé avec plus de personnes que déclaré ({nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} prévu{nbPersonnes > 1 ? 's' : ''}), signalez-le immédiatement pour régulariser la situation.
                          </p>
                          <button
                            onClick={() => {
                              setShowDepassement(false);
                              setLitigeMotif('DEPASSEMENT_PERSONNES');
                              setShowLitigeModal(true);
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            Signaler le dépassement
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signal no-show locataire — visible 2h après dateDebut */}
                  {canSignalNoshow && !res.litige && (
                    <div className="border border-rose-200/80 rounded-2xl overflow-hidden bg-rose-50/30">
                      <button
                        onClick={() => setShowNoshowModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-rose-800">Le locataire n&apos;est pas venu ?</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">Signalez son absence pour déclencher une annulation automatique</p>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* PHOTOS-UPLOADED : photos en DB mais checkinProprioLe absent */}
              {confirmedSub === 'photos-uploaded' && (
                <>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800">
                        {checkinPhotos.length} photo{checkinPhotos.length > 1 ? 's' : ''} uploadée{checkinPhotos.length > 1 ? 's' : ''} — confirmation requise
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Photos enregistrées. Confirmez ci-dessous pour notifier le locataire et démarrer officiellement le check-in.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckinProprio}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-black text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-emerald-500/25 disabled:shadow-none transition-all"
                  >
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Confirmation…</>
                      : <><CheckCircle2 className="w-4 h-4" />Confirmer l&apos;état des lieux d&apos;entrée</>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { clearFeedback(); setShowCheckinModal(true); }}
                    className="w-full text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-xl transition-all"
                  >
                    Ajouter d&apos;autres photos
                  </button>

                  {/* Dépassement voyageurs */}
                  {!res.litige && (
                    <div className="border border-amber-200/80 rounded-2xl overflow-hidden bg-amber-50/30">
                      <button
                        onClick={() => setShowDepassement((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-amber-800">Le locataire a plus de personnes que prévu ?</span>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-amber-500 transition-transform duration-200', showDepassement && 'rotate-180')} />
                      </button>
                      {showDepassement && (
                        <div className="px-4 pb-4 pt-1 border-t border-amber-100 space-y-3">
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Si le locataire est arrivé avec plus de personnes que déclaré ({nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} prévu{nbPersonnes > 1 ? 's' : ''}), signalez-le immédiatement pour régulariser la situation.
                          </p>
                          <button
                            onClick={() => {
                              setShowDepassement(false);
                              setLitigeMotif('DEPASSEMENT_PERSONNES');
                              setShowLitigeModal(true);
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            Signaler le dépassement
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signal no-show locataire — visible 2h après dateDebut */}
                  {canSignalNoshow && !res.litige && (
                    <div className="border border-rose-200/80 rounded-2xl overflow-hidden bg-rose-50/30">
                      <button
                        onClick={() => setShowNoshowModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-rose-800">Le locataire n&apos;est pas venu ?</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">Signalez son absence pour déclencher une annulation automatique</p>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* WAITING-TENANT : checkinProprioLe set, attente locataire */}
              {confirmedSub === 'waiting-tenant' && (
                <>
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800">
                        {checkinPhotos.length} photo{checkinPhotos.length > 1 ? 's' : ''} de check-in confirmée{checkinPhotos.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                        Le locataire a été notifié. Il doit confirmer son check-in depuis son espace. Les fonds restent en séquestre jusqu&apos;à sa validation.
                      </p>
                    </div>
                  </div>

                  {/* Dépassement voyageurs — visible si locataire arrivé avec plus de personnes */}
                  {!res.litige && (
                    <div className="border border-amber-200/80 rounded-2xl overflow-hidden bg-amber-50/30">
                      <button
                        onClick={() => setShowDepassement((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-amber-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-xs font-semibold text-amber-800">Le locataire a plus de personnes que prévu ?</span>
                        </div>
                        <ChevronDown className={cn('w-4 h-4 text-amber-500 transition-transform duration-200', showDepassement && 'rotate-180')} />
                      </button>
                      {showDepassement && (
                        <div className="px-4 pb-4 pt-1 border-t border-amber-100 space-y-3">
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Si le locataire est arrivé avec plus de personnes que déclaré ({nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} prévu{nbPersonnes > 1 ? 's' : ''}), signalez-le immédiatement pour régulariser la situation.
                          </p>
                          <button
                            onClick={() => {
                              setShowDepassement(false);
                              setLitigeMotif('DEPASSEMENT_PERSONNES');
                              setShowLitigeModal(true);
                            }}
                            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            Signaler le dépassement
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signal no-show locataire — visible 2h après dateDebut */}
                  {canSignalNoshow && !res.litige && (
                    <div className="border border-rose-200/80 rounded-2xl overflow-hidden bg-rose-50/30">
                      <button
                        onClick={() => setShowNoshowModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-rose-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                          <UserX className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-rose-800">Le locataire n&apos;est pas venu ?</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">Signalez son absence pour déclencher une annulation automatique</p>
                        </div>
                      </button>
                    </div>
                  )}
                </>
              )}


              {/* Annulation — cachée dans les 24h précédant le check-in */}
              {diffHoursToCheckin >= 24 && (
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => { clearFeedback(); setShowCancelModal(true); }}
                    className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Annuler la réservation
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ CHECKED_IN : check-out ══ */}
          {statut === 'CHECKED_IN' && (
            <>
              {/* READY : pas encore de photos checkout */}
              {checkedInSub === 'ready' && (
                <button
                  type="button"
                  onClick={() => { clearFeedback(); setShowCheckoutModal(true); }}
                  className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border border-rose-200/80 bg-white hover:bg-rose-50/40 hover:border-rose-300/80 hover:shadow-md hover:shadow-rose-100/60 transition-all duration-200 text-left overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-rose-500" />
                  <div className="w-11 h-11 rounded-2xl border bg-rose-50 border-rose-100 flex items-center justify-center shrink-0 ml-1">
                    <Camera className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-neutral-900 leading-tight">Démarrer l&apos;état des lieux de sortie</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Documentez l&apos;état du logement après le départ du locataire</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-rose-600 transition-colors" />
                  </div>
                </button>
              )}

              {/* PHOTOS-UPLOADED : photos checkout mais pas checkoutProprioLe */}
              {checkedInSub === 'photos-uploaded' && (
                <>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800">
                        {checkoutPhotos.length} photo{checkoutPhotos.length > 1 ? 's' : ''} de sortie — confirmation requise
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        Photos enregistrées. Confirmez l&apos;état des lieux de sortie pour pouvoir libérer les fonds.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckoutProprio}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-black text-white rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 hover:from-rose-600 hover:to-rose-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-rose-500/25 disabled:shadow-none transition-all"
                  >
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Confirmation…</>
                      : <><CheckCircle2 className="w-4 h-4" />Confirmer l&apos;état des lieux de sortie</>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { clearFeedback(); setShowCheckoutModal(true); }}
                    className="w-full text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 border border-neutral-200 px-4 py-2.5 rounded-xl transition-all"
                  >
                    Ajouter d&apos;autres photos
                  </button>
                </>
              )}

              {/* AWAITING-COMPLETION : checkoutProprioLe set → libérer les fonds */}
              {checkedInSub === 'awaiting-completion' && (
                <>
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800">
                        {checkoutPhotos.length} photo{checkoutPhotos.length > 1 ? 's' : ''} de check-out confirmée{checkoutPhotos.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-emerald-700 mt-0.5">État des lieux documenté. Clôturez le séjour pour libérer les fonds.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCompleteCheckout}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-black text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-emerald-500/25 disabled:shadow-none transition-all"
                  >
                    {isSubmitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Clôture en cours…</>
                      : <><Banknote className="w-4 h-4" />Finaliser le check-out &amp; libérer les fonds</>}
                  </button>
                </>
              )}

              {/* Litige + Dépassement — toujours visibles en CHECKED_IN */}
              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">Problème pendant le séjour ?</p>

                {!res.litige ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { clearFeedback(); setShowLitigeModal(true); }}
                      className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      Ouvrir un litige
                    </button>
                    <button
                      onClick={() => {
                        clearFeedback();
                        setLitigeMotif('DEPASSEMENT_PERSONNES');
                        setShowLitigeModal(true);
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200 hover:border-amber-300 px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Dépassement voyageurs
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* En-tête litige */}
                    <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                        <Gavel className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-rose-800">Litige ouvert par le propriétaire</p>
                        <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                          Les fonds restent gelés jusqu&apos;à résolution par notre équipe support.
                        </p>
                      </div>
                    </div>

                    {/* Détails du litige */}
                    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
                      {/* Motif */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Motif du litige</p>
                        <p className="text-xs font-bold text-neutral-900">
                          {res.litige.motif === 'DEPASSEMENT_PERSONNES' && 'Dépassement du nombre de voyageurs'}
                          {res.litige.motif === 'DEGRADATION' && 'Dégradation du logement'}
                          {res.litige.motif === 'LOGEMENT_NON_CONFORME' && 'Logement non conforme'}
                          {res.litige.motif === 'NON_PAIEMENT' && 'Non-paiement de frais supplémentaires'}
                          {res.litige.motif === 'NUISANCES' && 'Nuisances ou comportement inapproprié'}
                          {res.litige.motif === 'AUTRE' && 'Autre motif'}
                          {!['DEPASSEMENT_PERSONNES', 'DEGRADATION', 'LOGEMENT_NON_CONFORME', 'NON_PAIEMENT', 'NUISANCES', 'AUTRE'].includes(res.litige.motif) && res.litige.motif.replace(/_/g, ' ')}
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-2.5 border border-neutral-100">
                          {res.litige.description}
                        </p>
                      </div>

                      {/* Statut */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">Statut actuel</p>
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold',
                          res.litige.statut === 'EN_ATTENTE' && 'bg-amber-50 text-amber-700 border-amber-200',
                          res.litige.statut === 'FONDE' && 'bg-rose-50 text-rose-700 border-rose-200',
                          res.litige.statut === 'NON_FONDE' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        )}>
                          {res.litige.statut === 'EN_ATTENTE' && <><Clock className="w-3 h-3" /> En cours d&apos;examen</>}
                          {res.litige.statut === 'FONDE' && <><CheckCircle2 className="w-3 h-3" /> Litige fondé</>}
                          {res.litige.statut === 'NON_FONDE' && <><XCircle className="w-3 h-3" /> Litige non fondé</>}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Ouvert le</p>
                        <p className="text-xs text-neutral-700">
                          {new Date(res.litige.creeLe).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Délai de traitement */}
                      {res.litige.statut === 'EN_ATTENTE' && (
                        <div className="flex items-start gap-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl px-3.5 py-3">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-800">Délai de traitement : 48-72h</p>
                            <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                              Notre équipe support examine votre litige et vous contactera par email ou téléphone.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Issues possibles */}
                      {res.litige.statut === 'EN_ATTENTE' && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Issues possibles</p>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2 text-xs text-neutral-600">
                              <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                              <span className="leading-relaxed"><span className="font-bold">Litige fondé</span> : Pénalité appliquée au locataire, compensation versée</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-neutral-600">
                              <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                              <span className="leading-relaxed"><span className="font-bold">Litige non fondé</span> : Fonds débloqués normalement, aucune pénalité</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-neutral-600">
                              <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                              <span className="leading-relaxed"><span className="font-bold">Arrangement à l&apos;amiable</span> : Médiation entre les parties</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Résultat si litige résolu */}
                      {res.litige.statut === 'FONDE' && (
                        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3">
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-rose-700 leading-relaxed">
                            <span className="font-bold">Litige fondé.</span> Une pénalité a été appliquée au locataire et une compensation pourra vous être versée selon l&apos;évaluation des dommages.
                          </p>
                        </div>
                      )}
                      {res.litige.statut === 'NON_FONDE' && (
                        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                          <XCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-700 leading-relaxed">
                            <span className="font-bold">Litige non fondé.</span> Les fonds seront débloqués normalement après le check-out. Aucune pénalité n&apos;est appliquée.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ DISPUTED : affichage du litige ══ */}
          {statut === 'DISPUTED' && res.litige && (
            <div className="space-y-3">
              {/* En-tête litige */}
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <Gavel className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-rose-800">Litige ouvert par le propriétaire</p>
                  <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                    Les fonds restent gelés jusqu&apos;à résolution par notre équipe support.
                  </p>
                </div>
              </div>

              {/* Détails du litige */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
                {/* Motif */}
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Motif du litige</p>
                  <p className="text-xs font-bold text-neutral-900">
                    {res.litige.motif === 'DEPASSEMENT_PERSONNES' && 'Dépassement du nombre de voyageurs'}
                    {res.litige.motif === 'DEGRADATION' && 'Dégradation du logement'}
                    {res.litige.motif === 'LOGEMENT_NON_CONFORME' && 'Logement non conforme'}
                    {res.litige.motif === 'NON_PAIEMENT' && 'Non-paiement de frais supplémentaires'}
                    {res.litige.motif === 'NUISANCES' && 'Nuisances ou comportement inapproprié'}
                    {res.litige.motif === 'AUTRE' && 'Autre motif'}
                    {!['DEPASSEMENT_PERSONNES', 'DEGRADATION', 'LOGEMENT_NON_CONFORME', 'NON_PAIEMENT', 'NUISANCES', 'AUTRE'].includes(res.litige.motif) && res.litige.motif.replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-2.5 border border-neutral-100">
                    {res.litige.description}
                  </p>
                </div>

                {/* Statut */}
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">Statut actuel</p>
                  <div className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold',
                    res.litige.statut === 'EN_ATTENTE' && 'bg-amber-50 text-amber-700 border-amber-200',
                    res.litige.statut === 'FONDE' && 'bg-rose-50 text-rose-700 border-rose-200',
                    res.litige.statut === 'NON_FONDE' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  )}>
                    {res.litige.statut === 'EN_ATTENTE' && <><Clock className="w-3 h-3" /> En cours d&apos;examen</>}
                    {res.litige.statut === 'FONDE' && <><CheckCircle2 className="w-3 h-3" /> Litige fondé</>}
                    {res.litige.statut === 'NON_FONDE' && <><X className="w-3 h-3" /> Litige non fondé</>}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">Ouvert le</p>
                  <p className="text-xs text-neutral-700">
                    {new Date(res.litige.creeLe).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Délai de traitement */}
                {res.litige.statut === 'EN_ATTENTE' && (
                  <div className="flex items-start gap-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl px-3.5 py-3">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Délai de traitement : 48-72h</p>
                      <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                        Notre équipe support examine votre litige et vous contactera par email ou téléphone.
                      </p>
                    </div>
                  </div>
                )}

                {/* Issues possibles */}
                {res.litige.statut === 'EN_ATTENTE' && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Issues possibles</p>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 text-xs text-neutral-600">
                        <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed"><span className="font-bold">Litige fondé</span> : Pénalité appliquée au locataire, compensation versée</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-neutral-600">
                        <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed"><span className="font-bold">Litige non fondé</span> : Fonds débloqués normalement, aucune pénalité</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-neutral-600">
                        <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                        <span className="leading-relaxed"><span className="font-bold">Arrangement à l&apos;amiable</span> : Médiation entre les parties</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Résultat si litige résolu */}
                {res.litige.statut === 'FONDE' && (
                  <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 leading-relaxed">
                      <span className="font-bold">Litige fondé.</span> Une pénalité a été appliquée au locataire et une compensation pourra vous être versée selon l&apos;évaluation des dommages.
                    </p>
                  </div>
                )}
                {res.litige.statut === 'NON_FONDE' && (
                  <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-3">
                    <X className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      <span className="font-bold">Litige non fondé.</span> Les fonds seront débloqués normalement après le check-out. Aucune pénalité n&apos;est appliquée.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ COMPLETED : notation du locataire ══ */}
          {statut === 'COMPLETED' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-800">Séjour terminé avec succès</p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Les fonds ont été débloqués et transférés vers votre wallet. Merci d&apos;avoir utilisé ImmoLoc !
                  </p>
                </div>
              </div>

              {/* Notation du locataire */}
              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">Évaluer votre expérience</p>

                <div className="bg-gradient-to-br from-white to-neutral-50/50 border-2 border-neutral-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-sm font-black text-emerald-700 shrink-0 overflow-hidden border border-emerald-200/50">
                      {res.locataire.avatarUrl
                        ? <img src={res.locataire.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : `${res.locataire.prenom[0]}${res.locataire.nom[0]}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900">Noter {res.locataire.prenom} {res.locataire.nom}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">Comment s&apos;est passé le séjour avec ce locataire ?</p>
                    </div>
                  </div>

                  {/* Étoiles interactives */}
                  <div className="flex items-center justify-center gap-2 py-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-all duration-150 hover:scale-110 active:scale-95"
                        >
                          <Star
                            className={cn(
                              'w-8 h-8 transition-all duration-150',
                              isActive
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-neutral-300'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs font-bold text-center text-neutral-600">
                      {rating === 1 && 'Très insatisfait'}
                      {rating === 2 && 'Insatisfait'}
                      {rating === 3 && 'Moyen'}
                      {rating === 4 && 'Satisfait'}
                      {rating === 5 && 'Excellent !'}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-neutral-700">
                      Commentaire <span className="text-neutral-400 font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="w-full text-xs bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 resize-none"
                      placeholder="Partagez votre expérience avec ce locataire..."
                    />
                  </div>

                  <button
                    onClick={handleSubmitRating}
                    disabled={isSubmitting || rating === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-black text-white rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-emerald-500/25 disabled:shadow-none transition-all"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Publication...</>
                    ) : (
                      <><Star className="w-4 h-4" />Publier mon évaluation</>
                    )}
                  </button>

                  <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
                    Votre évaluation aidera les autres propriétaires à mieux connaître ce locataire
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer règles */}
        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            Comprendre les règles &amp; conditions (séquestre, auto-checkin…)
          </button>
        </div>
      </div>

      {/* ══ MODAL : Horaires du séjour ══ */}
      {showTimeModal && (() => {
        const [h, m] = checkinHeure.split(':').map(Number);
        const checkoutH = (h + 1) % 24;
        const checkoutHeure = `${String(checkoutH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        return (
          <Modal
            title="Horaires du séjour"
            onClose={() => setShowTimeModal(false)}
          >
            <div className="p-6 space-y-5">
              {/* Contexte dates */}
              <div className="flex items-stretch bg-white/6 border border-white/10 rounded-2xl overflow-hidden text-center">
                <div className="flex-1 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500 mb-1">Arrivée</p>
                  <p className="text-xs font-bold text-white">
                    {new Date(res.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center justify-center px-3 border-x border-white/10">
                  <span className="text-[10px] font-black text-neutral-500">{res.nbNuits}n</span>
                </div>
                <div className="flex-1 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500 mb-1">Départ</p>
                  <p className="text-xs font-bold text-white">
                    {new Date(res.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Saisie heure check-in */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-300">
                  Heure de check-in
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="time"
                    value={checkinHeure}
                    onChange={(e) => setCheckinHeure(e.target.value)}
                    className="w-full text-sm font-bold text-white bg-white/8 border border-white/15 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all [color-scheme:dark]"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  À partir de cette heure, le logement sera disponible pour le locataire.
                </p>
              </div>

              {/* Check-out auto */}
              <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Check-out calculé automatiquement</p>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Le locataire devra quitter le logement avant{' '}
                    <span className="font-black text-white">{checkoutHeure}</span>
                    {' '}le jour du départ.
                  </p>
                </div>
              </div>

              {/* Info séquestre */}
              <div className="flex items-start gap-2.5 bg-emerald-500/8 border border-emerald-400/15 rounded-xl px-3.5 py-3">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300 leading-relaxed font-medium">
                  Après confirmation, le locataire sera notifié et les fonds resteront en séquestre jusqu&apos;au check-in validé des deux côtés.
                </p>
              </div>

              {errorMsg && <Feedback type="error" message={errorMsg} />}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 py-3 text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 rounded-xl transition-all shadow-md shadow-emerald-500/20"
                >
                  {isSubmitting
                    ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Confirmation…</span>
                    : 'Confirmer la réservation'}
                </button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ══ CheckinModal ══ */}
      {showCheckinModal && (
        <CheckinModal
          reservationId={id}
          onSuccess={() => { setShowCheckinModal(false); onRefetch(); }}
          onCancel={() => setShowCheckinModal(false)}
        />
      )}

      {/* ══ CheckoutModal ══ */}
      {showCheckoutModal && (
        <CheckoutModal
          reservationId={id}
          onSuccess={() => { setShowCheckoutModal(false); onRefetch(); }}
          onCancel={() => setShowCheckoutModal(false)}
        />
      )}

      {/* ══ MODAL : Refus / Annulation ══ */}
      {showCancelModal && (
        <Modal
          title={statut === 'PENDING' ? 'Annuler la demande' : statut === 'CONFIRMED' ? 'Annuler la réservation confirmée' : 'Refuser la réservation'}
          onClose={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
        >
          <div className="p-6 space-y-4">
            {statut === 'PAID' && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed font-medium">
                  Le locataire sera intégralement remboursé. Une pénalité peut s&apos;appliquer sur votre wallet selon le délai.
                </p>
              </div>
            )}
            {statut === 'CONFIRMED' && (
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-rose-300">
                      Pénalité appliquée : {penaliteOwner.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-rose-300/80 leading-relaxed">
                      Le locataire sera remboursé intégralement. Cette pénalité est déduite de votre wallet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-400 leading-relaxed">
                    3 annulations après confirmation entraînent la <span className="font-bold">suspension automatique</span> de toutes vos annonces.
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Motif <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                className="w-full text-xs bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-400/40 resize-none"
                placeholder="Ex : Le logement n'est plus disponible aux dates indiquées."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            {errorMsg && <Feedback type="error" message={errorMsg} />}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
                className="flex-1 py-2.5 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />En cours…</span>
                  : 'Confirmer'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ MODAL : Litige ══ */}
      {showLitigeModal && (
        <Modal
          title="Ouvrir un litige"
          onClose={() => { setShowLitigeModal(false); setLitigeMotif(''); setLitigeDescription(''); clearFeedback(); }}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
              <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 leading-relaxed font-medium">
                Un litige gèle les fonds en séquestre jusqu&apos;à résolution. Notre équipe vous contactera sous 48h.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Motif <span className="text-rose-400">*</span>
              </label>
              <select
                value={litigeMotif}
                onChange={(e) => setLitigeMotif(e.target.value)}
                className="w-full text-xs bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-400/40"
              >
                <option value="" disabled className="bg-neutral-900">Sélectionnez un motif</option>
                <option value="LOGEMENT_NON_CONFORME"  className="bg-neutral-900">Logement non conforme à l&apos;annonce</option>
                <option value="DEGRADATION"             className="bg-neutral-900">Dégradation du logement</option>
                <option value="NON_PAIEMENT"            className="bg-neutral-900">Non-paiement de frais supplémentaires</option>
                <option value="DEPASSEMENT_PERSONNES"   className="bg-neutral-900">Dépassement du nombre de personnes</option>
                <option value="NUISANCES"               className="bg-neutral-900">Nuisances ou comportement inapproprié</option>
                <option value="AUTRE"                   className="bg-neutral-900">Autre motif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                className="w-full text-xs bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-400/40 resize-none"
                placeholder="Décrivez précisément le problème, avec les dates et faits…"
                value={litigeDescription}
                onChange={(e) => setLitigeDescription(e.target.value)}
              />
            </div>
            {errorMsg && <Feedback type="error" message={errorMsg} />}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowLitigeModal(false); setLitigeMotif(''); setLitigeDescription(''); clearFeedback(); }}
                className="flex-1 py-2.5 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenLitige}
                disabled={!litigeMotif || !litigeDescription.trim() || isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Ouverture…</span>
                  : 'Ouvrir le litige'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ MODAL : Règles & Conditions ══ */}
      {showRulesModal && (
        <Modal title="Charte de Confiance & Règles de Séjour" onClose={() => setShowRulesModal(false)}>
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-left">
            <p className="text-xs text-neutral-400 leading-relaxed">
              ImmoLoc applique un système hybride de double validation et de séquestre sécurisé pour protéger les deux parties.
            </p>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">1. Délai de confirmation</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Vous disposez d&apos;un délai affiché pour valider la réservation. Si ce délai expire sans action, la réservation est annulée automatiquement et le locataire est intégralement remboursé.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">2. Fenêtre de check-in (J-4h)</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  L&apos;état des lieux d&apos;entrée ne peut être démarré que <strong className="text-amber-400 font-bold">4 heures avant l&apos;arrivée du locataire</strong>. Cela garantit que les photos reflètent fidèlement l&apos;état du logement au moment de l&apos;entrée et empêche tout déclenchement prématuré du versement.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">3. Double validation check-in</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Le séjour démarre officiellement lorsque vous avez importé les photos ET que le locataire a confirmé son installation. Les fonds restent en séquestre jusqu&apos;à cette double validation.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">4. Pénalités d&apos;annulation</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Toute annulation après confirmation génère une pénalité : <strong className="text-rose-400">5 000 F</strong> (J-7+), <strong className="text-rose-400">10 000 F</strong> (J-2 à J-7), <strong className="text-rose-400">20 000 F</strong> (moins de 48h). 3 annulations = suspension automatique.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-2 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              J&apos;ai compris les règles
            </button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL : Signal no-show locataire ══ */}
      {showNoshowModal && (
        <Modal title="Signaler l'absence du locataire" onClose={() => { if (!isSubmitting) setShowNoshowModal(false); }}>
          <div className="p-6 space-y-4">
            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-300">
                  Signalement d&apos;absence
                </p>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  En signalant l&apos;absence du locataire, vous déclenchez un compte à rebours de <strong>3 heures</strong>.
                  Si le locataire ne se présente pas dans ce délai, la réservation sera annulée automatiquement.
                </p>
              </div>
            </div>

            {/* Optional comment */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Commentaire (optionnel)
              </label>
              <textarea
                rows={3}
                className="w-full text-xs bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400/40 resize-none disabled:opacity-40"
                placeholder="Ex : Aucune réponse aux appels, SMS non lus depuis 2h..."
                value={noshowComment}
                onChange={(e) => setNoshowComment(e.target.value)}
                disabled={isSubmitting}
                maxLength={500}
              />
              <p className="text-[10px] text-neutral-600 mt-1">Maximum 500 caractères</p>
            </div>

            {/* Info */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-3.5">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                <span className="font-bold text-neutral-300">Ce qui se passe ensuite :</span> Le locataire dispose de 3h
                pour se présenter et confirmer son check-in. Passé ce délai, la réservation sera annulée avec remboursement partiel
                (30% pour le locataire, 50% de compensation pour vous).
              </p>
            </div>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowNoshowModal(false); setNoshowComment(''); clearFeedback(); }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={handleSignalNoshow}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    Confirmer le signalement
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
