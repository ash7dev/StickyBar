import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, X, Check, Save, RefreshCw, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../shared/api/api-client';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { useListingWizardFormStore, PhotoItem } from '../../features/listings/stores/useListingWizardFormStore';
import { useRoleStore } from '../../shared/stores/role.store';
import { MobileStepBien } from '../../features/listings/components/wizard/steps/MobileStepBien';
import { MobileStepAnnonce } from '../../features/listings/components/wizard/steps/MobileStepAnnonce';
import { MobileStepEquipements } from '../../features/listings/components/wizard/steps/MobileStepEquipements';
import { MobileStepConditions } from '../../features/listings/components/wizard/steps/MobileStepConditions';
import { MobileStepPhotos } from '../../features/listings/components/wizard/steps/MobileStepPhotos';
import { MobileStepConfirmation } from '../../features/listings/components/wizard/steps/MobileStepConfirmation';
import { MobileListingEditHeader } from '../../features/listings/components/owner/MobileListingEditHeader';
import { MobileListingEditSkeleton } from '../../features/listings/components/owner/MobileListingEditSkeleton';

const STEP_TITLES_CREATION = [
  'Votre logement',
  'Votre annonce',
  'Équipements et services',
  'Conditions et règles',
  'Photos du bien',
  'Récapitulatif & Validation',
];

const STEP_SUBTITLES_CREATION = [
  'Décrivez votre bien et sa géolocalisation GPS',
  'Rédigez votre annonce et fixez votre tarif par nuitée',
  'Sélectionnez les équipements et services mis à disposition',
  'Définissez vos règles, vos identifiants Wifi et le digicode',
  'Ajoutez au minimum 5 photos haute définition',
  'Vérifiez l’intégralité de vos informations puis soumettez',
];

const STEP_TITLES_EDIT = [
  'Logement & Caractéristiques',
  'Titre & Tarifications de base',
  'Équipements & Prestations',
  'Conditions, Accès & Wifi',
  'Galerie Photos du bien',
  'Récapitulatif & Tarifs Paliers',
];

const STEP_SUBTITLES_EDIT = [
  'Modifiez le type de logement, l’adresse et la capacité d’accueil',
  'Ajustez le nom de l’annonce, le tarif par nuitée et la caution',
  'Cochez ou décochez les équipements disponibles dans le bien',
  'Configurez le digicode, le réseau Wifi et le règlement intérieur',
  'Gérez l’ordre et l’ajout de vos photos haute définition',
  'Consultez la synthèse et configurez vos réductions par durée',
];

