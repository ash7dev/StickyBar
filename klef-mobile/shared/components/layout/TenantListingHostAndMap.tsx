import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  MapPin,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Navigation,
  ExternalLink,
  Info,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { router } from 'expo-router';

export interface Proprietaire {
  id?: string;
  prenom?: string;
  nom?: string;
  avatarUrl?: string | null;
  statutKyc?: string;
  creeLe?: string;
  totalSejours?: number;
  totalAvis?: number;
}

interface TenantListingHostAndMapProps {
  ville: string;
  quartier?: string | null;
  adresse?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  proprietaire?: Proprietaire | null;
}

const CITY_FALLBACKS: Record<string, [number, number]> = {
  dakar: [14.7167, -17.4677],
  almadies: [14.7478, -17.5256],
  ngor: [14.7553, -17.5186],
  yoff: [14.7594, -17.4647],
  mermoz: [14.7081, -17.4722],
  plateau: [14.6678, -17.4372],
  fann: [14.6931, -17.4644],
  mamelles: [14.7333, -17.5111],
  saly: [14.4442, -17.0203],
  somone: [14.4842, -17.0805],
  mbour: [14.4225, -16.9639],
  thies: [14.7910, -16.9256],
  'saint-louis': [16.0326, -16.4818],
  'cap skirring': [12.3736, -16.7442],
  popenguine: [14.5542, -17.1128],
  ngaparou: [14.4642, -17.0503],
};

