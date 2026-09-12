import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Clock,
  Shield,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Camera,
  ClipboardCheck,
  X,
  XCircle,
  ChevronRight,
  RefreshCw,
  Gavel,
  Star,
  UserX,
  UserCheck,
  HelpCircle,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerActionPanelCardProps {
  reservation: ReservationDetail;
  onRefetch?: () => void;
  onOpenCheckinModal?: () => void;
  onOpenCheckoutModal?: () => void;
  onConfirmReservation?: () => void;
  onRefuseReservation?: () => void;
  onCompleteCheckout?: () => void;
  onOpenCancelModal?: () => void;
  onOpenRateModal?: () => void;
  onOpenDisputeModal?: (initialMotif?: string) => void;
  onOpenNoshowModal?: () => void;
  onReopenLateCheckin?: () => void;
}

const CHECKIN_GUARD_MS = 4 * 60 * 60 * 1000; // 4 heures
const NOSHOW_DELAY_MS = 2 * 60 * 60 * 1000; // 2 heures après arrivée
const ABSENCE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 heures pour réagir à un signalement d'absence
const DOUBLE_TAP_GUARD_MS = 1200; // anti double-tap sur les actions critiques
const PENALITES = { early: 0, mid: 2500, late: 10000 } as const;

/**
 * Palette "warning" (ambre) : n'a pas d'équivalent direct dans le trio
 * forest / lime / gold du design system Klef (le gold est réservé au statut
 * vérifié et aux notes, jamais à un avertissement). Centralisée ici en
 * attendant qu'un token sémantique "warning" existe dans tokens.ts —
 * à remplacer par colors.warning[...] si/quand il est ajouté.
 */
const WARNING = {
  bg: '#FFFBEB',
  border: '#FDE68A',
  iconBg: '#FEF3C7',
  title: '#92400E',
  body: '#B45309',
  icon: '#D97706',
} as const;

type NoticeVariant = 'forest' | 'success' | 'warning' | 'neutral' | 'error';

const NOTICE_STYLES: Record<
  NoticeVariant,
  { bg: string; border: string; iconBg: string; title: string; body: string }
> = {
  forest: {
    bg: colors.forest[50],
    border: colors.forest[200],
    iconBg: colors.forest[100],
    title: colors.forest[950],
    body: colors.forest[700],
  },
  success: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    iconBg: '#D1FAE5',
    title: '#065F46',
    body: '#047857',
  },
  warning: {
    bg: WARNING.bg,
    border: WARNING.border,
    iconBg: WARNING.iconBg,
    title: WARNING.title,
    body: WARNING.body,
  },
  neutral: {
    bg: colors.neutral[50],
    border: colors.neutral[200],
    iconBg: colors.neutral[200],
    title: colors.neutral[800],
    body: colors.neutral[600],
  },
  error: {
    bg: colors.error[50],
    border: colors.error[200],
    iconBg: colors.error[100],
    title: colors.error[800],
    body: colors.error[700],
  },
};

const STEP_CONFIG = {
  PENDING: {
    step: 1,
    icon: Clock,
    accent: colors.neutral[300],
    chipBg: colors.neutral[100],
    chipBorder: colors.neutral[200],
    chipText: colors.neutral[600],
    iconBoxBg: colors.neutral[50],
    iconBoxBorder: colors.neutral[200],
    iconColor: colors.neutral[500],
    label: 'En attente',
    sub: 'En attente du paiement du locataire',
  },
  PAID: {
    step: 2,
    icon: Shield,
    accent: WARNING.icon,
    chipBg: WARNING.iconBg,
    chipBorder: WARNING.border,
    chipText: WARNING.title,
    iconBoxBg: WARNING.iconBg,
    iconBoxBorder: WARNING.border,
    iconColor: WARNING.icon,
    label: 'Décision requise',
    sub: 'Paiement reçu — acceptez ou refusez',
  },
  CONFIRMED: {
    step: 3,
    icon: LogIn,
    accent: colors.forest[600],
    chipBg: colors.forest[50],
    chipBorder: colors.forest[200],
    chipText: colors.forest[900],
    iconBoxBg: colors.forest[50],
    iconBoxBorder: colors.forest[200],
    iconColor: colors.forest[900],
    label: 'Check-in',
    sub: 'État des lieux d’entrée',
  },
  CHECKED_IN: {
    step: 4,
    icon: LogOut,
    accent: WARNING.icon,
    chipBg: WARNING.iconBg,
    chipBorder: WARNING.border,
    chipText: WARNING.title,
    iconBoxBg: WARNING.iconBg,
    iconBoxBorder: WARNING.border,
    iconColor: WARNING.icon,
    label: 'Check-out',
    sub: 'Clôture du séjour',
  },
  COMPLETED: {
    step: 5,
    icon: CheckCircle2,
    accent: colors.forest[600],
    chipBg: colors.forest[50],
    chipBorder: colors.forest[200],
    chipText: colors.forest[900],
    iconBoxBg: colors.forest[50],
    iconBoxBorder: colors.forest[200],
    iconColor: colors.forest[900],
    label: 'Terminée',
    sub: 'Séjour terminé',
  },
  DISPUTED: {
    step: null,
    icon: AlertTriangle,
    accent: colors.error[500],
    chipBg: colors.error[50],
    chipBorder: colors.error[200],
    chipText: colors.error[800],
    iconBoxBg: colors.error[50],
    iconBoxBorder: colors.error[200],
    iconColor: colors.error[600],
    label: 'Litige en cours',
    sub: 'En attente de résolution par l’arbitrage Klef',
  },
} as const;

