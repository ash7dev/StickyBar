import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { Heart, ImageOff, Play, Star, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { colors, typography } from '../../theme/tokens';
import { useFavorite } from '../../../features/favorites/useFavorites';
import { formatAmount } from '../../../features/owner-home/lib/format';
import { getPrixDerniereMinute, getPrixPublic } from './TenantPriceDisplay';
import { prefetchListing } from '../../lib/prefetch-listing';
import { useSearchHistoryStore } from '../../stores/search-history.store';

const INK = colors.forest[950];
const LIME = colors.lime[400];
const MAX_PHOTOS = 5;
const NEW_DAYS = 30;

const TYPE_LABEL: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  MAISON: 'Maison',
  CHAMBRE: 'Chambre',
  DUPLEX: 'Duplex',
};

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
  totalAvis?: number;
  totalSejours?: number;
  /** Hôte (recherche) : « Chez Moussa » sur les cartes */
  proprietaire?: { id?: string; prenom?: string | null; avatarUrl?: string | null } | null;
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
  /** Total exact du séjour quand la recherche a des dates (API search). */
  prixSejour?: number | null;
  nbNuits?: number | null;
  /** Date d'ajout sur Paixi (section « Nouveautés »). */
  creeLe?: string | null;
}

interface TenantListingCardProps {
  listing: ListingItem;
  width?: number;
  onPress?: () => void;
}

/**
 * Carte « affiche » des rangées de l'accueil : la photo plein cadre, les photos en barres,
 * et un panneau sombre qui porte le lieu, le titre, le prix et la note.
 */
