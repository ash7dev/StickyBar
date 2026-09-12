import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { ShieldCheck, ShieldAlert, Sparkles, User, Camera, Award } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { UserRole, StatutKyc } from '../../../shared/contracts';

interface MobileProfileHeroProps {
  user?: {
    prenom?: string;
    nom?: string;
    email?: string | null;
    telephone?: string | null;
    photoUrl?: string | null;
    statutKyc?: StatutKyc | string;
    terangaTier?: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  } | null;
  activeRole: UserRole | string;
  onKycClick?: () => void;
  onAvatarClick?: () => void;
}

export function MobileProfileHero({
  user,
  activeRole,
  onKycClick,
  onAvatarClick,
}: MobileProfileHeroProps) {
  const prenom = user?.prenom || 'Utilisateur';
  const nom = user?.nom || 'Klef';
  const fullName = `${prenom} ${nom}`;
  const initiales = `${prenom[0] || 'K'}${nom[0] || ''}`.toUpperCase();
  const contactText = user?.email || user?.telephone || 'Membre Klef';
  const isKycVerified = user?.statutKyc === 'VERIFIE';
  const isOwner = activeRole === 'PROPRIETAIRE';

  const terangaTier = user?.terangaTier || 'BRONZE';
  const terangaLabel =
    terangaTier === 'GOLD'
      ? 'Clé d\'Or'
      : terangaTier === 'SILVER'
      ? 'Clé d\'Argent'
      : 'Clé de Bronze';
  const terangaEmoji = terangaTier === 'GOLD' ? '👑' : terangaTier === 'SILVER' ? '🔑' : '🗝️';

  const handleKycPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onKycClick?.();
  };

  return (
    <View style={styles.card}>
      {/* Glow de fond subtil */}
      <View style={styles.glowCircle} />

      <View style={styles.content}>
        {/* Row Avatar + Nom */}
        <View style={styles.topRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onAvatarClick}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarRing}>
              {user?.photoUrl ? (
                <ExpoImage source={{ uri: user.photoUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initiales}</Text>
              )}
            </View>
            <View style={styles.cameraIconCircle}>
              <Camera size={12} color={colors.forest[950]} />
            </View>
          </TouchableOpacity>

          <View style={styles.nameBlock}>
            <Text style={styles.fullName} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.contactText} numberOfLines={1}>
              {contactText}
            </Text>

            {/* Pastille Rôle Actif */}
            <View style={styles.roleBadge}>
              <Sparkles size={11} color={colors.lime[300]} />
              <Text style={styles.roleText} numberOfLines={1}>
                Espace {isOwner ? 'Hôte' : 'Voyageur'}
              </Text>
            </View>
          </View>
        </View>

        {/* Barres des Badges de Qualification (KYC & Teranga Club) */}
        <View style={styles.pillsGrid}>
          {/* Badge KYC */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleKycPress}
            style={[styles.pill, isKycVerified ? styles.pillSuccess : styles.pillWarning]}
          >
            {isKycVerified ? (
              <ShieldCheck size={13} color={colors.lime[300]} />
            ) : (
              <ShieldAlert size={13} color="#FBBF24" />
            )}
            <Text numberOfLines={1} style={[styles.pillText, isKycVerified ? styles.pillTextSuccess : styles.pillTextWarning]}>
              {isKycVerified ? 'Identité Vérifiée' : 'Vérification requise'}
            </Text>
          </TouchableOpacity>

          {/* Badge Teranga Club */}
          <View style={styles.pillTeranga}>
            <Text style={styles.terangaEmoji}>{terangaEmoji}</Text>
            <Text style={styles.terangaText} numberOfLines={1}>{terangaLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.md,
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
  },
  content: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(211, 242, 110, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: colors.lime[300],
  },
  cameraIconCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.forest[950],
  },

  nameBlock: {
    flex: 1,
    gap: 3,
  },
  fullName: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.text.inverseDisplay,
    letterSpacing: -0.3,
  },
  contactText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.text.inverseMuted,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  roleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.lime[300],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  pillsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillSuccess: {
    backgroundColor: 'rgba(211, 242, 110, 0.1)',
    borderColor: 'rgba(211, 242, 110, 0.25)',
  },
  pillWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  pillText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
  },
  pillTextSuccess: {
    color: colors.lime[300],
  },
  pillTextWarning: {
    color: '#FBBF24',
  },

  pillTeranga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  terangaEmoji: {
    fontSize: 12,
  },
  terangaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.text.inverse,
  },
});
