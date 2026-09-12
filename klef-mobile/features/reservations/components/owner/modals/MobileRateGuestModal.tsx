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
} from 'react-native';
import { X, Star, Send, UserCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileRateGuestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitRating: (note: number, commentaire: string) => Promise<void>;
  locataireNom?: string;
  loading?: boolean;
}

export function MobileRateGuestModal({
  visible,
  onClose,
  onSubmitRating,
  locataireNom = 'le locataire',
  loading = false,
}: MobileRateGuestModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [commentaire, setCommentaire] = useState<string>('');

  const handleSelectStar = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRating(val);
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Évaluation requise', 'Veuillez attribuer une note entre 1 et 5 étoiles.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await onSubmitRating(rating, commentaire.trim());
    setCommentaire('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.dragHandle} />

              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.iconBadge}>
                    <UserCheck size={22} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.title}>Évaluer {locataireNom}</Text>
                    <Text style={styles.subtitle}>Donnez votre avis sur l'expérience du séjour</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color={colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {/* 5 Etoiles tactiles */}
                <Text style={styles.sectionLabel}>Note globale</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= rating;
                    return (
                      <TouchableOpacity
                        key={`star-${star}`}
                        onPress={() => handleSelectStar(star)}
                        style={styles.starTouch}
                        activeOpacity={0.7}
                      >
                        <Star
                          size={36}
                          color={isFilled ? '#F59E0B' : colors.neutral[300]}
                          fill={isFilled ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Commentaire optionnel */}
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Commentaire public ou privé</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Propreté, respect des règles de la maison, communication..."
                  placeholderTextColor={colors.neutral[400]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={commentaire}
                  onChangeText={setCommentaire}
                />
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  style={[styles.submitButton, loading && styles.disabledButton]}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Publier l'évaluation</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
    maxHeight: '80%',
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
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
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[800],
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  starTouch: {
    padding: 6,
  },
  textArea: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    color: colors.neutral[900],
    fontFamily: typography.fontBody,
    fontSize: 13,
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    backgroundColor: '#0F172A',
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
    color: '#FFFFFF',
  },
});
