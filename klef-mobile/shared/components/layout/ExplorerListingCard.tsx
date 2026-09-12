import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import PagerView from 'react-native-pager-view';
import {
  Star,
  Heart,
  ShieldCheck,
  Zap,
  Video,
  ImageOff,
  MapPin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { ListingItem } from '../ui/TenantListingCard';
import { TenantPriceDisplay } from '../ui/TenantPriceDisplay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_ASPECT = 4 / 3; // Taller than 16/10 — more immersive
const CARD_HORIZONTAL_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_PADDING * 2;
const IMAGE_HEIGHT = IMAGE_WIDTH / PHOTO_ASPECT;
const MAX_PHOTOS = 5;

interface ExplorerListingCardProps {
  listing: ListingItem;
  onPress: () => void;
}

export function ExplorerListingCard({ listing, onPress }: ExplorerListingCardProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;
  const pagerRef = useRef<PagerView>(null);

  // ── Fade-in + slide-up entrance animation ──────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Normalize photos ──────────────────────────────────────────────────
  const photos: string[] = React.useMemo(() => {
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      return listing.photos
        .slice(0, MAX_PHOTOS)
        .map((p: any) => {
          if (typeof p === 'string') return p;
          return p?.url || p?.uri || p?.path || '';
        })
        .filter((url: string) => url.trim().length > 0);
    }
    return [];
  }, [listing.photos]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleFavoritePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Micro-animation : spring bounce sur le cœur
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.35,
        speed: 50,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        speed: 20,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
    setIsFavorite((prev) => !prev);
  }, []);

  const scrollToPhoto = useCallback((idx: number) => {
    pagerRef.current?.setPage(idx);
    setActivePhotoIdx(idx);
  }, []);

  // ── Derived display data ──────────────────────────────────────────────
  const locationLine = [listing.ville, listing.type].filter(Boolean).join(' · ');
  const specsLine = [
    listing.capaciteMax ? `${listing.capaciteMax} voy.` : null,
    listing.nombreChambres ? `${listing.nombreChambres} ch.` : null,
    listing.nombreSallesBain ? `${listing.nombreSallesBain} sdb` : null,
    listing.nuitesMinimum && listing.nuitesMinimum > 1
      ? `Min. ${listing.nuitesMinimum} nuits`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const hasRating = typeof listing.note === 'number' && listing.note > 0;
  const displayRating = hasRating ? Number(listing.note).toFixed(1) : null;

  return (
    <Animated.View style={[styles.cardOuter, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* ── PHOTO ZONE — Borderless full-width rounded ──────────────── */}
      <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.imageContainer}>
        {photos.length > 0 ? (
          <PagerView
            ref={pagerRef}
            style={styles.pager}
            initialPage={0}
            onPageSelected={(e) => setActivePhotoIdx(e.nativeEvent.position)}
          >
            {photos.map((url, i) => (
              <View key={`${url}-${i}`} style={styles.pageWrapper}>
                <ExpoImage
                  source={{ uri: url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={180}
                  recyclingKey={`explorer-${listing.id}-${i}`}
                />
              </View>
            ))}
          </PagerView>
        ) : (
          <View style={styles.noImagePlaceholder}>
            <ImageOff size={32} color={colors.neutral[400]} />
          </View>
        )}

        {/* ── Badges top-left ──────────────────────────────────────── */}
        <View style={styles.badgesTopLeft} pointerEvents="none">
          {listing.derniereMinuteActive && (
            <View style={styles.lastMinBadge}>
              <Zap size={10} color={colors.forest[950]} fill={colors.forest[950]} />
              <Text style={styles.lastMinText}>Dernière Min.</Text>
            </View>
          )}
          {listing.verifie && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={10} color={colors.gold[300]} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
          {listing.videoUrl && (
            <View style={styles.videoBadge}>
              <Video size={10} color={colors.lime[300]} />
              <Text style={styles.videoText}>360°</Text>
            </View>
          )}
        </View>

        {/* ── Bouton Favori (cœur animé) ──────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation?.();
            handleFavoritePress();
          }}
          style={styles.favoriteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={18}
              color={isFavorite ? colors.error[500] : colors.neutral[0]}
              fill={isFavorite ? colors.error[500] : 'rgba(0,0,0,0.25)'}
            />
          </Animated.View>
        </TouchableOpacity>

        {/* ── Pagination Dots — Animated elongated style ──────────── */}
        {photos.length > 1 && (
          <View style={styles.dotsContainer}>
            {photos.map((_, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => scrollToPhoto(i)}
                style={[
                  styles.dot,
                  i === activePhotoIdx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </TouchableOpacity>

      {/* ── INFO ZONE — Airbnb-style flush layout ─────────────────── */}
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.infoContainer}>
        {/* Ligne 1 : Localisation + Note */}
        <View style={styles.locationRatingRow}>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.forest[600]} strokeWidth={2.5} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLine || 'Sénégal'}
            </Text>
          </View>

          {displayRating && (
            <View style={styles.ratingPill}>
              <Star size={11} color={colors.gold[400]} fill={colors.gold[400]} />
              <Text style={styles.ratingText}>{displayRating}</Text>
              {listing.totalSejours && listing.totalSejours > 0 ? (
                <Text style={styles.ratingCount}>({listing.totalSejours})</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Ligne 2 : Titre (headline) */}
        <Text style={styles.titleText} numberOfLines={2}>
          {listing.titre}
        </Text>

        {/* Ligne 3 : Specs inline */}
        {specsLine.length > 0 && (
          <Text style={styles.specsText} numberOfLines={1}>
            {specsLine}
          </Text>
        )}

        {/* Séparateur subtil */}
        <View style={styles.priceSeparator} />

        {/* Ligne 4 : Prix */}
        <View style={styles.priceRow}>
          <TenantPriceDisplay
            prixBase={listing.prixBase}
            derniereMinuteActive={listing.derniereMinuteActive}
            size="sm"
            reserveSpace={false}
          />
          {listing.isInstantBooking && (
            <View style={styles.instantChip}>
              <Zap size={9} color={colors.forest[950]} fill={colors.forest[950]} />
              <Text style={styles.instantChipText}>Instantané</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ── Outer wrapper — no border, no card bg, clean spacing ─────────
  cardOuter: {
    marginBottom: 24,
  },

  // ── Photo section ────────────────────────────────────────────────
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
    position: 'relative',
  },
  pager: {
    width: '100%',
    height: '100%',
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
  },

  // ── Badges ───────────────────────────────────────────────────────
  badgesTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    right: 52,
    flexWrap: 'wrap',
  },
  lastMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  lastMinText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  verifiedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[300],
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 42, 32, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.3)',
  },
  videoText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.lime[300],
  },

  // ── Favorite button ──────────────────────────────────────────────
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Dots (Elongated active dot — signature Klef) ─────────────────
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.neutral[0],
    // Subtle glow effect
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },

  // ── Info section — flush, no card background ─────────────────────
  infoContainer: {
    paddingTop: 12,
    paddingHorizontal: 2,
    gap: 3,
  },

  // Location + Rating row
  locationRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[700],
    flex: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[900],
  },
  ratingCount: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Title
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.md,
    color: colors.forest[950],
    lineHeight: 20,
    marginTop: 1,
  },

  // Specs inline
  specsText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 1,
  },

  // Price separator — subtle line like Airbnb between specs and price
  priceSeparator: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginTop: 8,
    marginBottom: 6,
    opacity: 0.7,
  },

  // Price row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.lime[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lime[200],
  },
  instantChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[800],
    letterSpacing: -0.1,
  },
});
