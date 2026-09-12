import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AlertTriangle, X, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { apiClient } from '../../../../shared/api/api-client';

const MOTIF_MIN = 15;

export type TierId = 'full' | 'half' | 'quarter' | 'none';

export interface Tier {
  id: TierId;
  percentage: number;
  short: string;
  window: string;
  label: string;
  description: string;
  tone: {
    chipBg: string;
    chipBorder: string;
    text: string;
    dot: string;
  };
}

const TIERS: Tier[] = [
  {
    id: 'full',
    percentage: 100,
    short: '100 %',
    window: 'Plus de 7 jours',
    label: 'Remboursement intégral',
    description: 'Vous annulez plus de 7 jours avant l’arrivée.',
    tone: {
      chipBg: colors.success[50],
      chipBorder: '#BCE3C7',
      text: colors.success[700],
      dot: colors.success[600],
    },
  },
  {
    id: 'half',
    percentage: 50,
    short: '50 %',
    window: '3 à 7 jours',
    label: 'Remboursement partiel',
    description: 'Vous annulez entre 3 et 7 jours avant l’arrivée.',
    tone: {
      chipBg: colors.warning[50],
      chipBorder: '#F7E0B3',
      text: colors.warning[700],
      dot: colors.warning[600],
    },
  },
  {
    id: 'quarter',
    percentage: 25,
    short: '25 %',
    window: '24 h à 3 jours',
    label: 'Remboursement minimal',
    description: 'Vous annulez entre 24 heures et 3 jours avant l’arrivée.',
    tone: {
      chipBg: colors.error[50],
      chipBorder: '#F5C4BD',
      text: colors.error[600],
      dot: colors.error[500],
    },
  },
  {
    id: 'none',
    percentage: 0,
    short: '0 %',
    window: 'Moins de 24 h',
    label: 'Aucun remboursement',
    description: 'Vous annulez moins de 24 heures avant l’arrivée.',
    tone: {
      chipBg: colors.error[50],
      chipBorder: '#F5C4BD',
      text: colors.error[700],
      dot: colors.error[600],
    },
  },
];

function resolveTier(hoursToCheckin: number): Tier {
  const days = hoursToCheckin / 24;
  if (days > 7) return TIERS[0];
  if (days >= 3) return TIERS[1];
  if (hoursToCheckin >= 24) return TIERS[2];
  return TIERS[3];
}

function formatFcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0));
}

export interface MobileCancelReservationModalProps {
  visible: boolean;
  reservationId: string;
  dateDebut: string;
  montantPaye?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function MobileCancelReservationModal({
  visible,
  reservationId,
  dateDebut,
  montantPaye,
  onSuccess,
  onClose,
}: MobileCancelReservationModalProps) {
  const [raison, setRaison] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const trimmedLength = raison.trim().length;
  const isValid = trimmedLength >= MOTIF_MIN;

  const { tier, hasStarted } = useMemo(() => {
    if (!dateDebut) return { tier: TIERS[3], hasStarted: false };
    const checkin = new Date(dateDebut).getTime();
    if (Number.isNaN(checkin)) return { tier: TIERS[3], hasStarted: false };
    const hours = (checkin - Date.now()) / 3_600_000;
    return { tier: resolveTier(hours), hasStarted: hours <= 0 };
  }, [dateDebut]);

  const montantRembourse =
    montantPaye != null ? Math.round((montantPaye * tier.percentage) / 100) : null;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setRaison('');
    setErrorMsg(null);
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setErrorMsg(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    setIsSubmitting(true);

    try {
      await apiClient.patch(`/reservations/${reservationId}/cancel`, {
        raison: raison.trim(),
      });
      setRaison('');
      onSuccess();
      onClose();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (error instanceof Error ? error.message : null) ||
        'L’annulation n’a pas pu être enregistrée. Réessayez dans un instant.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, raison, reservationId, onSuccess, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.modalSheet}>
          {/* ── En-tête ─────────────────────────────────────────────────── */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBadge}>
                <AlertTriangle size={16} color={colors.error[600]} />
              </View>
              <Text style={styles.modalTitle}>Annuler la réservation</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* ── Corps ───────────────────────────────────────────────────── */}
          <ScrollView
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Carte unique de résultat : Si vous annulez maintenant */}
            <View style={[styles.estimateCard, { backgroundColor: tier.tone.chipBg, borderColor: tier.tone.chipBorder }]}>
              <Text style={styles.estimateSubHeader}>
                {hasStarted ? 'DATE D’ARRIVÉE DÉPASSÉE' : 'SI VOUS ANNULEZ MAINTENANT'}
              </Text>

              <View style={styles.estimateAmountRow}>
                <Text style={[styles.estimateAmountText, { color: tier.tone.text }]}>
                  {hasStarted || tier.id === 'none'
                    ? '0 FCFA'
                    : montantRembourse != null
                      ? `${formatFcfa(montantRembourse)} FCFA`
                      : tier.short}
                </Text>
                <Text style={styles.estimateAmountRatio}>
                  soit {hasStarted || tier.id === 'none' ? '0 %' : tier.short}
                </Text>
              </View>

              <Text style={[styles.estimateLabelText, { color: tier.tone.text }]}>
                {hasStarted
                  ? 'Aucun remboursement automatique'
                  : tier.label}
              </Text>

              <Text style={styles.estimateDisclaimer}>
                {hasStarted
                  ? 'La date de début du séjour est dépassée. Aucun remboursement automatique ne peut être effectué. Pour toute demande particulière ou urgence, contactez le support Klef.'
                  : tier.id === 'none'
                    ? 'Vous annulez moins de 24h avant le début du séjour. Conformément aux conditions d’annulation, le montant du séjour reste acquis à l’hôte. En cas d’imprévu majeur, contactez le support Klef.'
                    : `${tier.description} Estimation indicative : le montant définitif est arrêté par Klef à la réception de votre demande.`}
              </Text>
            </View>

            {/* Barème d'annulation */}
            <View style={styles.scaleContainer}>
              <Text style={styles.sectionTitle}>BARÈME D’ANNULATION</Text>
              <View style={styles.scaleList}>
                {TIERS.map((t, index) => {
                  const isCurrent = t.id === tier.id;
                  const isLast = index === TIERS.length - 1;
                  return (
                    <View
                      key={t.id}
                      style={[
                        styles.scaleRow,
                        isCurrent ? styles.scaleRowActive : styles.scaleRowInactive,
                        !isLast && styles.scaleRowBorderBottom,
                      ]}
                    >
                      <View style={styles.scaleRowLeft}>
                        <View
                          style={[
                            styles.scaleDot,
                            { backgroundColor: isCurrent ? t.tone.dot : colors.neutral[300] },
                          ]}
                        />
                        <Text
                          style={[
                            styles.scaleWindowText,
                            isCurrent ? styles.scaleTextBold : styles.scaleTextMuted,
                          ]}
                        >
                          {t.window} avant l’arrivée
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.scalePctText,
                          isCurrent ? { color: t.tone.text, fontFamily: typography.fontBodySemiBold } : styles.scaleTextMuted,
                        ]}
                      >
                        {t.short}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Saisie du motif */}
            <View style={styles.motifContainer}>
              <Text style={styles.sectionTitle}>
                MOTIF D’ANNULATION <Text style={{ color: colors.error[600] }}>*</Text>
              </Text>
              <Text style={styles.motifHelpText}>
                Ce motif est transmis à l’hôte et conservé avec la réservation.
              </Text>

              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={setRaison}
                placeholder="Ex : un imprévu professionnel m’empêche de voyager à ces dates."
                placeholderTextColor={colors.neutral[400]}
                style={styles.textArea}
                value={raison}
                selectionColor={colors.forest[600]}
                cursorColor={colors.forest[700]}
                autoCorrect={false}
                editable={!isSubmitting}
              />

              <View style={styles.counterRow}>
                <Text style={styles.counterMinText}>
                  Minimum {MOTIF_MIN} caractères
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    isValid && styles.counterTextValid,
                  ]}
                >
                  {trimmedLength} / {MOTIF_MIN}
                </Text>
              </View>
            </View>

