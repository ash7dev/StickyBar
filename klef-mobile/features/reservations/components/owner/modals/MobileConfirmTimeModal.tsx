import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Clock, CheckCircle2, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileConfirmTimeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (checkinHeure: string, checkoutHeure: string) => Promise<void>;
  loading?: boolean;
  hasSameDayCheckout?: boolean;
}

function DirectTimeInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const parts = (value || '14:00').split(':');
  const hStr = parts[0] || '14';
  const mStr = parts[1] || '00';

  const updateTime = (newH: number, newM: number) => {
    const validH = Math.max(0, Math.min(23, newH));
    const validM = Math.max(0, Math.min(59, newM));
    const formattedH = String(validH).padStart(2, '0');
    const formattedM = String(validM).padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  const currentH = parseInt(hStr, 10) || 0;
  const currentM = parseInt(mStr, 10) || 0;

  const handleHourChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      updateTime(0, currentM);
      return;
    }
    const num = parseInt(clean, 10);
    updateTime(num, currentM);
  };

  const handleMinuteChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      updateTime(currentH, 0);
      return;
    }
    const num = parseInt(clean, 10);
    updateTime(currentH, num);
  };

  return (
    <View style={styles.timeInputCol}>
      <Text style={styles.sectionLabel}>{label}</Text>

      <View style={styles.timeInputCard}>
        {/* Hour Input Block */}
        <View style={styles.timeUnitBlock}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              updateTime(currentH + 1 > 23 ? 0 : currentH + 1, currentM);
            }}
            style={styles.stepBtn}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
          >
            <ChevronUp size={16} color={colors.forest[800]} />
          </TouchableOpacity>

          <TextInput
            style={styles.timeDigitInput}
            value={hStr}
            onChangeText={handleHourChange}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
          />

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              updateTime(currentH - 1 < 0 ? 23 : currentH - 1, currentM);
            }}
            style={styles.stepBtn}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
          >
            <ChevronDown size={16} color={colors.forest[800]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.timeColon}>:</Text>

        {/* Minute Input Block */}
        <View style={styles.timeUnitBlock}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              updateTime(currentH, (currentM + 15) % 60);
            }}
            style={styles.stepBtn}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
          >
            <ChevronUp size={16} color={colors.forest[800]} />
          </TouchableOpacity>

          <TextInput
            style={styles.timeDigitInput}
            value={mStr}
            onChangeText={handleMinuteChange}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
          />

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              updateTime(currentH, (currentM - 15 + 60) % 60);
            }}
            style={styles.stepBtn}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
          >
            <ChevronDown size={16} color={colors.forest[800]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function MobileConfirmTimeModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
  hasSameDayCheckout = false,
}: MobileConfirmTimeModalProps) {
  const [selectedCheckin, setSelectedCheckin] = useState<string>('14:00');
  const [selectedCheckout, setSelectedCheckout] = useState<string>('12:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = loading || isSubmitting;

  const handleRequestClose = () => {
    if (busy) return;
    setErrorMessage(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (busy) return;

    // Validation horaire UNIQUEMENT s'il y a une rotation/check-out le même jour
    if (hasSameDayCheckout) {
      const parseMin = (t: string) => {
        const [h, m] = (t || '00:00').split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      if (parseMin(selectedCheckin) <= parseMin(selectedCheckout)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        setErrorMessage(
          "⚠️ Rotation le même jour : L'heure d'arrivée (check-in) doit être postérieure à l'heure de départ (check-out, ex: 14:00 après 12:00) pour permettre le nettoyage entre les deux séjours."
        );
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onConfirm(selectedCheckin, selectedCheckout);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue.';
      setErrorMessage(
        msg.includes('déjà réservé') || msg.includes('indisponible') || msg.includes('Conflict')
          ? '⚠️ Conflit de dates : Le logement est déjà réservé ou bloqué sur ces dates.'
          : msg
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            disabled={busy}
            onPress={handleRequestClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            accessibilityState={{ disabled: busy }}
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header badge & title */}
            <View style={styles.headerSection}>
              <View style={styles.clockBadge}>
                <Clock size={22} color={colors.forest[700]} />
              </View>

              <Text style={styles.modalTitle}>Confirmer les horaires</Text>
              <Text style={styles.modalSubtitle}>
                Définissez les heures de Check-in (Arrivée) et Check-out (Départ) validées.
              </Text>
            </View>

            {/* 2 colonnes de Saisie Directe HH:MM */}
            <View style={styles.gridTwoCols}>
              <DirectTimeInputField
                label="Check-in (Arrivée)"
                value={selectedCheckin}
                onChange={setSelectedCheckin}
              />

              <DirectTimeInputField
                label="Check-out (Départ)"
                value={selectedCheckout}
                onChange={setSelectedCheckout}
              />
            </View>

            {/* Note d'information */}
            <View style={styles.infoNoticeCard}>
              <AlertCircle size={18} color={colors.forest[700]} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.infoNoticeTitle}>Notification du voyageur</Text>
                <Text style={styles.infoNoticeDesc}>
                  Le locataire recevra une notification avec ses horaires d'arrivée et de départ validés.
                </Text>
              </View>
            </View>

            {errorMessage && (
              <View style={styles.errorNoticeCard}>
                <AlertCircle size={16} color="#DC2626" style={{ marginTop: 1 }} />
                <Text style={styles.errorNoticeText}>{errorMessage}</Text>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSubmit}
                disabled={busy}
                style={[styles.confirmBtn, busy && styles.disabledBtn]}
                accessibilityRole="button"
                accessibilityLabel="Valider et accepter la réservation"
                accessibilityState={{ disabled: busy, busy }}
              >
                {busy ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <CheckCircle2 size={18} color={colors.forest[950]} strokeWidth={2.5} />
                    <Text style={styles.confirmBtnText}>Valider et confirmer le séjour</Text>
                  </>
                )}
              </TouchableOpacity>

              {!busy && (
                <TouchableOpacity onPress={handleRequestClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 22,
    gap: 16,
  },
  headerSection: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    marginTop: 6,
  },
  clockBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F7FEE7',
    borderWidth: 1,
    borderColor: '#D9F99D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },

  gridTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  timeInputCol: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
  },
  timeInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.inner,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  timeUnitBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  timeDigitInput: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
    width: 38,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 0,
  },
  timeColon: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[800],
    marginHorizontal: 4,
  },

  infoNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F7FEE7',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  infoNoticeTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#3F6212',
  },
  infoNoticeDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },

  errorNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorNoticeText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 16,
  },

  actionsGroup: {
    gap: 10,
    marginTop: 4,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  confirmBtnText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  disabledBtn: {
    opacity: 0.6,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#64748B',
  },
});