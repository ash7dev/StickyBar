import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Share2, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { ReservationDetail } from '../../../features/reservations/types/reservation-detail.types';

// UI Cards
import { MobileOwnerReservationHeroCard } from '../../../features/reservations/components/owner/detail/MobileOwnerReservationHeroCard';
import { MobileOwnerGuestInfoCard } from '../../../features/reservations/components/owner/detail/MobileOwnerGuestInfoCard';
import { MobileOwnerFinancialBreakdownCard } from '../../../features/reservations/components/owner/detail/MobileOwnerFinancialBreakdownCard';
import { MobileOwnerExtraGuestCard } from '../../../features/reservations/components/owner/detail/MobileOwnerExtraGuestCard';
import { MobileOwnerEscrowNoticeCard } from '../../../features/reservations/components/owner/detail/MobileOwnerEscrowNoticeCard';
import { MobileOwnerActionPanelCard } from '../../../features/reservations/components/owner/detail/MobileOwnerActionPanelCard';
import { MobileOwnerCancelledBannerCard } from '../../../features/reservations/components/owner/detail/MobileOwnerCancelledBannerCard';
import { MobileOwnerEtatLieuxPreviewCard } from '../../../features/reservations/components/owner/detail/MobileOwnerEtatLieuxPreviewCard';
import { MobileOwnerMandatCard } from '../../../features/reservations/components/owner/detail/MobileOwnerMandatCard';
import { MobileOwnerPaymentCard } from '../../../features/reservations/components/owner/detail/MobileOwnerPaymentCard';
import { MobileOwnerActionStickyBar } from '../../../features/reservations/components/owner/detail/MobileOwnerActionStickyBar';
import { MobileContractBannerCard } from '../../../features/reservations/components/detail/MobileContractBannerCard';
import { MobileReservationTimeline } from '../../../features/reservations/components/detail/MobileReservationTimeline';
import { MobileOwnerLitigeCard } from '../../../features/reservations/components/owner/detail/MobileOwnerLitigeCard';
import { MobileAssistanceCard } from '../../../features/reservations/components/detail/MobileAssistanceCard';
import { MobileOwnerReservationDetailSkeleton } from '../../../features/reservations/components/owner/detail/MobileOwnerReservationDetailSkeleton';

// Modals
import { MobileConfirmTimeModal } from '../../../features/reservations/components/owner/modals/MobileConfirmTimeModal';
import { MobileEtatLieuxCameraModal } from '../../../features/reservations/components/owner/modals/MobileEtatLieuxCameraModal';
import { MobileOpenDisputeModal } from '../../../features/reservations/components/owner/modals/MobileOpenDisputeModal';
import { MobileRateGuestModal } from '../../../features/reservations/components/owner/modals/MobileRateGuestModal';
import { MobileSignalNoshowModal } from '../../../features/reservations/components/owner/modals/MobileSignalNoshowModal';
import { MobileOwnerRefusalModal } from '../../../features/reservations/components/owner/MobileOwnerRefusalModal';
import { MobileOwnerCancelModal } from '../../../features/reservations/components/owner/modals/MobileOwnerCancelModal';
import { MobileOwnerActionSheetModal } from '../../../features/reservations/components/owner/modals/MobileOwnerActionSheetModal';

// API Service
import { useQueryClient } from '@tanstack/react-query';
import { getReservationDetail, updateReservationStatus, submitCheckinProprio, submitCheckoutProprio, submitDispute, submitRating } from '../../../features/reservations/services/reservation.service';

