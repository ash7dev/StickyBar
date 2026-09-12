import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Camera, CheckCircle2, ChevronRight, Images } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { PhotoEtatLieu } from '../../../types/reservation-detail.types';
import { MobileCheckinGalleryModal } from '../../detail/MobileCheckinGalleryModal';

interface MobileOwnerEtatLieuxPreviewCardProps {
  photos: PhotoEtatLieu[];
}

export function MobileOwnerEtatLieuxPreviewCard({ photos }: MobileOwnerEtatLieuxPreviewCardProps) {
  const [showGallery, setShowGallery] = useState(false);

  if (!photos || photos.length === 0) return null;

  const count = photos.length;
  const previewPhotos = photos.slice(0, 4);
  const remainingCount = count > 4 ? count - 3 : 0;
  const displayedPhotos = remainingCount > 0 ? previewPhotos.slice(0, 3) : previewPhotos;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowGallery(true);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleOpen}
        style={styles.cardContainer}
      >
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Camera size={18} color={colors.lime[400]} />
          </View>

          <View style={styles.headerTextContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>Photos État des Lieux ({count})</Text>
              <CheckCircle2 size={13} color={colors.lime[400]} />
            </View>
            <Text style={styles.subtitleText}>Photos certifiées & horodatées sur les serveurs Klef</Text>
          </View>

          <View style={styles.viewBadge}>
            <Text style={styles.viewBadgeText}>Voir</Text>
            <ChevronRight size={12} color={colors.lime[300]} />
          </View>
        </View>

        <View style={styles.thumbnailsRow}>
          {displayedPhotos.map((photo, index) => (
            <View key={photo.id || index} style={styles.thumbnailContainer}>
              <Image source={{ uri: photo.url }} style={styles.thumbnailImage} />
              {photo.categorie ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {photo.categorie.replace(/_/g, ' ')}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}

          {remainingCount > 0 && (
            <View style={styles.moreThumbnailContainer}>
              <Image source={{ uri: previewPhotos[3]?.url }} style={styles.thumbnailImage} />
              <View style={styles.moreOverlay}>
                <Images size={15} color={colors.lime[400]} />
                <Text style={styles.moreText}>+{remainingCount}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Galerie grand écran */}
      <MobileCheckinGalleryModal
        visible={showGallery}
        photos={photos}
        onClose={() => setShowGallery(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  subtitleText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
  },
  viewBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailContainer: {
    flex: 1,
    height: 72,
    borderRadius: radius.inner,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 8,
    color: colors.lime[300],
    textAlign: 'center',
  },
  moreThumbnailContainer: {
    flex: 1,
    height: 72,
    borderRadius: radius.inner,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(4, 25, 18, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  moreText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.lime[300],
  },
});
