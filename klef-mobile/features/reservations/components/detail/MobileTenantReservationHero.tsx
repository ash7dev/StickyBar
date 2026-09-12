import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Calendar, Moon, Users, ShieldCheck, MapPin, Sparkles, ArrowRight } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationDetail } from '../../types/reservation-detail.types';

function formatShortDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatFcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0));
}

interface MobileTenantReservationHeroProps {
  res: ReservationDetail;
}

export function MobileTenantReservationHero({ res }: MobileTenantReservationHeroProps) {
  const photoUrl = React.useMemo(() => {
    if (res.logement?.photos && res.logement.photos.length > 0) {
      const main = res.logement.photos.find((p) => p.estPrincipale) || res.logement.photos[0];
      return typeof main === 'string' ? main : main.url || '';
    }
    return '';
  }, [res.logement?.photos]);

  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.heroCard}>

      <View style={styles.heroContent}>
        {/* En-tête : Ville/Quartier & Titre */}
        <View style={styles.lieuRow}>
          <MapPin size={12} color={colors.forest[300]} />
          <Text style={styles.lieuText} numberOfLines={1}>
            {res.logement?.quartier ? `${res.logement.quartier.toUpperCase()}, ` : ''}
            {res.logement?.ville?.toUpperCase() || 'SÉNÉGAL'}
          </Text>
        </View>

        <Text style={styles.titleText} numberOfLines={2}>
          {res.logement?.titre || 'Hébergement Klef'}
        </Text>

        {/* Hero Image with cinematic overlay */}
        {photoUrl ? (
          <View style={styles.imageContainer}>
            <ExpoImage
              source={{ uri: photoUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />

            {/* Escrow badge with shimmer */}
            <Animated.View style={[styles.escrowBadgeOnImage, { opacity: shimmerAnim }]}>
              <ShieldCheck size={13} color={colors.lime[400]} />
              <Text style={styles.escrowBadgeText}>Séquestre Klef Actif</Text>
            </Animated.View>

            {/* Photo count if multiple */}
            {res.logement?.photos && res.logement.photos.length > 1 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>
                  1/{res.logement.photos.length}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Dates bar — glass style avec badge Nuits au centre */}
        <View style={styles.datesContainer}>
          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>ARRIVÉE</Text>
            <Text style={styles.dateColValue}>{formatShortDate(res.dateDebut)}</Text>
          </View>

          <View style={styles.nightsCenterBadge}>
            <Moon size={12} color={colors.lime[300]} />
            <Text style={styles.nightsCenterText}>
              {res.nbNuits} nuit{res.nbNuits > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>DÉPART</Text>
            <Text style={styles.dateColValue}>{formatShortDate(res.dateFin)}</Text>
          </View>
        </View>

        {/* Footer : Voyageurs + Total */}
        <View style={styles.footerRow}>
          <View style={styles.metaChip}>
            <Users size={12} color={colors.lime[300]} />
            <Text style={styles.chipText}>
              {res.nbPersonnes} voyageur{res.nbPersonnes > 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>TOTAL RÉGLÉ</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>{formatFcfa(res.totalLocataire)}</Text>
              <Text style={styles.priceCurrency}>FCFA</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.lg,
  },

  heroContent: {
    gap: 14,
  },

  lieuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lieuText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.forest[300],
    letterSpacing: 1.4,
    flex: 1,
  },
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 24,
    color: colors.neutral[0],
    lineHeight: 30,
    letterSpacing: -0.5,
  },

  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: radius.inner,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 2,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  escrowBadgeOnImage: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(7, 42, 32, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.35)',
  },
  escrowBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[0],
    letterSpacing: 0.2,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  photoCountText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[0],
  },

  // Dates
  datesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.inner,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  nightsCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.28)',
  },
  nightsCenterText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
  dateColLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.forest[300],
    letterSpacing: 0.8,
  },
  dateColValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[300],
  },

  priceBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  priceLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.forest[300],
    letterSpacing: 0.6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.lime[300],
  },
  priceCurrency: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[400],
  },
});