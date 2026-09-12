import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ShieldAlert, AlertTriangle, Send, Gavel, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileOpenDisputeModalProps {
  visible: boolean;
  initialMotif?: string;
  onClose: () => void;
  onSubmitDispute: (motif: string, description: string) => Promise<void>;
  loading?: boolean;
}

const MOTIFS = [
  {
    id: 'DEGRADATION',
    label: 'Dégâts matériels / Casse',
    sub: 'Mobilier endommagé, équipements cassés, taches...',
  },
  {
    id: 'NUISANCES',
    label: 'Nuisances / Fête non autorisée',
    sub: 'Tapage nocturne, fête non déclarée, voisins gênés...',
  },
  {
    id: 'DEPASSEMENT_CAPACITE',
    label: 'Dépassement du nombre de voyageurs',
    sub: 'Capacité maximale d’accueil non respectée...',
  },
  {
    id: 'AUTRE',
    label: 'Autre problème ou manquement',
    sub: 'Non-respect du règlement, clé non restituée...',
  },
];

export function MobileOpenDisputeModal({
  visible,
  initialMotif = 'DEGRADATION',
  onClose,
  onSubmitDispute,
  loading = false,
}: MobileOpenDisputeModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedMotif, setSelectedMotif] = useState<string>(initialMotif);
  const [description, setDescription] = useState<string>('');

  React.useEffect(() => {
    if (visible) {
      setSelectedMotif(initialMotif || 'DEGRADATION');
    }
  }, [visible, initialMotif]);

  const isValid = description.trim().length >= 15;

  const handleSubmit = async () => {
    if (!isValid || loading) {
      Alert.alert('Description requise', 'Veuillez décrire le problème avec au moins 15 caractères.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await onSubmitDispute(selectedMotif, description.trim());
    setDescription('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[
                styles.sheetContainer,
                { paddingBottom: Math.max(insets.bottom + 12, 24) },
              ]}
            >
              <View style={styles.dragHandle} />

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconBadge}>
                    <Gavel size={22} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Ouvrir un litige</Text>
                    <Text style={styles.subtitle}>Arbitrage et gestion des litiges par Klef</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={18} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              {/* Body ScrollView */}
              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Choix du motif */}
                <Text style={styles.sectionLabel}>Motif principal du litige *</Text>
                <View style={styles.motifList}>
                  {MOTIFS.map((motif) => {
                    const isSelected = selectedMotif === motif.id;
                    return (
                      <TouchableOpacity
                        key={motif.id}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedMotif(motif.id);
                        }}
                        style={[styles.motifItem, isSelected && styles.motifItemSelected]}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.motifText, isSelected && styles.motifTextSelected]}>
                            {motif.label}
                          </Text>
                          <Text style={styles.motifSubText}>{motif.sub}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Champ description */}
                <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
                  Explication détaillée des faits *
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Décrivez précisément les faits constatés, l'heure et l'estimation des dégradations..."
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
                <View style={styles.counterRow}>
                  {isValid ? (
                    <View style={styles.validTag}>
                      <CheckCircle2 size={12} color="#15803D" />
                      <Text style={styles.validTagText}>Description valide</Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text style={[styles.charCounter, isValid && { color: '#15803D' }]}>
                    {description.trim().length} / 15 car. min.
                  </Text>
                </View>

                {/* Avertissement */}
                <View style={styles.warningBanner}>
                  <AlertTriangle size={18} color="#D97706" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.warningTitle}>Conséquences du litige</Text>
                    <Text style={styles.warningText}>
                      L'ouverture d'un dossier bloque la caution du locataire et gèle le virement. Un agent juridique Klef traitera la réclamation sous 48h.
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Footer Submit Button Sticky */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading || !isValid}
                  style={[
                    styles.submitButton,
                    (loading || !isValid) && styles.disabledButton,
                  ]}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Transmettre le dossier à Klef</Text>
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
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 12,
    paddingHorizontal: 20,
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  scrollBody: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[800],
    marginBottom: 10,
  },
  motifList: {
    gap: 8,
  },
  motifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 12,
  },
  motifItemSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[300],
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
  motifText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[800],
  },
  motifTextSelected: {
    color: '#991B1B',
  },
  motifSubText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  textArea: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    color: colors.neutral[900],
    fontFamily: typography.fontBody,
    fontSize: 13,
    minHeight: 95,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  validTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#15803D',
  },
  charCounter: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
  },
  warningBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 14,
  },
  warningTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#B45309',
  },
  warningText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
