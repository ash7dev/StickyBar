import React, { useState, useEffect, useCallback } from 'react';
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
import { TenantListingVideoSection } from '../../shared/components/layout/TenantListingVideoSection';
import { TenantListingAmenities } from '../../shared/components/layout/TenantListingAmenities';
import { TenantListingReviewsSection } from '../../shared/components/layout/TenantListingReviewsSection';
import { TenantListingHostAndMap } from '../../shared/components/layout/TenantListingHostAndMap';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';
import { useGatedAction } from '../../shared/hooks/useGatedAction';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { getPrixDerniereMinute, getPrixPublic } from '../../shared/components/ui/TenantPriceDisplay';
import { DatesSheet, type StaySelection } from '../../features/booking/components/DatesSheet';
import { BookingBar, CancellationCard, DatesCard, HowItWorks } from '../../features/booking/components/ListingBooking';
import { usePricePreview } from '../../features/booking/lib/booking';
import { ListingPhotosModal, PhotoLightbox, SimilarListings, lightboxItems } from '../../features/booking/components/ListingExtras';
import { formatAmount } from '../../features/owner-home/lib/format';
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
  const [photosOpen, setPhotosOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  // Dates et voyageurs choisis sur la fiche, transmis tels quels à l'écran de paiement
  const [stay, setStay] = useState<StaySelection>({ start: null, end: null, guests: 1 });
  const price = usePricePreview(listing?.id ?? id, stay.start, stay.end, stay.guests);

  const reserverPath = `/reserver?listingId=${listing?.id ?? id}&dateDebut=${stay.start}&dateFin=${stay.end}&personnes=${stay.guests}`;
  const goToCheckout = useCallback(() => router.push(reserverPath as any), [reserverPath]);
  const { gateState, trigger: triggerGate, complete: completeGate, cancel: cancelGate } = useGatedAction(goToCheckout);

  const book = () => {
    setIsModalOpen(false);
    const { token, isAuthenticated } = useAuthStore.getState();
    // Pas connecté : on garde les dates dans le lien de retour après connexion
    if (!token || !isAuthenticated) {
      setTimeout(() => router.push(`/(auth)/login?next=${encodeURIComponent(reserverPath)}` as any), 300);
      return;
    }
    setTimeout(() => triggerGate(), 300);
  };

  const fetchListingDetail = async (retryCount = 0) => {
    if (!id) return;
    try {
      if (!listing) {
        setLoading(true);
      }
      setError(null);

      const [resListing, resCal] = await Promise.all([
        apiClient.get<any>(`/listings/${id}`),
        apiClient.get<any>(`/calendrier/${id}`).catch(() => null),
      ]);

      if (resListing) {
        const payload = resListing.data?.data ? resListing.data.data : resListing.data;
        const calData = resCal?.data?.data ? resCal.data.data : resCal?.data;

        if (calData) {
          const calIndispos = Array.isArray(calData.indisponibilites) ? calData.indisponibilites : [];
          const calResas = Array.isArray(calData.reservations) ? calData.reservations : [];

          payload.indisponibilites = [
            ...(Array.isArray(payload.indisponibilites) ? payload.indisponibilites : []),
            ...calIndispos,
          ];
          payload.reservations = [
            ...(Array.isArray(payload.reservations) ? payload.reservations : []),
            ...calResas,
          ];
        }

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
          listingId={listing.id}
          onOpenAll={() => setPhotosOpen(true)}
          onOpenPhoto={lightboxItems(listing.photos).length ? setPhotoIndex : undefined}
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

        {/* 2b. Vos dates : déclenche le prix exact */}
        <DatesCard stay={stay} onPress={() => setIsModalOpen(true)} />

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

        {/* 4b. Visite en vidéo (1:1 avec la version Web) */}
        {(listing.videoUrl || listing.video_url || listing.video) ? (
          <TenantListingVideoSection
            videoUrl={listing.videoUrl || listing.video_url || listing.video}
            titre={listing.titre}
            posterUrl={
              Array.isArray(listing.photos) && listing.photos.length > 0
                ? typeof listing.photos[0] === 'string'
                  ? listing.photos[0]
                  : listing.photos[0]?.url
                : listing.coverUrl
            }
          />
        ) : null}

        {/* 5. Équipements avec icônes retonalisées */}
        <TenantListingAmenities equipements={listing.equipements} />

        {/* 6. Avis et commentaires des voyageurs */}
        <TenantListingReviewsSection
          note={listing.note}
          totalAvis={listing.totalAvis}
          avis={listing.avis}
        />

        {/* 6b. Le parcours de l'argent, puis les règles d'annulation, juste avant l'hôte et l'emplacement */}
        <HowItWorks hostName={listing.proprietaire?.prenom ?? 'l’hôte'} />
        <CancellationCard price={price.data} start={stay.start} />

        {/* 7. Hôte & Localisation (Carte Visuelle) */}
        <TenantListingHostAndMap
          ville={listing.ville}
          quartier={listing.quartier}
          adresse={listing.adresse}
          latitude={listing.latitude}
          longitude={listing.longitude}
          proprietaire={listing.proprietaire}
        />

        {/* 8. Autres logements dans la même ville */}
        <SimilarListings currentId={listing.id} ville={listing.ville} />
      </ScrollView>

      {/* Barre du bas : total du séjour dès que les dates sont choisies */}
      <BookingBar
        stay={stay}
        price={price.data}
        loading={price.isFetching}
        nightlyLabel={formatAmount(
          listing.derniereMinuteActive ? getPrixDerniereMinute(getPrixPublic(listing.prixBase)) : getPrixPublic(listing.prixBase),
        )}
        onChooseDates={() => setIsModalOpen(true)}
        onBook={book}
      />

      <DatesSheet
        visible={isModalOpen}
        titre={listing.titre}
        value={stay}
        onChange={setStay}
        minNights={listing.nuitesMinimum ?? 1}
        maxGuests={listing.capaciteMax ?? 1}
        includedGuests={listing.personnesBase ?? 1}
        disabledDates={[
          ...(Array.isArray(listing.disabledDates) ? listing.disabledDates : []),
          ...(Array.isArray(listing.datesBloquees) ? listing.datesBloquees : []),
          ...(Array.isArray(listing.indisponibilites) ? listing.indisponibilites : []),
          ...(Array.isArray(listing.indisponibilities) ? listing.indisponibilities : []),
          ...(Array.isArray(listing.reservations) ? listing.reservations : []),
        ]}
        price={price.data}
        priceLoading={price.isFetching}
        priceError={price.error}
        onContinue={book}
        onClose={() => setIsModalOpen(false)}
      />

      <PhotoLightbox visible={photoIndex !== null} items={lightboxItems(listing.photos)} index={photoIndex ?? 0} onClose={() => setPhotoIndex(null)} />

      <ListingPhotosModal visible={photosOpen} photos={listing.photos ?? []} onClose={() => setPhotosOpen(false)} />

      <TenantActionGateModal
        visible={gateState.open}
        steps={gateState.steps}
        block={gateState.block}
        onComplete={completeGate}
        onCancel={cancelGate}
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
