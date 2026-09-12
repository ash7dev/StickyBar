import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ShieldCheck, ShieldAlert, Sparkles, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { UserRole, StatutKyc } from '../../../shared/contracts';
import { apiClient } from '../../../shared/api/api-client';
import { useAuthStore } from '../../auth/stores/auth.store';

interface MobileProfileHeroProps {
  user?: {
    prenom?: string;
    nom?: string;
    email?: string | null;
    telephone?: string | null;
    photoUrl?: string | null;
    avatarUrl?: string | null;
    statutKyc?: StatutKyc | string;
    terangaTier?: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  } | null;
  activeRole: UserRole | string;
  onKycClick?: () => void;
  onAvatarClick?: () => void;
  onProfileUpdated?: () => void;
}

export function MobileProfileHero({
  user,
  activeRole,
  onKycClick,
  onAvatarClick,
  onProfileUpdated,
}: MobileProfileHeroProps) {
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const prenom = user?.prenom || 'Utilisateur';
  const nom = user?.nom || 'Klef';
  const fullName = `${prenom} ${nom}`;
  const initiales = `${prenom[0] || 'K'}${nom[0] || ''}`.toUpperCase();
  const contactText = user?.email || user?.telephone || 'Membre Klef';
  const isKycVerified = user?.statutKyc === 'VERIFIE';
  const isOwner = activeRole === 'PROPRIETAIRE';

  const avatarSrc = user?.photoUrl || user?.avatarUrl;

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

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onAvatarClick) {
      onAvatarClick();
    } else {
      setPickerModalVisible(true);
    }
  };

  const handlePickImage = async (source: 'camera' | 'library') => {
    setPickerModalVisible(false);
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission refusée', 'L\'accès à l\'appareil photo est nécessaire pour prendre une photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission refusée', 'L\'accès à la galerie d\'images est nécessaire pour choisir une photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error('[MobileProfileHero] Erreur sélection photo:', e);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    setIsUploading(true);
    let cleanUri = uri;
    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://') && !cleanUri.startsWith('http')) {
      cleanUri = `file://${cleanUri}`;
    }

    const filename = cleanUri.split('/').pop()?.split('?')[0] || 'profile_photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: cleanUri,
      name: filename,
      type,
    } as any);

    try {
      const res = await apiClient.post('/upload/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = res.data?.data || res.data;
      const uploadedUrl = data.url || data.secure_url;

      if (uploadedUrl) {
        await apiClient.patch('/users/me', { avatarUrl: uploadedUrl });

        const currentAuthUser = useAuthStore.getState().user;
        if (currentAuthUser) {
          useAuthStore.getState().setUser({
            ...currentAuthUser,
            photoUrl: uploadedUrl,
            avatarUrl: uploadedUrl,
          });
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onProfileUpdated?.();
      }
    } catch (err: any) {
      console.error('[MobileProfileHero] Erreur upload photo profil:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Erreur', 'Impossible de mettre à jour votre photo de profil. Réessayez.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <View style={styles.card}>
        {/* Glow de fond subtil */}
        <View style={styles.glowCircle} />

        <View style={styles.content}>
          {/* Row Avatar + Nom */}
          <View style={styles.topRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAvatarPress}
              style={styles.avatarWrapper}
              disabled={isUploading}
            >
              <View style={styles.avatarRing}>
                {isUploading ? (
                  <ActivityIndicator size="small" color={colors.lime[300]} />
                ) : avatarSrc ? (
                  <ExpoImage source={{ uri: avatarSrc }} style={styles.avatarImage} contentFit="cover" />
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

      {/* Modale de sélection de source de photo */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerModalVisible(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Photo de profil</Text>
            <TouchableOpacity onPress={() => setPickerModalVisible(false)} style={styles.closeBtn}>
              <X size={16} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubline}>
            Choisissez comment ajouter votre nouvelle photo de profil
          </Text>

          <View style={styles.pickerOptions}>
            <TouchableOpacity
              style={styles.pickerOptionCard}
              onPress={() => handlePickImage('camera')}
              activeOpacity={0.8}
            >
              <View style={styles.pickerOptionIconCircle}>
                <Camera size={20} color={colors.forest[700]} />
              </View>
              <View style={styles.pickerOptionTextContainer}>
                <Text style={styles.pickerOptionTitle}>Prendre une photo</Text>
                <Text style={styles.pickerOptionSub}>Utiliser l'appareil photo</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOptionCard}
              onPress={() => handlePickImage('library')}
              activeOpacity={0.8}
            >
              <View style={styles.pickerOptionIconCircle}>
                <ImageIcon size={20} color={colors.forest[700]} />
              </View>
              <View style={styles.pickerOptionTextContainer}>
                <Text style={styles.pickerOptionTitle}>Galerie photos</Text>
                <Text style={styles.pickerOptionSub}>Choisir depuis vos images</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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

  // Modale photo picker
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.6)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 12,
    ...shadows.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  modalSubline: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptions: {
    gap: 10,
  },
  pickerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pickerOptionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionTextContainer: {
    flex: 1,
    gap: 2,
  },
  pickerOptionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  pickerOptionSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
});

