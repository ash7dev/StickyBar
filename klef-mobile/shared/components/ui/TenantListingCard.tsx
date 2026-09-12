import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import {
  Star,
  Zap,
  ShieldCheck,
  Heart,
  Video,
  ImageOff,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { TenantPriceDisplay } from './TenantPriceDisplay';
import { router } from 'expo-router';

export interface ListingPhoto {
  url: string;
  estPrincipale?: boolean;
}

export interface ListingItem {
  id: string;
  titre: string;
  type: string;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  prixBase: number;
  note?: number | null;
  totalSejours?: number;
  capaciteMax?: number;
  nombreChambres?: number | null;
  nombreSallesBain?: number | null;
  nuitesMinimum?: number | null;
  isInstantBooking?: boolean;
  verifie?: boolean;
  sponsorise?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
  photos?: ListingPhoto[];
}

interface TenantListingCardProps {
  listing: ListingItem;
  width?: number;
  onPress?: () => void;
}

export function TenantListingCard({
  listing,
  width = 290,
  onPress,
}: TenantListingCardProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const pagerRef = useRef<PagerView>(null);

  const normalizedPhotos: string[] = React.useMemo(() => {
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      return listing.photos
        .map((p: any) => {
          if (typeof p === 'string') return p;
          return p?.url || p?.uri || p?.path || '';
        })
        .filter((url) => typeof url === 'string' && url.trim().length > 0);
    }
    return [];
  }, [listing.photos]);

  const locationText = listing.quartier
    ? `${listing.quartier}, ${listing.ville}`
    : listing.ville;
  const categoryText = listing.sousType || listing.type;

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/listing/${listing.id}` as any);
    }
  };

  const scrollToPhoto = (index: number) => {
    pagerRef.current?.setPage(index);
    setActivePhotoIdx(index);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handleCardPress}
      style={[styles.cardContainer, { width }]}
    >
      {/* ── Zone Image (Pager natif — swipe fluide comme sur Airbnb) ──── */}
      <View style={styles.imageWrapper}>
        {normalizedPhotos.length > 0 ? (
          <PagerView
            ref={pagerRef}
            style={[styles.imageScroll, { width }]}
            initialPage={0}
            onPageSelected={(e) => setActivePhotoIdx(e.nativeEvent.position)}
          >
            {normalizedPhotos.map((photoUrl, index) => (
              <TouchableOpacity
                key={`${photoUrl}-${index}`}
                activeOpacity={0.92}
                onPress={handleCardPress}
                style={styles.pageWrapper}
              >
                <Image
                  source={{ uri: photoUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </PagerView>
        ) : (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={handleCardPress}
            style={styles.noImagePlaceholder}
          >
            <ImageOff size={28} color={colors.neutral[400]} />
          </TouchableOpacity>
        )}

        {/* Badges sur l'image (Design System Klef Premium) */}
        <View style={styles.topBadgesLeft} pointerEvents="none">
          {listing.isInstantBooking && (
            <View style={styles.instantBadge}>
              <Zap size={11} color={colors.forest[950]} fill={colors.forest[950]} />
              <Text style={styles.instantText}>Instantané</Text>
            </View>
          )}
          {listing.verifie && (
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={11} color={colors.neutral[0]} />
              <Text style={styles.verifiedText}>Vérifié</Text>
            </View>
          )}
          {listing.videoUrl && (
            <View style={styles.videoBadge}>
              <Video size={11} color={colors.lime[300]} />
              <Text style={styles.videoText}>360°</Text>
            </View>
          )}
        </View>

        {/* Bouton Favori */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsFavorite(!isFavorite)}
          style={styles.favoriteButton}
        >
          <Heart
            size={18}
            color={isFavorite ? colors.error[500] : colors.neutral[0]}
            fill={isFavorite ? colors.error[500] : 'rgba(0,0,0,0.3)'}
          />
        </TouchableOpacity>

        {/* Indicateur de pagination (points cliquables) */}
        {normalizedPhotos.length > 1 && (
          <View style={styles.dotsContainer}>
            {normalizedPhotos.slice(0, 5).map((_, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={(e) => {
                  e.stopPropagation();
                  scrollToPhoto(i);
                }}
                style={[
                  styles.dot,
                  i === activePhotoIdx ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Infos Logement ────────────────────────────────────────────── */}
      <View style={styles.contentContainer}>
        {/* Titre & Note */}
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.titleText}>
            {listing.titre}
          </Text>

          {typeof listing.note === 'number' && listing.note > 0 && (
            <View style={styles.ratingBox}>
              <Star size={13} color={colors.gold[400]} fill={colors.gold[400]} />
              <Text style={styles.ratingText}>{listing.note.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Localisation & Catégorie */}
        <Text numberOfLines={1} style={styles.subtext}>
          {locationText}
          {categoryText ? ` · ${categoryText}` : ''}
        </Text>

        {/* Spécifications (Voyageurs, Chambres, Nuits min) */}
        <Text numberOfLines={1} style={styles.specsText}>
          {[
            listing.capaciteMax ? `${listing.capaciteMax} voy. max` : null,
            listing.nombreChambres ? `${listing.nombreChambres} ch.` : null,
            listing.nombreSallesBain ? `${listing.nombreSallesBain} sdb` : null,
            listing.nuitesMinimum && listing.nuitesMinimum > 1
              ? `Min. ${listing.nuitesMinimum} nuits`
              : '1 nuit min.',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        {/* Composant Partagé d'Affichage du Prix (Klef Design System) */}
        <View style={styles.priceRowContainer}>
          <TenantPriceDisplay
            prixBase={listing.prixBase}
            derniereMinuteActive={listing.derniereMinuteActive}
            size="sm"
          />
          {listing.sponsorise && !listing.derniereMinuteActive && (
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Mis en avant</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    backgroundColor: colors.neutral[100],
  },
  imageScroll: {
    height: 180,
  },
  pageWrapper: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBadgesLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    gap: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    right: 50,
  },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  instantText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  verifiedText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    color: colors.neutral[0],
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 42, 32, 0.92)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.35)',
    ...shadows.xs,
  },
  videoText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.lime[300],
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 14,
    backgroundColor: colors.neutral[0],
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  contentContainer: {
    padding: 12,
    gap: 4,
    minHeight: 128,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  titleText: {
    flex: 1,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.md,
    color: colors.forest[950],
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[900],
  },
  subtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  specsText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  priceRowContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sponsoredBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  sponsoredText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[600],
  },
});