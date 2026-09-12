import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Linking, Alert } from 'react-native';
import { UserCheck, Phone, Star, ShieldCheck, Crown, Key, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';
import { canSeeCoordonnees } from '../../../utils/coordonnees.utils';

interface MobileOwnerGuestInfoCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerGuestInfoCard({ reservation }: MobileOwnerGuestInfoCardProps) {
  const locataire = reservation.locataire;

  if (!locataire) {
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.noGuestText}>Informations du locataire non disponibles</Text>
      </View>
    );
  }

  const fullName = `${locataire.prenom} ${locataire.nom}`;
  const initials = `${locataire.prenom?.[0] || ''}${locataire.nom?.[0] || ''}`.toUpperCase();
  const canSeePhone = canSeeCoordonnees(reservation.statut, reservation.dateDebut);

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!canSeePhone) {
      const isClosed = ['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(reservation.statut || '');
      Alert.alert(
        'Numéro masqué 🔒',
        isClosed
          ? 'Le numéro de téléphone du locataire n’est pas disponible pour cette réservation.'
          : 'Le numéro de téléphone du locataire sera déverrouillé 24 h avant son arrivée.'
      );
      return;
    }
    if (locataire.telephone) {
      Linking.openURL(`tel:${locataire.telephone}`).catch(() => {
        Alert.alert('Erreur', "Impossible de lancer l'appel téléphonique.");
      });
    } else {
      Alert.alert('Numéro non disponible', 'Le locataire n\'a pas fourni de numéro de téléphone direct.');
    }
  };

  const getTerangaBadge = () => {
    switch (locataire.terangaBadge) {
      case 'OR':
        return { label: 'Clé d\'Or', icon: Crown, color: '#F59E0B' };
      case 'ARGENT':
        return { label: 'Clé d\'Argent', icon: Key, color: '#9CA3AF' };
      case 'BRONZE':
        return { label: 'Clé de Bronze', icon: Key, color: '#D97706' };
      default:
        return null;
    }
  };

  const teranga = getTerangaBadge();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.cardSectionTitle}>Voyageur / Locataire</Text>
        {locataire.estVerifie && (
          <View style={styles.kycBadge}>
            <ShieldCheck size={12} color={colors.lime[400]} />
            <Text style={styles.kycText}>Identité Vérifiée</Text>
          </View>
        )}
      </View>

      <View style={styles.contentRow}>
        {/* Avatar ou Initiales */}
        {locataire.avatarUrl ? (
          <Image source={{ uri: locataire.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}

        <View style={styles.infoCol}>
          <Text style={styles.guestName} numberOfLines={1}>
            {fullName}
          </Text>

          <View style={styles.badgesRow}>
            {/* Note moyenne */}
            {locataire.noteMoyenne ? (
              <View style={styles.ratingPill}>
                <Star size={11} color={colors.lime[400]} fill={colors.lime[400]} />
                <Text style={styles.ratingText}>
                  {locataire.noteMoyenne.toFixed(1)} {locataire.nbAvis ? `(${locataire.nbAvis})` : ''}
                </Text>
              </View>
            ) : (
              <Text style={styles.newGuestText}>Nouveau voyageur</Text>
            )}

            {/* Badge Teranga */}
            {teranga && (
              <View style={styles.terangaPill}>
                <teranga.icon size={11} color={teranga.color} />
                <Text style={[styles.terangaText, { color: teranga.color }]}>{teranga.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton Appel Direct (Vérifie canSeePhone) */}
        {locataire.telephone && (
          <TouchableOpacity
            onPress={handleCall}
            style={[styles.callButton, !canSeePhone && styles.callButtonDisabled]}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={canSeePhone ? "Appeler le locataire" : "Numéro de téléphone masqué"}
          >
            {canSeePhone ? (
              <Phone size={16} color={colors.forest[950]} />
            ) : (
              <Lock size={16} color={colors.neutral[500]} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  noGuestText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold[50],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  kycText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[700],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 16,
    color: colors.forest[700],
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  guestName: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold[50],
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.gold[700],
  },
  newGuestText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  terangaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
  },
  terangaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
  },
  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  callButtonDisabled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
});
