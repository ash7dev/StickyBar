import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  CreditCard,
  Camera,
  ImageIcon,
  CheckCircle2,
  X,
  Upload,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../theme/tokens';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../../features/auth/stores/auth.store';

interface StepKycProps {
  onDone: () => void;
}

type KycSide = 'recto' | 'verso';

export function StepKyc({ onDone }: StepKycProps) {
  const { user, setUser } = useAuthStore();

  const [subStep, setSubStep] = useState<KycSide>('recto');
  const [rectoUri, setRectoUri] = useState<string | null>(null);
  const [versoUri, setVersoUri] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUri = subStep === 'recto' ? rectoUri : versoUri;

  const handleOpenPickerModal = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Photothèque', 'Prendre une photo', 'Choisir les fichiers', 'Annuler'],
          cancelButtonIndex: 3,
          title: `Ajouter une pièce d'identité (${subStep.toUpperCase()})`,
        },
        (buttonIndex) => {
          if (buttonIndex === 0 || buttonIndex === 2) {
            handlePickFromGallery();
          } else if (buttonIndex === 1) {
            handlePickFromCamera();
          }
        }
      );
    } else {
      setShowPickerModal(true);
    }
  };

  const handlePickFromCamera = async () => {
    setShowPickerModal(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission refusée',
          'L\'accès à l\'appareil photo est nécessaire pour capturer votre pièce d\'identité.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 10],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        if (subStep === 'recto') {
          setRectoUri(result.assets[0].uri);
        } else {
          setVersoUri(result.assets[0].uri);
        }
        setError(null);
      }
    } catch (e) {
      console.error('[StepKyc] Erreur prise de photo:', e);
    }
  };

  const handlePickFromGallery = async () => {
    setShowPickerModal(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la galerie d\'images est nécessaire.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 10],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        if (subStep === 'recto') {
          setRectoUri(result.assets[0].uri);
        } else {
          setVersoUri(result.assets[0].uri);
        }
        setError(null);
      }
    } catch (e) {
      console.error('[StepKyc] Erreur sélection galerie:', e);
    }
  };

  const handleClearImage = () => {
    if (subStep === 'recto') {
      setRectoUri(null);
    } else {
      setVersoUri(null);
    }
  };

  const uploadSingleKycFile = async (
    uri: string
  ): Promise<{ url: string; publicId: string }> => {
    let cleanUri = uri;
    if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://') && !cleanUri.startsWith('http')) {
      cleanUri = `file://${cleanUri}`;
    }

    const filename = cleanUri.split('/').pop()?.split('?')[0] || 'kyc_document.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: cleanUri,
      name: filename,
      type,
    } as any);

    const res = await apiClient.post('/upload/kyc-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = res.data?.data || res.data;
    return {
      url: data.url || data.secure_url || '',
      publicId: data.publicId || data.public_id || `kyc_${Date.now()}`,
    };
  };

  const handleSubmit = async () => {
    if (!rectoUri || !versoUri) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Upload Recto & Verso
      const [rectoRes, versoRes] = await Promise.all([
        uploadSingleKycFile(rectoUri),
        uploadSingleKycFile(versoUri),
      ]);

      // 2. Soumission KYC au backend
      await apiClient.post('/kyc/submit', {
        kycDocumentUrl: rectoRes.url,
        kycDocumentPublicId: rectoRes.publicId,
        kycVersoUrl: versoRes.url,
        kycVersoPublicId: versoRes.publicId,
      });

      // 3. Mise à jour immédiate du statut KYC dans le store
      if (user) {
        const updatedUser = {
          ...user,
          statutKyc: 'EN_ATTENTE' as const,
        };
        setUser(updatedUser);
      }
      setLoading(false);
      onDone();
    } catch (err: any) {
      console.error('[StepKyc] Erreur soumission KYC:', err);
      const msg =
        err.response?.data?.message ||
        'Erreur lors du téléchargement des pièces d\'identité.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Mini Stepper Recto / Verso ───────────────────────────────── */}
      <View style={styles.stepperRow}>
        <View
          style={[
            styles.stepPill,
            subStep === 'recto' && styles.stepPillActive,
            Boolean(rectoUri) && styles.stepPillDone,
          ]}
        >
          <CreditCard
            size={12}
            color={
              rectoUri || subStep === 'recto'
                ? colors.forest[950]
                : colors.neutral[500]
            }
          />
          <Text
            style={[
              styles.stepPillText,
              (rectoUri || subStep === 'recto') && styles.stepPillTextActive,
            ]}
          >
            1. Recto
          </Text>
        </View>

        <View
          style={[
            styles.stepLine,
            Boolean(rectoUri) && styles.stepLineActive,
          ]}
        />

        <View
          style={[
            styles.stepPill,
            subStep === 'verso' && styles.stepPillActive,
            Boolean(versoUri) && styles.stepPillDone,
          ]}
        >
          <ImageIcon
            size={12}
            color={
              versoUri || subStep === 'verso'
                ? colors.forest[950]
                : colors.neutral[500]
            }
          />
          <Text
            style={[
              styles.stepPillText,
              (versoUri || subStep === 'verso') && styles.stepPillTextActive,
            ]}
          >
            2. Verso
          </Text>
        </View>
      </View>

      {/* ── Zone d'upload / Prévisualisation ───────────────────────── */}
      <View style={styles.sideHeader}>
        <Text style={styles.sideTitle}>
          {subStep === 'recto'
            ? 'Face avant (Recto CNI / Passeport)'
            : 'Face arrière (Verso CNI)'}
        </Text>
        <Text style={styles.sideSubtext}>
          {subStep === 'recto'
            ? 'Côté avec votre photo et vos informations personnelles'
            : 'Côté opposé de votre document d\'identité'}
        </Text>
      </View>

      {currentUri ? (
        /* ── Aperçu de la photo capturée ── */
        <View style={styles.previewCard}>
          <Image source={{ uri: currentUri }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <View style={styles.successBadge}>
              <CheckCircle2 size={16} color={colors.neutral[0]} />
              <Text style={styles.successBadgeText}>
                {subStep === 'recto' ? 'Recto sélectionné' : 'Verso sélectionné'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleClearImage}
            style={styles.clearBtn}
          >
            <X size={14} color={colors.error[600]} />
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Bouton de déclenchement d'upload ── */
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenPickerModal}
          style={styles.dropZone}
        >
          <View style={styles.dropZoneIconBox}>
            <Upload size={22} color={colors.forest[600]} />
          </View>
          <Text style={styles.dropZoneTitle}>
            Ajouter le {subStep === 'recto' ? 'Recto' : 'Verso'}
          </Text>
          <Text style={styles.dropZoneSubtext}>
            Appareil photo 📷 ou Galerie 🖼️ (Max 5 Mo)
          </Text>
        </TouchableOpacity>
      )}

      {/* Consignes de lisibilité */}
      <View style={styles.guideBox}>
        <ShieldCheck size={14} color={colors.forest[600]} />
        <Text style={styles.guideText}>
          Veillez à ce que le document soit bien cadré, lisible et sans reflet lumineux.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <AlertCircle size={15} color={colors.error[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ── Bouton d'Action ────────────────────────────────────────── */}
      {subStep === 'recto' ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => setSubStep('verso')}
          disabled={!rectoUri}
          style={[
            styles.submitButton,
            !rectoUri && styles.submitButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.submitButtonText,
              !rectoUri && styles.submitButtonTextDisabled,
            ]}
          >
            Continuer avec le verso
          </Text>
          <ArrowRight
            size={16}
            color={rectoUri ? colors.forest[950] : colors.neutral[500]}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.versoActionsCol}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSubmit}
            disabled={loading || !rectoUri || !versoUri}
            style={[
              styles.submitButton,
              (loading || !rectoUri || !versoUri) &&
                styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.forest[950]} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  Soumettre mes pièces d'identité
                </Text>
                <CheckCircle2 size={16} color={colors.forest[950]} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSubStep('recto')}
            style={styles.backToRectoBtn}
          >
            <Text style={styles.backToRectoText}>← Modifier le recto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal d'options Source Image (Caméra vs Galerie) ────────── */}
      <Modal
        visible={showPickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerModal(false)}
        >
          <View style={styles.pickerDialog}>
            <Text style={styles.pickerTitle}>
              Ajouter une pièce d'identité ({subStep.toUpperCase()})
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickFromCamera}
              style={styles.pickerOption}
            >
              <View style={styles.pickerIconCircle}>
                <Camera size={20} color={colors.forest[700]} />
              </View>
              <View style={styles.pickerOptionContent}>
                <Text style={styles.pickerOptionTitle}>Prendre une photo</Text>
                <Text style={styles.pickerOptionSub}>
                  Utiliser l'appareil photo du smartphone
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickFromGallery}
              style={styles.pickerOption}
            >
              <View style={styles.pickerIconCircle}>
                <ImageIcon size={20} color={colors.forest[700]} />
              </View>
              <View style={styles.pickerOptionContent}>
                <Text style={styles.pickerOptionTitle}>Choisir dans la galerie</Text>
                <Text style={styles.pickerOptionSub}>
                  Sélectionner un fichier JPG, PNG ou WebP
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowPickerModal(false)}
              style={styles.cancelPickerBtn}
            >
              <Text style={styles.cancelPickerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  stepPillActive: {
    backgroundColor: colors.lime[200],
    borderColor: colors.lime[400],
  },
  stepPillDone: {
    backgroundColor: colors.forest[100],
    borderColor: colors.forest[300],
  },
  stepPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
  },
  stepPillTextActive: {
    color: colors.forest[950],
  },
  stepLine: {
    width: 24,
    height: 2,
    backgroundColor: colors.neutral[200],
    borderRadius: 1,
  },
  stepLineActive: {
    backgroundColor: colors.forest[600],
  },
  sideHeader: {
    gap: 2,
  },
  sideTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  sideSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },
  dropZone: {
    height: 140,
    backgroundColor: colors.neutral[50],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropZoneIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  dropZoneSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  previewCard: {
    position: 'relative',
    height: 140,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.forest[600],
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(4, 25, 18, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  successBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.neutral[0],
  },
  clearBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  guideBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  guideText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[600],
    lineHeight: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    padding: 10,
    borderRadius: radius.inner,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.error[700],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.xs,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  submitButtonText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  submitButtonTextDisabled: {
    color: colors.neutral[500],
  },
  versoActionsCol: {
    gap: 6,
  },
  backToRectoBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  backToRectoText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },

  // Modal options
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerDialog: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 20,
    gap: 12,
    ...shadows.lg,
  },
  pickerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    marginBottom: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    borderRadius: radius.inner,
  },
  pickerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionContent: {
    flex: 1,
    gap: 1,
  },
  pickerOptionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  pickerOptionSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  cancelPickerBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  cancelPickerText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[600],
  },
});
