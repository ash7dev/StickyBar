import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Phone, MapPin, Building2, ShieldCheck, UserCheck, Smartphone, Camera, ChevronRight, Lock, PhoneCall } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationProprietaire, ReservationLogement, PhotoEtatLieu } from '../../types/reservation-detail.types';
import { canSeeCoordonnees } from '../../utils/coordonnees.utils';
export { canSeeCoordonnees };

interface MobileHostPropertyGridProps {
  proprietaire?: ReservationProprietaire | null;
  logement?: ReservationLogement | null;
  photosEtatLieu?: PhotoEtatLieu[];
  statut?: string;
  dateDebut?: string;
  onOpenWelcomeGuide?: () => void;
  onOpenGallery?: () => void;
}

export function MobileHostPropertyGrid({
  proprietaire,
  logement,
  photosEtatLieu = [],
  statut,
  dateDebut,
  onOpenWelcomeGuide,
  onOpenGallery,
}: MobileHostPropertyGridProps) {
  const canSeePhone = canSeeCoordonnees(statut, dateDebut);

  const handleCallHost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
    if (!canSeePhone) {
      const isClosed = ['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(statut || '');
      Alert.alert(
        'Numéro masqué 🔒',
        isClosed
          ? 'Le numéro du propriétaire n’est pas disponible pour cette réservation.'
          : 'Le numéro de téléphone de l’hôte sera déverrouillé 24 h avant votre arrivée.'
      );
      return;
    }

    if (proprietaire?.telephone) {
      Linking.openURL(`tel:${proprietaire.telephone}`).catch(() => {
        Alert.alert('Numéro non disponible', proprietaire.telephone || '');
      });
    } else {
      Alert.alert('Information', "Le numéro du propriétaire n'est pas disponible directement.");
    }
  };

  const mainPhoto = logement?.photos?.[0]?.url || '';
  const locationText = [logement?.quartier, logement?.ville].filter(Boolean).join(', ');
  const photosCount = photosEtatLieu?.length || 0;
  const hostInitial = proprietaire?.prenom?.[0]?.toUpperCase() || 'K';

  return (
    <View style={styles.container}>
      {/* ── 1. Carte Hôte (Propriétaire) ───────────────────────────── */}
      <View style={styles.hostCard}>
        <View style={styles.hostTopRow}>
          {/* Avatar with forest ring */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              {proprietaire?.avatarUrl ? (
                <ExpoImage source={{ uri: proprietaire.avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitial}>{hostInitial}</Text>
              )}
            </View>
          </View>

          <View style={styles.hostInfo}>
            <Text style={styles.hostName}>
              {proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : 'Hôte Klef'}
            </Text>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={12} color={colors.forest[600]} />
              <Text style={styles.verifiedText}>Identité Vérifiée Klef</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            canSeePhone
              ? `Contacter ${proprietaire?.prenom || 'l’hôte'} par téléphone`
              : "Numéro de téléphone de l’hôte masqué"
          }
          accessibilityHint={
            canSeePhone
              ? "Lance un appel téléphonique vers le propriétaire"
              : "Affiche l’information d’accès au numéro"
          }
          activeOpacity={0.8}
          onPress={handleCallHost}
          style={[styles.callButton, !canSeePhone && styles.callButtonDisabled]}
        >
          <View style={[styles.callIconCircle, !canSeePhone && styles.callIconCircleDisabled]}>
            {canSeePhone ? (
              <Phone size={14} color={colors.forest[800]} strokeWidth={2.2} />
            ) : (
              <Lock size={14} color={colors.neutral[500]} />
            )}
          </View>
          <Text style={[styles.callButtonText, !canSeePhone && styles.callButtonTextDisabled]}>
            {canSeePhone ? "Contacter par téléphone" : "Numéro masqué (24h avant)"}
          </Text>
          <ChevronRight size={15} color={canSeePhone ? colors.forest[400] : colors.neutral[300]} />
        </TouchableOpacity>
      </View>

      {/* ── 2. Carte Logement ──────────────────────────────────────── */}
      <View style={styles.propertyCard}>
        {/* Property image banner */}
        <View style={styles.propertyImageWrapper}>
          {mainPhoto ? (
            <>
              <ExpoImage source={{ uri: mainPhoto }} style={styles.propertyBannerImage} contentFit="cover" />
              <View style={styles.propertyImageOverlay} />
              <View style={styles.propertyTypeBadgeOnImage}>
                <Text style={styles.propertyTypeBadgeText}>{logement?.type || 'HÉBERGEMENT'}</Text>
              </View>
            </>
          ) : (
            <View style={styles.noPhotoPlaceholder}>
              <Building2 size={28} color={colors.neutral[400]} />
              <Text style={styles.noPhotoText}>Photo non disponible</Text>
            </View>
          )}
        </View>

        {/* Property info */}
        <View style={styles.propertyInfoSection}>
          <Text style={styles.propertyTitle} numberOfLines={2}>
            {logement?.titre || 'Logement'}
          </Text>

          {locationText ? (
            <View style={styles.locationRow}>
              <MapPin size={13} color={colors.forest[600]} strokeWidth={2.2} />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          ) : null}

          {logement?.adresse ? (
            <Text style={styles.addressText} numberOfLines={1}>
              {logement.adresse}
            </Text>
          ) : null}
        </View>

        {/* Quick access buttons */}
        {(onOpenWelcomeGuide || (onOpenGallery && photosCount > 0)) && (
          <View style={styles.actionsSection}>
            {onOpenWelcomeGuide ? (
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Livret d'accueil digital"
                accessibilityHint="Consulter les consignes et informations pratiques du logement"
                activeOpacity={0.8}
                onPress={onOpenWelcomeGuide}
                style={styles.actionCard}
              >
                <View style={styles.actionIconCircle}>
                  <Smartphone size={16} color={colors.forest[700]} />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionCardTitle}>Livret d'accueil digital</Text>
                  <Text style={styles.actionCardSub}>Infos pratiques du logement</Text>
                </View>
                <ChevronRight size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
            ) : null}

            {onOpenGallery && photosCount > 0 ? (
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Galerie état des lieux d'entrée"
                accessibilityHint="Afficher les photos documentées et certifiées par Klef"
                activeOpacity={0.8}
                onPress={onOpenGallery}
                style={styles.actionCard}
              >
                <View style={[styles.actionIconCircle, styles.actionIconCircleAlt]}>
                  <Camera size={16} color={colors.lime[800]} />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionCardTitle}>État des lieux</Text>
                  <Text style={styles.actionCardSub}>{photosCount} photo{photosCount > 1 ? 's' : ''} documentée{photosCount > 1 ? 's' : ''}</Text>
                </View>
                <ChevronRight size={16} color={colors.neutral[400]} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // ── Host Card ──────────────────────────────────────────────────────────
  hostCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  hostTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.forest[50],
    borderWidth: 2,
    borderColor: colors.forest[200],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[700],
  },
  hostInfo: {
    flex: 1,
    gap: 4,
  },
  hostName: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[600],
  },

  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  callButtonDisabled: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
    opacity: 0.85,
  },
  callIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.forest[100],
    borderWidth: 1,
    borderColor: colors.forest[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconCircleDisabled: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  callButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[800],
    flex: 1,
  },
  callButtonTextDisabled: {
    color: colors.neutral[600],
    fontFamily: typography.fontBodyMedium,
  },

  // ── Property Card ─────────────────────────────────────────────────────
  propertyCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  propertyImageWrapper: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  propertyBannerImage: {
    width: '100%',
    height: '100%',
  },
  propertyImageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 25, 18, 0.15)',
  },
  propertyTypeBadgeOnImage: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(4, 25, 18, 0.8)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  propertyTypeBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[0],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  noPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  noPhotoText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  propertyInfoSection: {
    padding: 16,
    gap: 6,
  },
  propertyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[700],
    flex: 1,
  },
  addressText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // ── Quick access cards ────────────────────────────────────────────────
  actionsSection: {
    gap: 1,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleAlt: {
    backgroundColor: colors.lime[50],
    borderColor: colors.lime[200],
  },
  actionCardText: {
    flex: 1,
    gap: 1,
  },
  actionCardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  actionCardSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
