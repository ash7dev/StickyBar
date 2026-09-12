import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  X,
  ShieldCheck,
  Eye,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Maximize2,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { PhotoEtatLieu } from '../../types/reservation-detail.types';

interface MobileCheckinGalleryModalProps {
  visible: boolean;
  photos: PhotoEtatLieu[];
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORIES_LABEL: Record<string, string> = {
  ENTREE: 'Entrée',
  SALON: 'Salon',
  CHAMBRE: 'Chambre',
  CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain',
  TERRASSE: 'Terrasse',
  AUTRE: 'Autre',
};

function formatDateShort(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function MobileCheckinGalleryModal({
  visible,
  photos,
  onClose,
}: MobileCheckinGalleryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filtrer les photos pour ne garder que les photos de type CHECKIN
  const checkinPhotos = useMemo(() => {
    const list = (photos || []).filter((p) => p.type === 'CHECKIN' || !p.type);
    return list.length > 0 ? list : photos;
  }, [photos]);

  // Groupes par catégorie
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    checkinPhotos.forEach((p) => {
      if (p.categorie) cats.add(p.categorie);
    });
    return Array.from(cats);
  }, [checkinPhotos]);

  // Photos filtrées selon la catégorie sélectionnée
  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'ALL') return checkinPhotos;
    return checkinPhotos.filter((p) => (p.categorie || 'AUTRE') === selectedCategory);
  }, [checkinPhotos, selectedCategory]);

  if (!visible) return null;

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const handleCategoryPress = (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedCategory(cat);
  };

  const handlePhotoPress = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setLightboxIndex(index);
  };

  const handlePrevPhoto = () => {
    if (lightboxIndex === null || lightboxIndex <= 0) return;
    Haptics.selectionAsync().catch(() => {});
    setLightboxIndex(lightboxIndex - 1);
  };

  const handleNextPhoto = () => {
    if (lightboxIndex === null || lightboxIndex >= filteredPhotos.length - 1) return;
    Haptics.selectionAsync().catch(() => {});
    setLightboxIndex(lightboxIndex + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.fullScreenContainer}>
        {/* Header Blanc Épuré */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.titleIconBadge}>
              <Eye size={18} color={colors.forest[700]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitleText}>État des lieux d’entrée</Text>
              <Text style={styles.headerSubText}>
                {checkinPhotos.length} photo{checkinPhotos.length > 1 ? 's' : ''} scellées et horodatées
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onClose();
            }}
            style={styles.closeBtn}
          >
            <X size={20} color={colors.neutral[700]} />
          </TouchableOpacity>
        </View>

        {/* Banner de Sécurité Legal sur Fond Clair */}
        <View style={styles.legalBanner}>
          <View style={styles.shieldIconCircle}>
            <ShieldCheck size={18} color={colors.forest[700]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.legalBannerTitle}>Preuves juridiquement valides</Text>
            <Text style={styles.legalBannerText}>
              Ces clichés font foi auprès du support Klef en cas de réclamation ou litige.
            </Text>
          </View>
        </View>

        {/* Barre de Filtres par Pièce / Catégorie */}
        {categoriesList.length > 0 && (
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCategoryPress('ALL')}
                style={[
                  styles.filterTab,
                  selectedCategory === 'ALL' && styles.filterTabActive,
                ]}
              >
                <Layers size={13} color={selectedCategory === 'ALL' ? colors.forest[950] : colors.neutral[600]} />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedCategory === 'ALL' && styles.filterTabTextActive,
                  ]}
                >
                  Toutes ({checkinPhotos.length})
                </Text>
              </TouchableOpacity>

              {categoriesList.map((cat) => {
                const count = checkinPhotos.filter((p) => p.categorie === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.8}
                    onPress={() => handleCategoryPress(cat)}
                    style={[
                      styles.filterTab,
                      isSelected && styles.filterTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        isSelected && styles.filterTabTextActive,
                      ]}
                    >
                      {CATEGORIES_LABEL[cat] || cat} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Grille de Photos sur Fond Blanc */}
        <ScrollView
          contentContainerStyle={styles.gridScrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Camera size={36} color={colors.neutral[400]} />
              <Text style={styles.emptyTitle}>Aucune photo disponible</Text>
              <Text style={styles.emptySub}>
                Aucun cliché n’a encore été importé pour cette catégorie.
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {filteredPhotos.map((photo, idx) => (
                <TouchableOpacity
                  key={photo.id || idx}
                  activeOpacity={0.9}
                  onPress={() => handlePhotoPress(idx)}
                  style={styles.photoCard}
                >
                  <Image source={{ uri: photo.url }} style={styles.cardImage} resizeMode="cover" />

                  {/* Overlay Gradient */}
                  <View style={styles.cardOverlayGradient}>
                    {/* Badge Catégorie Top Left */}
                    <View style={styles.cardCategoryBadge}>
                      <Text style={styles.cardCategoryText}>
                        {CATEGORIES_LABEL[photo.categorie] || photo.categorie || 'État des lieux'}
                      </Text>
                    </View>

                    {/* Button Zoom Top Right */}
                    <View style={styles.cardZoomBadge}>
                      <Maximize2 size={12} color={colors.neutral[0]} />
                    </View>

                    {/* Bottom Metadata Bar */}
                    <View style={styles.cardMetaBar}>
                      <Clock size={10} color={colors.neutral[0]} />
                      <Text style={styles.cardMetaTime}>
                        {formatDateShort(photo.creeLe) || 'Check-in'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ── LIGHTBOX PLEIN ÉCRAN DARK (pour l'affichage en grand) ───────────────────── */}
      {lightboxIndex !== null && currentLightboxPhoto && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setLightboxIndex(null)}>
          <View style={styles.lightboxContainer}>
            {/* Top Bar Lightbox */}
            <SafeAreaView style={styles.lightboxTopBar}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setLightboxIndex(null)}
                style={styles.lightboxCloseCircle}
              >
                <X size={20} color={colors.neutral[0]} />
              </TouchableOpacity>

              <View style={styles.lightboxTitleCenter}>
                <Text style={styles.lightboxCategoryTitle}>
                  {CATEGORIES_LABEL[currentLightboxPhoto.categorie] || currentLightboxPhoto.categorie || 'Check-in'}
                </Text>
                <Text style={styles.lightboxCounterText}>
                  Photo {lightboxIndex + 1} sur {filteredPhotos.length}
                </Text>
              </View>

              <View style={{ width: 40 }} />
            </SafeAreaView>

            {/* Main High-Res Image View */}
            <View style={styles.lightboxImageWrapper}>
              <Image
                source={{ uri: currentLightboxPhoto.url }}
                style={styles.lightboxMainImage}
                resizeMode="contain"
              />
            </View>

            {/* Bottom Metadata & Controls Overlay */}
            <SafeAreaView style={styles.lightboxBottomSection}>
              {/* Photo Details Badge */}
              <View style={styles.lightboxMetaCard}>
                <View style={styles.lightboxMetaRow}>
                  <CheckCircle2 size={14} color={colors.lime[400]} />
                  <Text style={styles.lightboxMetaText}>
                    Horodatée le {formatDateShort(currentLightboxPhoto.creeLe) || 'Jour J'}
                  </Text>
                </View>
                {currentLightboxPhoto.uploadePar && (
                  <Text style={styles.lightboxUploaderText}>
                    Ajoutée par : {currentLightboxPhoto.uploadePar}
                  </Text>
                )}
              </View>

              {/* Strip thumbnails preview */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.thumbnailStripContent}
              >
                {filteredPhotos.map((p, index) => {
                  const isActive = index === lightboxIndex;
                  return (
                    <TouchableOpacity
                      key={p.id || index}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setLightboxIndex(index);
                      }}
                      style={[styles.stripThumbWrapper, isActive && styles.stripThumbActive]}
                    >
                      <Image source={{ uri: p.url }} style={styles.stripThumbImage} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Arrow Nav Buttons */}
              <View style={styles.navControlsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={lightboxIndex === 0}
                  onPress={handlePrevPhoto}
                  style={[styles.navArrowBtn, lightboxIndex === 0 && styles.navArrowDisabled]}
                >
                  <ChevronLeft size={22} color={colors.neutral[0]} />
                </TouchableOpacity>

                <Text style={styles.navIndexIndicator}>
                  {lightboxIndex + 1} / {filteredPhotos.length}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={lightboxIndex === filteredPhotos.length - 1}
                  onPress={handleNextPhoto}
                  style={[
                    styles.navArrowBtn,
                    lightboxIndex === filteredPhotos.length - 1 && styles.navArrowDisabled,
                  ]}
                >
                  <ChevronRight size={22} color={colors.neutral[0]} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },

  // ── Header Bar Blanc ──────────────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  verifiedTagText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.forest[800],
  },
  headerSubText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Legal Banner Clair ────────────────────────────────────────────────
  legalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: radius.card,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  shieldIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalBannerTitle: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  legalBannerText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[800],
    lineHeight: 15,
    marginTop: 2,
  },

  // ── Filters ────────────────────────────────────────────────────────────
  filterSection: {
    marginVertical: 6,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterTabActive: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[400],
  },
  filterTabText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[700],
  },
  filterTabTextActive: {
    fontFamily: typography.fontBodyExtraBold,
    color: colors.forest[950],
  },

  // ── Grid & Photos ──────────────────────────────────────────────────────
  gridScrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    height: (SCREEN_WIDTH - 42) / 2 * 1.1,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    position: 'relative',
    ...shadows.sm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 25, 18, 0.25)',
    justifyContent: 'space-between',
    padding: 8,
  },
  cardCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  cardCategoryText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[0],
  },
  cardZoomBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.inner,
    alignSelf: 'flex-start',
  },
  cardMetaTime: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[0],
  },

  // ── Empty State ────────────────────────────────────────────────────────
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  emptySub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // ── Lightbox ───────────────────────────────────────────────────────────
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 10,
  },
  lightboxCloseCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxTitleCenter: {
    alignItems: 'center',
  },
  lightboxCategoryTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.neutral[0],
  },
  lightboxCounterText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
  },
  lightboxImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxMainImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  lightboxBottomSection: {
    paddingBottom: 20,
    gap: 14,
  },
  lightboxMetaCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  lightboxMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lightboxMetaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[0],
  },
  lightboxUploaderText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[400],
  },

  thumbnailStripContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  stripThumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: radius.inner,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  stripThumbActive: {
    borderColor: colors.lime[400],
    opacity: 1,
  },
  stripThumbImage: {
    width: '100%',
    height: '100%',
  },

  navControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  navArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navIndexIndicator: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[300],
  },
});
