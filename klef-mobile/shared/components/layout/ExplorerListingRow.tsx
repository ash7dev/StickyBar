import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Star, Heart, ShieldCheck, Users, BedDouble, Moon, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';
import { ListingItem } from '../ui/TenantListingCard';
import { TenantPriceDisplay } from '../ui/TenantPriceDisplay';

interface ExplorerListingRowProps {
  listing: ListingItem;
  onPress: () => void;
}

export function ExplorerListingRow({ listing, onPress }: ExplorerListingRowProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const photos = Array.isArray(listing.photos) && listing.photos.length > 0
    ? listing.photos.map((p) => (typeof p === 'string' ? p : p.url))
    : typeof listing.photos === 'string'
    ? [listing.photos]
    : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80'];

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsFavorite((prev) => !prev);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={styles.cardContainer}
    >
      {/* 1. Zone Photo (Hero Aspect 16/10) */}
      <View style={styles.imageContainer}>
        <ExpoImage
          source={{ uri: photos[0] }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* Badge Hôte / Logement Vérifié */}
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={12} color={colors.gold[300]} />
          <Text style={styles.verifiedText}>Vérifié</Text>
        </View>

        {/* Bouton Favoris (Cœur haptique) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleFavoritePress}
          style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]}
        >
          <Heart
            size={14}
            color={isFavorite ? colors.error[500] : colors.forest[900]}
            fill={isFavorite ? colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>

        {/* Badge Promo Dernier Minute */}
        {listing.derniereMinuteActive && (
          <View style={styles.promoBadge}>
            <Text style={styles.promoText}>⚡ Dernier Min.</Text>
          </View>
        )}
      </View>

      {/* 2. Contenu d'informations épuré */}
      <View style={styles.infoContainer}>
        {/* Ligne 1 : Titre + Rating Star */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {listing.titre}
          </Text>

          <View style={styles.ratingRow}>
            <Star size={12} color={colors.gold[500]} fill={colors.gold[500]} />
            <Text style={styles.ratingText}>
              {listing.note ? Number(listing.note).toFixed(1) : '4.8'}
            </Text>
          </View>
        </View>

        {/* Ligne 2 : Localisation */}
        <Text style={styles.locationText} numberOfLines={1}>
          {listing.ville}
          {listing.quartier ? ` • ${listing.quartier}` : ''}
          {listing.type ? ` • ${listing.type}` : ''}
        </Text>

        {/* Ligne 3 : Puces d'équipements clé */}
        <View style={styles.chipsRow}>
          <View style={styles.chipPill}>
            <Users size={11} color={colors.neutral[600]} />
            <Text style={styles.chipText}>{listing.capaciteMax || 1} max</Text>
          </View>

          {Boolean(listing.nombreChambres && listing.nombreChambres > 0) && (
            <View style={styles.chipPill}>
              <BedDouble size={11} color={colors.neutral[600]} />
              <Text style={styles.chipText}>{listing.nombreChambres} ch.</Text>
            </View>
          )}

          <View style={styles.chipPill}>
            <Moon size={11} color={colors.neutral[600]} />
            <Text style={styles.chipText}>
              {listing.nuitesMinimum && listing.nuitesMinimum > 1
                ? `${listing.nuitesMinimum} nuits min.`
                : '1 nuit min.'}
            </Text>
          </View>

          <View style={styles.chipPill}>
            <Wallet size={11} color={colors.neutral[600]} />
            <Text style={styles.chipText}>Acompte {(listing as any).acomptePourcentage || 30}%</Text>
          </View>
        </View>

        {/* Ligne 4 : Tarification bas de carte via TenantPriceDisplay */}
        <View style={styles.priceRow}>
          <TenantPriceDisplay
            prixBase={listing.prixBase}
            derniereMinuteActive={listing.derniereMinuteActive}
            size="sm"
            reserveSpace={false}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 14,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: colors.neutral[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  verifiedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[300],
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteBtnActive: {
    backgroundColor: colors.neutral[0],
  },
  promoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: colors.lime[400],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  promoText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.forest[950],
  },
  infoContainer: {
    padding: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleText: {
    flex: 1,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.md,
    color: colors.forest[950],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  locationText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  chipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[700],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  priceAmount: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  perNight: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },
});
