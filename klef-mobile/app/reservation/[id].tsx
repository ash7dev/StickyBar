import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertCircle } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import type { DemandeFraisReservation, ReservationDetail } from '../../features/reservations/types/reservation-detail.types';
import { tenantStage } from '../../features/reservations/tenant/lib/stage';
import { useTenantActions } from '../../features/reservations/tenant/hooks/useTenantActions';
import { PillButton, StayTopBar, type DetailTab } from '../../features/reservations/tenant/components/ui';
import { renderStage } from '../../features/reservations/tenant/components/StayStages';
import { Dossier } from '../../features/reservations/tenant/components/Dossier';
import { FeeSheet, RefuseCheckinSheet, ReportProblemSheet } from '../../features/reservations/tenant/components/sheets';
import { MobileCancelReservationModal } from '../../features/reservations/components/detail/MobileCancelReservationModal';
import { MobileCheckinGalleryModal } from '../../features/reservations/components/detail/MobileCheckinGalleryModal';
import { MobileDigitalWelcomeGuideModal } from '../../features/reservations/components/detail/MobileDigitalWelcomeGuideModal';
import { formatFCFA } from '../../features/owner-home/lib/format';

/**
 * Détail d'une réservation côté locataire : un écran qui suit l'étape du séjour.
 * « Séjour » = ce qu'il y a à faire maintenant ; « Dossier » = toute la traçabilité.
 */
export default function ReservationDetailScreen() {
  const router = useRouter();
  const { id: reservationId = '' } = useLocalSearchParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const [tab, setTab] = useState<DetailTab>('stay');
  const [cachedDetail, setCachedDetail] = useState<ReservationDetail | null>(null);
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [sheet, setSheet] = useState<'cancel' | 'refuse' | 'report' | 'welcome' | null>(null);
  const [gallery, setGallery] = useState<'CHECKIN' | 'CHECKOUT' | null>(null);
  const [fee, setFee] = useState<{ item: DemandeFraisReservation; mode: 'pay' | 'contest' } | null>(null);
  const [now, setNow] = useState(() => new Date());

  const cacheKey = `klef_tenant_reservation_detail_${reservationId}`;

  // Affichage instantané depuis le cache disque, puis rafraîchissement réseau
  useEffect(() => {
    if (!reservationId) {
      setCacheLoaded(true);
      return;
    }
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
    queryKey: ['tenant', 'reservation-detail', reservationId],
    queryFn: async () => {
      const res = await apiClient.get(`/reservations/${reservationId}`);
      const detail: ReservationDetail = res.data?.data || res.data;
      if (detail) AsyncStorage.setItem(cacheKey, JSON.stringify(detail)).catch(() => {});
      return detail;
    },
    enabled: Boolean(reservationId),
    staleTime: 60_000,
    // Le jour J, l'état change vite (photos de l'hôte, absence…) : on rafraîchit seul
    refetchInterval: 60_000,
  });

  // L'étape dépend aussi de l'heure (jour J, retard de l'hôte) : on recalcule chaque minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const reservation = data ?? cachedDetail;
  const actions = useTenantActions(reservationId, () => refetch());
  const stage = useMemo(() => (reservation ? tenantStage(reservation, now) : null), [reservation, now]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.navigate('/(tenant)/reservations' as never);
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
            <View style={[styles.skelBlock, { height: 240 }]} />
            <View style={[styles.skelBlock, { height: 64 }]} />
          </View>
        ) : (
          <View style={styles.errorCard}>
            <AlertCircle size={28} color={colors.error[500]} />
            <Text style={styles.errorTitle}>Réservation introuvable</Text>
            <Text style={styles.errorText}>
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                'Cette réservation n’existe pas ou ne vous appartient pas.'}
            </Text>
            <PillButton label="Réessayer" variant="ghost" onPress={() => refetch()} />
          </View>
        )}
      </View>
    );
  }

  const view = renderStage(reservation, stage!, {
    actions,
    currentUserId: userId,
    onCancel: () => setSheet('cancel'),
    onGallery: setGallery,
    onWelcomeGuide: () => setSheet('welcome'),
    onRefuse: () => setSheet('refuse'),
    onReportProblem: () => setSheet('report'),
    onFee: (item, mode) => setFee({ item, mode }),
    onDossier: () => setTab('dossier'),
    onSupport: openSupport,
  }, now);

  const canReport = !['cancelled', 'expired', 'disputed', 'payment-pending', 'awaiting-host'].includes(stage!);
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
            currentUserId={userId}
            onGallery={setGallery}
            onReportProblem={() => setSheet('report')}
            canReport={canReport}
          />
        )}
      </ScrollView>

      {tab === 'stay' && view.sticky}

      {/* ── Feuilles et fenêtres ─────────────────────────────────────────── */}
      <MobileCancelReservationModal
        visible={sheet === 'cancel'}
        reservationId={reservation.id}
        dateDebut={reservation.dateDebut}
        montantPaye={Number(reservation.totalLocataire)}
        onSuccess={() => {
          setSheet(null);
          refetch();
        }}
        onClose={() => setSheet(null)}
      />
      <RefuseCheckinSheet
        visible={sheet === 'refuse'}
        amountLabel={formatFCFA(Number(reservation.totalLocataire))}
        actions={actions}
        onClose={() => setSheet(null)}
      />
      <ReportProblemSheet visible={sheet === 'report'} actions={actions} onClose={() => setSheet(null)} />
      <FeeSheet
        key={fee ? `${fee.item.id}-${fee.mode}` : 'none'}
        fee={fee?.item ?? null}
        initialMode={fee?.mode}
        hostName={reservation.proprietaire?.prenom ?? 'l’hôte'}
        actions={actions}
        onClose={() => setFee(null)}
      />
      {reservation.logement && (
        <MobileDigitalWelcomeGuideModal
          visible={sheet === 'welcome'}
          onClose={() => setSheet(null)}
          logement={reservation.logement as never}
        />
      )}
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