export default function OwnerReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // States pour l'ouverture des Modales
  const [showConfirmTimeModal, setShowConfirmTimeModal] = useState<boolean>(false);
  const [showRefusalModal, setShowRefusalModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [cameraType, setCameraType] = useState<'CHECKIN' | 'CHECKOUT'>('CHECKIN');
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [disputeInitialMotif, setDisputeInitialMotif] = useState<string>('DEGRADATION');
  const [showRateModal, setShowRateModal] = useState<boolean>(false);
  const [showNoshowModal, setShowNoshowModal] = useState<boolean>(false);
  const [showOwnerCancelModal, setShowOwnerCancelModal] = useState<boolean>(false);
  const [showActionSheetModal, setShowActionSheetModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Invalider les caches globaux Dashboard, Wallet et Réservations
  const invalidateGlobalStores = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['owner', 'dashboard-full'] });
    queryClient.invalidateQueries({ queryKey: ['reservations', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['wallet', 'mine'] });
  }, [queryClient]);

  // Charger les détails de la réservation
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await getReservationDetail(id as string);
      if (data) {
        setReservation(data);
        invalidateGlobalStores();
      } else {
        // Fallback Mock si l'API n'est pas encore connectée en local
        setReservation(getMockOwnerReservation(id as string));
      }
    } catch (err: any) {
      console.warn('Erreur chargement réservation hôte:', err);
      // Fallback mock de secours
      setReservation(getMockOwnerReservation(id as string));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, invalidateGlobalStores]);

  useEffect(() => {
    setReservation(null);
    setLoading(true);
    setShowConfirmTimeModal(false);
    setShowRefusalModal(false);
    setShowCameraModal(false);
    setShowDisputeModal(false);
    setShowRateModal(false);
    setShowNoshowModal(false);
    setShowOwnerCancelModal(false);
    setShowActionSheetModal(false);
    fetchDetail();
  }, [id, fetchDetail]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDetail();
  };

  // --- GESTION DES ACTIONS ---

  // 1. Primary Action réactive selon le statut et les sous-statuts
  const handlePrimaryAction = () => {
    if (!reservation) return;
    const photosList = reservation.photosEtatLieu || [];
    const checkoutPhotos = photosList.filter((p) => p.type === 'SORTIE' || (p as any).type === 'CHECKOUT');

    switch (reservation.statut) {
      case 'PAID':
        setShowConfirmTimeModal(true);
        break;
      case 'CONFIRMED':
        setCameraType('CHECKIN');
        setShowCameraModal(true);
        break;
      case 'CHECKED_IN':
        if (reservation.checkoutProprioLe || checkoutPhotos.length > 0) {
          handleCompleteCheckout();
        } else {
          setCameraType('CHECKOUT');
          setShowCameraModal(true);
        }
        break;
      case 'COMPLETED':
        if (!reservation.avisDonneProprio) {
          setShowRateModal(true);
        }
        break;
      default:
        setShowActionSheetModal(true);
        break;
    }
  };

  // 2. Valider confirmation avec choix des heures
  const handleConfirmReservation = async (checkinHeure: string, checkoutHeure: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'CONFIRM', {
        heureDebut: checkinHeure,
        heureFin: checkoutHeure,
        checkinHeure,
        checkoutHeure,
      });
      setShowConfirmTimeModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Réservation confirmée !', `Le séjour est désormais validé (Arrivée : ${checkinHeure}, Départ : ${checkoutHeure}).`);
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de confirmer la réservation pour le moment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Valider refus de réservation
  const handleRefuseReservation = async (motif: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'REFUSE', { raison: motif });
      setShowRefusalModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Réservation refusée', 'La réservation a été annulée et le locataire sera remboursé.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de refuser la réservation.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Soumettre photos d'état des lieux (Checkin / Checkout)
  const handleSubmitPhotos = async (photos: Array<{ uri: string; categorie: string }>) => {
    if (!id) return;
    setActionLoading(true);
    try {
      if (cameraType === 'CHECKIN') {
        await submitCheckinProprio(id as string, photos);
        Alert.alert('Check-in validé', 'Les photos d\'état des lieux d\'entrée ont été enregistrées avec succès.');
      } else {
        await submitCheckoutProprio(id as string, photos);
        Alert.alert('Check-out validé', 'Les photos d\'état des lieux de sortie ont été enregistrées avec succès.');
      }
      setShowCameraModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      fetchDetail();
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message;
      if (err?.response?.status === 409) {
        Alert.alert(
          'Action non disponible (Conflit 409)',
          serverMsg ||
            'L’état des lieux de sortie ne peut pas être effectué : vérifiez que le séjour est bien en cours (CHECKED_IN) ou que les photos n’ont pas déjà été soumises.'
        );
      } else {
        Alert.alert('Erreur', serverMsg || 'Échec de l’envoi des photos d’état des lieux.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Clôturer la réservation (Complete checkout)
  const handleCompleteCheckout = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'COMPLETE', {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Séjour clôturé !', 'La réservation est désormais terminée. Vos fonds ont été crédités vers votre portefeuille.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec lors de la clôture du séjour.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Soumettre litige
  const handleSubmitDispute = async (motif: string, description: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await submitDispute(id as string, motif, description);
      setShowDisputeModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Litige ouvert', 'Votre signalement a bien été transmis à l\'équipe support et arbitrage Klef.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec lors de l\'ouverture du litige.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Noter locataire
  const handleSubmitRating = async (note: number, commentaire: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await submitRating(id as string, note, commentaire);
      setShowRateModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Évaluation enregistrée', 'Merci pour votre retour d\'expérience sur ce locataire.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d\'enregistrer la note.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Signaler absence No-Show
  const handleConfirmNoshow = async (comment?: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'NOSHOW', { commentaire: comment });
      setShowNoshowModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Absence signalée', 'Le signalement de non-présentation a été enregistré.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de signaler l\'absence.');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Annuler séjour (Hôte)
  const handleConfirmOwnerCancel = async (raison: string) => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'CANCEL', { raison });
      setShowOwnerCancelModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert('Séjour annulé', 'Le séjour a bien été annulé et le locataire sera intégralement remboursé.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d\'annuler le séjour.');
    } finally {
      setActionLoading(false);
    }
  };

  // 9. Ré-ouvrir pour check-in tardif
  const handleReopenLateCheckin = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await updateReservationStatus(id as string, 'REOPEN_LATE_CHECKIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Check-in tardif réouvert', 'La réservation a été ré-ouverte pour accueillir le voyageur.');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Échec de la ré-ouverture du check-in tardif.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions annexes
  const handleCallGuest = () => {
    if (reservation?.locataire?.telephone) {
      Linking.openURL(`tel:${reservation.locataire.telephone}`);
    }
  };

  const handleDownloadContract = () => {
    if (reservation?.contratUrl) {
      Linking.openURL(reservation.contratUrl);
    } else {
      Alert.alert('Contrat en cours', 'Le contrat de location PDF est en cours de signature numérique.');
    }
  };

  return (
    <View style={styles.screenContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.navigate('/(owner)/reservations');
          }}
          style={styles.headerIconButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={20} color={colors.forest[950]} strokeWidth={2.2} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Détail du Séjour Hôte
        </Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Corps principal ScrollView */}
      {loading ? (
        <MobileOwnerReservationDetailSkeleton />
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={36} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchDetail} style={styles.retryButton}>
            <RefreshCw size={16} color={colors.forest[950]} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : reservation ? (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 170 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.lime[400]}
              colors={[colors.lime[400]]}
            />
          }
        >
          {/* 1. Hero Card sombre (Statut, dates & Revenu Net) */}
          <MobileOwnerReservationHeroCard reservation={reservation} />

          {/* 2. Bannière d'Annulation ou Expiration (Si CANCELLED / EXPIRED) */}
          {(reservation.statut === 'CANCELLED' || reservation.statut === 'EXPIRED') && (
            <MobileOwnerCancelledBannerCard reservation={reservation} />
          )}

          {/* 3. Carte d'Action Propriétaire Web 1:1 (Fond blanc, Étape X/5 & Notices) */}
          {reservation.statut !== 'CANCELLED' && reservation.statut !== 'EXPIRED' && (
            <MobileOwnerActionPanelCard
              reservation={reservation}
              onRefetch={fetchDetail}
              onOpenCheckinModal={() => {
                setCameraType('CHECKIN');
                setShowCameraModal(true);
              }}
              onOpenCheckoutModal={() => {
                setCameraType('CHECKOUT');
                setShowCameraModal(true);
              }}
              onConfirmReservation={() => setShowConfirmTimeModal(true)}
              onRefuseReservation={() => setShowRefusalModal(true)}
              onCompleteCheckout={handleCompleteCheckout}
              onOpenCancelModal={() => setShowOwnerCancelModal(true)}
              onOpenRateModal={() => setShowRateModal(true)}
              onOpenDisputeModal={(initialMotif) => {
                setDisputeInitialMotif(initialMotif || 'DEGRADATION');
                setShowDisputeModal(true);
              }}
              onOpenNoshowModal={() => setShowNoshowModal(true)}
              onReopenLateCheckin={handleReopenLateCheckin}
            />
          )}

          {/* 4. Accordéon Dépassement d'occupants (si CONFIRMED ou CHECKED_IN) */}
          {(reservation.statut === 'CONFIRMED' || reservation.statut === 'CHECKED_IN') && (
            <MobileOwnerExtraGuestCard
              nbPersonnes={reservation.nbPersonnes}
              onOpenDispute={() => {
                setDisputeInitialMotif('DEPASSEMENT_CAPACITE');
                setShowDisputeModal(true);
              }}
            />
          )}

          {/* 5. Bandeau Contrat PDF Horodaté (si non annulé et non pending) */}
          {reservation.statut !== 'CANCELLED' && reservation.statut !== 'EXPIRED' && reservation.statut !== 'PENDING' && (
            <MobileContractBannerCard
              contratUrl={reservation.contratUrl}
              reservationId={reservation.id}
            />
          )}

          {/* 6. Fiche Locataire (KYC, Badge Teranga, Note & Appel) */}
          <MobileOwnerGuestInfoCard reservation={reservation} />

          {/* 7. Photos de l'État des Lieux (Entrée / Sortie si présentes) */}
          {reservation.photosEtatLieu && reservation.photosEtatLieu.length > 0 && (
            <MobileOwnerEtatLieuxPreviewCard photos={reservation.photosEtatLieu} />
          )}

          {/* 8. Détail Financier Complet & Baromètre de Répartition */}
          <MobileOwnerFinancialBreakdownCard reservation={reservation} />

          {/* 9. Carte Détails du Paiement (Formule Acompte en ligne + Solde le jour J - Web 1:1) */}
          <MobileOwnerPaymentCard reservation={reservation} />

          {/* 10. Traçabilité & Mandat de Gestion (Gestion Directe vs Délégué) */}
          <MobileOwnerMandatCard reservation={reservation} />

          {/* 11. Carte Litige Propriétaire (Si statut DISPUTED ou objet litige présent) */}
          {(reservation.statut === 'DISPUTED' || reservation.litige) && (
            <MobileOwnerLitigeCard litige={reservation.litige || {
              id: 'lit-1',
              statut: 'EN_ATTENTE',
              motif: 'AUTRE',
              description: 'Dossier de litige en cours d\'examen par l\'équipe support Klef.',
              creeLe: new Date().toISOString(),
            }} />
          )}

          {/* 10. Chronologie de la réservation */}
          {reservation.historique && reservation.historique.length > 0 && (
            <MobileReservationTimeline historique={reservation.historique} />
          )}

          {/* 11. Carte Assistance Hôte Klef */}
          <MobileAssistanceCard reservationId={reservation.id} />
        </ScrollView>
      ) : null}

      {/* Sticky Bottom Action Bar (Masquée si la réservation est annulée ou expirée) */}
      {reservation && reservation.statut !== 'CANCELLED' && reservation.statut !== 'EXPIRED' && (
        <MobileOwnerActionStickyBar
          reservation={reservation}
          onPrimaryAction={handlePrimaryAction}
          onOpenActionSheet={() => setShowActionSheetModal(true)}
          loading={actionLoading}
        />
      )}

      {/* --- ECOSYSTÈME DES MODALES NATIVES --- */}

      {/* Modale 1: Choix heures check-in / check-out */}
      <MobileConfirmTimeModal
        visible={showConfirmTimeModal}
        onClose={() => setShowConfirmTimeModal(false)}
        onConfirm={handleConfirmReservation}
        loading={actionLoading}
        hasSameDayCheckout={Boolean((reservation as any)?.hasSameDayCheckout || (reservation as any)?.aUnCheckOutLeMemeJour)}
      />

      {/* Modale 2: Photos d'état des lieux (entrée / sortie) */}
      <MobileEtatLieuxCameraModal
        visible={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onSubmitPhotos={handleSubmitPhotos}
        type={cameraType}
        loading={actionLoading}
      />

      {/* Modale 3: Refus de réservation */}
      <MobileOwnerRefusalModal
        visible={showRefusalModal}
        onClose={() => setShowRefusalModal(false)}
        onConfirm={handleRefuseReservation}
        guestName={reservation?.locataire?.prenom}
      />

      {/* Modale 4: Ouverture de litige */}
      <MobileOpenDisputeModal
        visible={showDisputeModal}
        initialMotif={disputeInitialMotif}
        onClose={() => setShowDisputeModal(false)}
        onSubmitDispute={handleSubmitDispute}
        loading={actionLoading}
      />

      {/* Modale 5: Évaluation locataire */}
      <MobileRateGuestModal
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        onSubmitRating={handleSubmitRating}
        locataireNom={reservation?.locataire?.prenom}
        loading={actionLoading}
      />

      {/* Modale 6: Signalement d'absence No-show */}
      <MobileSignalNoshowModal
        visible={showNoshowModal}
        onClose={() => setShowNoshowModal(false)}
        onConfirmNoshow={handleConfirmNoshow}
        loading={actionLoading}
      />

      {/* Modale 7: Annulation du séjour côté hôte */}
      {reservation && (
        <MobileOwnerCancelModal
          visible={showOwnerCancelModal}
          onClose={() => setShowOwnerCancelModal(false)}
          onConfirmCancel={handleConfirmOwnerCancel}
          dateDebut={reservation.dateDebut}
          netProprietaire={reservation.netProprietaire}
          loading={actionLoading}
        />
      )}

      {/* Modale 8: BottomSheet d'actions globales */}
      {reservation && (
        <MobileOwnerActionSheetModal
          visible={showActionSheetModal}
          onClose={() => setShowActionSheetModal(false)}
          reservation={reservation}
          onOpenConfirmTime={() => setShowConfirmTimeModal(true)}
          onOpenRefusal={() => setShowRefusalModal(true)}
          onOpenCheckinCamera={() => {
            setCameraType('CHECKIN');
            setShowCameraModal(true);
          }}
          onOpenCheckoutCamera={() => {
            setCameraType('CHECKOUT');
            setShowCameraModal(true);
          }}
          onOpenDispute={() => setShowDisputeModal(true)}
          onOpenRateGuest={() => setShowRateModal(true)}
          onOpenNoshow={() => setShowNoshowModal(true)}
          onOpenOwnerCancel={() => setShowOwnerCancelModal(true)}
          onCallGuest={handleCallGuest}
          onDownloadContract={handleDownloadContract}
        />
      )}
    </View>
  );
}

