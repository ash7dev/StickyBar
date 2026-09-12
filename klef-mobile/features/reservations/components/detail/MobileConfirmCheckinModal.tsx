import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CheckCircle2, ShieldCheck, X, Camera, AlertTriangle, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { PhotoEtatLieu } from '../../types/reservation-detail.types';

interface MobileConfirmCheckinModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
  photos?: PhotoEtatLieu[];
  onOpenGallery?: () => void;
}

export function MobileConfirmCheckinModal({
  visible,
  onClose,
  onConfirm,
  loading,
  photos = [],
  onOpenGallery,
}: MobileConfirmCheckinModalProps) {
  if (!visible) return null;

  const photoCount = photos.length;
  const previewPhotos = photos.slice(0, 3);

  const handleConfirmPress = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={!loading ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            disabled={loading}
            onPress={onClose}
            style={styles.closeBtn}
          >
            <X size={18} color={colors.forest[300]} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header badge & title */}
            <View style={styles.headerSection}>
              <View style={styles.sparkleBadge}>
                <Sparkles size={22} color={colors.lime[400]} />
              </View>

              <Text style={styles.modalTitle}>Valider votre arrivée ?</Text>
              <Text style={styles.modalSubtitle}>
                Confirmation de votre entrée dans les lieux et déblocage du paiement.
              </Text>
            </View>

            {/* Photos Preview Card if state of play is done */}
            {photoCount > 0 ? (
              <View style={styles.photosBlock}>
                <View style={styles.photosBlockHeader}>
                  <Camera size={14} color={colors.lime[400]} />
                  <Text style={styles.photosBlockTitle}>
                    {photoCount} photo{photoCount > 1 ? 's' : ''} d'état des lieux d'entrée
                  </Text>
                </View>

                <View style={styles.thumbnailsRow}>
                  {previewPhotos.map((photo, i) => (
                    <View key={photo.id || i} style={styles.thumbWrap}>
                      <ExpoImage
                        source={{ uri: photo.url }}
                        style={styles.thumbImage}
                        contentFit="cover"
                      />
                    </View>
                  ))}
                  {photoCount > 3 && (
                    <View style={styles.thumbMore}>
                      <Text style={styles.thumbMoreText}>+{photoCount - 3}</Text>
                    </View>
                  )}
                </View>

                {onOpenGallery && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenGallery();
                    }}
                    style={styles.inspectGalleryBtn}
                  >
                    <Text style={styles.inspectGalleryText}>
                      Vérifier les photos avant validation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noPhotosNotice}>
                <AlertTriangle size={16} color={colors.warning[500]} />
                <Text style={styles.noPhotosNoticeText}>
                  Aucune photo d'état des lieux téléversée. Assurez-vous d'avoir bien inspecté l'appartement avec l'hôte.
                </Text>
              </View>
            )}

            {/* Notice de séquestre */}
            <View style={styles.escrowNoticeCard}>
              <ShieldCheck size={18} color={colors.lime[400]} style={{ marginTop: 1 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.escrowNoticeTitle}>Déblocage du séquestre Klef</Text>
                <Text style={styles.escrowNoticeDesc}>
                  En confirmant, vous attestez que le logement est conforme. Les fonds seront transférés sur le portefeuille de l'hôte.
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionsGroup}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleConfirmPress}
                disabled={loading}
                style={styles.confirmBtn}
              >
                {loading ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <CheckCircle2 size={18} color={colors.forest[950]} strokeWidth={2.5} />
                    <Text style={styles.confirmBtnText}>Oui, confirmer mon entrée 🎉</Text>
                  </>
                )}
              </TouchableOpacity>

              {!loading && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelBtn}
                >
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
    backgroundColor: 'rgba(4, 25, 18, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
  sparkleBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.neutral[0],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[300],
    textAlign: 'center',
    lineHeight: 17,
  },

  photosBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photosBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photosBlockTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[0],
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbWrap: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbMore: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: 'rgba(4, 25, 18, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.3)',
  },
  thumbMoreText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.lime[300],
  },
  inspectGalleryBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  inspectGalleryText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.lime[400],
    textDecorationLine: 'underline',
  },

  noPhotosNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  noPhotosNoticeText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.warning[500],
    flex: 1,
    lineHeight: 16,
  },

  escrowNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.2)',
  },
  escrowNoticeTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.lime[300],
  },
  escrowNoticeDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[200],
    lineHeight: 15,
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
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.forest[300],
  },
});
