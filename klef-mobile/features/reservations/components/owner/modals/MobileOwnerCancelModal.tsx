import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, CalendarX, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileOwnerCancelModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmCancel: (reason: string) => Promise<void>;
  dateDebut: string;
  netProprietaire?: number;
  loading?: boolean;
}

const PREDEFINED_REASONS = [
  'Sinistre ou problème technique imprévu dans le logement',
  'Erreur de disponibilité / Calendrier non mis à jour',
  'Incapacité à accueillir le locataire à la date prévue',
  'Autre raison majeure',
];

export function MobileOwnerCancelModal({
  visible,
  onClose,
  onConfirmCancel,
  dateDebut,
  netProprietaire = 0,
  loading = false,
}: MobileOwnerCancelModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  const isCustom = selectedReason === 'Autre raison majeure';
  const finalReason = isCustom ? customReason.trim() : selectedReason;
  const isValid = !isCustom || customReason.trim().length >= 15;

  // Calcul du délai avant le check-in et de la pénalité hôte
  const { hoursLeft, penaltyAmount, penaltyTier } = useMemo(() => {
    if (!dateDebut) return { hoursLeft: 0, penaltyAmount: 30000, penaltyTier: 'CRITICAL' };
    const checkin = new Date(dateDebut).getTime();
    if (Number.isNaN(checkin)) return { hoursLeft: 0, penaltyAmount: 30000, penaltyTier: 'CRITICAL' };
    const h = (checkin - Date.now()) / 3600000;

    if (h > 168) {
      // > 7 jours
      return { hoursLeft: h, penaltyAmount: 0, penaltyTier: 'LOW' };
    } else if (h >= 48) {
      // 48h à 7 jours
      return { hoursLeft: h, penaltyAmount: 15000, penaltyTier: 'MEDIUM' };
    } else {
      // < 48h
      return { hoursLeft: h, penaltyAmount: 30000, penaltyTier: 'CRITICAL' };
    }
  }, [dateDebut]);

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await onConfirmCancel(finalReason);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.sheetContainer}
            >
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconBadge}>
                    <AlertTriangle size={20} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={styles.title}>Annuler le séjour (Hôte)</Text>
                    <Text style={styles.subtitle}>Conséquences et pénalités d'annulation</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color={colors.neutral[400]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {/* Banner 100% Remboursement Locataire */}
                <View style={styles.refundBanner}>
                  <CheckCircle2 size={16} color="#15803D" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.refundTitle}>Remboursement intégral du locataire</Text>
                    <Text style={styles.refundSub}>
                      Le locataire sera remboursé à 100 % des sommes versées conformément aux garanties hôtes Klef.
                    </Text>
                  </View>
                </View>

                {/* Estimation des frais/pénalités Hôte */}
                <View style={styles.penaltyCard}>
                  <Text style={styles.penaltyHeader}>IMPACT ET PÉNALITÉS HÔTE</Text>
                  
                  <View style={styles.penaltyRow}>
                    <Text style={styles.penaltyAmountText}>
                      {penaltyAmount === 0 ? '0 FCFA' : `-${penaltyAmount.toLocaleString('fr-FR')} FCFA`}
                    </Text>
                    <View
                      style={[
                        styles.tierTag,
                        penaltyTier === 'LOW' && styles.tierLow,
                        penaltyTier === 'MEDIUM' && styles.tierMedium,
                        penaltyTier === 'CRITICAL' && styles.tierCritical,
                      ]}
                    >
                      <Text style={styles.tierTagText}>
                        {penaltyTier === 'LOW'
                          ? '> 7 jours'
                          : penaltyTier === 'MEDIUM'
                          ? '3 à 7 jours'
                          : '< 48 heures'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.penaltyDescription}>
                    {penaltyTier === 'LOW'
                      ? 'Annulation anticipée (> 7j). Aucun frais financier prélevé, mais les annulations répétées diminuent la visibilité de votre annonce.'
                      : penaltyTier === 'MEDIUM'
                      ? 'Annulation modérée (3-7j). Des frais de gestion d\'annulation hôte de 15 000 FCFA seront déduits de votre prochain virement.'
                      : 'Annulation tardive (< 48h). Une pénalité forfaitaire de 30 000 FCFA sera retenue et les dates resteront bloquées.'}
                  </Text>
                </View>

                {/* Saisie du motif */}
                <Text style={styles.sectionLabel}>Motif de l'annulation hôte *</Text>
                <View style={styles.reasonsList}>
                  {PREDEFINED_REASONS.map((r) => {
                    const isSelected = selectedReason === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedReason(r);
                        }}
                        style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                      >
                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                          {r}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {isCustom && (
                  <View style={{ marginTop: 10 }}>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Expliquez précisément la raison (15 caractères min.)..."
                      placeholderTextColor={colors.neutral[400]}
                      multiline
                      numberOfLines={3}
                      value={customReason}
                      onChangeText={setCustomReason}
                    />
                    <Text style={styles.charCount}>
                      {customReason.trim().length} / 15 caractères min.
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer CTA */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading || !isValid}
                  style={[styles.submitButton, (loading || !isValid) && styles.disabledButton]}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <CalendarX size={18} color="#FFF" />
                      <Text style={styles.submitButtonText}>Confirmer l'annulation du séjour</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
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
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.inner,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  title: {
    fontFamily: typography.fontBodyBold,
    fontSize: 16,
    color: colors.neutral[900],
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    marginBottom: 16,
  },
  refundBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  refundTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#15803D',
  },
  refundSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
    marginTop: 2,
  },
  penaltyCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 18,
    gap: 6,
  },
  penaltyHeader: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },
  penaltyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  penaltyAmountText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: '#DC2626',
  },
  tierTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tierLow: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  tierMedium: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  tierCritical: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  tierTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[800],
  },
  penaltyDescription: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    lineHeight: 16,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[800],
    marginBottom: 10,
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 10,
  },
  reasonItemSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#EF4444',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  reasonText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[700],
    flex: 1,
  },
  reasonTextSelected: {
    fontFamily: typography.fontBodyBold,
    color: '#991B1B',
  },
  textArea: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    color: colors.neutral[900],
    fontFamily: typography.fontBody,
    fontSize: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  charCount: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  submitButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#FFF',
  },
});
