import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { Bath, BedDouble, Heart, ImageOff, Play, Star, Users, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';
import { useFavorite } from '../../../features/favorites/useFavorites';
import { formatAmount } from '../../../features/owner-home/lib/format';
import { ListingItem } from '../ui/TenantListingCard';
import { getPrixDerniereMinute, getPrixPublic } from '../ui/TenantPriceDisplay';
import { prefetchListing } from '../../lib/prefetch-listing';
import { useSearchHistoryStore } from '../../stores/search-history.store';

const INK = colors.forest[950];
const LIME = colors.lime[400];
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const PHOTO_HEIGHT = Math.round(CARD_WIDTH * 1.08);
const MAX_PHOTOS = 6;
const NEW_DAYS = 30;

const TYPE_LABEL: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  MAISON: 'Maison',
  CHAMBRE: 'Chambre',
  DUPLEX: 'Duplex',
};

interface ExplorerListingCardProps {
  listing: ListingItem;
  onPress: () => void;
  /** Masquer « Chez … » (inutile sur le profil de l'hôte lui-même) */
  hideHost?: boolean;
}

/**
 * Carte d'annonce d'Explorer : la photo en grand format, les photos en barres « stories »,
 * le prix posé sur un ticket sombre, l'hôte, et seulement des informations vraies.
 */
