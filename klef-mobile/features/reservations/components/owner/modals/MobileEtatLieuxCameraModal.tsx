import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { X, Camera, ImagePlus, Trash2, CheckCircle2, ShieldCheck, Tag } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface PhotoItem {
  uri: string;
  categorie: string;
}

interface MobileEtatLieuxCameraModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitPhotos: (photos: PhotoItem[]) => Promise<void>;
  type: 'CHECKIN' | 'CHECKOUT';
  loading?: boolean;
}

const CATEGORIES = [
  { id: 'ENTREE', label: "Entrée / Clés" },
  { id: 'SALON', label: "Salon / Séjour" },
  { id: 'CUISINE', label: "Cuisine / Équipements" },
  { id: 'CHAMBRE', label: "Chambres / Literie" },
  { id: 'SALLE_DE_BAIN', label: "Salle de bain / W.C." },
  { id: 'AUTRE', label: "Compteurs / Autres" },
];

export function MobileEtatLieuxCameraModal({
  visible,
  onClose,
  onSubmitPhotos,
  type,
  loading = false,
}: MobileEtatLieuxCameraModalProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ENTREE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAndroidPickerMenu, setShowAndroidPickerMenu] = useState(false);

  const busy = loading || isSubmitting;

  const resetAndClose = () => {
    setPhotos([]);
    setErrorMessage(null);
    onClose();
  };

  const handleRequestClose = () => {
    if (busy) return;
    if (photos.length > 0) {
      Alert.alert(
        'Fermer sans enregistrer ?',
        `${photos.length} photo${photos.length > 1 ? 's' : ''} n'${photos.length > 1 ? 'ont' : 'a'
        } pas encore été validée${photos.length > 1 ? 's' : ''}. Elles seront perdues.`,
        [
          { text: 'Continuer les photos', style: 'cancel' },
          { text: 'Fermer', style: 'destructive', onPress: resetAndClose },
        ],
      );
      return;
    }
    resetAndClose();
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'accès à l'appareil photo est nécessaire pour capturer l'état des lieux.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotos((prev) => [...prev, { uri: result.assets[0].uri, categorie: activeCategory }]);
    }
  };

  const handlePickLibrary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'accès à la galerie est nécessaire pour joindre des photos d'état des lieux.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const newPhotos: PhotoItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        categorie: activeCategory,
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleAddPhotosPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Photothèque', 'Prendre une photo', 'Annuler'],
          cancelButtonIndex: 2,
          title: 'Ajouter des photos',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handlePickLibrary();
          } else if (buttonIndex === 1) {
            handleTakePhoto();
          }
        }
      );
    } else {
      setShowAndroidPickerMenu(true);
    }
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (busy || photos.length === 0) {
      if (photos.length === 0) {
        Alert.alert('Photos requises', "Veuillez prendre ou sélectionner au moins 1 photo d'état des lieux.");
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onSubmitPhotos(photos);
      setPhotos([]);
    } catch (err) {
      setErrorMessage("L'envoi des photos a échoué. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  const isCheckin = type === 'CHECKIN';

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleRequestClose}>
        <TouchableWithoutFeedback onPress={handleRequestClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                <View style={styles.dragHandle} />

                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <View style={styles.iconBadge}>
                      <Camera size={20} color={colors.forest[700]} />
                    </View>
                    <View>
                      <Text style={styles.title}>
                        {isCheckin ? "État des Lieux d'Entrée" : "État des Lieux de Sortie"}
                      </Text>
                      <Text style={styles.subtitle}>
                        {isCheckin ? "Prenez en photo le logement à l'arrivée" : "Prenez en photo le logement au départ"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={handleRequestClose}
                    disabled={busy}
                    style={[styles.closeButton, busy && styles.closeButtonDisabled]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Fermer"
                    accessibilityState={{ disabled: busy }}
                  >
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                  {/* Catégories de pièce */}
                  <Text style={styles.sectionLabel}>1. Sélectionnez la pièce / zone</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = activeCategory === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setActiveCategory(cat.id);
                          }}
                          style={[styles.catPill, isSelected && styles.catPillSelected]}
                          accessibilityRole="button"
                          accessibilityLabel={`Catégorie ${cat.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Tag size={12} color={isSelected ? colors.forest[950] : '#64748B'} />
                          <Text style={[styles.catText, isSelected && styles.catTextSelected]}>
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Bouton unique Ajouter des photos */}
                  <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
                    2. Prenez des photos ({photos.length} ajoutée{photos.length > 1 ? 's' : ''})
                  </Text>

                  <TouchableOpacity
                    onPress={handleAddPhotosPress}
                    style={styles.singleDropZone}
                    activeOpacity={0.8}
                  >
                    <View style={styles.singleDropZoneIconWrap}>
                      <ImagePlus size={24} color={colors.forest[700]} />
                    </View>
                    <View style={{ gap: 2 }}>
                      <Text style={styles.singleDropZoneTitle}>Ajouter des photos</Text>
                      <Text style={styles.singleDropZoneSub}>Photothèque ou appareil photo</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Galerie de prévisualisation */}
                  {photos.length > 0 && (
                    <View style={styles.photoGrid}>
                      {photos.map((item, idx) => (
                        <View key={`photo-${idx}`} style={styles.photoCard}>
                          <Image source={{ uri: item.uri }} style={styles.photoImg} />
                          <View style={styles.catTag}>
                            <Text style={styles.catTagText}>{item.categorie}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemovePhoto(idx)}
                            style={styles.deleteBadge}
                            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                            accessibilityRole="button"
                            accessibilityLabel={`Supprimer la photo ${item.categorie}`}
                          >
                            <Trash2 size={12} color="#FFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Info juridique */}
                  <View style={styles.infoBanner}>
                    <ShieldCheck size={16} color={colors.forest[700]} style={{ marginTop: 2 }} />
                    <Text style={styles.infoText}>
                      Les photos sont horodatées et certifiées sur les serveurs sécurisés Klef. Elles
                      servent de preuve irréfutable en cas de litige.
                    </Text>
                  </View>

                  {errorMessage && (
                    <View style={styles.errorBanner}>
                      <ShieldCheck size={16} color="#DC2626" style={{ marginTop: 2 }} />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.footer}>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={busy || photos.length === 0}
                    style={[styles.submitButton, (busy || photos.length === 0) && styles.disabledButton]}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`Valider l'état des lieux, ${photos.length} photos`}
                    accessibilityState={{ disabled: busy || photos.length === 0, busy }}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.forest[950]} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color={colors.forest[950]} />
                        <Text style={styles.submitButtonText}>
                          Valider l'état des lieux ({photos.length} photos)
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal fallback pour Android ActionSheet */}
      <Modal
        visible={showAndroidPickerMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAndroidPickerMenu(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowAndroidPickerMenu(false)}
        >
          <View style={styles.sheetCard}>
            <Text style={styles.sheetCardTitle}>Ajouter des photos</Text>

            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => {
                setShowAndroidPickerMenu(false);
                handlePickLibrary();
              }}
            >
              <ImagePlus size={18} color={colors.forest[700]} />
              <Text style={styles.sheetOptionText}>Photothèque</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOptionBtn}
              onPress={() => {
                setShowAndroidPickerMenu(false);
                handleTakePhoto();
              }}
            >
              <Camera size={18} color={colors.forest[700]} />
              <Text style={styles.sheetOptionText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setShowAndroidPickerMenu(false)}
            >
              <Text style={styles.sheetCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  body: {
    marginVertical: 14,
  },
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#334155',
    marginBottom: 10,
  },
  catRow: {
    gap: 8,
    paddingRight: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillSelected: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[500],
  },
  catText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#475569',
  },
  catTextSelected: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  singleDropZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  singleDropZoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7FEE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  singleDropZoneTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#0F172A',
  },
  singleDropZoneSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#64748B',
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  photoCard: {
    width: '31%',
    height: 90,
    borderRadius: radius.inner,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  catTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  catTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.lime[300],
  },
  deleteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F7FEE7',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  errorBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },
  footer: {
    paddingTop: 10,
  },
  submitButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 10,
    ...shadows.lg,
  },
  sheetCardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  sheetOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetOptionText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#0F172A',
  },
  sheetCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  sheetCancelText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: '#64748B',
  },
});