export function TenantListingHostAndMap({
  ville,
  quartier,
  adresse,
  latitude,
  longitude,
  proprietaire,
}: TenantListingHostAndMapProps) {
  // Coordonnées GPS réelles ou fallback par ville/quartier
  let lat = latitude ? Number(latitude) : null;
  let lng = longitude ? Number(longitude) : null;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    const key = (quartier || ville || '').toLowerCase().trim();
    const match = Object.keys(CITY_FALLBACKS).find((c) => key.includes(c));
    if (match) {
      [lat, lng] = CITY_FALLBACKS[match];
    } else {
      [lat, lng] = [14.7167, -17.4677]; // Dakar par défaut
    }
  }

  const locationText = quartier ? `${quartier}, ${ville}` : ville;

  const handleOpenExternalMaps = () => {
    const label = encodeURIComponent(locationText);
    const mapsUrl =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`
        : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.openURL(mapsUrl).catch(() => {});
  };

  const hostName =
    proprietaire?.prenom && proprietaire?.nom
      ? `${proprietaire.prenom} ${proprietaire.nom}`
      : 'Hôte Klef';

  const hostInitials =
    proprietaire?.prenom && proprietaire?.nom
      ? `${proprietaire.prenom[0]}${proprietaire.nom[0]}`.toUpperCase()
      : 'K';

  const hostYear = proprietaire?.creeLe
    ? new Date(proprietaire.creeLe).getFullYear()
    : null;

  const isKycVerified = proprietaire?.statutKyc === 'VERIFIE';

  return (
    <View style={styles.container}>
      {/* ── Section Emplacement & Carte Visuelle ────────────────────── */}
      <View style={styles.locationBlock}>
        <View style={styles.locationHeaderRow}>
          <View style={styles.locationHeaderLeft}>
            <Text style={styles.sectionTitle}>Où se situe le logement</Text>
            <View style={styles.locationSubRow}>
              <MapPin size={14} color={colors.forest[600]} />
              <Text style={styles.locationSubTitle}>{locationText}</Text>
            </View>
          </View>

          {/* Bouton Ouvrir dans Google Maps / Plans */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenExternalMaps}
            style={styles.openMapsBtn}
          >
            <Navigation size={13} color={colors.forest[700]} />
            <Text style={styles.openMapsBtnText}>Maps</Text>
            <ExternalLink size={12} color={colors.forest[600]} />
          </TouchableOpacity>
        </View>

        {/* ── Carte Visuelle Style Airbnb (Cercle de quartier + Pin Klef) ── */}
        <View style={styles.mapCardContainer}>
          {/* Faux fond de tuiles de carte élégant */}
          <Image
            source={{
              uri: `https://static-maps.yandex.ru/1.x/?lang=en-US&ll=${lng},${lat}&z=14&l=map&size=600,260`,
            }}
            style={styles.mapImageBackground}
            resizeMode="cover"
          />

          {/* Calque d'assombrissement doux */}
          <View style={styles.mapOverlayGrad} />

          {/* Cercle Translucide de Zone de Quartier (Airbnb Style) */}
          <View style={styles.neighborhoodRadiusCircle}>
            {/* Badge Pin Central Klef Premium */}
            <View style={styles.pinBadgeWrapper}>
              <View style={styles.pinOuterPulse} />
              <View style={styles.pinInnerCircle}>
                <MapPin size={20} color={colors.lime[400]} />
              </View>
            </View>
          </View>

          {/* Bulle d'adresse / quartier sur la carte */}
          <View style={styles.mapAddressBubble}>
            <Text style={styles.mapAddressBubbleTitle}>{locationText}</Text>
            <Text style={styles.mapAddressBubbleSub}>
              Zone d'emplacement exact du logement
            </Text>
          </View>
        </View>

        {/* Note de confidentialité & sécurité (Style Airbnb / Klef Web) */}
        <View style={styles.privacyBanner}>
          <ShieldCheck size={16} color={colors.forest[600]} style={{ marginTop: 2 }} />
          <Text style={styles.privacyBannerText}>
            <Text style={styles.privacyBannerBold}>
              Confidentialité & Sécurité :{' '}
            </Text>
            L'emplacement exact dans la zone vous sera automatiquement communiqué
            avec les instructions d'accès dès la confirmation de votre réservation.
          </Text>
        </View>
      </View>

      {/* ── Section Votre Hôte ───────────────────────────────────────── */}
      <View style={styles.hostBlock}>
        <Text style={styles.sectionTitle}>Votre hôte</Text>

        <View style={styles.hostCard}>
          <View style={styles.hostMainRow}>
            {proprietaire?.avatarUrl ? (
              <Image
                source={{ uri: proprietaire.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initialsText}>{hostInitials}</Text>
              </View>
            )}

            <View style={styles.hostDetails}>
              <Text style={styles.hostName}>{hostName}</Text>
              {hostYear ? (
                <Text style={styles.hostYearText}>Hôte depuis {hostYear}</Text>
              ) : (
                <Text style={styles.hostYearText}>Hôte vérifié sur Klef</Text>
              )}

              {isKycVerified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={colors.gold[700]} />
                  <Text style={styles.verifiedBadgeText}>Identité vérifiée</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bouton Voir le profil de l'hôte */}
          {proprietaire?.id && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push(`/hote/${proprietaire.id}` as any)
              }
              style={styles.hostProfileButton}
            >
              <UserCheck size={15} color={colors.forest[800]} />
              <Text style={styles.hostProfileButtonText}>
                Voir le profil de l'hôte
              </Text>
              <ChevronRight size={15} color={colors.forest[800]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 24,
    marginBottom: 80, // Laisse de la place avant la barre sticky
  },
  locationBlock: {
    gap: 12,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  locationHeaderLeft: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  locationSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationSubTitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.forest[700],
  },
  openMapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  openMapsBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },

  // ── Carte Visuelle Style Airbnb ─────────────────────────────────────
  mapCardContainer: {
    position: 'relative',
    height: 210,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  mapImageBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  mapOverlayGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(4, 25, 18, 0.12)',
  },

  // Cercle de quartier Airbnb
  neighborhoodRadiusCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(211, 242, 110, 0.30)',
    borderWidth: 2,
    borderColor: 'rgba(7, 42, 32, 0.60)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadgeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuterPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(4, 25, 18, 0.25)',
  },
  pinInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest[950],
    borderWidth: 2.5,
    borderColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  // Bulle d'adresse en bas de la carte
  mapAddressBubble: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadows.sm,
  },
  mapAddressBubbleTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  mapAddressBubbleSub: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[600],
  },

  // Banner Confidentialité
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    padding: 12,
    borderRadius: radius.field,
  },
  privacyBannerText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 17,
  },
  privacyBannerBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[900],
  },

  // ── Hôte ───────────────────────────────────────────────────────────
  hostBlock: {
    gap: 10,
  },
  hostCard: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.card,
    padding: 14,
    gap: 14,
  },
  hostMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[700],
  },
  hostDetails: {
    flex: 1,
    gap: 3,
  },
  hostName: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  hostYearText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  verifiedBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[700],
  },
  hostProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  hostProfileButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[800],
  },
});
