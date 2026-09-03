'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Clock, CheckCircle2, AlertTriangle, ShieldAlert, X, Check, LogIn,
  RefreshCw, ArrowRight, Images, HelpCircle, Shield, Lock, Home, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationDetail } from '@/lib/nestjs/types';
import { CheckinGalleryModal } from './CheckinGalleryModal';
import { RefuseCheckInModal } from './RefuseCheckInModal';
import { DigitalWelcomeGuideModal } from './DigitalWelcomeGuideModal';
import { TerangaRewardModal } from '@/features/teranga-club/components/TerangaRewardModal';
import { LitigePanel } from '../shared/LitigePanel';
import { ExtraFeesCard } from '../shared/ExtraFeesCard';
import {
  Modal, Notice, Feedback, PrimaryButton, GhostButton, DangerButton,
  RefundScale, StarRating, useNow, resolveRefundTier, MOTIF_MIN, type Tone,
} from './reservation-ui';

/* Tolérance après l'heure d'arrivée avant que le signalement d'absence
   devienne disponible. */
const ABSENCE_TOLERANCE_MS = 30 * 60 * 1000;

interface Props {
  id: string;
  res: ReservationDetail;
  onRefetch: () => void;
}

type SubState = 'owner-ready' | 'photos-pending' | 'absent-reported' | 'absent-time' | 'waiting';

const SUBTITLES: Record<SubState, string> = {
  'owner-ready': 'Inspectez l’état des lieux et validez votre arrivée',
  'photos-pending': 'L’hôte finalise l’état des lieux — confirmation en cours',
  'absent-reported': 'Signalement envoyé — l’hôte dispose de 2 h pour réagir',
  'absent-time': 'L’hôte n’a pas encore effectué l’état des lieux',
  waiting: 'En attente de votre arrivée',
};

