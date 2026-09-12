import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { ReservationDetail } from '../../features/reservations/types/reservation-detail.types';
import { MobileDetailTopBar } from '../../features/reservations/components/detail/MobileDetailTopBar';
import { MobileTenantReservationHero } from '../../features/reservations/components/detail/MobileTenantReservationHero';
import { MobileContractBannerCard } from '../../features/reservations/components/detail/MobileContractBannerCard';
import { MobileHostPropertyGrid } from '../../features/reservations/components/detail/MobileHostPropertyGrid';
import { MobileFinancialCard } from '../../features/reservations/components/detail/MobileFinancialCard';
import { MobileReservationTimeline } from '../../features/reservations/components/detail/MobileReservationTimeline';
import { MobileTenantActionStickyBar } from '../../features/reservations/components/detail/MobileTenantActionStickyBar';
import { MobileLitigeCard } from '../../features/reservations/components/detail/MobileLitigeCard';
import { MobileExtraFeesCard } from '../../features/reservations/components/detail/MobileExtraFeesCard';
import { MobileDigitalWelcomeGuideModal } from '../../features/reservations/components/detail/MobileDigitalWelcomeGuideModal';
import { MobileCheckinGalleryModal } from '../../features/reservations/components/detail/MobileCheckinGalleryModal';
import { MobileEtatLieuxPreviewCard } from '../../features/reservations/components/detail/MobileEtatLieuxPreviewCard';
import { MobileCheckInTimeCard } from '../../features/reservations/components/detail/MobileCheckInTimeCard';
import { MobileAssistanceCard } from '../../features/reservations/components/detail/MobileAssistanceCard';

// ── Premium Shimmer Skeleton ─────────────────────────────────────────────
function SkeletonBlock({ style }: { style: any }) {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[style, { opacity: shimmerAnim }]} />;
}

function DetailSkeleton() {
  return (
    <View style={styles.skeletonStack}>
      <SkeletonBlock style={styles.skeletonHero} />
      <SkeletonBlock style={styles.skeletonBanner} />
      <View style={styles.skeletonRow}>
        <SkeletonBlock style={styles.skeletonHalf} />
        <SkeletonBlock style={styles.skeletonHalf} />
      </View>
      <SkeletonBlock style={styles.skeletonBox} />
      <SkeletonBlock style={styles.skeletonBoxSmall} />
    </View>
  );
}

// ── Section Divider ──────────────────────────────────────────────────────
function SectionDivider({ label }: { label?: string }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      {label && <Text style={styles.dividerLabel}>{label}</Text>}
      {label && <View style={styles.dividerLine} />}
    </View>
  );
}

