import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../shared/api/api-client';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { MobileOwnerDetailHeader } from '../../../features/listings/components/owner/detail/MobileOwnerDetailHeader';
import { MobileOwnerDetailGallery } from '../../../features/listings/components/owner/detail/MobileOwnerDetailGallery';
import { MobileOwnerDetailSpecsCard } from '../../../features/listings/components/owner/detail/MobileOwnerDetailSpecsCard';
import { MobileOwnerDetailPricingCard } from '../../../features/listings/components/owner/detail/MobileOwnerDetailPricingCard';
import { MobileOwnerDetailGuestbook } from '../../../features/listings/components/owner/detail/MobileOwnerDetailGuestbook';
import { MobileOwnerDetailAmenitiesCard } from '../../../features/listings/components/owner/detail/MobileOwnerDetailAmenitiesCard';
import { MobileOwnerDetailCalendar } from '../../../features/listings/components/owner/detail/MobileOwnerDetailCalendar';
import { MobileOwnerDetailReservations } from '../../../features/listings/components/owner/detail/MobileOwnerDetailReservations';
import { MobileListingEditSkeleton } from '../../../features/listings/components/owner/MobileListingEditSkeleton';

export default function MobileOwnerListingDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ── Fetch Listing Detail ────────────────────────────────────────────
  const {
    data: listing,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['listing-owner', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get(`/listings/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // ── Fetch Reservations for this listing ────────────────────────────
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => {
      const res = await apiClient.get('/reservations/me');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!id,
  });

  // Filter reservations for this listing
  const listingReservations = reservations.filter(
    (r: any) => r.logementId === id || r.logement?.id === id
  );

  // ── Toggle Status Mutation ─────────────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: 'PUBLISHED' | 'PAUSED') => {
      const endpoint = newStatus === 'PAUSED' ? `/listings/${id}/pause` : `/listings/${id}/republier`;
      return apiClient.patch(endpoint);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['listing-owner', id] });
      queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] });
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });

  if (isLoading) {
    return <MobileListingEditSkeleton />;
  }

  if (isError || !listing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <AlertCircle size={32} color={colors.error[500]} />
            <Text style={styles.errorTitle}>Impossible de charger l'annonce</Text>
            <Text style={styles.errorSubtext}>
              Une erreur s'est produite lors de la récupération des détails de votre bien.
            </Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => refetch()}
                style={styles.retryBtn}
              >
                <RefreshCw size={14} color={colors.forest[950]} />
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <ArrowLeft size={14} color={colors.forest[950]} />
                <Text style={styles.backText}>Retour</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <MobileOwnerDetailHeader
        listingId={id!}
        titre={listing.titre}
        statut={listing.statut}
        slug={listing.slug}
        onToggleStatus={(newStatus) => toggleStatusMutation.mutate(newStatus)}
        isTogglingStatus={toggleStatusMutation.isPending}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.lime[600]}
          />
        }
      >
        {/* 1. Hero Photo Gallery */}
        <MobileOwnerDetailGallery photos={listing.photos} titre={listing.titre} />

        <View style={styles.mainStack}>
          {/* 2. Characteristics & Specifications Card */}
          <MobileOwnerDetailSpecsCard
            titre={listing.titre}
            type={listing.typeLogement || listing.type}
            sousType={listing.sousTypeLogement || listing.sousType}
            ville={listing.ville}
            commune={listing.commune}
            quartier={listing.quartier}
            adresse={listing.adresseExacte || listing.adresse}
            surface={listing.surfaceM2 || listing.surface}
            nombreChambres={listing.nombreChambres}
            nombreSallesBain={listing.nombreSdb || listing.nombreSallesBain}
            nombrePieces={listing.nombrePieces}
            capaciteMax={listing.capaciteMax}
          />

          {/* 3. Pricing & Discounts Card */}
          <MobileOwnerDetailPricingCard
            prixBase={listing.prixBase}
            personnesBase={listing.personnesBase}
            capaciteMax={listing.capaciteMax}
            nuitesMinimum={listing.nuitesMinimum}
            caution={listing.caution}
            fraisMenage={listing.fraisMenage}
            derniereMinuteActive={listing.derniereMinuteActive}
            acomptePourcentage={listing.acomptePourcentage}
            tarifsNuits={listing.tarifsNuits}
            tarifsPersonnes={listing.tarifsPersonnes}
          />

          {/* 4. Digital Guestbook & Confidential Wifi / Digicode */}
          <MobileOwnerDetailGuestbook
            nomReseauWifi={listing.nomReseauWifi || listing.wifiSsid}
            codeWifi={listing.codeWifi || listing.wifiPassword}
            instructionsDigicode={listing.instructionsDigicode || listing.codeDigicode}
            instructionsAcces={listing.instructionsAcces}
            regimeElectricite={listing.regimeElectricite}
            detailsElectricite={listing.detailsElectricite}
            reglesMaison={listing.reglesMaison}
          />

          {/* 5. Amenities Categorized */}
          <MobileOwnerDetailAmenitiesCard equipements={listing.equipements} />

          {/* 6. Availability Calendar & Block Dates */}
          <MobileOwnerDetailCalendar listingId={id!} />

          {/* 7. Recent Reservations Shortcut */}
          <MobileOwnerDetailReservations listingId={id!} reservations={listingReservations} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainStack: {
    padding: 16,
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.md,
  },
  errorTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  errorSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  retryText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  backText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
});