export function TenantReservationActionPanel({ id, res, onRefetch }: Props) {
  const { statut, photosEtatLieu, dateDebut, absenceSignaleeLe } = res;

  const isDisputeActive = statut === 'DISPUTED' || (!!res.litige && res.litige.statut === 'EN_ATTENTE');

  const now = useNow();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showGallery, setShowGallery] = useState(false);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const [cancelReason, setCancelReason] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');

  /* ── Données dérivées ─────────────────────────────────────────────────── */

  const checkinPhotos = useMemo(
    () => photosEtatLieu.filter((p) => p.type === 'CHECKIN'),
    [photosEtatLieu],
  );
  const hasPhotos = checkinPhotos.length > 0;

  /* ⚠️ Corrigé : `hasOwnerCheckin` valait `!!checkinProprioLe || hasPhotos`.
     Comme `photos-pending` exige justement « photos présentes ET pas de
     confirmation », la condition était contradictoire : la branche
     photos-pending et son sous-titre étaient du code mort, et surtout le
     locataire pouvait valider son check-in dès le premier upload, avant que
     l'hôte n'ait confirmé. Cela contournait la double validation que la
     modale de règles promet explicitement — et déclenchait le reversement des
     fonds sur un état des lieux incomplet. */
  const hasOwnerCheckin = !!res.checkinProprioLe;
  const hasTenantCheckin = !!res.checkinLocataireLe;

  const debutMs = new Date(dateDebut).getTime();
  const isCheckinTimePassed = now > debutMs + ABSENCE_TOLERANCE_MS;
  const alreadyReported = !!absenceSignaleeLe;

  const hoursToCheckin = (debutMs - now) / 3_600_000;
  const refundTier = resolveRefundTier(hoursToCheckin);

  const subState: SubState = hasOwnerCheckin
    ? 'owner-ready'
    : hasPhotos
      ? 'photos-pending'
      : isCheckinTimePassed
        ? (alreadyReported ? 'absent-reported' : 'absent-time')
        : 'waiting';

  /* ── Appels API ───────────────────────────────────────────────────────── */

  const run = useCallback(async (fn: () => Promise<void>, success: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await fn();
      setSuccessMsg(success);
      onRefetch();
    } catch (e) {
      setErrorMsg(e instanceof Error && e.message ? e.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }, [onRefetch]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 8_000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const [earnedCoins, setEarnedCoins] = useState<number>(0);

  const handleConfirmCheckin = () => run(async () => {
    const response = await nestFetch<{ success: boolean; earnedCoins: number; message: string }>(
      NEST_API.RESERVATIONS.CONFIRM_CHECKIN(id),
      { method: 'POST' }
    );
    setEarnedCoins(response.earnedCoins || 0);
    setShowRewardModal(true);
  }, 'Check-in validé. Bon séjour !');

  const handleReportAbsent = () => {
    setShowAbsentModal(false);
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.REPORT_ABSENT(id), { method: 'POST' });
    }, 'Absence signalée. L’hôte dispose de 2 h pour effectuer l’état des lieux.');
  };

  const handleExtendAbsentTimeout = () => run(async () => {
    await nestFetch(NEST_API.RESERVATIONS.EXTEND_ABSENT_TIMEOUT(id), { method: 'POST' });
  }, 'Deux heures supplémentaires accordées à l’hôte.');

  const handleCancel = () => {
    if (cancelReason.trim().length < MOTIF_MIN) {
      setErrorMsg(`Le motif doit contenir au moins ${MOTIF_MIN} caractères.`);
      return;
    }
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.CANCEL(id), {
        method: 'PATCH',
        body: JSON.stringify({ raison: cancelReason.trim() }),
      });
      setShowCancelModal(false);
      setCancelReason('');
    }, 'Réservation annulée.');
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      setErrorMsg('Sélectionnez une note de 1 à 5 étoiles.');
      return;
    }
    run(async () => {
      await nestFetch(NEST_API.RESERVATIONS.RATE_OWNER(id), {
        method: 'POST',
        body: JSON.stringify({ note: rating, commentaire: ratingComment.trim() || undefined }),
      });
      setRating(0);
      setRatingComment('');
    }, 'Votre évaluation a été publiée.');
  };

  const noshowHistoriqueItem = useMemo(() => {
    return res.historique?.find((h) => h.modifiePar === 'OWNER_SIGNAL_TENANT_NOSHOW');
  }, [res.historique]);

  const isOwnerNoshowActive = useMemo(() => {
    if (!noshowHistoriqueItem) return false;
    if (statut !== 'CONFIRMED' || hasTenantCheckin) return false;
    const signalDate = new Date(noshowHistoriqueItem.modifieLe).getTime();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    return now - signalDate < THREE_HOURS_MS;
  }, [noshowHistoriqueItem, statut, hasTenantCheckin, now]);

  if (!['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED'].includes(statut)) return null;

  /* ── En-tête ──────────────────────────────────────────────────────────── */

  const header =
    statut === 'DISPUTED'
      ? { icon: AlertTriangle, label: 'Litige en cours', chip: 'Litige', subtitle: 'Dossier en cours d’examen par l’équipe support Klef' }
      : statut === 'COMPLETED'
        ? { icon: CheckCircle2, label: 'Séjour terminé', chip: 'Terminé', subtitle: 'Partagez votre expérience avec la communauté' }
        : statut === 'CHECKED_IN'
          ? { icon: Home, label: 'Séjour en cours', chip: 'En cours', subtitle: 'Vos garanties Klef sont actives' }
          : { icon: LogIn, label: 'Check-in', chip: 'Étape 3', subtitle: SUBTITLES[subState] };

  const HeaderIcon = header.icon;

  /* Bloc « signaler un problème », identique dans trois sous-états. */
  const reportProblem = (titre: string, libelle: string) => (
    <div className="border-t border-border pt-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
        {titre}
      </p>
      <button
        type="button"
        onClick={() => setShowRefuseModal(true)}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-pill border border-error-200 bg-error-50 px-4 py-2.5 text-xs font-semibold text-error-700 shadow-2xs transition-[border-color,background-color,box-shadow,transform] duration-150 hover:border-error-300 hover:bg-error-100 hover:shadow-xs active:scale-[0.98] disabled:opacity-50"
      >
        <AlertTriangle className="h-3.5 w-3.5 text-error-600" aria-hidden="true" />
        {libelle}
      </button>
    </div>
  );

  /* Vignettes empilées de l'état des lieux. */
  const galleryButton = (title: string, subtitle: string, tone: Tone = 'forest') => (
    <button
      type="button"
      onClick={() => setShowGallery(true)}
      className="relative flex w-full items-center gap-4 overflow-hidden rounded-card border border-border bg-background-alt p-4 text-left transition-[border-color,background-color] duration-200 hover:border-border-hover hover:bg-background-card"
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-1', tone === 'warning' ? 'bg-warning-500' : 'bg-forest-600')}
      />
      <span className="ml-1 flex shrink-0 items-center">
        {checkinPhotos.slice(0, 3).map((p, i) => (
          <span
            key={p.id}
            className="relative block h-10 w-10 overflow-hidden rounded-inner border-2 border-background-card"
            style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: 3 - i }}
          >
            <Image src={p.url} alt="" fill sizes="40px" className="object-cover" />
          </span>
        ))}
        {checkinPhotos.length > 3 && (
          <span
            className="relative flex h-10 w-10 items-center justify-center rounded-inner border-2 border-background-card bg-forest-800 text-xs font-semibold text-neutral-50"
            style={{ marginLeft: '-10px', zIndex: 0 }}
          >
            +{checkinPhotos.length - 3}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-semibold leading-tight text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-foreground-muted">{subtitle}</span>
      </span>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-border bg-background-card text-foreground-muted">
        <Images className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );

  return (
    <>
      <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-sm">

        <div className="h-1 w-full bg-forest-600" />

        <div className="flex items-start gap-4 px-6 pt-5 pb-4">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <HeaderIcon className="h-4 w-4" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold leading-tight text-foreground">
                {header.label}
              </h2>
              <span className="rounded-pill border border-forest-100 bg-forest-50 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                {header.chip}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">{header.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onRefetch}
            aria-label="Actualiser"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-border bg-background-alt text-forest-700 transition-colors hover:bg-forest-50"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mx-6 h-px bg-border" />

        <div className="space-y-4 p-6">

          {errorMsg && <Feedback type="error" message={errorMsg} />}
          {successMsg && <Feedback type="success" message={successMsg} />}

          {isOwnerNoshowActive && (
            <Notice tone="warning" icon={ShieldAlert} title="⚠️ Votre hôte a signalé votre absence (No-Show)">
              Votre hôte signale ne pas vous avoir vu sur les lieux. Si vous êtes arrivé ou en route, contactez rapidement votre hôte ou validez votre état des lieux pour empêcher l&apos;annulation automatique.
            </Notice>
          )}

          {/* ── MODE LITIGE EN ATTENTE ───────────────────────────────────────── */}
          {isDisputeActive && res.litige && (
            <LitigePanel litige={res.litige} isOwner={false} />
          )}

          {/* ── FRAIS & SUPPLÉMENTS (LOCATAIRE) ───────────────────────── */}
          {statut !== 'PENDING' && (
            <ExtraFeesCard
              reservationId={res.id}
              demandesFrais={(res as unknown as { demandesFrais?: any[] }).demandesFrais || []}
              isOwner={false}
              hasResolvedDispute={!!res.litige && res.litige.statut !== 'EN_ATTENTE'}
              onRefresh={onRefetch}
              onOpenDisputeWithMotif={(motif, description) => {
                setShowRefuseModal(true);
              }}
            />
          )}

          {/* ── Livret d'accueil (Masqué si litige en cours) ─────────────── */}
          {res.logement && !isDisputeActive && (
            <button
              type="button"
              onClick={() => setShowWelcomeGuide(true)}
              className="flex w-full items-center justify-between gap-3 rounded-card border border-border bg-background-alt p-4 text-left transition-colors hover:border-border-hover hover:bg-background-card"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-foreground">
                    Livret d’accueil
                  </span>
                  <span className="mt-0.5 block text-xs text-foreground-muted">
                    Wi-Fi, digicode et itinéraire GPS
                  </span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
            </button>
          )}

          {/* Les actions ordinaires ne sont accessibles QUE si AUCUN litige n'est actif */}
          {!isDisputeActive && (
            <>
              {/* ── OWNER-READY ──────────────────────────────────────────────── */}

          {!hasTenantCheckin && subState === 'owner-ready' && (
            <>
              <Notice
                tone="forest"
                icon={CheckCircle2}
                title={`${checkinPhotos.length} photo${checkinPhotos.length > 1 ? 's' : ''} de check-in disponible${checkinPhotos.length > 1 ? 's' : ''}`}
              >
                L’hôte a documenté l’état du logement. Vérifiez les photos avant de valider votre
                arrivée : c’est cette validation qui libère les fonds.
              </Notice>

              {hasPhotos && galleryButton(
                'Voir l’état des lieux',
                'Inspectez chaque pièce avant de confirmer',
              )}

              <PrimaryButton
                onClick={handleConfirmCheckin}
                loading={isSubmitting}
                loadingLabel="Validation…"
                icon={Check}
              >
                Valider le check-in
              </PrimaryButton>

              {reportProblem('Quelque chose ne va pas ?', 'Signaler un problème')}
            </>
          )}

          {/* ── PHOTOS-PENDING ───────────────────────────────────────────── */}

          {!hasTenantCheckin && subState === 'photos-pending' && (
            <>
              <Notice tone="warning" icon={Clock} title="L’hôte finalise l’état des lieux">
                Des photos ont été déposées mais l’hôte n’a pas encore confirmé. Vous pourrez
                valider votre arrivée dès que ce sera fait.
              </Notice>

              {galleryButton(
                'Aperçu des photos',
                'Confirmation de l’hôte en attente',
                'warning',
              )}

              {reportProblem('Quelque chose ne va pas ?', 'Signaler un problème')}
            </>
          )}

          {/* ── ABSENT-REPORTED ──────────────────────────────────────────── */}

          {!hasTenantCheckin && subState === 'absent-reported' && (
            <>
              <Notice tone="warning" icon={Clock} title="Absence de l’hôte signalée">
                Signalement envoyé le{' '}
                <span className="font-semibold">
                  {absenceSignaleeLe &&
                    new Date(absenceSignaleeLe).toLocaleString('fr-FR', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                </span>
                . Passé le délai accordé, la réservation est annulée et vous êtes remboursé
                intégralement.
              </Notice>

              <GhostButton
                onClick={handleExtendAbsentTimeout}
                disabled={isSubmitting}
                className="w-full py-3 text-sm"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                Accorder 2 h supplémentaires à l’hôte
              </GhostButton>
            </>
          )}

          {/* ── ABSENT-TIME ──────────────────────────────────────────────── */}

          {!hasTenantCheckin && subState === 'absent-time' && (
            <>
              <Notice tone="warning" icon={ShieldAlert} title="L’état des lieux n’a pas démarré">
                Si votre hôte est injoignable, signalez-le. Il disposera de 2 h pour réagir, faute
                de quoi votre réservation sera annulée et intégralement remboursée.
              </Notice>

              <DangerButton
                onClick={() => { setErrorMsg(null); setShowAbsentModal(true); }}
                disabled={isSubmitting}
                icon={AlertTriangle}
                className="w-full py-3 text-sm"
              >
                Signaler l’hôte absent
              </DangerButton>

              {reportProblem('Problème avec le logement ?', 'Signaler un autre problème')}
            </>
          )}

          {/* ── WAITING ──────────────────────────────────────────────────── */}

          {!hasTenantCheckin && subState === 'waiting' && (
            <div className="section-inverse p-5">
              <div className="flex items-start gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5">
                  <Clock className="h-4 w-4 text-on-inverse-marker" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h3 className="font-display text-sm font-semibold text-on-inverse-display">
                    En attente de l’état des lieux
                  </h3>
                  <p className="text-xs leading-relaxed text-on-inverse-muted">
                    L’hôte réalisera les photos le jour de votre arrivée, le{' '}
                    <span className="font-semibold text-on-inverse">
                      {new Date(dateDebut).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                    . Vous pourrez les vérifier et les valider ici pour débloquer l’accès.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── SÉJOUR EN COURS ──────────────────────────────────────────── */}

          {hasTenantCheckin && statut !== 'COMPLETED' && (
            <>
              {res.historique?.some((h) => h.modifiePar === 'SYSTEM_AUTO_CHECKIN') ? (
                <Notice tone="warning" icon={CheckCircle2} title="⚡ Check-in automatique par le système (H+6)">
                  Ce séjour a été activé automatiquement car 6 heures se sont écoulées après l’heure d’arrivée sans action ni litige. L’acompte sous séquestre a été transmis au propriétaire pour valider votre accès.
                </Notice>
              ) : (
                <Notice tone="forest" icon={CheckCircle2} title="Séjour en cours">
                  Votre arrivée a été validée. Votre séjour reste couvert par l’assistance et la
                  garantie Klef.
                </Notice>
              )}

              {hasPhotos && galleryButton(
                'Voir l’état des lieux d’entrée',
                `${checkinPhotos.length} photo${checkinPhotos.length > 1 ? 's' : ''} validée${checkinPhotos.length > 1 ? 's' : ''}`,
              )}

              {!isDisputeActive && reportProblem(
                'Un problème pendant votre séjour ?',
                'Déclarer un problème ou un litige',
              )}
            </>
          )}

          {/* ── COMPLETED ────────────────────────────────────────────────── */}

          {statut === 'COMPLETED' && (
            <>
              <Notice tone="forest" icon={CheckCircle2} title="Séjour terminé">
                Merci d’avoir utilisé Klef. Votre avis aide les prochains voyageurs à choisir.
              </Notice>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                  Évaluer l’hôte et le logement
                </p>

                <StarRating
                  value={rating}
                  onChange={setRating}
                  label="Note de l’hôte et du logement"
                />

                <div className="space-y-2">
                  <label htmlFor="tenant-rating-comment" className="block text-xs font-semibold text-foreground">
                    Commentaire{' '}
                    <span className="font-normal text-foreground-muted">(optionnel)</span>
                  </label>
                  <textarea
                    id="tenant-rating-comment"
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Propreté, conformité à l’annonce, accueil…"
                    className="w-full resize-none rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none"
                  />
                </div>

                <PrimaryButton
                  onClick={handleSubmitRating}
                  disabled={rating === 0}
                  loading={isSubmitting}
                  loadingLabel="Publication…"
                  icon={CheckCircle2}
                >
                  Publier mon évaluation
                </PrimaryButton>

                {rating === 0 && (
                  <p className="text-center text-xs text-foreground-muted">
                    Sélectionnez une note pour continuer
                  </p>
                )}
              </div>
            </>
          )}

          {/* ── Annulation ───────────────────────────────────────────────── */}

              {statut === 'CONFIRMED' && !hasTenantCheckin && (
                <div className="border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => { setErrorMsg(null); setShowCancelModal(true); }}
                    className="inline-flex items-center gap-2 rounded-pill border border-error-200 bg-error-50/60 hover:bg-error-50 hover:border-error-300 px-4 py-2.5 text-xs font-semibold text-error-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-error-600" aria-hidden="true" />
                    Annuler la réservation
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border bg-background-alt px-6 py-4">
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900"
          >
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Comprendre vos droits : séquestre, auto-check-in, remboursement
          </button>
        </div>
      </div>

      {/* ═══ MODALES ═══════════════════════════════════════════════════════ */}

      {showGallery && (
        <CheckinGalleryModal photos={checkinPhotos} onClose={() => setShowGallery(false)} />
      )}

      {res.logement && (
        <DigitalWelcomeGuideModal
          isOpen={showWelcomeGuide}
          onClose={() => setShowWelcomeGuide(false)}
          listing={res.logement}
        />
      )}

      {showRefuseModal && (
        <RefuseCheckInModal
          reservationId={id}
          onSuccess={onRefetch}
          onClose={() => setShowRefuseModal(false)}
        />
      )}

      {showAbsentModal && (
        <Modal title="Signaler l’hôte absent" onClose={() => setShowAbsentModal(false)}>
          <div className="space-y-4 p-6">
            <Notice tone="warning" icon={Clock} title="Délai de 2 heures">
              Une fois le signalement envoyé, l’hôte dispose de 2 h pour effectuer l’état des
              lieux. Passé ce délai, la réservation est annulée et vous êtes remboursé
              intégralement.
            </Notice>

            <p className="text-xs leading-relaxed text-foreground-muted">
              Assurez-vous d’avoir tenté de joindre votre hôte avant de continuer. Cette action
              est irréversible.
            </p>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3 pt-1">
              <GhostButton
                onClick={() => setShowAbsentModal(false)}
                className="flex-1 py-3 text-sm"
              >
                Retour
              </GhostButton>
              <DangerButton
                onClick={handleReportAbsent}
                loading={isSubmitting}
                loadingLabel="Envoi…"
                className="flex-1 py-3 text-sm"
              >
                Confirmer le signalement
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {showCancelModal && (
        <Modal
          title="Annuler la réservation"
          onClose={() => { setShowCancelModal(false); setCancelReason(''); setErrorMsg(null); }}
        >
          <div className="space-y-5 p-6">

            <section className="rounded-card border border-border bg-background-alt p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Si vous annulez maintenant
              </p>
              <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-foreground">
                {refundTier.short}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{refundTier.label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
                Estimation indicative sur le montant payé. Le montant définitif est arrêté par
                Klef à la réception de votre demande.
              </p>
            </section>

            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Barème d’annulation
              </p>
              <RefundScale current={refundTier.id} />
            </div>

            <div>
              <label htmlFor="tenant-cancel-reason" className="mb-1.5 block text-xs font-semibold text-foreground">
                Motif <span className="text-error-600">*</span>
              </label>
              <textarea
                id="tenant-cancel-reason"
                rows={3}
                autoFocus
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                placeholder="Ex : je ne pourrai finalement pas voyager à ces dates."
                className="w-full resize-none rounded-xl border border-border bg-white p-3 text-sm font-medium text-foreground placeholder:text-foreground-faint focus:border-forest-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
              <p className="mt-1.5 text-xs text-foreground-muted">
                Minimum {MOTIF_MIN} caractères · {cancelReason.trim().length} saisis
              </p>
            </div>

            {errorMsg && <Feedback type="error" message={errorMsg} />}

            <div className="flex gap-3">
              <GhostButton
                onClick={() => { setShowCancelModal(false); setCancelReason(''); setErrorMsg(null); }}
                className="flex-1 py-3 text-sm"
              >
                Conserver ma réservation
              </GhostButton>
              <DangerButton
                onClick={handleCancel}
                disabled={cancelReason.trim().length < MOTIF_MIN}
                loading={isSubmitting}
                className="flex-1 py-3 text-sm"
              >
                Confirmer
              </DangerButton>
            </div>
          </div>
        </Modal>
      )}

      {showRulesModal && (
        <Modal title="Vos droits sur Klef" onClose={() => setShowRulesModal(false)}>
          <div className="space-y-4 p-6">
            <p className="text-xs leading-relaxed text-foreground-muted">
              Klef protège votre séjour par un séquestre sécurisé et une double validation.
            </p>

            {[
              {
                icon: Lock, tone: 'forest' as Tone, title: '1. Votre paiement est sécurisé',
                body: 'Les fonds sont conservés en séquestre et ne sont reversés à l’hôte qu’après votre confirmation de check-in.',
              },
              {
                icon: Shield, tone: 'forest' as Tone, title: '2. Vous avez le dernier mot',
                body: 'L’hôte dépose les photos de l’état des lieux. Vous les inspectez et ne confirmez que si tout est conforme. En cas de non-conformité, refusez : les fonds restent bloqués.',
              },
              {
                icon: RefreshCw, tone: 'warning' as Tone, title: '3. Auto-check-in (H+6)',
                body: 'Si ni vous ni l’hôte n’avez agi 6 h après le début du séjour, le système effectue un check-in automatique. Le séjour commence et le reversement est programmé.',
              },
              {
                icon: AlertTriangle, tone: 'error' as Tone, title: '4. Hôte absent : remboursement garanti',
                body: 'Si votre hôte ne se présente pas, signalez son absence. Il dispose de 2 h pour réagir. Passé ce délai, la réservation est annulée et vous êtes remboursé intégralement.',
              },
            ].map(({ icon, tone, title, body }) => (
              <Notice key={title} tone={tone} icon={icon} title={title}>
                {body}
              </Notice>
            ))}

            <PrimaryButton onClick={() => setShowRulesModal(false)}>
              J’ai compris
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {showRewardModal && (
        <TerangaRewardModal
          isOpen={showRewardModal}
          onClose={() => setShowRewardModal(false)}
          earnedCoins={earnedCoins}
        />
      )}
    </>
  );
}