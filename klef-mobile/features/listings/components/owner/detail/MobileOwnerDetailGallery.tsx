import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { Camera, ImageOff, X, Grid2x2, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

export interface PhotoItemData {
  id?: string;
  url?: string;
  uri?: string;
  estPrincipale?: boolean;
  categorie?: string;
}

export interface MobileOwnerDetailGalleryProps {
  photos?: PhotoItemData[] | string[];
  titre?: string;
}

const CAT_LABELS: Record<string, string> = {
  SALON: 'Salon',
  CHAMBRE: 'Chambre',
  CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain',
  TERRASSE: 'Terrasse & Balcon',
  VUE: 'Vue & Environs',
  ENTREE: 'Entrée',
  PISCINE: 'Piscine & Jardin',
  AUTRE: 'Autre espace',
};

export function MobileOwnerDetailGallery({ photos = [], titre }: MobileOwnerDetailGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const heroPagerRef = useRef<PagerView>(null);
  const lightboxPagerRef = useRef<PagerView>(null);

  const normalizedPhotos = React.useMemo(() => {
    if (!photos || !Array.isArray(photos)) return [];
    return photos
      .map((p, idx) => {
        if (typeof p === 'string') {
          return {
            id: `photo-${idx}`,
            url: p,
            estPrincipale: idx === 0,
            categorie: 'AUTRE',
          };
        }
        return {
          id: p.id || `photo-${idx}`,
          url: p.url || p.uri || '',
          estPrincipale: Boolean(p.estPrincipale),
          categorie: p.categorie || 'AUTRE',
        };
      })
      .filter((p) => typeof p.url === 'string' && p.url.trim().length > 0);
  }, [photos]);

  if (normalizedPhotos.length === 0) {
    return (
      <View style={styles.emptyGalleryContainer}>
        <View style={styles.emptyIconCircle}>
          <ImageOff size={28} color={colors.neutral[500]} />
        </View>
        <Text style={styles.emptyTitle}>Aucune photo disponible</Text>
        <Text style={styles.emptySubtext}>
          Ajoutez au moins 5 photos haute définition pour optimiser l'attractivité de votre annonce.
        </Text>
      </View>
    );
  }

  const openLightbox = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLightboxIdx(index);
    setLightboxOpen(true);
  };

  const handleSelectThumbnail = (index: number) => {
    Haptics.selectionAsync().catch(() => {});
    setLightboxIdx(index);
    lightboxPagerRef.current?.setPage(index);
  };

  const currentPhoto = normalizedPhotos[activeIdx] || normalizedPhotos[0];
  const lightboxPhoto = normalizedPhotos[lightboxIdx] || normalizedPhotos[0];

  return (
    <View style={styles.heroContainer}>
      {/* ── Main Hero PagerView ────────────────────────────────────────── */}
      <PagerView
        ref={heroPagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveIdx(e.nativeEvent.position)}
      >
        {normalizedPhotos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id}
            activeOpacity={0.95}
            onPress={() => openLightbox(index)}
            style={styles.slideTouchable}
          >
            <Image source={{ uri: photo.url }} style={styles.heroImage} resizeMode="cover" />

            {/* Subtle Gradient Backdrop Shadow */}
            <View style={styles.bottomShadowOverlay} />
          </TouchableOpacity>
        ))}
      </PagerView>

      {/* ── Overlay Badges & Controls ──────────────────────────────────── */}
      <View style={styles.overlayTopRow} pointerEvents="box-none">
        {currentPhoto?.estPrincipale && (
          <View style={styles.mainBadge}>
            <Star size={11} color={colors.forest[950]} fill={colors.lime[400]} />
            <Text style={styles.mainBadgeText}>Photo Principale</Text>
          </View>
        )}
      </View>

      {/* ── Overlay Bottom Bar: Dots + Counter + View All Pill ─────────── */}
      <View style={styles.overlayBottomRow} pointerEvents="box-none">
        {/* Pagination Dots */}
        {normalizedPhotos.length > 1 && (
          <View style={styles.dotsCapsule}>
            {normalizedPhotos.slice(0, 5).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIdx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* View All Photos Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openLightbox(activeIdx)}
          style={styles.viewAllBtn}
        >
          <Grid2x2 size={13} color={colors.neutral[0]} />
          <Text style={styles.viewAllBtnText}>
            {activeIdx + 1} / {normalizedPhotos.length}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── FULLSCREEN LIGHTBOX MODAL ───────────────────────────────────── */}
      <Modal
        visible={lightboxOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setLightboxOpen(false)}
      >
        <SafeAreaView style={styles.lightboxContainer}>
          {/* Lightbox Header Bar */}
          <View style={styles.lightboxHeader}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLightboxOpen(false)}
              style={styles.lightboxCloseBtn}
            >
              <X size={20} color={colors.neutral[0]} />
            </TouchableOpacity>

            <View style={styles.lightboxCenterStack}>
              <Text style={styles.lightboxTitle} numberOfLines={1}>
                {titre || 'Photos de l’annonce'}
              </Text>
              {lightboxPhoto?.categorie && CAT_LABELS[lightboxPhoto.categorie] ? (
                <View style={styles.catChip}>
                  <Text style={styles.catChipText}>
                    {CAT_LABELS[lightboxPhoto.categorie].toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.lightboxCounterBadge}>
              <Text style={styles.lightboxCounterText}>
                {lightboxIdx + 1} / {normalizedPhotos.length}
              </Text>
            </View>
          </View>

          {/* Lightbox PagerView Body */}
          <View style={styles.lightboxBody}>
            <PagerView
              ref={lightboxPagerRef}
              style={styles.lightboxPager}
              initialPage={lightboxIdx}
              onPageSelected={(e) => setLightboxIdx(e.nativeEvent.position)}
            >
              {normalizedPhotos.map((photo, index) => (
                <View key={`lb-${photo.id}`} style={styles.lightboxPage}>
                  <Image
                    source={{ uri: photo.url }}
                    style={styles.lightboxFullImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </PagerView>
          </View>

          {/* Lightbox Bottom Thumbnail Strip */}
          <View style={styles.lightboxFooter}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStripContent}
            >
              {normalizedPhotos.map((photo, idx) => {
                const isSelected = idx === lightboxIdx;
                return (
                  <TouchableOpacity
                    key={`thumb-${photo.id}`}
                    activeOpacity={0.8}
                    onPress={() => handleSelectThumbnail(idx)}
                    style={[
                      styles.thumbPill,
                      isSelected && styles.thumbPillActive,
                    ]}
                  >
                    <Image source={{ uri: photo.url }} style={styles.thumbImage} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    height: HERO_HEIGHT,
    backgroundColor: colors.forest[950],
    position: 'relative',
  },
  pager: {
    height: HERO_HEIGHT,
    width: SCREEN_WIDTH,
  },
  slideTouchable: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  bottomShadowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },

  // Empty State
  emptyGalleryContainer: {
    height: 200,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  emptySubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 17,
  },

  // Overlays
  overlayTopRow: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[400],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  mainBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  overlayBottomRow: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  dotsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.lime[400],
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    ...shadows.xs,
  },
  viewAllBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.neutral[0],
  },

  // ── Lightbox Fullscreen ──────────────────────────────────────────
  lightboxContainer: {
    flex: 1,
    backgroundColor: colors.forest[950],
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
  },
  lightboxCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCenterStack: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
    marginHorizontal: 12,
  },
  lightboxTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
    textAlign: 'center',
  },
  catChip: {
    backgroundColor: 'rgba(155, 194, 44, 0.20)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  catChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.lime[400],
    letterSpacing: 0.6,
  },
  lightboxCounterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  lightboxCounterText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.lime[400],
  },
  lightboxBody: {
    flex: 1,
  },
  lightboxPager: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  lightboxPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxFullImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    paddingVertical: 12,
    backgroundColor: 'rgba(4, 25, 18, 0.90)',
  },
  thumbnailStripContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thumbPill: {
    width: 56,
    height: 56,
    borderRadius: radius.inner,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  thumbPillActive: {
    borderColor: colors.lime[400],
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
});
