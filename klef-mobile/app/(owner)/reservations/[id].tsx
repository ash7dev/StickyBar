import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertCircle } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';
import { useAuthStore } from '../../../features/auth/stores/auth.store';
import type { ReservationDetail } from '../../../features/reservations/types/reservation-detail.types';
import { disputeOpen, hostPayout, ownerCancelPenalty, ownerStage } from '../../../features/reservations/owner/lib/stage';
import { useOwnerActions } from '../../../features/reservations/owner/hooks/useOwnerActions';
import { renderOwnerStage } from '../../../features/reservations/owner/components/OwnerStages';
import {
  AcceptSheet,
  CancelSheet,
  FeeCreateSheet,
  HostDisputeSheet,
  NoshowSheet,
  RefuseSheet,
} from '../../../features/reservations/owner/components/sheets';
import { PillButton, StayTopBar, type DetailTab } from '../../../features/reservations/tenant/components/ui';
import { Dossier } from '../../../features/reservations/tenant/components/Dossier';
import { longDate } from '../../../features/reservations/tenant/lib/stage';
import { MobileEtatLieuxCameraModal } from '../../../features/reservations/components/owner/modals/MobileEtatLieuxCameraModal';
import { MobileCheckinGalleryModal } from '../../../features/reservations/components/detail/MobileCheckinGalleryModal';
import { formatFCFA } from '../../../features/owner-home/lib/format';

type Sheet = 'accept' | 'refuse' | 'cancel' | 'fee' | 'dispute' | 'noshow' | null;

/**
 * Détail d'une réservation côté hôte : un écran qui suit l'étape du séjour.
 * « Séjour » = ce qu'il y a à faire maintenant ; « Dossier » = toute la traçabilité.
 */
