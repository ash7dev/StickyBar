import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Camera, CheckCircle2, ChevronRight, Images } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { PhotoEtatLieu } from '../../types/reservation-detail.types';

interface MobileEtatLieuxPreviewCardProps {
  photos: PhotoEtatLieu[];
  onOpenGallery: () => void;
}

export function MobileEtatLieuxPreviewCard({ photos, onOpenGallery }: MobileEtatLieuxPreviewCardProps) {
  if (!photos || photos.length === 0) return null;

  const count = photos.length;

  // Take up to 4 photos for preview
  const previewPhotos = photos.slice(0, 4);
  const remainingCount = count > 4 ? count - 3 : 0;
  const displayedPhotos = remainingCount > 0 ? previewPhotos.slice(0, 3) : previewPhotos;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenGallery();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      {/* Header section */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Camera size={16} color={colors.forest[700]} />
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText} numberOfLines={1}>État des lieux certifié</Text>
            <CheckCircle2 size={13} color={colors.forest[600]} />
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            {count} photo{count > 1 ? 's' : ''} horodatée{count > 1 ? 's' : ''} par l'hôte
          </Text>
        </View>

        <View style={styles.viewBadge}>
          <Text style={styles.viewBadgeText}>Voir ({count})</Text>
          <ChevronRight size={12} color={colors.forest[700]} strokeWidth={2.5} />
        </View>
      </View>

      {/* Thumbnails row */}
      <View style={styles.thumbnailsRow}>
        {displayedPhotos.map((photo, index) => (
          <View key={photo.id || index} style={styles.thumbnailContainer}>
            <ExpoImage
              source={{ uri: photo.url }}
              style={styles.thumbnailImage}
              contentFit="cover"
              transition={200}
            />
            {photo.categorie ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText} numberOfLines={1}>
                  {photo.categorie.replace('_', ' ')}
                </Text>
              </View>
            ) : null}
          </View>
        ))}

        {remainingCount > 0 && (
          <View style={styles.moreThumbnailContainer}>
            <ExpoImage
              source={{ uri: previewPhotos[3]?.url }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
            <View style={styles.moreOverlay}>
              <Images size={15} color={colors.neutral[0]} />
              <Text style={styles.moreText}>+{remainingCount}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  subtitleText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[500],
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.forest[50],
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
    flexShrink: 0,
  },
  viewBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.forest[800],
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
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 8,
    color: colors.neutral[0],
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  moreThumbnailContainer: {
    flex: 1,
    height: 72,
    borderRadius: radius.inner,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  moreOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  moreText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.lime[300],
  },
});
