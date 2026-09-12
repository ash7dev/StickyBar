import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { X, UserX, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileSignalNoshowModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmNoshow: (comment?: string) => Promise<void>;
  loading?: boolean;
}

export function MobileSignalNoshowModal({
  visible,
  onClose,
  onConfirmNoshow,
  loading = false,
}: MobileSignalNoshowModalProps) {
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setComment('');
    }
  }, [visible]);

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await onConfirmNoshow(comment.trim() || undefined);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                <View style={styles.dragHandle} />

                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <UserX size={20} color={colors.error[600]} />
                    </View>
                    <View style={styles.headerTextGroup}>
                      <Text style={styles.title}>Signaler un No-Show</Text>
                      <Text style={styles.subtitle}>Le locataire ne s'est pas présenté</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Bannière d'avertissement */}
                  <View style={styles.alertBanner}>
                    <AlertTriangle size={18} color={colors.error[600]} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.alertBannerTitle}>Signalement d'absence officielle</Text>
                      <Text style={styles.alertBannerText}>
                        À effectuer uniquement si le locataire est injoignable ou ne s'est pas présenté au moins 2h après l'heure d'arrivée prévue.
                      </Text>
                    </View>
                  </View>

                  {/* Champ Commentaire */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputHeader}>
                      <Text style={styles.inputLabel}>Commentaire ou précision</Text>
                      <Text style={styles.inputOptional}>(optionnel)</Text>
                    </View>
                    <TextInput
                      style={styles.textInput}
                      value={comment}
                      onChangeText={setComment}
                      maxLength={500}
                      multiline
                      numberOfLines={3}
                      placeholder="Ex: Tentative d'appel effectuée à 14h30 et 15h15 sans réponse, porte du logement close..."
                      placeholderTextColor="#94A3B8"
                      textAlignVertical="top"
                    />
                    <Text style={styles.charCounter}>{comment.length} / 500</Text>
                  </View>

                  {/* Encadré d'information sur les étapes suivantes */}
                  <View style={styles.infoBox}>
                    <ShieldAlert size={16} color={colors.forest[700]} style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                      <Text style={styles.infoBold}>Procédure Klef : </Text>
                      Le locataire sera notifié en urgence. S'il ne valide pas sa présence sous 3h, le séjour sera annulé et la politique de compensation d'absence sera appliquée.
                    </Text>
                  </View>
                </ScrollView>

                {/* Footer avec Boutons */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    activeOpacity={0.88}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <UserX size={18} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Confirmer le signalement</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onClose}
                    disabled={loading}
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    ...shadows.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingVertical: 16,
    gap: 14,
  },

  alertBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  alertBannerTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#991B1B',
  },
  alertBannerText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: '#991B1B',
    lineHeight: 16,
  },

  inputGroup: {
    gap: 6,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inputLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: '#334155',
  },
  inputOptional: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#94A3B8',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
  },
  charCounter: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },
  infoBold: {
    fontFamily: typography.fontBodySemiBold,
    color: '#0F172A',
  },

  footer: {
    paddingTop: 10,
    gap: 8,
  },
  submitButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: '#64748B',
  },
});