            {/* Message d'erreur API si présent */}
            {errorMsg && (
              <View style={styles.errorBannerBox}>
                <AlertTriangle size={16} color={colors.error[600]} style={{ marginTop: 1 }} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            {/* Banner délai de remboursement */}
            <View style={styles.infoBannerBox}>
              <Info size={16} color={colors.neutral[500]} style={{ marginTop: 1 }} />
              <Text style={styles.infoBannerText}>
                <Text style={styles.infoBannerBold}>Délai de remboursement : </Text>
                3 à 5 jours ouvrés après validation. Une confirmation vous est envoyée par e-mail.
              </Text>
            </View>
          </ScrollView>

          {/* ── Pied de modale : Actions ─────────────────────────────────── */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.btnSecondary}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={styles.btnSecondaryText}
              >
                Conserver ma réservation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!isValid || isSubmitting}
              onPress={handleSubmit}
              style={[
                styles.btnDanger,
                (!isValid || isSubmitting) && styles.btnDisabled,
              ]}
            >
              {isSubmitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator size="small" color={colors.neutral[0]} />
                  <Text numberOfLines={1} style={styles.btnDangerText}>Annulation…</Text>
                </View>
              ) : (
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={styles.btnDangerText}
                >
                  Confirmer l’annulation
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  /* Header */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: 'rgba(179, 54, 40, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.text.primary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },

  /* Body */
  modalBody: {
    padding: 20,
    gap: 20,
  },



  /* Estimate Card */
  estimateCard: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 18,
    gap: 4,
  },
  estimateSubHeader: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  estimateAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  estimateAmountText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 26,
  },
  estimateAmountRatio: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.text.secondary,
  },
  estimateLabelText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 14,
    marginTop: 2,
  },
  estimateDisclaimer: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 16,
    marginTop: 6,
  },

  /* Scale List */
  scaleContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  scaleList: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.inner,
    overflow: 'hidden',
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scaleRowActive: {
    backgroundColor: colors.background.alt,
  },
  scaleRowInactive: {
    backgroundColor: colors.neutral[0],
  },
  scaleRowBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  scaleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scaleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scaleWindowText: {
    fontSize: 12,
  },
  scaleTextBold: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.text.primary,
  },
  scaleTextMuted: {
    fontFamily: typography.fontBodyMedium,
    color: colors.text.secondary,
  },
  scalePctText: {
    fontSize: 12,
  },

  /* Motif */
  motifContainer: {
    gap: 6,
  },
  motifHelpText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  textArea: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.field,
    padding: 12,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  counterMinText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.text.secondary,
  },
  counterText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.text.secondary,
  },
  counterTextValid: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.success[700],
  },

  /* Error Banner */
  errorBannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: 'rgba(179, 54, 40, 0.2)',
    padding: 12,
    borderRadius: radius.inner,
  },
  errorBannerText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.error[700],
    flex: 1,
    lineHeight: 16,
  },

  /* Info Banner */
  infoBannerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.background.alt,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: 12,
    borderRadius: radius.inner,
  },
  infoBannerText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
  infoBannerBold: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.text.primary,
  },

  /* Footer */
  modalFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.alt,
  },
  btnSecondary: {
    flex: 1.15,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.text.primary,
    textAlign: 'center',
  },
  btnDanger: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.error[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDangerText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
