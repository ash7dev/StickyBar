/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import {
  Clock, CheckCircle2, AlertTriangle, ShieldAlert,
  Loader2, X, Check, LogIn, RefreshCw, ArrowRight, Images,
  HelpCircle, Shield, Lock, Star,
} from 'lucide-react';
import { CheckinGalleryModal } from './CheckinGalleryModal';
import { RefuseCheckInModal } from './RefuseCheckInModal';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Props {
  id: string;
  res: ReservationDetail;
  onRefetch: () => void;
}

/* ─── Modal overlay ───────────────────────────────────────────────────────── */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
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

function Feedback({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-error-50 border border-error-200 text-error-700 rounded-xl p-3.5">
      <AlertTriangle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
      <p className="text-xs font-semibold leading-relaxed">{message}</p>
    </div>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────────── */

export function TenantReservationActionPanel({ id, res, onRefetch }: Props) {
  const { statut, photosEtatLieu, dateDebut, absenceSignaleeLe } = res;

  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);

  /* Modal galerie */
  const [showGallery, setShowGallery] = useState(false);

  /* Modal règles */
  const [showRulesModal, setShowRulesModal] = useState(false);

  /* Modal refus check-in */
  const [showRefuseModal, setShowRefuseModal] = useState(false);

  /* Modal confirmation absence */
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  /* Annulation */
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason]       = useState('');

  /* Rating system for COMPLETED status */
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  const [now] = useState(() => Date.now());

  const checkinPhotos   = photosEtatLieu.filter((p) => p.type === 'CHECKIN');
  const hasOwnerCheckin = !!res.checkinProprioLe;
  const hasPhotos       = checkinPhotos.length > 0;
  const isCheckinDay    = new Date(dateDebut).getTime() <= now;
  const alreadyReported = !!absenceSignaleeLe;

  /* CONFIRMED et COMPLETED nécessitent des actions locataire */
  if (!['CONFIRMED', 'COMPLETED'].includes(statut)) return null;

  const clearFeedback = () => setErrorMsg(null);
  const onError       = (e: any) => setErrorMsg(e?.message ?? 'Une erreur est survenue.');

  const diffMsToCheckin    = new Date(dateDebut).getTime() - now;
  const diffDaysToCheckin  = diffMsToCheckin / (1000 * 60 * 60 * 24);
  const diffHoursToCheckin = diffMsToCheckin / 3_600_000;
  const tenantRefundPct    = diffDaysToCheckin > 7 ? 100 : diffDaysToCheckin >= 3 ? 50 : 25;

  /* ── Handlers ── */

  const handleConfirmCheckin = async () => {
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.CONFIRM_CHECKIN(id), { method: 'POST' });
      onRefetch();
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  const handleReportAbsent = async () => {
    setShowAbsentModal(false);
    clearFeedback(); setIsSubmitting(true);
    try {
      await nestFetch(NEST_API.RESERVATIONS.REPORT_ABSENT(id), { method: 'POST' });
      onRefetch();
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
      onRefetch();
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
      await nestFetch(NEST_API.RESERVATIONS.RATE_OWNER(id), {
        method: 'POST',
        body: JSON.stringify({ note: rating, commentaire: ratingComment }),
      });
      setRating(0); setRatingComment('');
      onRefetch();
    } catch (e) { onError(e); }
    finally { setIsSubmitting(false); }
  };

  /*
   * Sous-états dérivés du cycle de vie serveur :
   *
   * owner-ready      → checkinProprioLe set : proprio a confirmé → locataire peut valider/refuser
   * photos-pending   → photos en DB mais checkinProprioLe absent (upload partiel) → galerie visible, pas de confirm
   * absent-reported  → locataire a déjà signalé l'absence, attente du délai 2h
   * absent-day       → jour J, pas de checkin proprio, pas encore signalé → bouton absent disponible
   * waiting          → avant le jour J, rien à faire
   */
  type SubState = 'owner-ready' | 'photos-pending' | 'absent-reported' | 'absent-day' | 'waiting';

  const subState: SubState = hasOwnerCheckin
    ? 'owner-ready'
    : hasPhotos
      ? 'photos-pending'
      : isCheckinDay
        ? alreadyReported ? 'absent-reported' : 'absent-day'
        : 'waiting';

  const subtitleMap: Record<SubState, string> = {
    'owner-ready':     "Inspectez l'état des lieux et validez votre arrivée",
    'photos-pending':  "L'hôte finalise l'état des lieux — confirmation en cours",
    'absent-reported': "Signalement envoyé — en attente du propriétaire (2h)",
    'absent-day':      "L'hôte n'a pas encore effectué l'état des lieux",
    'waiting':         "En attente de votre arrivée",
  };

  /* ─────────────────────────────────────────────────── */

  // Header config based on status
  const headerConfig = statut === 'COMPLETED'
    ? {
        gradient: 'from-emerald-500 to-emerald-700',
        iconBg: 'bg-emerald-50 border-emerald-100',
        iconColor: 'text-emerald-600',
        icon: CheckCircle2,
        label: 'Séjour terminé',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badgeText: 'Terminé',
        subtitle: 'Partagez votre expérience avec la communauté',
      }
    : {
        gradient: 'from-emerald-500 to-emerald-700',
        iconBg: 'bg-emerald-50 border-emerald-100',
        iconColor: 'text-emerald-600',
        icon: LogIn,
        label: 'Check-in',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        badgeText: 'Étape 3/4',
        subtitle: subtitleMap[subState],
      };

  const HeaderIcon = headerConfig.icon;

  return (
    <>
      <div className="bg-background-card border border-border rounded-3xl overflow-hidden shadow-sm shadow-neutral-200/40">

        {/* Bande gradient */}
        <div className={cn('h-1 w-full bg-gradient-to-r', headerConfig.gradient)} />

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <div className={cn('w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 mt-0.5', headerConfig.iconBg)}>
            <HeaderIcon className={cn('w-4.5 h-4.5', headerConfig.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-black text-neutral-900 leading-tight">{headerConfig.label}</p>
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border', headerConfig.badge)}>
                {headerConfig.badgeText}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{headerConfig.subtitle}</p>
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

          {errorMsg && <Feedback message={errorMsg} />}

          {/* ══ OWNER-READY : proprio a confirmé → galerie + valider + refuser ══ */}
          {subState === 'owner-ready' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-800">
                    {checkinPhotos.length} photo{checkinPhotos.length > 1 ? 's' : ''} de check-in disponible{checkinPhotos.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    L&apos;hôte a documenté l&apos;état du logement. Vérifiez les photos puis validez votre arrivée.
                  </p>
                </div>
              </div>

              {/* Bouton galerie */}
              <button
                type="button"
                onClick={() => setShowGallery(true)}
                className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-200/60 transition-all duration-200 text-left overflow-hidden relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-emerald-500" />
                <div className="flex items-center ml-1 shrink-0">
                  {checkinPhotos.slice(0, 3).map((p, i) => (
                    <div
                      key={p.id}
                      className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm"
                      style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: 3 - i }}
                    >
                      <Image src={p.url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                  {checkinPhotos.length > 3 && (
                    <div
                      className="relative w-10 h-10 rounded-xl bg-neutral-100 border-2 border-white flex items-center justify-center shadow-sm"
                      style={{ marginLeft: '-10px', zIndex: 0 }}
                    >
                      <span className="text-[9px] font-black text-neutral-500">+{checkinPhotos.length - 3}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-neutral-900 leading-tight">Voir l&apos;état des lieux</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Inspectez chaque pièce avant de confirmer</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-100 flex items-center justify-center transition-colors shrink-0">
                  <Images className="w-4 h-4 text-emerald-500" />
                </div>
              </button>

              {/* CTA confirmer */}
              <button
                onClick={handleConfirmCheckin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-black text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-emerald-500/25 disabled:shadow-none transition-all"
              >
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Validation…</>
                  : <><Check className="w-4 h-4" />Valider le check-in &amp; récupérer les clés</>}
              </button>

              {/* Refus */}
              <div className="pt-1 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-semibold mb-3 uppercase tracking-wide">Quelque chose ne va pas ?</p>
                <button
                  onClick={() => setShowRefuseModal(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-xs font-bold text-error-600 hover:text-error-700 hover:bg-error-50 border border-error-200 hover:border-error-300 px-4 py-2.5 rounded-xl transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Signaler un problème
                </button>
              </div>
            </>
          )}

          {/* ══ PHOTOS-PENDING : photos en DB mais proprio n'a pas encore confirmé ══ */}
          {subState === 'photos-pending' && (
            <>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-800">L&apos;hôte finalise l&apos;état des lieux</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Des photos ont été uploadées mais la confirmation de l&apos;hôte est en cours. Actualisez dans quelques instants.
                  </p>
                </div>
              </div>

              {/* Galerie visible même en pending */}
              {hasPhotos && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowGallery(true)}
                    className="w-full group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200/80 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 text-left overflow-hidden relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-amber-400" />
                    <div className="flex items-center ml-1 shrink-0">
                      {checkinPhotos.slice(0, 3).map((p, i) => (
                        <div
                          key={p.id}
                          className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm"
                          style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: 3 - i }}
                      >
                        <Image src={p.url} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-neutral-900 leading-tight">Aperçu des photos</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Confirmation en attente — pas encore validable</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                    <Images className="w-4 h-4 text-neutral-400" />
                  </div>
                </button>
                </>
              )}

              {/* Bouton signaler un problème */}
              <div className="pt-1 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-semibold mb-3 uppercase tracking-wide">Quelque chose ne va pas ?</p>
                <button
                  onClick={() => setShowRefuseModal(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-xs font-bold text-error-600 hover:text-error-700 hover:bg-error-50 border border-error-200 hover:border-error-300 px-4 py-2.5 rounded-xl transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Signaler un problème
                </button>
              </div>
            </>
          )}

          {/* ══ ABSENT-REPORTED : locataire a déjà signalé ══ */}
          {subState === 'absent-reported' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                </div>
                <p className="text-xs font-black text-amber-800">Absence du propriétaire signalée</p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Signalement envoyé le{' '}
                <span className="font-bold">
                  {new Date(absenceSignaleeLe!).toLocaleString('fr-FR', {
                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                . L&apos;hôte dispose de <span className="font-bold">2 heures</span> pour effectuer l&apos;état des lieux. Passé ce délai, la réservation est annulée et vous êtes remboursé intégralement.
              </p>
            </div>
          )}

          {/* ══ ABSENT-DAY : jour J, proprio pas là, pas encore signalé ══ */}
          {subState === 'absent-day' && (
            <>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-800">L&apos;état des lieux n&apos;a pas encore démarré</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Si votre hôte est injoignable ou absent, signalez-le. Il disposera de 2h pour réagir, sinon votre réservation sera annulée et remboursée.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { clearFeedback(); setShowAbsentModal(true); }}
                disabled={isSubmitting}
                className="w-full group relative flex items-center gap-4 p-4 rounded-2xl border border-amber-200/80 bg-white hover:bg-amber-50/60 hover:border-amber-300/80 hover:shadow-md hover:shadow-amber-100/60 transition-all duration-200 disabled:opacity-40 overflow-hidden text-left"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-amber-500" />
                <div className="w-11 h-11 rounded-2xl border bg-amber-50 border-amber-100 flex items-center justify-center shrink-0 ml-1">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-neutral-900 leading-tight">Signaler le propriétaire absent</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Déclenche un délai de grâce de 2h avant annulation automatique</p>
                </div>
                {isSubmitting
                  ? <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />
                  : <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0">
                      <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    </div>}
              </button>

              {/* Bouton signaler un problème avec le logement */}
              <div className="pt-1 border-t border-neutral-100">
                <p className="text-[10px] text-neutral-400 font-semibold mb-3 uppercase tracking-wide">Problème avec le logement ?</p>
                <button
                  onClick={() => setShowRefuseModal(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-xs font-bold text-error-600 hover:text-error-700 hover:bg-error-50 border border-error-200 hover:border-error-300 px-4 py-2.5 rounded-xl transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Signaler un autre problème
                </button>
              </div>
            </>
          )}

          {/* ══ WAITING : avant le jour J ══ */}
          {subState === 'waiting' && (
            <div className="flex items-start gap-3 bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-neutral-400" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-700">En attente de l&apos;état des lieux</p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                  Le propriétaire effectuera les photos d&apos;état des lieux le jour de votre arrivée (
                  <span className="font-bold">
                    {new Date(dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  ). Vous pourrez les valider ici pour obtenir les clés.
                </p>
              </div>
            </div>
          )}

          {/* ══ COMPLETED : notation du propriétaire ══ */}
          {statut === 'COMPLETED' && (
            <>
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-800">Séjour terminé avec succès</p>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Merci d&apos;avoir utilisé ImmoLoc ! Partagez votre expérience pour aider la communauté.
                  </p>
                </div>
              </div>

              {/* Notation du propriétaire */}
              <div className="pt-2 border-t border-neutral-100 space-y-3">
                <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wide">Évaluer le propriétaire et le logement</p>

                {/* Étoiles interactives */}
                <div className="flex items-center justify-center gap-2 py-4">
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
                            isActive ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'
                          )}
                          strokeWidth={2}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Labels de satisfaction */}
                {rating > 0 && (
                  <p className="text-xs font-bold text-center text-neutral-600">
                    {rating === 1 && 'Très insatisfait'}
                    {rating === 2 && 'Insatisfait'}
                    {rating === 3 && 'Correct'}
                    {rating === 4 && 'Satisfait'}
                    {rating === 5 && 'Excellent !'}
                  </p>
                )}

                {/* Commentaire optionnel */}
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                    Commentaire <span className="text-neutral-400 font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 resize-none transition-all"
                    placeholder="Partagez votre expérience : propreté, conformité, accueil..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                </div>

                {/* Bouton soumettre */}
                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmitting || rating === 0}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-black text-white rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 disabled:from-neutral-200 disabled:to-neutral-200 disabled:text-neutral-400 shadow-md shadow-emerald-500/25 disabled:shadow-none transition-all"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi en cours…</>
                    : <><CheckCircle2 className="w-4 h-4" />Publier mon évaluation</>}
                </button>

                {rating === 0 && (
                  <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
                    Sélectionnez une note pour continuer
                  </p>
                )}
              </div>
            </>
          )}

          {/* Annulation — cachée dans les 24h précédant le check-in */}
          {statut === 'CONFIRMED' && diffHoursToCheckin >= 24 && (
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

        </div>

        {/* Footer — lien règles */}
        <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            Comprendre les règles (séquestre, auto-checkin, remboursement…)
          </button>
        </div>
      </div>

      {/* ══ GALERIE État des lieux ══ */}
      {showGallery && (
        <CheckinGalleryModal
          photos={checkinPhotos}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* ══ MODAL : Refuser le check-in ══ */}
      {showRefuseModal && (
        <RefuseCheckInModal
          reservationId={id}
          onSuccess={onRefetch}
          onClose={() => setShowRefuseModal(false)}
        />
      )}

      {/* ══ MODAL : Confirmer signalement absence ══ */}
      {showAbsentModal && (
        <Modal
          title="Signaler le propriétaire absent"
          onClose={() => setShowAbsentModal(false)}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed font-medium">
                Une fois signalé, le propriétaire dispose de <span className="font-black">2 heures</span> pour effectuer l&apos;état des lieux. Passé ce délai, votre réservation sera annulée et vous serez remboursé intégralement.
              </p>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Assurez-vous d&apos;avoir bien tenté de joindre votre hôte avant de continuer. Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAbsentModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleReportAbsent}
                disabled={isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Envoi…</span>
                  : 'Confirmer le signalement'}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* ══ MODAL : Annulation locataire ══ */}
      {showCancelModal && (
        <Modal
          title="Annuler la réservation"
          onClose={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
        >
          <div className="p-6 space-y-4">
            {/* Grille politique remboursement */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-neutral-300">Politique de remboursement</p>
              <div className="grid grid-cols-3 gap-2">
                <div className={cn(
                  'rounded-xl p-3 text-center border',
                  diffDaysToCheckin > 7
                    ? 'bg-emerald-500/15 border-emerald-500/30'
                    : 'bg-white/5 border-white/8 opacity-40',
                )}>
                  <p className="text-xs font-black text-emerald-400">100%</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{'> 7 jours'}</p>
                </div>
                <div className={cn(
                  'rounded-xl p-3 text-center border',
                  diffDaysToCheckin >= 3 && diffDaysToCheckin <= 7
                    ? 'bg-amber-500/15 border-amber-500/30'
                    : 'bg-white/5 border-white/8 opacity-40',
                )}>
                  <p className="text-xs font-black text-amber-400">50%</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">3–7 jours</p>
                </div>
                <div className={cn(
                  'rounded-xl p-3 text-center border',
                  diffHoursToCheckin >= 24 && diffDaysToCheckin < 3
                    ? 'bg-rose-500/15 border-rose-500/30'
                    : 'bg-white/5 border-white/8 opacity-40',
                )}>
                  <p className="text-xs font-black text-rose-400">25%</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">24h–3 jours</p>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Vous serez remboursé à hauteur de{' '}
                <span className="font-black text-white">{tenantRefundPct}%</span>{' '}
                du montant payé selon votre date d&apos;annulation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Motif <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                className="w-full text-xs bg-white/5 border border-white/10 text-white placeholder:text-neutral-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-rose-400/40 resize-none"
                placeholder="Ex : Je ne pourrai finalement pas voyager à ces dates."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            {errorMsg && <Feedback message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); clearFeedback(); }}
                className="flex-1 py-2.5 text-xs font-bold text-neutral-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl transition-all"
              >
                Retour
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || isSubmitting}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl transition-all"
              >
                {isSubmitting
                  ? <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />En cours…</span>
                  : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══ MODAL : Règles & Conditions locataire ══ */}
      {showRulesModal && (
        <Modal title="Charte de Confiance & Vos Droits" onClose={() => setShowRulesModal(false)}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-left">
            <p className="text-xs text-neutral-400 leading-relaxed">
              ImmoLoc protège votre séjour de bout en bout grâce à un système de séquestre sécurisé et une validation en double.
            </p>

            {/* 1. Séquestre */}
            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">1. Votre paiement est sécurisé</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Les fonds sont conservés en <strong className="text-emerald-400 font-bold">séquestre sécurisé</strong> et ne sont reversés à l&apos;hôte qu&apos;après votre confirmation de check-in. Vous avez le contrôle.
                </p>
              </div>
            </div>

            {/* 2. Double validation check-in */}
            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">2. Check-in : vous avez le dernier mot</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  L&apos;hôte uploade les photos de l&apos;état des lieux. Vous les inspectez ici et vous <strong className="text-emerald-400 font-bold">confirmez uniquement si tout est conforme</strong>. En cas de non-conformité, refusez et les fonds restent bloqués.
                </p>
              </div>
            </div>

            {/* 3. Auto-checkin */}
            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">3. Auto-Checkin (H+6)</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Si ni vous ni l&apos;hôte n&apos;avez agi 6h après le début du séjour (arrivée autonome, pas de réseau…), le système effectue un <strong className="text-amber-400 font-bold">check-in automatique</strong>. Le séjour commence et le reversement est programmé.
                </p>
              </div>
            </div>

            {/* 4. Proprio absent */}
            <div className="flex gap-3.5 items-start p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">4. Propriétaire absent — remboursement garanti</h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Si votre hôte ne se présente pas le jour J, signalez son absence ici. Il dispose de <strong className="text-rose-400 font-bold">2 heures</strong> pour réagir. Passé ce délai, votre réservation est annulée et vous êtes <strong className="text-rose-400 font-bold">remboursé intégralement</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-2 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              J&apos;ai compris mes droits
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
