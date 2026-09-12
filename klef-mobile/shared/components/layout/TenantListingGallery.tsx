import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {
  ChevronLeft,
  Heart,
  Share2,
  ImageOff,
  Grid2x2,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { router } from 'expo-router';

export interface ListingPhoto {
  id?: string;
  url: string;
  estPrincipale?: boolean;
}

interface TenantListingGalleryProps {
  photos: ListingPhoto[];
  titre: string;
  onBack?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TenantListingGallery({
  photos = [],
  titre,
  onBack,
}: TenantListingGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  const normalizedPhotos: string[] = React.useMemo(() => {
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const extracted = photos
        .map((p: any) => {
          if (typeof p === 'string') return p;
          return p?.url || p?.uri || p?.path || '';
        })
        .filter((url) => typeof url === 'string' && url.trim().length > 0);

      if (extracted.length > 0) {
        return extracted;
      }
    }
    // Backup d'images haute résolution pour démo / logements sans photos
    return [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop',
    ];
  }, [photos]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/(tenant)/explorer' as any);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: titre,
        message: `Découvrez "${titre}" sur Klef Sénégal !`,
      });
    } catch {
      // Ignorer l'annulation
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Carousel PagerView Swipeable ─────────────────────────────── */}
      {normalizedPhotos.length > 0 ? (
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          onPageSelected={(e) => setActiveIdx(e.nativeEvent.position)}
        >
          {normalizedPhotos.map((photoUrl, index) => (
            <View key={`${photoUrl}-${index}`} style={styles.pageWrapper}>
              <Image
                source={{ uri: photoUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          ))}
        </PagerView>
      ) : (
        <View style={styles.noImagePlaceholder}>
          <ImageOff size={36} color={colors.neutral[400]} />
          <Text style={styles.noImageText}>Aucune photo disponible</Text>
        </View>
      )}

      {/* ── Overlay Top Controls (Bouton Retour + Boutons Actions) ──── */}
      <View style={styles.topControlsRow} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleBack}
          style={styles.glassButton}
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={20} color={colors.neutral[0]} />
        </TouchableOpacity>

        <View style={styles.rightActionsRow} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShare}
            style={styles.glassButton}
            accessibilityLabel="Partager"
          >
            <Share2 size={18} color={colors.neutral[0]} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setIsFavorite(!isFavorite)}
            style={styles.glassButton}
            accessibilityLabel="Mettre en favori"
          >
            <Heart
              size={18}
              color={isFavorite ? colors.error[500] : colors.neutral[0]}
              fill={isFavorite ? colors.error[500] : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Overlay Bottom Controls (Compteur + Dots) ────────────────── */}
      {normalizedPhotos.length > 1 && (
        <View style={styles.bottomControlsRow} pointerEvents="none">
          {/* Dots indicateurs au centre */}
          <View style={styles.dotsWrapper}>
            {normalizedPhotos.slice(0, 5).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIdx ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>

          {/* Badge Compteur 1 / N à droite */}
          <View style={styles.counterBadge}>
            <Grid2x2 size={12} color={colors.neutral[0]} />
            <Text style={styles.counterText}>
              {activeIdx + 1} / {normalizedPhotos.length}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 310,
    width: SCREEN_WIDTH,
    backgroundColor: colors.forest[950],
  },
  pager: {
    height: 310,
    width: SCREEN_WIDTH,
  },
  pageWrapper: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    gap: 8,
  },
  noImageText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[500],
  },
  topControlsRow: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  bottomControlsRow: {
    position: 'absolute',
    bottom: 34, // Laisse la place au Sheet Overlap (-24px)
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(4, 25, 18, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  activeDot: {
    width: 14,
    backgroundColor: colors.neutral[0],
  },
  inactiveDot: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  counterText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[0],
  },
});