export default function ReservationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const reservationId = params.id || '';

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showWelcomeGuideModal, setShowWelcomeGuideModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Fade-in animation for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!reservationId) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await apiClient.get<any>(`/reservations/${reservationId}`);
      const data = res.data?.data || res.data;
      setReservation(data);

      // Animate content in
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err: any) {
      console.warn('[ReservationDetailScreen] Error fetching reservation:', err);
      const msg = err.response?.data?.message || 'Impossible de charger les détails de cette réservation.';
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reservationId]);

  useEffect(() => {
    setReservation(null);
    setLoading(true);
    fetchDetail(false);
  }, [reservationId, fetchDetail]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Floating Top Navigation Bar */}
        <View style={styles.headerPadding}>
          <MobileDetailTopBar
            id={reservationId}
            statut={reservation?.statut}
            onBack={() => router.navigate('/(tenant)/reservations')}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDetail(true)}
              tintColor={colors.forest[800]}
              colors={[colors.forest[800]]}
            />
          }
        >
          {loading && !refreshing ? (
            <DetailSkeleton />
          ) : error || !reservation ? (
            <View style={styles.errorCard}>
              <View style={styles.errorIconCircle}>
                <AlertCircle size={28} color={colors.error[600]} />
              </View>
              <Text style={styles.errorTitle}>Réservation introuvable</Text>
              <Text style={styles.errorSub}>{error || 'Cette réservation n\'existe pas ou ne vous appartient pas.'}</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => fetchDetail(false)}
                style={styles.retryBtn}
              >
                <RefreshCw size={14} color={colors.forest[950]} />
                <Text style={styles.retryBtnText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Animated.View style={[styles.contentStack, { opacity: fadeAnim }]}>
              {/* 1. Héro Sombre Impérial & Métriques */}
              <MobileTenantReservationHero res={reservation} />

              {/* 1.2. Card Horaires & Accès au séjour (Check-in time & conseils) */}
              <MobileCheckInTimeCard res={reservation} />

              {/* 1.5. Carte de Litige (Si litige actif) */}
              {(reservation.litige || reservation.statut === 'DISPUTED') && reservation.litige ? (
                <MobileLitigeCard litige={reservation.litige} />
              ) : null}

              {/* 1.8. Demandes de Frais & Suppléments séjour */}
              {((reservation as any).demandesFrais?.length ?? 0) > 0 ? (
                <MobileExtraFeesCard
                  reservationId={reservation.id}
                  demandesFrais={(reservation as any).demandesFrais}
                  onRefresh={() => fetchDetail(false)}
                  onOpenDispute={() => fetchDetail(false)}
                />
              ) : null}

              {/* 1.5. Carte Prévisualisation Galerie État des lieux (Si réalisé) */}
              {reservation.photosEtatLieu && reservation.photosEtatLieu.length > 0 && (
                <MobileEtatLieuxPreviewCard
                  photos={reservation.photosEtatLieu}
                  onOpenGallery={() => setShowGalleryModal(true)}
                />
              )}

              {/* 2. Banner Contrat PDF Klef Vérifié */}
              <MobileContractBannerCard
                contratUrl={reservation.contratUrl}
                reservationId={reservation.id}
              />

              {/* 3. Grille Hôte & Logement */}
              <MobileHostPropertyGrid
                proprietaire={reservation.proprietaire}
                logement={reservation.logement}
                photosEtatLieu={reservation.photosEtatLieu}
                statut={reservation.statut}
                dateDebut={reservation.dateDebut}
                onOpenWelcomeGuide={() => setShowWelcomeGuideModal(true)}
                onOpenGallery={() => setShowGalleryModal(true)}
              />

              <SectionDivider label="Finances" />

              {/* 4. Récapitulatif Financier */}
              <MobileFinancialCard res={reservation} />

              {/* 4.5. Assistance & Support Klef 24/7 */}
              <MobileAssistanceCard reservationId={reservation.id} />

              <SectionDivider label="Historique" />

              {/* 5. Chronologie & Historique des Événements */}
              <MobileReservationTimeline historique={reservation.historique} />
            </Animated.View>
          )}
        </ScrollView>

        {/* 6. Sticky Bottom Action Bar pour les actions locataire */}
        {reservation && (
          <MobileTenantActionStickyBar
            id={reservationId}
            res={reservation}
            onRefetch={() => fetchDetail(false)}
          />
        )}

        {/* 7. Modales de niveau Écran (Livret d'accueil digital & Galerie État des lieux) */}
        {reservation?.logement && (
          <MobileDigitalWelcomeGuideModal
            visible={showWelcomeGuideModal}
            onClose={() => setShowWelcomeGuideModal(false)}
            logement={reservation.logement as any}
          />
        )}

        {reservation?.photosEtatLieu && reservation.photosEtatLieu.length > 0 && (
          <MobileCheckinGalleryModal
            visible={showGalleryModal}
            photos={reservation.photosEtatLieu}
            onClose={() => setShowGalleryModal(false)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    flex: 1,
  },
  headerPadding: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  contentStack: {
    gap: 14,
  },

  // ── Section Dividers ──────────────────────────────────────────────────
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // ── Skeleton ──────────────────────────────────────────────────────────
  skeletonStack: {
    gap: 12,
  },
  skeletonHero: {
    height: 280,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.card,
  },
  skeletonBanner: {
    height: 90,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.card,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonHalf: {
    flex: 1,
    height: 130,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.card,
  },
  skeletonBox: {
    height: 180,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.card,
  },
  skeletonBoxSmall: {
    height: 100,
    backgroundColor: colors.neutral[200],
    borderRadius: radius.card,
  },

  // ── Error Card ────────────────────────────────────────────────────────
  errorCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  errorIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  errorTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  errorSub: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 19,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.action,
  },
  retryBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
