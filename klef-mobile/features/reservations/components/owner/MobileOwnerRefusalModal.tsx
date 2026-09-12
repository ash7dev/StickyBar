import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';

const PREDEFINED_REASONS = [
  'Dates non disponibles (déjà réservé ailleurs)',
  'Logement en maintenance / travaux',
  'Nombre de voyageurs supérieur à la capacité',
  'Autre raison personnelle',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  guestName?: string;
}

export function MobileOwnerRefusalModal({
  visible,
  onClose,
  onConfirm,
  guestName = 'ce voyageur',
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const isCustom = selectedReason === 'Autre raison personnelle';
  const finalReason = isCustom ? customReason.trim() : selectedReason;

  const handleSubmit = async () => {
    if (!finalReason) return;
    try {
      setSubmitting(true);
      await onConfirm(finalReason);
      setSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.sheetWrapper}
          >
            <View style={styles.sheetCard}>
              {/* Top Bar */}
              <View style={styles.header}>
                <View style={styles.warningIconBadge}>
                  <AlertTriangle size={20} color="#DC2626" />
                </View>
                <Text style={styles.title}>Refuser la réservation ?</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  disabled={submitting}
                >
                  <X size={20} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>
                Veuillez indiquer le motif du refus pour <Text style={styles.boldText}>{guestName}</Text>. 
                Cette action annulera la demande.
              </Text>

              {/* Predefined reason selector */}
              <View style={styles.reasonsList}>
                {PREDEFINED_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setSelectedReason(reason)}
                      activeOpacity={0.7}
                      style={[
                        styles.reasonOption,
                        isSelected ? styles.reasonOptionSelected : styles.reasonOptionNormal,
                      ]}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text
                        style={[
                          styles.reasonText,
                          isSelected && styles.reasonTextSelected,
                        ]}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom input if selected */}
              {isCustom && (
                <TextInput
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Précisez la raison de l'annulation..."
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  numberOfLines={3}
                  style={styles.customInput}
                />
              )}

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={submitting}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitting || !finalReason}
                  style={[
                    styles.confirmBtn,
                    (!finalReason || submitting) && styles.disabledBtn,
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.neutral[0]} size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color={colors.neutral[0]} />
                      <Text style={styles.confirmBtnText}>Confirmer le refus</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheetCard: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warningIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 12,
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  closeBtn: {
    padding: 6,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: colors.neutral[900],
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  reasonOptionNormal: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  reasonOptionSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#DC2626',
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.neutral[700],
    flex: 1,
  },
  reasonTextSelected: {
    fontWeight: '700',
    color: '#991B1B',
  },
  customInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
  },
  cancelBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.neutral[0],
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
