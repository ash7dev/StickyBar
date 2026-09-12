import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../shared/theme/tokens';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { apiClient } from '../shared/api/api-client';
import { getPrixPublic, getPrixDerniereMinute } from '../shared/components/ui/TenantPriceDisplay';

import { MobileCheckoutHeader } from '../features/checkout/components/MobileCheckoutHeader';
import { MobileCheckoutStayCard } from '../features/checkout/components/MobileCheckoutStayCard';
import {
  MobileCheckoutPaymentSection,
  PaymentTiming,
  PaymentOperator,
} from '../features/checkout/components/MobileCheckoutPaymentSection';
import { MobileCheckoutPriceDetailCard } from '../features/checkout/components/MobileCheckoutPriceDetailCard';
import { MobileCheckoutBottomBar } from '../features/checkout/components/MobileCheckoutBottomBar';

const PHONE_REGEX = /^\+?[0-9\s-]{8,15}$/;

export default function ReserverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    listingId?: string;
    dateDebut?: string;
    dateFin?: string;
    personnes?: string;
  }>();

  const { user } = useAuthStore();

  const listingId = params.listingId || '';
  const initialDateDebut = params.dateDebut || '';
  const initialDateFin = params.dateFin || '';
  const initialPersonnes = Number(params.personnes) || 1;

  const [loadingListing, setLoadingListing] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [terangaCoins, setTerangaCoins] = useState(0);

  const [step, setStep] = useState<1 | 2>(
    initialDateDebut && initialDateFin ? 2 : 1
  );

  const [startDate, setStartDate] = useState(initialDateDebut);
  const [endDate, setEndDate] = useState(initialDateFin);
  const [nbPersonnes, setNbPersonnes] = useState(initialPersonnes);

  const handleDateChange = (range: { from: Date | null; to: Date | null }) => {
    if (range.from) {
      setStartDate(range.from.toISOString().split('T')[0]);
    } else {
      setStartDate('');
    }
    if (range.to) {
      setEndDate(range.to.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  };

  const [typePaiement, setTypePaiement] = useState<PaymentTiming>('DEPOSIT');
  const [fournisseur, setFournisseur] = useState<PaymentOperator>('WAVE');
  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [useCoins, setUseCoins] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ telephone?: string; cgu?: string }>({});

  const fetchCheckoutData = useCallback(async () => {
    if (!listingId) return;
    try {
      setLoadingListing(true);
      const [resListing, resTeranga] = await Promise.all([
        apiClient.get<any>(`/listings/${listingId}`).catch(() => null),
        apiClient.get<any>('/teranga-club/me').catch(() => null),
      ]);

      if (resListing?.data) {
        setListing(resListing.data.data || resListing.data);
      }
      if (resTeranga?.data) {
        const t = resTeranga.data.data || resTeranga.data;
        setTerangaCoins(t.soldeCoins || 0);
      }
    } catch (err) {
      console.warn('[ReserverScreen] Erreur chargement checkout:', err);
    } finally {
      setLoadingListing(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  // Calcul du nombre de nuits
  const calculateNights = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  const nights = calculateNights();
  const prixBase = listing?.prixBase || 0;
  const prixPublic = getPrixPublic(prixBase);
  const derniereMinuteActive = listing?.derniereMinuteActive || false;
  const prixParNuit = derniereMinuteActive ? getPrixDerniereMinute(prixPublic) : prixPublic;
  const sousTotalNuits = prixParNuit * Math.max(1, nights);

  // 1. Calcul du supplément voyageurs si nbPersonnes > personnesBase
  const personnesBase = listing?.personnesBase || 1;
  let supplementPersonnes = 0;
  if (nbPersonnes > personnesBase && Array.isArray(listing?.tarifsPersonnes)) {
    const tp = listing.tarifsPersonnes.find(
      (t: any) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax
    );
    if (tp && tp.supplement) {
      const suppPublicPerNight = getPrixPublic(Number(tp.supplement));
      supplementPersonnes = suppPublicPerNight * Math.max(1, nights);
    }
  }

  // 2. Calcul de la réduction nuits / séjour long
  let reductionNuits = 0;
  const nuitesMinimum = listing?.nuitesMinimum || 1;
  if (nights > nuitesMinimum && Array.isArray(listing?.tarifsNuits)) {
    const tn = listing.tarifsNuits.find(
      (t: any) => nights >= t.nuitsMin && (!t.nuitsMax || nights <= t.nuitsMax)
    );
    if (tn && tn.prix) {
      const prixReduitPublic = getPrixPublic(Number(tn.prix));
      reductionNuits = Math.max(0, (prixPublic - prixReduitPublic) * Math.max(1, nights));
    }
  }

  const subTotalBeforeCoins = Math.max(0, sousTotalNuits + supplementPersonnes - reductionNuits);

  // Coins & déduction
  const coinsDeducted = useCoins ? Math.min(terangaCoins, subTotalBeforeCoins) : 0;
  const totalFinal = Math.max(0, subTotalBeforeCoins - coinsDeducted);

  const acomptePct = listing?.acomptePourcentage || 30;
  const acompteAmount = Math.round(totalFinal * (acomptePct / 100));
  const aDebiter = typePaiement === 'DEPOSIT' ? acompteAmount : totalFinal;

  const validate = () => {
    const next: typeof errors = {};
    if (!telephone.trim() || !PHONE_REGEX.test(telephone.trim())) {
      next.telephone = 'Veuillez saisir un numéro Mobile Money valide (ex: +221770000000)';
    }
    if (!cguAccepted) {
      next.cgu = 'Vous devez accepter les conditions de location pour réserver.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePay = async () => {
    setApiError(null);
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const res = await apiClient.post('/reservations', {
        logementId: listingId,
        dateDebut: startDate,
        dateFin: endDate,
        nbPersonnes,
        typePaiement,
        fournisseur,
        telephone: telephone.trim(),
        useCoins,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const dataRes = res?.data?.data || res?.data;
      const createdId = dataRes?.id || dataRes?.reservationId;

      if (createdId) {
        router.replace(`/reservation/${createdId}` as any);
      } else {
        router.replace('/(tenant)/reservations' as any);
      }
    } catch (err: any) {
      console.error('[ReserverScreen] Erreur création réservation:', err?.response?.data || err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const responseData = err?.response?.data;
      let msg = 'Impossible de valider la réservation. Vérifiez vos informations.';
      if (responseData) {
        if (Array.isArray(responseData.details) && responseData.details.length > 0) {
          msg = responseData.details.join(' • ');
        } else if (Array.isArray(responseData.message)) {
          msg = responseData.message.join(' • ');
        } else if (typeof responseData.message === 'string') {
          msg = responseData.message;
        } else if (typeof responseData.error === 'string') {
          msg = responseData.error;
        }
      } else if (err?.message === 'Network Error') {
        msg = 'Problème de connexion réseau. Réessayez.';
      }
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!listingId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <AlertTriangle size={32} color={colors.error[600]} />
          <Text style={styles.emptyTitle}>Réservation incomplète</Text>
          <Text style={styles.emptyText}>
            Aucun logement sélectionné. Repartez d'une annonce pour choisir vos dates.
          </Text>
          <TouchableOpacity
            style={styles.backButtonBtn}
            onPress={() => router.back()}
          >
            <ArrowLeft size={16} color={colors.neutral[0]} />
            <Text style={styles.backButtonText}>Retour aux logements</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Sticky avec bouton Retour direct vers le modal / fiche */}
      <MobileCheckoutHeader
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingListing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.forest[800]} />
            <Text style={styles.loadingText}>
              Préparation de votre réservation…
            </Text>
          </View>
        ) : (
          <>
            {apiError && (
              <View style={styles.apiErrorBox}>
                <AlertTriangle size={16} color={colors.error[600]} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            )}

            {/* 1. Carte récapitulative du séjour (2 Lignes avec Calendrier) */}
            <MobileCheckoutStayCard
              listing={listing}
              startDate={startDate}
              endDate={endDate}
              nights={nights}
              nbPersonnes={nbPersonnes}
              onDateChange={handleDateChange}
              onPersonnesChange={setNbPersonnes}
            />

            {/* 2. Décomposition tarifaire & Acompte */}
            <MobileCheckoutPriceDetailCard
              prixParNuit={prixParNuit}
              nights={nights}
              sousTotalNuits={sousTotalNuits}
              supplementPersonnes={supplementPersonnes}
              nbPersonnes={nbPersonnes}
              reductionNuits={reductionNuits}
              typePaiement={typePaiement}
              acomptePct={acomptePct}
              useCoins={useCoins}
              coinsDeducted={coinsDeducted}
              totalFinal={totalFinal}
              aDebiter={aDebiter}
            />

            {/* 3. Moyen de règlement Mobile Money & Validation CGU */}
            <MobileCheckoutPaymentSection
              typePaiement={typePaiement}
              setTypePaiement={setTypePaiement}
              acomptePct={acomptePct}
              acompteAmount={acompteAmount}
              totalAmount={sousTotalNuits}
              acompteDisponible={true}

              soldeCoins={terangaCoins}
              coinsMax={terangaCoins}
              useCoins={useCoins}
              setUseCoins={setUseCoins}

              fournisseur={fournisseur}
              setFournisseur={setFournisseur}

              telephone={telephone}
              setTelephone={setTelephone}

              cguAccepted={cguAccepted}
              setCguAccepted={setCguAccepted}

              errors={errors}
            />
          </>
        )}
      </ScrollView>

      {/* Barre d'action flottante en bas de page */}
      {!loadingListing && (
        <MobileCheckoutBottomBar
          aDebiter={aDebiter}
          fournisseur={fournisseur}
          loading={saving}
          onPay={handlePay}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 130,
    gap: 14,
  },

  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[600],
  },

  emptyContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  backButtonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[900],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 8,
  },
  backButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500] + '40',
    borderRadius: radius.inner,
    padding: 12,
  },
  apiErrorText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.error[700],
  },
});
