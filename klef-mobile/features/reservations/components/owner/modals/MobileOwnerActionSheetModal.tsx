import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  CalendarCheck,
  CalendarX,
  ClipboardCheck,
  ShieldAlert,
  Scale,
  Star,
  UserX,
  FileCheck,
  ChevronRight,
  Lock,
  PhoneCall,
  Headphones,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';
import { canSeeCoordonnees } from '../../../utils/coordonnees.utils';

interface MobileOwnerActionSheetModalProps {
  visible: boolean;
  onClose: () => void;
  reservation: ReservationDetail;
  onOpenConfirmTime: () => void;
  onOpenRefusal: () => void;
  onOpenCheckinCamera: () => void;
  onOpenCheckoutCamera: () => void;
  onOpenDispute: () => void;
  onOpenRateGuest: () => void;
  onOpenNoshow: () => void;
  onOpenOwnerCancel?: () => void;
  onCallGuest: () => void;
  onDownloadContract: () => void;
  /** Ouvre l'assistance prioritaire Klef. Optionnel : si absent, la ligne
   * "Assistance Prioritaire" ferme simplement la modale (comportement
   * précédent conservé le temps de brancher le vrai flux côté parent). */
  onOpenSupport?: () => void;
}

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: { label: 'En attente', bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
  PAID: { label: 'Paiement reçu', bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
  CONFIRMED: { label: 'Confirmée', bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
  CHECKED_IN: { label: 'Séjour en cours', bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  COMPLETED: { label: 'Terminée', bg: '#E0E7FF', text: '#4338CA', dot: '#6366F1' },
  DISPUTED: { label: 'Litige en cours', bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
};

type ActionTone = 'lime' | 'red' | 'amber' | 'blue' | 'muted';

const TONE_STYLES: Record<ActionTone, { iconBg: string; iconBorder: string; iconColor: string }> = {
  lime: { iconBg: '#ECFDF5', iconBorder: '#A7F3D0', iconColor: '#15803D' },
  red: { iconBg: '#FEF2F2', iconBorder: '#FECACA', iconColor: '#DC2626' },
  amber: { iconBg: '#FFFBEB', iconBorder: '#FDE68A', iconColor: '#D97706' },
  blue: { iconBg: '#EFF6FF', iconBorder: '#BFDBFE', iconColor: '#2563EB' },
  muted: { iconBg: '#F8FAFC', iconBorder: '#E2E8F0', iconColor: '#475569' },
};

function ActionCardRow({
  icon: Icon,
  tone,
  title,
  subtitle,
  highlighted,
  titleColor,
  iconFill,
  badgeText,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; fill?: string; strokeWidth?: number }>;
  tone: ActionTone;
  title: string;
  subtitle: string;
  highlighted?: boolean;
  titleColor?: string;
  iconFill?: string;
  badgeText?: string;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const toneStyle = disabled ? TONE_STYLES.muted : TONE_STYLES[tone];
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.82}
      style={[
        styles.actionCard,
        highlighted && !disabled && styles.actionCardHighlighted,
        disabled && styles.actionCardDisabled,
      ]}
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <View
        style={[
          styles.iconSquircle,
          { backgroundColor: toneStyle.iconBg, borderColor: toneStyle.iconBorder },
        ]}
      >
        {disabled ? (
          <Lock size={19} color={colors.neutral[400]} strokeWidth={2} />
        ) : (
          <Icon size={20} color={toneStyle.iconColor} strokeWidth={2} fill={iconFill} />
        )}
      </View>

      <View style={styles.actionTextCol}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.actionTitle,
              highlighted && !disabled && { color: '#14532D' },
              titleColor && !disabled && { color: titleColor },
              disabled && { color: colors.neutral[400] },
            ]}
          >
            {title}
          </Text>
          {badgeText && !disabled && (
            <View style={styles.recommendedBadge}>
              <Sparkles size={10} color="#15803D" />
              <Text style={styles.recommendedBadgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.actionSub, disabled && { color: colors.neutral[400] }]}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.arrowBox, highlighted && !disabled && styles.arrowBoxHighlighted]}>
        {disabled ? (
          <Lock size={14} color={colors.neutral[300]} strokeWidth={2} />
        ) : (
          <ChevronRight
            size={18}
            color={highlighted ? '#15803D' : colors.neutral[400]}
            strokeWidth={2.2}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export function MobileOwnerActionSheetModal({
  visible,
  onClose,
  reservation,
  onOpenConfirmTime,
  onOpenRefusal,
  onOpenCheckinCamera,
  onOpenCheckoutCamera,
  onOpenDispute,
  onOpenRateGuest,
  onOpenNoshow,
  onOpenOwnerCancel,
  onCallGuest,
  onDownloadContract,
  onOpenSupport,
}: MobileOwnerActionSheetModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const statut = reservation?.statut || 'PENDING';
  const statusBadge = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
  const canSeePhone = canSeeCoordonnees(statut, reservation?.dateDebut);

  // ── Règles métier & Calcul des fenêtres de garde ────────────────────────
  const now = Date.now();
  const CHECKIN_GUARD_MS = 4 * 60 * 60 * 1000; // 4 heures avant heure de début
  const NOSHOW_DELAY_MS = 2 * 60 * 60 * 1000; // 2 heures après heure de début

  const debutMs = new Date(reservation?.dateDebut || 0).getTime();
  const finMs = new Date(reservation?.dateFin || 0).getTime();

  const checkinWindowStart = debutMs - CHECKIN_GUARD_MS;
  const canStartCheckin = now >= checkinWindowStart;
  const hoursUntilCheckin = Math.max(1, Math.ceil((checkinWindowStart - now) / 3600000));

  const checkoutWindowStart = finMs - CHECKIN_GUARD_MS;
  const canStartCheckout = now >= checkoutWindowStart;
  const hoursUntilCheckout = Math.max(1, Math.ceil((checkoutWindowStart - now) / 3600000));

  const ownerCheckinDone = !!reservation?.checkinProprioLe;
  const canSignalNoshow = !ownerCheckinDone && now - debutMs >= NOSHOW_DELAY_MS;

  const isKycVerified =
    (reservation?.locataire as any)?.statutKyc === 'VERIFIE' ||
    reservation?.locataire?.estVerifie === true;

  const handleAction = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    onClose();
    callback();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom + 12, 20) },
          ]}
        >
          {/* Header Drag Handle & Title Bar */}
          <View style={styles.sheetHeaderGroup}>
            <View style={styles.dragHandle} />

            <View style={styles.headerRow}>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>Actions disponibles</Text>
                <Text style={styles.subtitle}>Gérer ce séjour & contacter les services Klef</Text>
              </View>

              <View style={styles.headerRightGroup}>
                <View style={[styles.statusChip, { backgroundColor: statusBadge.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusBadge.dot }]} />
                  <Text style={[styles.statusChipText, { color: statusBadge.text }]}>
                    {statusBadge.label}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <X size={18} color={colors.neutral[600]} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            {/* ── 1. Actions PAID ────────────────────────────────────────────── */}
            {statut === 'PAID' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Décision d’acceptation</Text>
                </View>

                <ActionCardRow
                  icon={CalendarCheck}
                  tone="lime"
                  highlighted={isKycVerified}
                  disabled={!isKycVerified}
                  badgeText={isKycVerified ? "Action requise" : undefined}
                  title="Confirmer la réservation"
                  subtitle={
                    !isKycVerified
                      ? "Attente validation KYC du locataire par Klef"
                      : "Valider et fixer les horaires d’arrivée / départ"
                  }
                  onPress={() => handleAction(onOpenConfirmTime)}
                  accessibilityLabel="Confirmer la réservation"
                />

                <ActionCardRow
                  icon={CalendarX}
                  tone="red"
                  title="Refuser la réservation"
                  subtitle="Annuler la demande et libérer les dates du calendrier"
                  titleColor="#DC2626"
                  onPress={() => handleAction(onOpenRefusal)}
                  accessibilityLabel="Refuser la réservation"
                />
              </View>
            )}

            {/* ── 2. Actions CONFIRMED ───────────────────────────────────────── */}
            {statut === 'CONFIRMED' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Gestion du séjour</Text>
                </View>

                <ActionCardRow
                  icon={ClipboardCheck}
                  tone="lime"
                  highlighted={canStartCheckin}
                  disabled={!canStartCheckin}
                  badgeText={canStartCheckin ? "Étape en cours" : undefined}
                  title="Démarrer l’état des lieux d’entrée"
                  subtitle={
                    !canStartCheckin
                      ? `Disponible 4h avant l’arrivée (dans ${hoursUntilCheckin}h)`
                      : ownerCheckinDone
                      ? "Photos enregistrées (en attente du locataire)"
                      : "Prendre les photos clés et valider l’arrivée"
                  }
                  onPress={() => handleAction(onOpenCheckinCamera)}
                  accessibilityLabel="Démarrer l’état des lieux d’entrée"
                />

                <ActionCardRow
                  icon={UserX}
                  tone="red"
                  disabled={!canSignalNoshow}
                  title="Signaler une absence (No-Show)"
                  subtitle={
                    !canSignalNoshow
                      ? "Disponible 2h après l’heure d’arrivée prévue"
                      : "Locataire absent 2h après l’heure convenue"
                  }
                  onPress={() => handleAction(onOpenNoshow)}
                  accessibilityLabel="Signaler une absence du locataire"
                />

                <ActionCardRow
                  icon={Scale}
                  tone="amber"
                  title="Ouvrir un litige"
                  subtitle="Saisir l’arbitrage Klef et bloquer les fonds"
                  onPress={() => handleAction(onOpenDispute)}
                  accessibilityLabel="Ouvrir un litige"
                />

                {onOpenOwnerCancel && (
                  <ActionCardRow
                    icon={CalendarX}
                    tone="red"
                    title="Annuler la réservation (Hôte)"
                    subtitle="Annulation d’un séjour confirmé et pénalités"
                    titleColor="#DC2626"
                    onPress={() => handleAction(onOpenOwnerCancel)}
                    accessibilityLabel="Annuler la réservation en tant qu’hôte"
                  />
                )}
              </View>
            )}

            {/* ── 3. Actions CHECKED_IN ──────────────────────────────────────── */}
            {statut === 'CHECKED_IN' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Clôture & Restitution</Text>
                </View>

                <ActionCardRow
                  icon={ClipboardCheck}
                  tone="lime"
                  highlighted={canStartCheckout}
                  disabled={!canStartCheckout}
                  badgeText={canStartCheckout ? "Étape finale" : undefined}
                  title="Démarrer l’état des lieux de sortie"
                  subtitle={
                    !canStartCheckout
                      ? `Disponible 4h avant la fin du séjour (dans ${hoursUntilCheckout}h)`
                      : "Prendre les photos de départ et libérer les fonds net hôte"
                  }
                  onPress={() => handleAction(onOpenCheckoutCamera)}
                  accessibilityLabel="Démarrer l’état des lieux de sortie"
                />

                <ActionCardRow
                  icon={ShieldAlert}
                  tone="amber"
                  title="Déclarer un dégât ou ouvrir un litige"
                  subtitle="Bloquer la caution et contacter l’arbitrage Klef"
                  onPress={() => handleAction(onOpenDispute)}
                  accessibilityLabel="Déclarer un dégât ou ouvrir un litige"
                />
              </View>
            )}

            {/* ── 4. Actions COMPLETED ───────────────────────────────────────── */}
            {statut === 'COMPLETED' && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>Évaluation hôte</Text>
                </View>

                <ActionCardRow
                  icon={Star}
                  tone="amber"
                  highlighted
                  badgeText="Recommandé"
                  title="Évaluer le locataire"
                  subtitle="Attribuer une note et laisser un avis sur le profil"
                  onPress={() => handleAction(onOpenRateGuest)}
                  accessibilityLabel="Évaluer le locataire"
                />
              </View>
            )}

            {/* ── 5. Contact & Documents ───────────────────────────────────── */}
            <View style={styles.sectionGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionDot} />
                <Text style={styles.sectionTitle}>Contact & Documents</Text>
              </View>

              {reservation?.locataire?.telephone && (
                canSeePhone ? (
                  <ActionCardRow
                    icon={PhoneCall}
                    tone="blue"
                    title="Appeler le locataire"
                    subtitle={reservation.locataire.telephone}
                    onPress={() => handleAction(onCallGuest)}
                    accessibilityLabel="Appeler le locataire"
                  />
                ) : (
                  <ActionCardRow
                    icon={Lock}
                    tone="muted"
                    title="Numéro masqué 🔒"
                    subtitle={
                      ['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(statut)
                        ? "Non disponible pour cette réservation"
                        : "Disponible 24h avant l'arrivée"
                    }
                    onPress={() => handleAction(onCallGuest)}
                    accessibilityLabel="Numéro de téléphone masqué"
                  />
                )
              )}

              <ActionCardRow
                icon={FileCheck}
                tone="muted"
                title="Consulter le contrat PDF"
                subtitle="Document officiel signé et certifié horodaté"
                onPress={() => handleAction(onDownloadContract)}
                accessibilityLabel="Consulter le contrat PDF"
              />
            </View>

            {/* ── 6. Banner Support Prioritaire Klef ────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.supportBanner}
              onPress={() => handleAction(() => onOpenSupport?.())}
            >
              <View style={styles.supportBannerIconBox}>
                <Headphones size={22} color={colors.lime[400]} strokeWidth={2.2} />
              </View>
              <View style={styles.supportBannerTextCol}>
                <Text style={styles.supportBannerTitle}>Assistance Prioritaire Klef</Text>
                <Text style={styles.supportBannerSub}>Support conciergerie & aide 7j/7</Text>
              </View>
              <View style={styles.supportBannerBtn}>
                <Text style={styles.supportBannerBtnText}>Aide</Text>
                <ArrowUpRight size={14} color={colors.forest[950]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 26, 16, 0.65)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    width: '100%',
    height: '80%',
    maxHeight: '88%',
    minHeight: 460,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.lg,
  },
  sheetHeaderGroup: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.neutral[900],
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 22,
  },
  sectionGroup: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    marginBottom: 2,
  },
  sectionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[400],
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...shadows.xs,
  },
  actionCardHighlighted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },
  actionCardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  iconSquircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[900],
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  recommendedBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#15803D',
  },
  actionSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 16,
  },
  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBoxHighlighted: {
    backgroundColor: '#DCFCE7',
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forest[950],
    padding: 14,
    borderRadius: 18,
    gap: 12,
    marginTop: 4,
    ...shadows.md,
  },
  supportBannerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
  },
  supportBannerTextCol: {
    flex: 1,
    gap: 2,
  },
  supportBannerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  supportBannerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
  },
  supportBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  supportBannerBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
});