/** Bloc de notice générique : remplace les 5 variantes (forest/success/warning/neutral/error)
 * qui étaient dupliquées quasi à l'identique dans le fichier d'origine. */
function NoticeBox({
  variant,
  icon: Icon,
  title,
  body,
}: {
  variant: NoticeVariant;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  body: React.ReactNode;
}) {
  const s = NOTICE_STYLES[variant];
  return (
    <View
      style={[
        styles.noticeBox,
        { backgroundColor: s.bg, borderColor: s.border },
      ]}
    >
      <View style={[styles.noticeIconCircle, { backgroundColor: s.iconBg }]}>
        <Icon size={18} color={s.title} />
      </View>
      <View style={styles.noticeTextCol}>
        <Text style={[styles.noticeTitle, { color: s.title }]}>{title}</Text>
        <Text style={[styles.noticeBody, { color: s.body }]}>{body}</Text>
      </View>
    </View>
  );
}

/** Empêche le déclenchement en rafale d'une action critique (double-tap accidentel).
 * La garde se lève automatiquement après DOUBLE_TAP_GUARD_MS ; si la réservation
 * change de statut avant, elle disparaît de toute façon avec le re-render du parent. */
function useGuardedPress(callback?: () => void) {
  const guardedRef = useRef(false);
  return useCallback(() => {
    if (guardedRef.current || !callback) return;
    guardedRef.current = true;
    callback();
    setTimeout(() => {
      guardedRef.current = false;
    }, DOUBLE_TAP_GUARD_MS);
  }, [callback]);
}