// Fonction de Mock pour les démos & développement offline
function getMockOwnerReservation(idStr: string): ReservationDetail {
  const isNoshowMock = idStr?.toLowerCase().includes('noshow') || idStr?.toLowerCase().includes('late');
  return {
    id: idStr || '0f64cf0a-bbec-4942-b888-71d96ba0fd8b',
    dateDebut: '2026-09-15T14:00:00Z',
    dateFin: '2026-09-20T12:00:00Z',
    nbNuits: 5,
    nbPersonnes: 2,
    prixBase: 45000,
    supplementPersonnes: 0,
    prixNuitEffectif: 45000,
    reductionNuits: 0,
    totalBase: 225000,
    tauxCommission: 0.07,
    montantCommission: 15750,
    totalLocataire: 240750,
    netProprietaire: 225000,
    statut: isNoshowMock ? 'COMPLETED' : 'PAID',
    politiqueAppliquee: isNoshowMock ? 'NO_SHOW_LOCATAIRE' : null,
    checkinHeure: '14:00',
    checkoutHeureInput: '12:00',
    contratUrl: 'https://sticky-bar-zeta.vercel.app/sample-contract.pdf',
    creeLe: '2026-09-10T10:30:00Z',
    locataire: {
      id: 'usr-8832',
      prenom: 'Moussa',
      nom: 'Diop',
      telephone: '+221 77 123 45 67',
      email: 'moussa.diop@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      estVerifie: true,
      terangaBadge: 'OR',
      noteMoyenne: 4.9,
      nbAvis: 12,
    },
    logement: {
      id: 'log-102',
      titre: 'Villa Luxury Almadies avec Piscine',
      type: 'VILLA',
      ville: 'Dakar',
      quartier: 'Les Almadies',
      adresse: 'Route des Almadies, Villa #42',
      photos: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600', estPrincipale: true }],
    },
    historique: [
      { id: 'h1', nouveauStatut: 'PENDING', raison: 'Réservation effectuée par le locataire', modifieLe: '2026-09-10T10:30:00Z' },
      { id: 'h2', nouveauStatut: 'PAID', raison: 'Paiement Wave consigné sous séquestre Klef', modifieLe: '2026-09-10T10:35:00Z' },
    ],
  };
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderColor: colors.neutral[200],
    zIndex: 10,
    ...shadows.xs,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerPlaceholder: {
    width: 38,
    height: 38,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.forest[300],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 12,
  },
  errorText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[200],
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
  },
  retryButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
});