export function ExplorerListingCard({ listing, onPress, hideHost = false }: ExplorerListingCardProps) {
  const [index, setIndex] = useState(0);
  const [isFavorite, toggleFavorite] = useFavorite(listing.id);
  const pager = useRef<PagerView>(null);
  const heart = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [enter]);

  const photos = useMemo(
    () =>
      (listing.photos ?? [])
        .map((p: any) => (typeof p === 'string' ? p : p?.url || p?.uri || ''))
        .filter((u: string) => u.trim().length > 0)
        .slice(0, MAX_PHOTOS),
    [listing.photos],
  );

  // ── Prix public (commission incluse), dernière minute appliquée ──
  const base = getPrixPublic(listing.prixBase);
  const promo = !!listing.derniereMinuteActive;
  const nightly = promo ? getPrixDerniereMinute(base) : base;
  const stay = listing.prixSejour && listing.nbNuits ? { total: listing.prixSejour, nights: listing.nbNuits } : null;

  const reviews = listing.totalAvis ?? 0;
  const rating = reviews > 0 && typeof listing.note === 'number' && listing.note > 0 ? listing.note : null;
  const isNew = !reviews && !!listing.creeLe && Date.now() - new Date(listing.creeLe).getTime() < NEW_DAYS * 86_400_000;
  const place = [listing.quartier, listing.ville].filter(Boolean).join(' · ') || 'Sénégal';
  const kind = TYPE_LABEL[(listing.type ?? '').toUpperCase()] ?? listing.type;
  const host = hideHost ? null : listing.proprietaire;

  const open = useCallback(() => {
    useSearchHistoryStore.getState().addRecentListing(listing);
    onPress();
  }, [listing, onPress]);

  const onHeart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.spring(heart, { toValue: 1.32, speed: 50, bounciness: 14, useNativeDriver: true }),
      Animated.spring(heart, { toValue: 1, speed: 20, bounciness: 8, useNativeDriver: true }),
    ]).start();
    toggleFavorite();
  }, [heart, toggleFavorite]);

  const pressTo = (v: number) => Animated.spring(press, { toValue: v, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  // Le toucher prépare la fiche : elle s'ouvre déjà remplie
  const pressIn = () => {
    pressTo(0.985);
    prefetchListing(listing);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: press }],
        },
      ]}
    >
      {/* ── Photo ─────────────────────────────────────────────── */}
      <View style={styles.photo}>
        {photos.length > 0 ? (
          <PagerView ref={pager} style={StyleSheet.absoluteFill} initialPage={0} onPageSelected={(e) => setIndex(e.nativeEvent.position)}>
            {photos.map((url, i) => (
              <Pressable key={`${url}-${i}`} onPress={open} onPressIn={pressIn} onPressOut={() => pressTo(1)} style={styles.page}>
                <ExpoImage source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} recyclingKey={`ex-${listing.id}-${i}`} />
              </Pressable>
            ))}
          </PagerView>
        ) : (
          <Pressable onPress={open} style={[StyleSheet.absoluteFill, styles.noPhoto]}>
            <ImageOff size={30} color={colors.forest[300]} />
          </Pressable>
        )}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(4,25,18,0.45)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.88)']}
          locations={[0, 0.22, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Barres « stories » : combien de photos, laquelle on regarde */}
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

        {/* Haut : signaux qui comptent + favori */}
        <View style={styles.top} pointerEvents="box-none">
          <View style={styles.topChips} pointerEvents="none">
            {listing.videoUrl ? (
              <View style={styles.glassChip}>
                <View style={styles.playDot}>
                  <Play size={8} color={INK} fill={INK} />
                </View>
                <Text style={styles.glassChipText}>Visite vidéo</Text>
              </View>
            ) : null}
            {isNew && (
              <View style={[styles.glassChip, { backgroundColor: LIME }]}>
                <Text style={[styles.glassChipText, { color: INK }]}>Nouveau</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onHeart} style={styles.heart} hitSlop={8} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Garder ce logement'}>
            <Animated.View style={{ transform: [{ scale: heart }] }}>
              <Heart size={19} color={isFavorite ? '#FF5A5F' : '#FFFFFF'} fill={isFavorite ? '#FF5A5F' : 'transparent'} strokeWidth={2.2} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Bas : où, quoi */}
        <View style={styles.bottom} pointerEvents="none">
          <Text style={styles.kicker} numberOfLines={1}>
            {place.toUpperCase()}
            {kind ? `  ·  ${kind.toUpperCase()}` : ''}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {listing.titre}
          </Text>
        </View>

        {/* Ticket de prix, posé sur le bord de la photo */}
        <View style={styles.ticket} pointerEvents="none">
          {promo && (
            <View style={styles.promo}>
              <Zap size={9} color={INK} fill={INK} />
              <Text style={styles.promoText}>−15 %</Text>
            </View>
          )}
          {stay ? (
            <>
              <Text style={styles.ticketAmount}>
                {formatAmount(stay.total)} <Text style={styles.ticketCur}>FCFA</Text>
              </Text>
              <Text style={styles.ticketSub}>
                {stay.nights} nuit{stay.nights > 1 ? 's' : ''} · tout compris
              </Text>
            </>
          ) : (
            <>
              {promo && <Text style={styles.ticketOld}>{formatAmount(base)}</Text>}
              <Text style={styles.ticketAmount}>
                {formatAmount(nightly)} <Text style={styles.ticketCur}>FCFA</Text>
              </Text>
              <Text style={styles.ticketSub}>par nuit</Text>
            </>
          )}
        </View>
      </View>

      {/* ── Sous la photo : l'hôte, l'avis, l'essentiel ─────────── */}
      <Pressable onPress={open} onPressIn={pressIn} onPressOut={() => pressTo(1)} style={styles.info}>
        <View style={styles.infoTop}>
          {host?.prenom ? (
            <View style={styles.host}>
              {host.avatarUrl ? (
                <ExpoImage source={{ uri: host.avatarUrl }} style={styles.hostAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.hostAvatar, styles.hostAvatarEmpty]}>
                  <Text style={styles.hostInitial}>{host.prenom.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.hostText} numberOfLines={1}>
                Chez <Text style={styles.hostName}>{host.prenom.charAt(0).toUpperCase() + host.prenom.slice(1).toLowerCase()}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.flex} />
          )}
          {rating ? (
            <View style={styles.rating}>
              <Star size={13} color={colors.gold[500]} fill={colors.gold[400]} />
              <Text style={styles.ratingValue}>{rating.toFixed(1).replace('.', ',')}</Text>
              <Text style={styles.ratingCount}>
                · {reviews} avis
              </Text>
            </View>
          ) : (
            <Text style={styles.noReviews}>{isNew ? 'Nouveau sur Paixi' : 'Pas encore d’avis'}</Text>
          )}
        </View>

        <View style={styles.specs}>
          {!!listing.capaciteMax && (
            <View style={styles.spec}>
              <Users size={14} color={colors.forest[700]} />
              <Text style={styles.specText}>{listing.capaciteMax} voyageurs</Text>
            </View>
          )}
          {!!listing.nombreChambres && (
            <View style={styles.spec}>
              <BedDouble size={14} color={colors.forest[700]} />
              <Text style={styles.specText}>
                {listing.nombreChambres} ch.
              </Text>
            </View>
          )}
          {!!listing.nombreSallesBain && (
            <View style={styles.spec}>
              <Bath size={14} color={colors.forest[700]} />
              <Text style={styles.specText}>{listing.nombreSallesBain} sdb</Text>
            </View>
          )}
          {listing.isInstantBooking && (
            <View style={styles.instant}>
              <Zap size={10} color={INK} fill={INK} />
              <Text style={styles.instantText}>Instantané</Text>
            </View>
          )}
        </View>
        {listing.nuitesMinimum && listing.nuitesMinimum > 1 ? (
          <Text style={styles.minNights}>À partir de {listing.nuitesMinimum} nuits</Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginBottom: 28 },

  photo: {
    height: PHOTO_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.forest[900],
    shadowColor: INK,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  page: { flex: 1 },
  noPhoto: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest[900] },

  stories: { position: 'absolute', top: 12, left: 16, right: 16, flexDirection: 'row', gap: 4 },
  story: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  storyOn: { backgroundColor: '#FFFFFF' },

  top: { position: 'absolute', top: 26, left: 14, right: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  topChips: { flexDirection: 'row', gap: 6 },
  glassChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(4,25,18,0.55)' },
  glassChipText: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: '#FFFFFF' },
  playDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  heart: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(4,25,18,0.45)', alignItems: 'center', justifyContent: 'center' },

  bottom: { position: 'absolute', left: 18, right: 150, bottom: 18 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: LIME },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 23, lineHeight: 27, letterSpacing: -0.5, color: '#FFFFFF', marginTop: 4 },

  ticket: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: INK,
    borderWidth: 1,
    borderColor: 'rgba(211,242,110,0.25)',
    alignItems: 'flex-end',
  },
  promo: { position: 'absolute', top: -11, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: LIME },
  promoText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, color: INK },
  ticketOld: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.forest[300], textDecorationLine: 'line-through' },
  ticketAmount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, letterSpacing: -0.4, color: '#FFFFFF' },
  ticketCur: { fontFamily: typography.fontBodyBold, fontSize: 10, color: LIME },
  ticketSub: { fontFamily: typography.fontBodySemiBold, fontSize: 10.5, color: colors.forest[200], marginTop: 1 },

  info: { paddingHorizontal: 6, paddingTop: 14, gap: 10 },
  infoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  host: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hostAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: LIME },
  hostAvatarEmpty: { backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  hostInitial: { fontFamily: typography.fontBodyBold, fontSize: 11, color: LIME },
  hostText: { flexShrink: 1, fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  hostName: { fontFamily: typography.fontBodyBold, color: INK },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValue: { fontFamily: typography.fontBodyBold, fontSize: 13.5, color: INK },
  ratingCount: { fontFamily: typography.fontBody, fontSize: 12.5, color: colors.neutral[500] },
  noReviews: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[600] },
  specs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 6 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specText: { fontFamily: typography.fontBodyMedium, fontSize: 12.5, color: colors.neutral[700] },
  instant: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: colors.lime[100] },
  instantText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK },
  minNights: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[500] },
});