export function MobileOwnerActionPanelCard({
  reservation,
  onRefetch,
  onOpenCheckinModal,
  onOpenCheckoutModal,
  onConfirmReservation,
  onRefuseReservation,
  onCompleteCheckout,
  onOpenCancelModal,
  onOpenRateModal,
  onOpenDisputeModal,
  onOpenNoshowModal,
  onReopenLateCheckin,
}: MobileOwnerActionPanelCardProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Horloge vivante pour mise à jour dynamique des délais (J-4h, No-Show 2h)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const guardedConfirm = useGuardedPress(onConfirmReservation);
  const guardedRefuse = useGuardedPress(onRefuseReservation);
  const guardedCompleteCheckout = useGuardedPress(onCompleteCheckout);
  const guardedReopenLate = useGuardedPress(onReopenLateCheckin);

  const statut = (reservation.statut || 'PENDING') as keyof typeof STEP_CONFIG;
  const config = STEP_CONFIG[statut] || STEP_CONFIG.PENDING;
  const StepIcon = config.icon;

  const debutMs = new Date(reservation.dateDebut).getTime();
  const finMs = new Date(reservation.dateFin).getTime();

  const checkinWindowStart = debutMs - CHECKIN_GUARD_MS;
  const canStartCheckin = now >= checkinWindowStart;
  const hoursUntilCheckin = Math.max(1, Math.ceil((checkinWindowStart - now) / 3600000));

  const checkoutWindowStart = finMs - CHECKIN_GUARD_MS;
  const canStartCheckout = now >= checkoutWindowStart;
  const hoursUntilCheckout = Math.max(1, Math.ceil((checkoutWindowStart - now) / 3600000));

  const ownerCheckinDone = !!reservation.checkinProprioLe;
  const ownerCheckoutDone = !!reservation.checkoutProprioLe;

  // Le no-show n'a de sens que tant que le propriétaire n'a pas déjà réalisé
  // son check-in : au-delà, le locataire est réputé présent.
  const canSignalNoshow = !ownerCheckinDone && now - debutMs >= NOSHOW_DELAY_MS;

  const photosList = reservation.photosEtatLieu || [];
  const checkinPhotos = photosList.filter(
    (p) => p.type === 'ENTREE' || (p as any).type === 'CHECKIN',
  );
  const checkoutPhotos = photosList.filter(
    (p) => p.type === 'SORTIE' || (p as any).type === 'CHECKOUT',
  );
  const isAutoCheckin = !!reservation.historique?.some(
    (h) => h.modifiePar === 'SYSTEM_AUTO_CHECKIN',
  );

  const absenceMs = reservation.absenceSignaleeLe
    ? new Date(reservation.absenceSignaleeLe).getTime()
    : 0;
  const isAbsenceActive =
    !!reservation.absenceSignaleeLe &&
    statut === 'CONFIRMED' &&
    !ownerCheckinDone &&
    now - absenceMs < ABSENCE_WINDOW_MS;

  const formatDateTime = (dateStr?: string | Date | number | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateFormatted} à ${hours}:${minutes}`;
  };

  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const isKycVerified =
    (reservation.locataire as any)?.statutKyc === 'VERIFIE' ||
    reservation.locataire?.estVerifie === true;

  const isKycPending = (reservation.locataire as any)?.statutKyc === 'EN_ATTENTE';

  const confirmedSub = ownerCheckinDone
    ? 'waiting-tenant'
    : checkinPhotos.length > 0
    ? 'photos-uploaded'
    : canStartCheckin
    ? 'ready'
    : 'locked';

  const checkedInSub = !canStartCheckout
    ? 'locked'
    : ownerCheckoutDone
    ? 'awaiting-completion'
    : checkoutPhotos.length > 0
    ? 'photos-uploaded'
    : 'ready';

  return (
    <View style={styles.cardContainer}>
      {/* ── Top Color Accent Bar ────────────────────────────────────────────── */}
      <View style={[styles.accentBar, { backgroundColor: config.accent }]} />

      {/* ── En-tête de l'Étape ──────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: config.iconBoxBg, borderColor: config.iconBoxBorder },
          ]}
        >
          <StepIcon size={20} color={config.iconColor} />
        </View>

        <View style={styles.headerTextCol}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.stepTitle}>{config.label}</Text>
            {config.step !== null && (
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: config.chipBg, borderColor: config.chipBorder },
                ]}
              >
                <Text style={[styles.stepBadgeText, { color: config.chipText }]}>
                  Étape {config.step}/5
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.stepSubtitle}>{config.sub}</Text>
        </View>

        {onRefetch && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRefetch}
            style={styles.btnRefreshHeader}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Actualiser la réservation"
          >
            <RefreshCw size={14} color={colors.forest[700]} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Ligne de Séparation ─────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Corps des Notices & Actions ────────────────────────────────────── */}
      <View style={styles.bodyContent}>
        {/* Signalement d'absence d'hôte urgent */}
        {isAbsenceActive && (
          <NoticeBox
            variant="error"
            icon={AlertTriangle}
            title="⚠️ URGENT : Le locataire signale votre absence le jour J !"
            body={
              <>
                Le locataire a indiqué être sans nouvelles de vous pour l'arrivée (signalé
                le {formatDateTime(reservation.absenceSignaleeLe)}). Vous disposez de 2h à
                compter du signalement pour réaliser l'état des lieux ou contacter le
                locataire, sans quoi la réservation sera annulée avec remboursement à 100%.
              </>
            }
          />
        )}

        {/* ══ PENDING ══ */}
        {statut === 'PENDING' && (
          <>
            <NoticeBox
              variant="neutral"
              icon={Clock}
              title="En attente du paiement"
              body="Le locataire n’a pas encore finalisé le paiement. Vous serez notifié dès réception."
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onOpenCancelModal}
              style={styles.btnGhostCancel}
              accessibilityRole="button"
              accessibilityLabel="Annuler la demande de réservation"
            >
              <X size={14} color={colors.error[700]} />
              <Text style={styles.btnGhostCancelText}>Annuler la demande</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ══ PAID ══ */}
        {statut === 'PAID' && (
          <>
            <View style={styles.kycStatusInline}>
              {isKycVerified ? (
                <View style={styles.kycBadgeSuccess}>
                  <CheckCircle2 size={13} color={colors.forest[700]} />
                  <Text style={styles.kycBadgeSuccessText}>Identité du locataire vérifiée</Text>
                </View>
              ) : (
                <View style={styles.kycBadgeWarning}>
                  <AlertTriangle size={13} color={WARNING.title} />
                  <Text style={styles.kycBadgeWarningText}>
                    {isKycPending ? 'Identité en cours de validation' : 'Identité non vérifiée'}
                  </Text>
                </View>
              )}
            </View>

            {reservation.delaiConfirmation && (
              <View style={styles.delayBox}>
                <Clock size={14} color={colors.neutral[500]} />
                <Text style={styles.delayText}>
                  Répondez avant le{' '}
                  <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                    {formatDateTime(reservation.delaiConfirmation)}
                  </Text>
                </Text>
              </View>
            )}

            <NoticeBox
              variant="warning"
              icon={AlertTriangle}
              title="Annulation après confirmation"
              body="Une pénalité sera déduite de votre wallet selon le délai restant avant l’arrivée."
            />

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={guardedRefuse}
                style={styles.btnFullRefuse}
                accessibilityRole="button"
                accessibilityLabel="Refuser la réservation"
              >
                <XCircle size={16} color={colors.error[700]} />
                <Text style={styles.btnGhostRefuseText}>Refuser la réservation</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ CONFIRMED ══ */}
        {statut === 'CONFIRMED' && (
          <>
            {confirmedSub === 'locked' && (
              <NoticeBox
                variant="neutral"
                icon={Lock}
                title={`Check-in disponible dans ${hoursUntilCheckin} h`}
                body={
                  <>
                    Ouverture de l’état des lieux d’entrée le{' '}
                    <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                      {formatDateTime(checkinWindowStart)}
                    </Text>
                    .
                  </>
                }
              />
            )}

            {confirmedSub === 'ready' && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenCheckinModal}
                style={styles.actionCardButton}
                accessibilityRole="button"
                accessibilityLabel="Démarrer l’état des lieux d’entrée"
              >
                <View style={styles.actionCardIconBox}>
                  <Camera size={20} color={colors.forest[700]} />
                </View>
                <View style={styles.noticeTextCol}>
                  <Text style={styles.actionCardTitle}>Démarrer l’état des lieux d’entrée</Text>
                  <Text style={styles.actionCardSub}>
                    Photographiez chaque pièce avant l’arrivée du locataire (recommandé)
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}

            {confirmedSub === 'photos-uploaded' && (
              <>
                <NoticeBox
                  variant="warning"
                  icon={Camera}
                  title={`${checkinPhotos.length} photo${
                    checkinPhotos.length > 1 ? 's' : ''
                  } enregistrée${
                    checkinPhotos.length > 1 ? 's' : ''
                  }`}
                  body="Vos photos d’entrée sont enregistrées. Vous pouvez les valider via la barre d’action en bas."
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenCheckinModal}
                  style={styles.actionCardButton}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter d’autres photos de check-in"
                >
                  <View style={styles.actionCardIconBox}>
                    <Camera size={20} color={colors.forest[700]} />
                  </View>
                  <View style={styles.noticeTextCol}>
                    <Text style={styles.actionCardTitle}>Ajouter d’autres photos</Text>
                    <Text style={styles.actionCardSub}>
                      Compléter l’état des lieux d’entrée avec de nouvelles photos
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.neutral[400]} />
                </TouchableOpacity>
              </>
            )}

            {confirmedSub === 'waiting-tenant' && (
              <NoticeBox
                variant="forest"
                icon={CheckCircle2}
                title={`${checkinPhotos.length} photo${
                  checkinPhotos.length > 1 ? 's' : ''
                } de check-in confirmée${checkinPhotos.length > 1 ? 's' : ''}`}
                body="Le locataire a été notifié. Il doit confirmer son check-in depuis son espace. Les fonds restent en séquestre jusqu’à sa validation."
              />
            )}

            {/* Signalement No-Show si délai atteint et check-in propriétaire non fait */}
            {canSignalNoshow && onOpenNoshowModal && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenNoshowModal}
                style={styles.noshowCtaCard}
                accessibilityRole="button"
                accessibilityLabel="Signaler l’absence du locataire"
              >
                <View style={styles.noshowIconCircle}>
                  <UserX size={18} color={colors.error[600]} />
                </View>
                <View style={styles.noticeTextCol}>
                  <Text style={styles.noshowCtaTitle}>Le locataire ne s’est pas présenté ?</Text>
                  <Text style={styles.noshowCtaSub}>
                    Signalez son absence pour déclencher une annulation automatique
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {!reservation.litige && (
              <View style={styles.sideActionsBox}>
                <Text style={styles.sideActionsTitle}>Un problème avec ce séjour ?</Text>
                <View style={styles.sideActionsButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onOpenDisputeModal?.()}
                    style={styles.btnDisputeRed}
                    accessibilityRole="button"
                    accessibilityLabel="Ouvrir un litige"
                  >
                    <Gavel size={14} color={colors.error[600]} />
                    <Text style={styles.btnDisputeRedText}>Ouvrir un litige</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onOpenCancelModal}
                    style={styles.btnGhostCancel}
                    accessibilityRole="button"
                    accessibilityLabel="Annuler la réservation"
                  >
                    <X size={14} color={colors.error[700]} />
                    <Text style={styles.btnGhostCancelText}>Annuler la réservation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ══ CHECKED_IN (SÉJOUR EN COURS & CHECK-OUT) ══ */}
        {statut === 'CHECKED_IN' && (
          <>
            {isAutoCheckin && (
              <View style={styles.autoCheckinCompactBadge}>
                <CheckCircle2 size={14} color="#059669" />
                <Text style={styles.autoCheckinCompactText}>
                  ⚡ Check-in automatique (H+6) · Fonds libérés
                </Text>
              </View>
            )}

            {checkedInSub === 'locked' && (
              <NoticeBox
                variant="neutral"
                icon={Lock}
                title={`Check-out disponible dans ${hoursUntilCheckout} h`}
                body={
                  <>
                    Ouverture de l’état des lieux de sortie le{' '}
                    <Text style={{ fontWeight: '700', color: colors.neutral[900] }}>
                      {formatDateTime(checkoutWindowStart)}
                    </Text>
                    .
                  </>
                }
              />
            )}

            {checkedInSub === 'ready' && (
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onOpenCheckoutModal}
                  style={styles.actionCardButton}
                  accessibilityRole="button"
                  accessibilityLabel="Démarrer l’état des lieux de sortie"
                >
                  <View style={styles.actionCardIconBoxCheckout}>
                    <ClipboardCheck size={20} color={colors.forest[700]} strokeWidth={2.2} />
                  </View>
                  <View style={styles.noticeTextCol}>
                    <Text style={styles.actionCardTitle}>Démarrer l’état des lieux de sortie</Text>
                    <Text style={styles.actionCardSub}>
                      Photographiez le logement au départ du locataire (recommandé)
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.neutral[400]} />
                </TouchableOpacity>

                <View style={styles.directCheckoutCard}>
                  <Text style={styles.directCheckoutTitle}>Clôture directe sans état des lieux</Text>
                  <Text style={styles.directCheckoutSub}>
                    Clôturez directement le séjour sans photos de sortie.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={guardedCompleteCheckout}
                    style={styles.btnPrimaryCheckout}
                    accessibilityRole="button"
                    accessibilityLabel="Clôturer la réservation directement"
                  >
                    <CheckCircle2 size={16} color={colors.forest[950]} />
                    <Text style={styles.btnPrimaryCheckoutText}>Clôturer la réservation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {checkedInSub === 'photos-uploaded' && (
              <>
                <NoticeBox
                  variant="warning"
                  icon={Camera}
                  title={`${checkoutPhotos.length} photo${
                    checkoutPhotos.length > 1 ? 's' : ''
                  } de sortie — confirmation requise`}
                  body="Confirmez l’état des lieux de sortie pour pouvoir clôturer la réservation."
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={guardedCompleteCheckout}
                  style={styles.btnPrimaryCheckout}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmer l’état des lieux de sortie"
                >
                  <CheckCircle2 size={16} color={colors.forest[950]} />
                  <Text style={styles.btnPrimaryCheckoutText}>
                    Confirmer l’état des lieux de sortie
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onOpenCheckoutModal}
                  style={[styles.btnGhostRefuse, { marginTop: 8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Ajouter d’autres photos de check-out"
                >
                  <Text style={styles.btnGhostRefuseText}>Ajouter d’autres photos</Text>
                </TouchableOpacity>
              </>
            )}

            {checkedInSub === 'awaiting-completion' && (
              <>
                <NoticeBox
                  variant="forest"
                  icon={CheckCircle2}
                  title={`${checkoutPhotos.length} photo${
                    checkoutPhotos.length > 1 ? 's' : ''
                  } de check-out confirmée${checkoutPhotos.length > 1 ? 's' : ''}`}
                  body="État des lieux documenté. Vous pouvez maintenant clôturer la réservation."
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={guardedCompleteCheckout}
                  style={styles.btnPrimaryCheckout}
                  accessibilityRole="button"
                  accessibilityLabel="Clôturer la réservation"
                >
                  <CheckCircle2 size={16} color={colors.forest[950]} />
                  <Text style={styles.btnPrimaryCheckoutText}>Clôturer la réservation</Text>
                </TouchableOpacity>
              </>
            )}

            {!reservation.litige && (
              <View style={styles.sideActionsBox}>
                <Text style={styles.sideActionsTitle}>Problème pendant le séjour ?</Text>
                <View style={styles.sideActionsButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => onOpenDisputeModal?.()}
                    style={styles.btnDisputeRed}
                    accessibilityRole="button"
                    accessibilityLabel="Ouvrir un litige"
                  >
                    <Gavel size={14} color={colors.error[600]} />
                    <Text style={styles.btnDisputeRedText}>Ouvrir un litige</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ══ COMPLETED ══ */}
        {statut === 'COMPLETED' && (
          <>
            <NoticeBox
              variant="forest"
              icon={CheckCircle2}
              title="Séjour terminé"
              body={`Le séjour est clôturé avec succès. Merci d’avoir accueilli ${
                reservation.locataire?.prenom || 'votre voyageur'
              } sur Klef !`}
            />

            {(reservation.politiqueAppliquee as string) === 'NO_SHOW_LOCATAIRE' && (
              <View style={styles.lateCheckinBox}>
                <Text style={styles.lateCheckinTitle}>
                  Le locataire est finalement arrivé avec du retard ?
                </Text>
                <Text style={styles.lateCheckinSub}>
                  Vous pouvez ré-ouvrir la réservation pour lui remettre les clés, tout en
                  conservant vos fonds débloqués.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={guardedReopenLate}
                  style={styles.btnReopenLate}
                  accessibilityRole="button"
                  accessibilityLabel="Accueillir le voyageur en check-in tardif"
                >
                  <RefreshCw size={14} color={colors.neutral[0]} />
                  <Text style={styles.btnReopenLateText}>
                    Accueillir le voyageur (check-in tardif)
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.ratingSectionBox}>
              <Text style={styles.ratingSectionTitle}>Évaluer votre expérience</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onOpenRateModal}
                style={styles.btnRateGuest}
                accessibilityRole="button"
                accessibilityLabel={`Noter ${reservation.locataire?.prenom || 'le locataire'}`}
              >
                <UserCheck size={16} color={WARNING.icon} />
                <Text style={styles.btnRateGuestText}>
                  Noter {reservation.locataire?.prenom || 'le locataire'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ DISPUTED ══ */}
        {statut === 'DISPUTED' && (
          <NoticeBox
            variant="error"
            icon={AlertTriangle}
            title="Litige ouvert — Fonds gelés sous séquestre"
            body="Un litige est en cours de traitement par le support Klef (délai 48h à 72h). Les fonds restent sécurisés jusqu'à la résolution du dossier."
          />
        )}
      </View>

      {/* ── Pied : Règles de séjour et séquestre ──────────────────────────────── */}
      <View style={styles.cardFooterRules}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowRulesModal(true)}
          style={styles.rulesBtnTrigger}
          accessibilityRole="button"
          accessibilityLabel="Comprendre les règles de séquestre et de check-in"
        >
          <HelpCircle size={16} color={colors.neutral[900]} />
          <Text style={styles.rulesBtnTriggerText}>
            Comprendre les règles : séquestre, fenêtre de check-in, pénalités
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══ Modale explicative des Règles ════════════════════════════════════ */}
      <Modal
        visible={showRulesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Règles de séjour et séquestre</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowRulesModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <X size={18} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScrollBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalIntroText}>
                Klef applique une double validation et un séquestre sécurisé pour protéger les
                deux parties.
              </Text>

              <NoticeBox
                variant="forest"
                icon={Clock}
                title="1. Délai de confirmation"
                body="Vous disposez du délai affiché pour valider la réservation. Passé ce délai sans action, la réservation est annulée et le locataire intégralement remboursé."
              />

              <NoticeBox
                variant="warning"
                icon={Lock}
                title="2. Fenêtre de check-in (J−4 h)"
                body="L’état des lieux d’entrée ne peut démarrer que 4 heures avant l’arrivée. Cela garantit des photos fidèles et empêche tout déclenchement prématuré du versement."
              />

              <NoticeBox
                variant="forest"
                icon={Shield}
                title="3. Double validation du check-in"
                body="Le séjour démarre lorsque vous avez importé les photos ET que le locataire a confirmé son installation. Les fonds restent en séquestre jusque-là."
              />

              <NoticeBox
                variant="error"
                icon={AlertTriangle}
                title="4. Pénalités d’annulation"
                body={
                  <>
                    Après confirmation : Gratuit (0 FCFA) au-delà de 5 jours,{' '}
                    {PENALITES.mid.toLocaleString('fr-FR')} FCFA entre 24 h et 5 jours,{' '}
                    {PENALITES.late.toLocaleString('fr-FR')} FCFA à moins de 24 h (dernière
                    minute).
                  </>
                }
              />
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowRulesModal(false)}
              style={styles.modalPrimaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer les règles"
            >
              <Text style={styles.modalPrimaryBtnText}>J’ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.neutral[900],
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  stepBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  stepSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
  btnRefreshHeader: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  bodyContent: {
    padding: 16,
    gap: 12,
  },

  delayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  delayText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },

  // Notice générique (remplace les 5 variantes forest/success/warning/neutral/error)
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
  },
  noticeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noticeTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    lineHeight: 18,
  },
  noticeBody: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  noticeTextCol: {
    flex: 1,
  },

  // Buttons & Actions
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  btnGhostRefuse: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostRefuseText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[700],
  },
  btnGhostCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    marginTop: 4,
  },
  btnGhostCancelText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.error[700],
  },
  btnPrimaryConfirm: {
    flex: 1.5,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadows.action,
  },
  btnPrimaryConfirmText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  btnDisabled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDisabledText: {
    color: colors.neutral[400],
  },

  actionCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    gap: 12,
  },
  actionCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardIconBoxCheckout: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  actionCardSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },

  directCheckoutCard: {
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    gap: 8,
  },
  directCheckoutTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  directCheckoutSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    lineHeight: 16,
  },
  btnPrimaryCheckout: {
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    ...shadows.action,
  },
  btnPrimaryCheckoutText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  noshowCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
    gap: 12,
  },
  noshowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.error[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  noshowCtaTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.error[800],
  },
  noshowCtaSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[700],
    marginTop: 1,
  },

  sideActionsBox: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 10,
  },
  sideActionsTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sideActionsButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btnDisputeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  btnDisputeRedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.error[600],
  },

  lateCheckinBox: {
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: WARNING.bg,
    borderWidth: 1,
    borderColor: WARNING.border,
    gap: 8,
  },
  lateCheckinTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: WARNING.title,
  },
  lateCheckinSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: WARNING.body,
    lineHeight: 17,
  },
  btnReopenLate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: WARNING.icon,
    marginTop: 4,
  },
  btnReopenLateText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  ratingSectionBox: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 10,
  },
  ratingSectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnRateGuest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: WARNING.border,
    backgroundColor: WARNING.bg,
  },
  btnRateGuestText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: WARNING.title,
  },

  cardFooterRules: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rulesBtnTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rulesBtnTriggerText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[900],
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 45, 27, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    overflow: 'hidden',
    padding: 20,
    gap: 16,
    ...shadows.lg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.neutral[900],
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    gap: 12,
  },
  modalIntroText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  modalPrimaryBtn: {
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalPrimaryBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  kycStatusInline: {
    marginBottom: 4,
  },
  kycBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[200],
    borderWidth: 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  kycBadgeSuccessText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },
  kycBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: WARNING.iconBg,
    borderColor: WARNING.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  kycBadgeWarningText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: WARNING.title,
  },
  btnFullRefuse: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  autoCheckinCompactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  autoCheckinCompactText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: '#047857',
    textAlign: 'center',
  },
});