export default function OwnerReservationDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id: reservationId = '' } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const [tab, setTab] = useState<DetailTab>('stay');
  const [cachedDetail, setCachedDetail] = useState<ReservationDetail | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [disputeMotif, setDisputeMotif] = useState<string | undefined>();
  const [camera, setCamera] = useState<'CHECKIN' | 'CHECKOUT' | null>(null);
  const [gallery, setGallery] = useState<'CHECKIN' | 'CHECKOUT' | null>(null);
  const [now, setNow] = useState(() => new Date());

  const cacheKey = `klef_owner_reservation_detail_${reservationId}`;

  // L'écran reste monté entre deux réservations (onglet caché) : on repart de zéro
  useEffect(() => {
    setTab('stay');
    setSheet(null);
    setCamera(null);
    setGallery(null);
    setCachedDetail(null);
    setCacheLoaded(false);
    if (!reservationId) {
      setCacheLoaded(true);
      return;
    }
    // Affichage instantané depuis le cache disque, puis rafraîchissement réseau
    AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (!raw) return;
        try {
          setCachedDetail(JSON.parse(raw));
        } catch {
          // cache illisible : on attend le réseau
        }
      })
      .finally(() => setCacheLoaded(true));
  }, [reservationId, cacheKey]);

  const { data, isLoading, isRefetching, refetch, error } = useQuery<ReservationDetail | null>({
    queryKey: ['owner', 'reservation-detail', reservationId],
    queryFn: async () => {
      const res = await apiClient.get(`/reservations/${reservationId}`);
      const detail: ReservationDetail = res.data?.data || res.data;
      if (detail) AsyncStorage.setItem(cacheKey, JSON.stringify(detail)).catch(() => {});
      return detail;
    },
    enabled: Boolean(reservationId),
    staleTime: 60_000,
    // Le jour J, l'état change vite (validation du voyageur, absence…) : on rafraîchit seul
    refetchInterval: 60_000,
  });

  // L'étape dépend aussi de l'heure (ouverture de l'état des lieux, retard) : on recalcule chaque minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const onDone = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard-full'] });
    queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['wallet', 'mine'] });
  }, [refetch, queryClient]);

  const reservation = data ?? cachedDetail;
  const actions = useOwnerActions(reservationId, onDone);
  const stage = useMemo(() => (reservation ? ownerStage(reservation, now) : null), [reservation, now]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.navigate('/(owner)/reservations' as never);
  }, [router]);

  const openSupport = useCallback(() => {
    router.push({ pathname: '/assistance' as never, params: { reservationId, tab: 'new' } });
  }, [router, reservationId]);

  if (!reservation) {
    return (
      <View style={styles.screen}>
        <StayTopBar tab="stay" onTab={() => {}} onBack={goBack} onHelp={openSupport} />
        {!cacheLoaded || isLoading ? (
          <View style={styles.skeleton}>
            <View style={[styles.skelBlock, { height: 88 }]} />
            <View style={[styles.skelBlock, { height: 260 }]} />
            <View style={[styles.skelBlock, { height: 64 }]} />
          </View>
        ) : (
          <View style={styles.errorCard}>
            <AlertCircle size={28} color={colors.error[500]} />
            <Text style={styles.errorTitle}>Réservation introuvable</Text>
            <Text style={styles.errorText}>
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Cette réservation n’existe pas ou ne concerne pas vos logements.'}
            </Text>
            <PillButton label="Réessayer" variant="ghost" onPress={() => refetch()} />
          </View>
        )}
      </View>
    );
  }

  const guestName = reservation.locataire?.prenom ?? 'le voyageur';
  const payout = hostPayout(reservation);
  const openDispute = (motif?: string) => {
    setDisputeMotif(motif);
    setSheet('dispute');
  };

  const view = renderOwnerStage(
    reservation,
    stage!,
    {
      actions,
      currentUserId: userId,
      onAccept: () => setSheet('accept'),
      onRefuse: () => setSheet('refuse'),
      onCancel: () => setSheet('cancel'),
      onCheckinCamera: () => setCamera('CHECKIN'),
      onCheckoutCamera: () => setCamera('CHECKOUT'),
      onNoshow: () => setSheet('noshow'),
      onFee: () => setSheet('fee'),
      onDispute: openDispute,
      onGallery: setGallery,
      onDossier: () => setTab('dossier'),
      onSupport: openSupport,
      onCalendar: () => router.navigate('/(owner)/calendar' as never),
      onWallet: () => router.navigate('/(owner)/wallet' as never),
    },
    now,
  );

  const galleryPhotos = gallery ? (reservation.photosEtatLieu ?? []).filter((p) => p.type === gallery) : [];

  return (
    <View style={styles.screen}>
      <StayTopBar tab={tab} onTab={setTab} onBack={goBack} onHelp={openSupport} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.forest[600]} colors={[colors.forest[600]]} />}
      >
        {tab === 'stay' ? (
          view.content
        ) : (
          <Dossier
            res={reservation}
            viewer="owner"
            payout={payout}
            currentUserId={userId}
            onGallery={setGallery}
            onReportProblem={() => openDispute()}
            canReport={disputeOpen(reservation, now) && stage !== 'disputed'}
          />
        )}
      </ScrollView>

      {tab === 'stay' && view.sticky}

      {/* ── Feuilles et fenêtres ─────────────────────────────────────────── */}
      <AcceptSheet
        visible={sheet === 'accept'}
        guestName={guestName}
        payoutLabel={formatFCFA(payout)}
        arrivalDay={longDate(reservation.dateDebut)}
        departureDay={longDate(reservation.dateFin)}
        actions={actions}
        onClose={() => setSheet(null)}
      />
      <RefuseSheet visible={sheet === 'refuse'} guestName={guestName} actions={actions} onClose={() => setSheet(null)} />
      <CancelSheet
        visible={sheet === 'cancel'}
        guestName={guestName}
        penalty={ownerCancelPenalty(reservation, now)}
        actions={actions}
        onClose={() => setSheet(null)}
      />
      <FeeCreateSheet visible={sheet === 'fee'} guestName={guestName} actions={actions} onClose={() => setSheet(null)} />
      <HostDisputeSheet
        key={disputeMotif ?? 'default'}
        visible={sheet === 'dispute'}
        initialMotif={disputeMotif}
        actions={actions}
        onClose={() => setSheet(null)}
      />
      <NoshowSheet visible={sheet === 'noshow'} guestName={guestName} actions={actions} onClose={() => setSheet(null)} />
      <MobileEtatLieuxCameraModal
        visible={camera !== null}
        type={camera ?? 'CHECKIN'}
        loading={actions.pending === 'checkin' || actions.pending === 'checkout'}
        onClose={() => setCamera(null)}
        onSubmitPhotos={async (photos) => {
          const ok = camera === 'CHECKOUT' ? await actions.submitCheckout(photos) : await actions.submitCheckin(photos);
          if (ok) setCamera(null);
        }}
      />
      <MobileCheckinGalleryModal visible={gallery !== null && galleryPhotos.length > 0} photos={galleryPhotos} onClose={() => setGallery(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 18 },
  skeleton: { padding: 16, gap: 14 },
  skelBlock: { borderRadius: 26, backgroundColor: colors.neutral[100] },
  errorCard: {
    margin: 16,
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 26,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  errorTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: colors.forest[950] },
  errorText: { textAlign: 'center', fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
});