export default function AddListingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const {
    currentStep,
    setStep,
    nextStep,
    prevStep,
    completedSteps,
    markCompleted,
    reset,
    hydrateFromListing,
    bien,
    annonce,
    equipements,
    conditions,
    photos,
    tarifsNuits,
    tarifsPersonnes,
  } = useListingWizardFormStore();
  
  const { activeRole, setActiveRole } = useRoleStore();
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (activeRole !== 'PROPRIETAIRE' && activeRole !== 'GESTIONNAIRE') {
      setActiveRole('PROPRIETAIRE').catch(() => {});
    }
  }, [activeRole, setActiveRole]);

  // ── Query listing detail if in Edit Mode ────────────────────────────
  const {
    data: listingData,
    isLoading: isListingLoading,
    isError: isListingError,
    refetch: refetchListing,
  } = useQuery({
    queryKey: ['listing-owner', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/listings/${id}`);
      return res.data;
    },
    enabled: isEditMode,
  });

  // ── Hydrate Store on Load in Edit Mode ──────────────────────────────
  React.useEffect(() => {
    if (isEditMode && listingData) {
      hydrateFromListing(listingData);
    }
  }, [isEditMode, listingData, hydrateFromListing]);

  const isLastStep = currentStep === 5;

  const handleQuit = () => {
    Alert.alert(
      isEditMode ? 'Quitter la modification ?' : 'Quitter la création ?',
      isEditMode
        ? 'Les modifications non enregistrées seront perdues.'
        : 'Vos informations actuelles resteront sauvegardées en brouillon.',
      [
        { text: 'Poursuivre', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            reset();
            router.back();
          },
        },
      ]
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !annonce.titre.trim()) {
      Alert.alert('Titre requis', 'Veuillez saisir un titre d’annonce avant de continuer.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    markCompleted(currentStep);
    nextStep();
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    prevStep();
  };

  const handleSegmentPress = (stepIndex: number) => {
    if (isEditMode || stepIndex < currentStep || completedSteps.includes(stepIndex)) {
      Haptics.selectionAsync().catch(() => {});
      setStep(stepIndex);
    }
  };

  // ── Section Save Handler for Edit Mode ───────────────────────────────
  const handleSaveEditSection = async (sectionIndex: number = currentStep) => {
    if (!id) return;
    setIsSaving(true);

    try {
      if (sectionIndex === 0) {
        // Section Logement
        await apiClient.patch(`/listings/${id}`, {
          type: bien.type,
          sousType: bien.sousType,
          ville: bien.ville,
          adresse: bien.adresse,
          latitude: bien.latitude ?? undefined,
          longitude: bien.longitude ?? undefined,
          nombreChambres: bien.nombreChambres,
          nombreSallesBain: bien.nombreSallesBain,
          nombrePieces: bien.nombrePieces,
          capaciteMax: bien.capaciteMax,
        });
      } else if (sectionIndex === 1) {
        // Section Présentation & Prix
        await apiClient.patch(`/listings/${id}`, {
          titre: annonce.titre,
          description: annonce.description,
          prixBase: annonce.prixBase,
          nuitesMinimum: annonce.nuitesMinimum,
          isInstantBooking: annonce.isInstantBooking,
        });
      } else if (sectionIndex === 2) {
        // Section Équipements
        await apiClient.put(`/listings/${id}/equipements`, {
          equipementIds: equipements,
        });
      } else if (sectionIndex === 3) {
        // Section Conditions & Livret
        await apiClient.patch(`/listings/${id}`, {
          reglesMaison: conditions.reglesMaison,
          instructionsAcces: conditions.instructionsAcces,
          nomReseauWifi: conditions.nomReseauWifi,
          codeWifi: conditions.codeWifi,
          instructionsDigicode: conditions.instructionsDigicode,
          regimeElectricite: conditions.regimeElectricite,
          detailsElectricite: conditions.detailsElectricite,
        });
      } else if (sectionIndex === 4) {
        // Section Photos
        const formattedPhotos = photos.map((p: PhotoItem) => p.url || p.uri);
        await apiClient.patch(`/listings/${id}`, {
          photos: formattedPhotos,
        });
      } else if (sectionIndex === 5) {
        // Section Tarifs & Paliers
        const promises = [];
        if (tarifsNuits.length > 0) {
          promises.push(
            apiClient.post(`/listings/${id}/tarifs-nuits`, {
              tarifs: tarifsNuits.map((t) => ({
                dureeMinNuits: t.nuitsMin,
                prix: t.prix,
              })),
            })
          );
        }
        if (tarifsPersonnes.length > 0) {
          promises.push(
            apiClient.post(`/listings/${id}/tarifs-personnes`, {
              tarifs: tarifsPersonnes,
            })
          );
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['listing-owner', id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });

      Alert.alert(
        'Modifications enregistrées',
        'La section a été mise à jour avec succès.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert(
        'Erreur de sauvegarde',
        err?.response?.data?.message || err?.message || 'Impossible d’enregistrer la section.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render Loading State in Edit Mode ────────────────────────────────
  if (isEditMode && isListingLoading) {
    return <MobileListingEditSkeleton />;
  }

  // ── Render Error State in Edit Mode ──────────────────────────────────
  if (isEditMode && isListingError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconCircle}>
              <AlertTriangle size={28} color="#DC2626" />
            </View>
            <Text style={styles.errorTitle}>Impossible de charger l'annonce</Text>
            <Text style={styles.errorSubtitle}>
              Une erreur est survenue lors de la récupération des détails du bien. Vérifiez votre connexion.
            </Text>
            <View style={styles.errorActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => refetchListing()}
                style={styles.retryBtn}
              >
                <RefreshCw size={14} color={colors.forest[950]} />
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.back()}
                style={styles.backErrBtn}
              >
                <ArrowLeft size={14} color={colors.forest[950]} />
                <Text style={styles.backErrBtnText}>Retour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const titles = isEditMode ? STEP_TITLES_EDIT : STEP_TITLES_CREATION;
  const subtitles = isEditMode ? STEP_SUBTITLES_EDIT : STEP_SUBTITLES_CREATION;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Ultra-Premium Header Bar ─────────────────────────── */}
      {isEditMode ? (
        <MobileListingEditHeader
          currentSection={currentStep}
          onSelectSection={handleSegmentPress}
          onBack={handleQuit}
          onSave={() => handleSaveEditSection(currentStep)}
          isSaving={isSaving}
          statut={listingData?.statut}
          titreLogement={annonce.titre}
        />
      ) : (
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            {/* Quit Button Pill */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleQuit} style={styles.quitBtn}>
              <X size={15} color={colors.forest[950]} />
              <Text style={styles.quitText}>Quitter</Text>
            </TouchableOpacity>

            {/* Central Counter Pill */}
            <View style={styles.counterBadge}>
              <Text style={styles.counterBadgeText}>
                Étape {currentStep + 1} sur 6
              </Text>
            </View>

            {/* Auto Saved Status */}
            <View style={styles.savedStatusGroup}>
              <Check size={13} color={colors.forest[700]} />
              <Text style={styles.savedStatusText}>Brouillon</Text>
            </View>
          </View>

          {/* Segmented Step Indicators (6 Pill Capsules) */}
          <View style={styles.segmentsRow}>
            {[0, 1, 2, 3, 4, 5].map((stepIdx) => {
              const isActive = stepIdx === currentStep;
              const isCompleted = completedSteps.includes(stepIdx) || stepIdx < currentStep;

              return (
                <TouchableOpacity
                  key={stepIdx}
                  activeOpacity={0.7}
                  disabled={!isCompleted && stepIdx > currentStep}
                  onPress={() => handleSegmentPress(stepIdx)}
                  style={styles.segmentTouchable}
                >
                  <View
                    style={[
                      styles.segmentCapsule,
                      isActive && styles.segmentCapsuleActive,
                      isCompleted && !isActive && styles.segmentCapsuleCompleted,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── Main Step Scroll Content ─────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Premium Step Title Box */}
        <View style={styles.stepTitleBox}>
          <View style={styles.eyebrowChip}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>
              {isEditMode ? "MODIFICATION D'ANNONCE" : 'NOUVELLE ANNONCE'}
            </Text>
          </View>

          <Text style={styles.stepTitle}>{titles[currentStep]}</Text>
          <Text style={styles.stepSubtitle}>{subtitles[currentStep]}</Text>
        </View>

        {/* Step Component View */}
        {currentStep === 0 && <MobileStepBien />}
        {currentStep === 1 && <MobileStepAnnonce />}
        {currentStep === 2 && <MobileStepEquipements />}
        {currentStep === 3 && <MobileStepConditions />}
        {currentStep === 4 && <MobileStepPhotos />}
        {currentStep === 5 && <MobileStepConfirmation />}
      </ScrollView>

      {/* ── Sticky Bottom Action Navigation Bar ──────────────────── */}
      {isEditMode ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.back();
            }}
            style={styles.prevBtn}
          >
            <ArrowLeft size={16} color={colors.forest[800]} />
            <Text style={styles.prevBtnText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={() => handleSaveEditSection(currentStep)}
            style={[styles.nextBtnLime, isSaving && styles.btnDisabled]}
          >
            <Save size={16} color={colors.forest[950]} strokeWidth={2.5} />
            <Text style={styles.nextBtnLimeText}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        !isLastStep && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevStep}
              disabled={currentStep === 0}
              style={[styles.prevBtn, currentStep === 0 && styles.btnDisabled]}
            >
              <ArrowLeft size={16} color={currentStep === 0 ? colors.neutral[400] : colors.forest[800]} />
              <Text style={[styles.prevBtnText, currentStep === 0 && styles.btnTextDisabled]}>
                Précédent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNextStep}
              style={styles.nextBtnLime}
            >
              <Text style={styles.nextBtnLimeText}>
                {currentStep === 4 ? 'Vérifier l’annonce' : 'Continuer'}
              </Text>
              <ArrowRight size={16} color={colors.forest[950]} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 19,
  },
  errorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  retryBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  backErrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  backErrBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  // Premium Header Container
  headerContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
    ...shadows.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 42,
  },

  // Quit Button
  quitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quitText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  // Counter Badge
  counterBadge: {
    backgroundColor: colors.forest[950],
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  counterBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.lime[400],
    letterSpacing: 0.3,
  },

  // Saved Status
  savedStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  savedStatusText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[800],
  },

  // Segmented Pill Indicators
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 6,
  },
  segmentTouchable: {
    flex: 1,
    paddingVertical: 4,
  },
  segmentCapsule: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.neutral[200],
  },
  segmentCapsuleActive: {
    backgroundColor: colors.lime[500],
  },
  segmentCapsuleCompleted: {
    backgroundColor: colors.forest[950],
  },

  // Scroll Content
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    gap: 20,
  },

  // Step Title Box
  stepTitleBox: {
    gap: 6,
  },
  eyebrowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(155, 194, 44, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(155, 194, 44, 0.30)',
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime[600],
  },
  eyebrowText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.lime[700],
    letterSpacing: 1,
  },
  stepTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 25,
    color: colors.forest[950],
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 19,
  },

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    ...shadows.float,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  btnDisabled: {
    opacity: 0.4,
  },
  prevBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[800],
  },
  btnTextDisabled: {
    color: colors.neutral[400],
  },
  nextBtnLime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  nextBtnLimeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
});
