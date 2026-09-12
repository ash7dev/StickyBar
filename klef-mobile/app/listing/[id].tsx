import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiClient } from '../../shared/api/api-client';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { TenantListingGallery } from '../../shared/components/layout/TenantListingGallery';
import { TenantListingSpec } from '../../shared/components/layout/TenantListingSpec';
import { TenantListingPricingInfo } from '../../shared/components/layout/TenantListingPricingInfo';
import { TenantListingDescription } from '../../shared/components/layout/TenantListingDescription';
import { TenantListingAmenities } from '../../shared/components/layout/TenantListingAmenities';
import { TenantListingReviewsSection } from '../../shared/components/layout/TenantListingReviewsSection';
import { TenantListingHostAndMap } from '../../shared/components/layout/TenantListingHostAndMap';
import { TenantStickyReservationBar } from '../../shared/components/layout/TenantStickyReservationBar';
import { TenantReservationModal } from '../../shared/components/layout/TenantReservationModal';
import { TenantListingDetailSkeleton } from '../../shared/components/layout/TenantListingDetailSkeleton';
import { useListingCacheStore } from '../../shared/stores/listing-cache.store';
import { AlertCircle, ChevronLeft, RotateCw } from 'lucide-react-native';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDetail, setDetail } = useListingCacheStore();

  const cachedEntry = id ? getDetail(id) : null;
  const [listing, setListing] = useState<any>(cachedEntry?.data || null);
  const [loading, setLoading] = useState(!cachedEntry?.data);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchListingDetail = async (retryCount = 0) => {
    if (!id) return;
    try {
      if (!listing) {
        setLoading(true);
      }
      setError(null);
      const res = await apiClient.get<any>(`/listings/${id}`);
      if (res) {
        const payload = res.data?.data ? res.data.data : res.data;
        setListing(payload);
        setDetail(id, payload, false);
      }
    } catch (err: any) {
      const isTimeoutOrNetwork =
        err?.code === 'ECONNABORTED' ||
        err?.message?.includes('timeout') ||
        !err?.response;

      if (isTimeoutOrNetwork && retryCount < 1) {
        console.warn(`[ListingDetailScreen] Timeout API. Tentative de ré-essai (1/1)...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return fetchListingDetail(retryCount + 1);
      }

      console.error('[ListingDetailScreen] Erreur chargement:', err);
      if (!listing) {
        setError(
          err?.response?.data?.message ||
            err?.data?.message ||
            'Le serveur Render met du temps à répondre. Veuillez réessayer.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      setError('Identifiant de logement manquant');
      setLoading(false);
      return;
    }

    const cached = getDetail(id);
    if (cached?.data) {
      setListing(cached.data);
      setLoading(false);
    }

    fetchListingDetail();
  }, [id]);

  if (loading) {
    return <TenantListingDetailSkeleton />;
  }

  if (error || !listing) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <AlertCircle size={36} color={colors.error[500]} />
          <Text style={styles.errorTitle}>Problème de connexion</Text>
          <Text style={styles.errorText}>
            {error || 'Ce logement n\'est pas disponible pour le moment.'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => fetchListingDetail(0)}
              style={styles.retryButton}
            >
              <RotateCw size={16} color={colors.neutral[0]} />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tenant)/explorer' as any)}
              style={styles.backButton}
            >
              <ChevronLeft size={16} color={colors.forest[800]} />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Galerie photos swipeable PagerView */}
        <TenantListingGallery
          photos={listing.photos}
          titre={listing.titre}
        />

        {/* 2. Spécifications & Garantie (avec superposition Sheet Overlap) */}
        <TenantListingSpec
          titre={listing.titre}
          type={listing.type}
          sousType={listing.sousType}
          ville={listing.ville}
          quartier={listing.quartier}
          surface={listing.surface}
          nombreChambres={listing.nombreChambres}
          nombreSallesBain={listing.nombreSallesBain}
          capaciteMax={listing.capaciteMax}
          nuitesMinimum={listing.nuitesMinimum}
          ageMin={listing.ageMin}
        />

        {/* 3. Tarifs dégressifs & Conditions */}
        <TenantListingPricingInfo
          prixBase={listing.prixBase}
          capaciteMax={listing.capaciteMax}
          personnesBase={listing.personnesBase}
          nuitesMinimum={listing.nuitesMinimum}
          derniereMinuteActive={listing.derniereMinuteActive}
          tarifsNuits={listing.tarifsNuits}
          tarifsPersonnes={listing.tarifsPersonnes}
        />

        {/* 4. Description complète (repliable) */}
        <TenantListingDescription description={listing.description} />

        {/* 5. Équipements avec icônes retonalisées */}
        <TenantListingAmenities equipements={listing.equipements} />

        {/* 6. Avis et commentaires des voyageurs */}
        <TenantListingReviewsSection
          note={listing.note}
          totalAvis={listing.totalAvis}
          avis={listing.avis}
        />

        {/* 7. Hôte & Localisation (Carte Visuelle) */}
        <TenantListingHostAndMap
          ville={listing.ville}
          quartier={listing.quartier}
          adresse={listing.adresse}
          latitude={listing.latitude}
          longitude={listing.longitude}
          proprietaire={listing.proprietaire}
        />
      </ScrollView>

      {/* Barre Sticky de Réservation (ancrée en bas) */}
      <TenantStickyReservationBar
        prixBase={listing.prixBase}
        nuitesMinimum={listing.nuitesMinimum}
        derniereMinuteActive={listing.derniereMinuteActive}
        onOpenModal={() => setIsModalOpen(true)}
      />

      {/* Modal Bottom Sheet de Réservation */}
      <TenantReservationModal
        visible={isModalOpen}
        listingId={listing.id}
        titre={listing.titre}
        prixBase={listing.prixBase}
        nuitesMinimum={listing.nuitesMinimum}
        capaciteMax={listing.capaciteMax}
        personnesBase={listing.personnesBase}
        derniereMinuteActive={listing.derniereMinuteActive}
        tarifsPersonnes={listing.tarifsPersonnes}
        tarifsNuits={listing.tarifsNuits}
        onClose={() => setIsModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  scrollContent: {
    paddingBottom: 24,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    width: '100%',
  },
  errorTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[600],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  retryButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  backButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[800],
  },
});