export function TenantListingCard({ listing, width = 270, onPress }: TenantListingCardProps) {
  const [index, setIndex] = useState(0);
  const [isFavorite, toggleFavorite] = useFavorite(listing.id);
  const pager = useRef<PagerView>(null);
  const heart = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(1)).current;
  const height = Math.round(width * 1.34);

  const photos = useMemo(
    () =>
      (listing.photos ?? [])
        .map((p: any) => (typeof p === 'string' ? p : p?.url || p?.uri || ''))
        .filter((u: string) => u.trim().length > 0)
        .slice(0, MAX_PHOTOS),
    [listing.photos],
  );

  const base = getPrixPublic(listing.prixBase);
  const promo = !!listing.derniereMinuteActive;
  const nightly = promo ? getPrixDerniereMinute(base) : base;
  const reviews = listing.totalAvis ?? 0;
  const rating = reviews > 0 && typeof listing.note === 'number' && listing.note > 0 ? listing.note : null;
  const isNew = !reviews && !!listing.creeLe && Date.now() - new Date(listing.creeLe).getTime() < NEW_DAYS * 86_400_000;
  const kind = TYPE_LABEL[(listing.type ?? '').toUpperCase()] ?? listing.type;
  const place = listing.quartier || listing.ville || 'Sénégal';

  const open = () => {
    useSearchHistoryStore.getState().addRecentListing(listing);
    if (onPress) onPress();
    else router.push(`/listing/${listing.id}` as any);
  };
  const pressTo = (v: number) => Animated.spring(press, { toValue: v, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  // Le toucher prépare la fiche : elle s'ouvre déjà remplie
  const pressIn = () => {
    pressTo(0.975);
    prefetchListing(listing);
  };
  const onHeart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.spring(heart, { toValue: 1.3, speed: 50, bounciness: 14, useNativeDriver: true }),
      Animated.spring(heart, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }),
    ]).start();
    toggleFavorite();
  };

  return (
    <Animated.View style={[styles.card, { width, height, transform: [{ scale: press }] }]}>
      {photos.length > 0 ? (
        <PagerView ref={pager} style={StyleSheet.absoluteFill} initialPage={0} onPageSelected={(e) => setIndex(e.nativeEvent.position)}>
          {photos.map((url, i) => (
            <Pressable key={`${url}-${i}`} onPress={open} onPressIn={pressIn} onPressOut={() => pressTo(1)} style={styles.page}>
              <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={`home-${listing.id}-${i}`} />
            </Pressable>
          ))}
        </PagerView>
      ) : (
        <Pressable onPress={open} style={[StyleSheet.absoluteFill, styles.noPhoto]}>
          <ImageOff size={26} color={colors.forest[300]} />
        </Pressable>
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4,25,18,0.45)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.55)']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {photos.length > 1 && (
        <View style={styles.stories} pointerEvents="box-none">
          {photos.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                pager.current?.setPage(i);
                setIndex(i);
              }}
              hitSlop={{ top: 10, bottom: 10 }}
              style={[styles.story, i <= index && styles.storyOn]}
              accessibilityLabel={`Photo ${i + 1} sur ${photos.length}`}
            />
          ))}
        </View>
      )}

      <View style={styles.top} pointerEvents="box-none">
        <View style={styles.chips} pointerEvents="none">
          {promo ? (
            <View style={[styles.chip, { backgroundColor: LIME }]}>
              <Zap size={10} color={INK} fill={INK} />
              <Text style={[styles.chipText, { color: INK }]}>−15 %</Text>
            </View>
          ) : null}
          {listing.videoUrl ? (
            <View style={styles.chip}>
              <View style={styles.play}>
                <Play size={7} color={INK} fill={INK} />
              </View>
              <Text style={styles.chipText}>Vidéo</Text>
            </View>
          ) : isNew ? (
            <View style={[styles.chip, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.chipText, { color: INK }]}>Nouveau</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={onHeart} style={styles.heart} hitSlop={8} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Garder ce logement'}>
          <Animated.View style={{ transform: [{ scale: heart }] }}>
            <Heart size={17} color={isFavorite ? '#FF5A5F' : '#FFFFFF'} fill={isFavorite ? '#FF5A5F' : 'transparent'} strokeWidth={2.2} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Panneau d'informations, inséré dans l'affiche */}
      <Pressable onPress={open} onPressIn={pressIn} onPressOut={() => pressTo(1)} style={styles.panel}>
        <Text style={styles.kicker} numberOfLines={1}>
          {place.toUpperCase()}
          {kind ? `  ·  ${kind.toUpperCase()}` : ''}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {listing.titre}
        </Text>
        <View style={styles.divider} />
        <View style={styles.foot}>
          <View style={styles.flex}>
            {listing.prixSejour && listing.nbNuits ? (
              <Text style={styles.price} numberOfLines={1}>
                {formatAmount(listing.prixSejour)} <Text style={styles.priceUnit}>FCFA · {listing.nbNuits} nuit{listing.nbNuits > 1 ? 's' : ''}</Text>
              </Text>
            ) : (
              <Text style={styles.price} numberOfLines={1}>
                {promo && <Text style={styles.priceOld}>{formatAmount(base)} </Text>}
                {formatAmount(nightly)} <Text style={styles.priceUnit}>FCFA / nuit</Text>
              </Text>
            )}
          </View>
          {rating ? (
            <View style={styles.rating}>
              <Star size={11} color={LIME} fill={LIME} />
              <Text style={styles.ratingText}>{rating.toFixed(1).replace('.', ',')}</Text>
              <Text style={styles.ratingCount}>({reviews})</Text>
            </View>
          ) : isNew ? (
            <Text style={styles.newText}>Nouveau</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.forest[900],
    shadowColor: INK,
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  page: { flex: 1 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  stories: { position: 'absolute', top: 10, left: 14, right: 14, flexDirection: 'row', gap: 4 },
  story: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  storyOn: { backgroundColor: '#FFFFFF' },
  top: { position: 'absolute', top: 22, left: 12, right: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 9, borderRadius: 13, backgroundColor: 'rgba(4,25,18,0.55)' },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },
  play: { width: 14, height: 14, borderRadius: 7, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  heart: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(4,25,18,0.45)', alignItems: 'center', justifyContent: 'center' },
  panel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    padding: 14,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: 'rgba(4,25,18,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(211,242,110,0.16)',
  },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: LIME },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, lineHeight: 22, letterSpacing: -0.3, color: '#FFFFFF', marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(248,251,244,0.12)', marginVertical: 10 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: '#FFFFFF' },
  priceOld: { fontFamily: typography.fontBodySemiBold, fontSize: 11.5, color: colors.forest[300], textDecorationLine: 'line-through' },
  priceUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 10.5, color: colors.forest[200] },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: '#FFFFFF' },
  ratingCount: { fontFamily: typography.fontBody, fontSize: 11.5, color: colors.forest[200] },
  newText: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: LIME },
});
