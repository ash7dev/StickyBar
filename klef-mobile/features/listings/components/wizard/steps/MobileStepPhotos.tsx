import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import {
  Camera,
  ImagePlus,
  Star,
  Trash2,
  CheckCircle2,
  Film,
  Upload,
  ChevronDown,
  X,
  Play,
  Check,
  Plus,
  Folder,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import {
  useListingWizardFormStore,
  PhotoItem,
} from '../../../stores/useListingWizardFormStore';

const MIN_PHOTOS = 1;
const RECOMMENDED_PHOTOS = 5;
const MAX_PHOTOS = 15;

const CAT_LABELS: Record<string, string> = {
  SALON: 'Salon',
  CHAMBRE: 'Chambre',
  CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain',
  TERRASSE: 'Terrasse',
  VUE: 'Vue',
  ENTREE: 'Entrée',
  PISCINE: 'Piscine',
  AUTRE: 'Autre',
};

export function MobileStepPhotos() {
  const {
    photos,
    addPhoto,
    removePhoto,
    updatePhoto,
    setMainPhoto,
    video,
    setVideo,
  } = useListingWizardFormStore();

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);

  const count = photos.length;
  const isComplete = count >= MIN_PHOTOS;
  const isRecommendedMet = count >= RECOMMENDED_PHOTOS;
  const slotsLeft = MAX_PHOTOS - count;

  const principal = photos.find((p) => p.estPrincipale) ?? photos[0];

  const handleOpenPhotoPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Photothèque', 'Prendre une photo', 'Choisir les fichiers', 'Annuler'],
          cancelButtonIndex: 3,
          title: 'Ajouter des photos du logement',
        },
        (buttonIndex) => {
          if (buttonIndex === 0 || buttonIndex === 2) {
            handlePickFromLibrary();
          } else if (buttonIndex === 1) {
            handleTakePhoto();
          }
        }
      );
    } else {
      setShowSourceModal(true);
    }
  };

  const handlePickFromLibrary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès aux photos requis pour ajouter des images du logement.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const remainingSlots = MAX_PHOTOS - photos.length;
      const acceptedAssets = result.assets.slice(0, remainingSlots);

      acceptedAssets.forEach((asset) => {
        addPhoto({ uri: asset.uri, categorie: 'AUTRE' });
      });

      if (result.assets.length > remainingSlots) {
        Alert.alert('Limite atteinte', `Seules ${remainingSlots} photo(s) ont été ajoutées (max ${MAX_PHOTOS}).`);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleTakePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limite atteinte', `Maximum ${MAX_PHOTOS} photos autorisé.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à l’appareil photo requis.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      addPhoto({ uri: result.assets[0].uri, categorie: 'AUTRE' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la bibliothèque requis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const durationSec = asset.duration ? Math.round(asset.duration / 1000) : undefined;

      if (durationSec && durationSec > 90) {
        Alert.alert(
          'Vidéo trop longue',
          `La durée de votre vidéo est de ${durationSec}s. La durée maximale autorisée est de 1 min 30s (90s).`
        );
        return;
      }

      setVideo({
        uri: asset.uri,
        name: asset.fileName ?? 'Visite_Logement.mp4',
        duration: durationSec,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      {/* ── SECTION 1 : Photos du logement ───────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Camera size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Photos du logement</Text>
            <Text style={styles.sectionDesc}>
              Ajoutez au moins {MIN_PHOTOS} photo de couverture pour continuer ({RECOMMENDED_PHOTOS} recommandées, {MAX_PHOTOS} max).
            </Text>
          </View>
        </View>

        {/* Progression Status Bar */}
        <View style={[styles.progressCard, isComplete ? styles.progressCardSuccess : styles.progressCardNeutral]}>
          <View style={styles.progressLeft}>
            <View style={[styles.progressIconCircle, isComplete && styles.progressIconCircleSuccess]}>
              {isComplete ? (
                <CheckCircle2 size={18} color={colors.forest[800]} />
              ) : (
                <Camera size={18} color={colors.neutral[500]} />
              )}
            </View>
            <View style={styles.progressTextStack}>
              <Text style={[styles.progressTitle, isComplete && styles.progressTitleSuccess]}>
                {isRecommendedMet
                  ? 'Nombre idéal de photos atteint'
                  : isComplete
                  ? `Photo de couverture ajoutée (${count}/${RECOMMENDED_PHOTOS} recommandées)`
                  : 'Au moins 1 photo requise'}
              </Text>
              <Text style={styles.progressSubtext}>
                {count} / {MAX_PHOTOS} sélectionnée{count > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* 15 Bar Pillars */}
          <View style={styles.barsRow}>
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barPillar,
                  i < count
                    ? styles.barPillarFilled
                    : i < MIN_PHOTOS
                    ? styles.barPillarReq
                    : styles.barPillarEmpty,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Featured Cover Hero Image ──────────────────────────────── */}
        {principal && (
          <View style={styles.coverHeroCard}>
            <Image source={{ uri: principal.uri }} style={styles.coverHeroImage} />
            <View style={styles.coverHeroOverlay}>
              <View style={styles.coverHeroBadge}>
                <Star size={12} color={colors.gold[400]} fill={colors.gold[400]} />
                <Text style={styles.coverHeroBadgeText}>Photo de couverture</Text>
              </View>

              <View style={styles.coverHeroCategoryPill}>
                <Text style={styles.coverHeroCategoryText}>
                  {CAT_LABELS[principal.categorie ?? 'AUTRE'] ?? 'Autre'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Single Primary Airbnb-style Add Button ───────────────────── */}
        {slotsLeft > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenPhotoPicker}
            style={styles.singleAddPhotosBtn}
          >
            <Plus size={18} color={colors.forest[950]} strokeWidth={2.8} />
            <Text style={styles.singleAddPhotosBtnText}>
              {photos.length === 0 ? 'Ajouter des photos du logement' : 'Ajouter d’autres photos'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Photo Grid ───────────────────────────────────────────── */}
        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((item, index) => {
              const isCover = item.estPrincipale;

              return (
                <View
                  key={item.uri + index}
                  style={[styles.photoCard, isCover && styles.photoCardCover]}
                >
                  <Image source={{ uri: item.uri }} style={styles.photoImage} />

                  {/* Top bar overlay */}
                  <View style={styles.photoTopOverlay}>
                    {isCover ? (
                      <View style={styles.coverPillMini}>
                        <Star size={10} color={colors.forest[950]} fill={colors.forest[950]} />
                        <Text style={styles.coverPillMiniText}>Couverture</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setMainPhoto(index);
                        }}
                        style={styles.setCoverBtnMini}
                      >
                        <Star size={10} color={colors.neutral[0]} />
                        <Text style={styles.setCoverTextMini}>Couverture</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        removePhoto(index);
                      }}
                      style={styles.deleteBtnMini}
                    >
                      <Trash2 size={13} color={colors.error[500]} />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Category Selector Button */}
                  <View style={styles.photoBottomOverlay}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setActivePhotoIndex(index);
                      }}
                      style={styles.catSelectorBtn}
                    >
                      <Text style={styles.catSelectorBtnText}>
                        {CAT_LABELS[item.categorie ?? 'AUTRE'] ?? 'Autre'}
                      </Text>
                      <ChevronDown size={12} color={colors.neutral[0]} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Hero Interactive Dropzone Card when 0 photos */}
        {photos.length === 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpenPhotoPicker}
            style={styles.heroDropzoneBox}
          >
            <View style={styles.heroDropzoneIconCircle}>
              <Camera size={24} color={colors.forest[800]} />
            </View>
            <Text style={styles.heroDropzoneTitle}>Ajoutez les photos de votre bien</Text>
            <Text style={styles.heroDropzoneDesc}>
              Au moins 1 photo de couverture requise · 15 photos max · format JPEG, PNG, WebP
            </Text>
            <View style={styles.heroDropzonePill}>
              <Plus size={14} color={colors.forest[950]} strokeWidth={2.8} />
              <Text style={styles.heroDropzonePillText}>Parcourir mes photos</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── SECTION 2 : Visite en vidéo (Optionnel) ────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Film size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.sectionTitle}>Visite en vidéo</Text>
              <View style={styles.optionBadge}>
                <Text style={styles.optionBadgeText}>OPTIONNEL</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>
              1 min 30 maximum · le format vertical rend mieux sur mobile
            </Text>
          </View>
        </View>

        {video ? (
          <View style={styles.videoSuccessBox}>
            <View style={styles.videoSuccessLeft}>
              <View style={styles.videoPlayCircle}>
                <Play size={16} color={colors.forest[950]} fill={colors.forest[950]} />
              </View>
              <View style={styles.videoTextStack}>
                <Text style={styles.videoSuccessTitle}>
                  Vidéo prête{video.duration ? ` · ${video.duration} s` : ''}
                </Text>
                <Text style={styles.videoNameText} numberOfLines={1}>
                  {video.name ?? 'Visite_Logement.mp4'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setVideo(null);
              }}
              style={styles.removeVideoBtn}
            >
              <Text style={styles.removeVideoBtnText}>Retirer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePickVideo}
            style={styles.addVideoCard}
          >
            <View style={styles.addVideoLeft}>
              <Text style={styles.addVideoTitle}>Ajouter une vidéo de visite</Text>
              <Text style={styles.addVideoDesc}>MP4, MOV · 1 min 30 maximum</Text>
            </View>
            <View style={styles.addVideoBtnPill}>
              <Upload size={14} color={colors.forest[950]} />
              <Text style={styles.addVideoBtnPillText}>Choisir</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category Modal Overlay ────────────────────────────────────── */}
      <Modal
        visible={activePhotoIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePhotoIndex(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActivePhotoIndex(null)}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>CATÉGORIE DE LA PHOTO</Text>
              <TouchableOpacity
                onPress={() => setActivePhotoIndex(null)}
                style={styles.modalCloseBtn}
              >
                <X size={16} color={colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalCatList}>
              {Object.entries(CAT_LABELS).map(([catKey, catLabel]) => {
                const currentCat =
                  activePhotoIndex !== null
                    ? photos[activePhotoIndex]?.categorie ?? 'AUTRE'
                    : 'AUTRE';
                const isSelected = currentCat === catKey;

                return (
                  <TouchableOpacity
                    key={catKey}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (activePhotoIndex !== null) {
                        Haptics.selectionAsync().catch(() => {});
                        updatePhoto(activePhotoIndex, { categorie: catKey });
                        setActivePhotoIndex(null);
                      }
                    }}
                    style={[styles.catOptionRow, isSelected && styles.catOptionRowSelected]}
                  >
                    <Text style={[styles.catOptionLabel, isSelected && styles.catOptionLabelSelected]}>
                      {catLabel}
                    </Text>
                    {isSelected && <Check size={16} color={colors.forest[950]} strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Photo Source Action Sheet Modal ───────────────────────── */}
      <Modal
        visible={showSourceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSourceModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSourceModal(false)}
          style={styles.sourceModalBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.sourceModalCard}
          >
            <View style={styles.sourceModalHandle} />
            <Text style={styles.sourceModalTitle}>AJOUTER DES PHOTOS</Text>
            <Text style={styles.sourceModalSubtitle}>
              Choisissez la provenance de vos images
            </Text>

            <View style={styles.sourceOptionsStack}>
              {/* Option 1 : Photothèque */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowSourceModal(false);
                  handlePickFromLibrary();
                }}
                style={styles.sourceOptionBtn}
              >
                <View style={styles.sourceOptionIconCircle}>
                  <ImagePlus size={20} color={colors.forest[950]} />
                </View>
                <View style={styles.sourceOptionTextStack}>
                  <Text style={styles.sourceOptionTitle}>Photothèque</Text>
                  <Text style={styles.sourceOptionDesc}>Sélectionnez dans vos albums photos</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2 : Fichiers */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowSourceModal(false);
                  handlePickFromLibrary();
                }}
                style={styles.sourceOptionBtn}
              >
                <View style={styles.sourceOptionIconCircleBlue}>
                  <Folder size={20} color={colors.forest[900]} />
                </View>
                <View style={styles.sourceOptionTextStack}>
                  <Text style={styles.sourceOptionTitle}>Fichiers</Text>
                  <Text style={styles.sourceOptionDesc}>Parcourir vos dossiers et stockage d'images</Text>
                </View>
              </TouchableOpacity>

              {/* Option 3 : Appareil photo */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowSourceModal(false);
                  handleTakePhoto();
                }}
                style={styles.sourceOptionBtn}
              >
                <View style={styles.sourceOptionIconCircleDark}>
                  <Camera size={20} color={colors.lime[400]} />
                </View>
                <View style={styles.sourceOptionTextStack}>
                  <Text style={styles.sourceOptionTitle}>Appareil photo</Text>
                  <Text style={styles.sourceOptionDesc}>Prenez une photo instantanée du logement</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSourceModal(false)}
              style={styles.sourceCancelBtn}
            >
              <Text style={styles.sourceCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },

  sectionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderStack: {
    flex: 1,
    gap: 2,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
  },
  optionBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  optionBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[600],
    letterSpacing: 0.4,
  },
  sectionDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },

  // Progress Card
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
  },
  progressCardSuccess: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[200],
  },
  progressCardNeutral: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  progressLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  progressIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconCircleSuccess: {
    backgroundColor: colors.forest[100],
  },
  progressTextStack: {
    flex: 1,
    gap: 1,
  },
  progressTitle: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[700],
  },
  progressTitleSuccess: {
    color: colors.forest[950],
    fontFamily: typography.fontBodyBold,
  },
  progressSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barPillar: {
    width: 4,
    borderRadius: radius.pill,
  },
  barPillarFilled: {
    height: 18,
    backgroundColor: colors.forest[800],
  },
  barPillarReq: {
    height: 12,
    backgroundColor: colors.warning[500],
  },
  barPillarEmpty: {
    height: 8,
    backgroundColor: colors.neutral[300],
  },

  // Featured Cover Hero
  coverHeroCard: {
    width: '100%',
    height: 190,
    borderRadius: radius.card,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.neutral[900],
    borderWidth: 1.5,
    borderColor: colors.gold[400],
    ...shadows.sm,
  },
  coverHeroImage: {
    width: '100%',
    height: '100%',
  },
  coverHeroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
  },
  coverHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(234, 179, 8, 0.20)',
    borderWidth: 1,
    borderColor: colors.gold[400],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  coverHeroBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.gold[400],
  },
  coverHeroCategoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  coverHeroCategoryText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[0],
  },

  // Single Primary Action Button
  singleAddPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    height: 48,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    ...shadows.action,
  },
  singleAddPhotosBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },

  // Hero Dropzone Card
  heroDropzoneBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  heroDropzoneIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lime[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDropzoneTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
    textAlign: 'center',
  },
  heroDropzoneDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
  },
  heroDropzonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.xs,
  },
  heroDropzonePillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },

  // Photo Source Action Sheet Modal
  sourceModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  sourceModalCard: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 12,
    ...shadows.lg,
  },
  sourceModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 4,
  },
  sourceModalTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[400],
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  sourceModalSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    marginTop: -6,
  },
  sourceOptionsStack: {
    gap: 10,
    marginTop: 6,
  },
  sourceOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sourceOptionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.lime[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionIconCircleBlue: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionIconCircleDark: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceOptionTextStack: {
    flex: 1,
    gap: 2,
  },
  sourceOptionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  sourceOptionDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },
  sourceCancelBtn: {
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  sourceCancelBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[700],
  },

  // Photo Grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '48%',
    height: 140,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  photoCardCover: {
    borderColor: colors.gold[400],
    borderWidth: 1.5,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoTopOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coverPillMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  coverPillMiniText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[950],
  },
  setCoverBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  setCoverTextMini: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 9.5,
    color: colors.neutral[0],
  },
  deleteBtnMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBottomOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  catSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(4, 25, 18, 0.80)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  catSelectorBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10.5,
    color: colors.neutral[0],
  },

  // Dropzone Box
  dropzoneBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 24,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
  },
  dropzoneIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropzoneTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  dropzoneDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // Video Section
  addVideoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  addVideoLeft: {
    flex: 1,
    gap: 2,
  },
  addVideoTitle: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  addVideoDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },
  addVideoBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  addVideoBtnPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  videoSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forest[50],
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  videoSuccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  videoPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTextStack: {
    flex: 1,
    gap: 1,
  },
  videoSuccessTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  videoNameText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[800],
  },
  removeVideoBtn: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  removeVideoBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11.5,
    color: colors.error[600],
  },

  // Modal Category Sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.70)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    maxHeight: 440,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 12,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCatList: {
    gap: 4,
  },
  catOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
  },
  catOptionRowSelected: {
    backgroundColor: colors.forest[50],
  },
  catOptionLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13.5,
    color: colors.neutral[800],
  },
  catOptionLabelSelected: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
});
