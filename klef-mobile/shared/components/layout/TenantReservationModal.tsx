import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Calendar,
  Users,
  Minus,
  Plus,
  Moon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { AppDateRangeCalendar } from '../ui/AppDateRangeCalendar';
import { getPrixPublic, getPrixDerniereMinute } from '../ui/TenantPriceDisplay';
import { router } from 'expo-router';
import { useGatedAction } from '../../hooks/useGatedAction';
import { TenantActionGateModal } from '../gate/TenantActionGateModal';
import { useAuthStore } from '../../../features/auth/stores/auth.store';

export interface TarifNuit {
  nuitsMin: number;
  nuitsMax?: number | null;
  prix: number;
}

export interface TarifPersonne {
  personnesMin: number;
  personnesMax: number;
  supplement: number;
}

interface TenantReservationModalProps {
  visible: boolean;
  listingId: string;
  titre: string;
  prixBase: number | string;
  nuitesMinimum?: number | null;
  capaciteMax?: number;
  personnesBase?: number | null;
  derniereMinuteActive?: boolean;
  tarifsPersonnes?: TarifPersonne[];
  tarifsNuits?: TarifNuit[];
  onClose: () => void;
}

const formatMoney = (amount: number) => {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export function TenantReservationModal({
  visible,
  listingId,
  titre,
  prixBase,
  nuitesMinimum = 1,
  capaciteMax = 1,
  personnesBase = 1,
  derniereMinuteActive = false,
  tarifsPersonnes = [],
  tarifsNuits = [],
  onClose,
}: TenantReservationModalProps) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [cguAccepted, setCguAccepted] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const minNuits = nuitesMinimum ?? 1;

  // Calcul du nombre de nuits
  const calculateNights = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  };

  const nights = calculateNights();
  const prixPublic = getPrixPublic(prixBase);
  const prixParNuit = derniereMinuteActive ? getPrixDerniereMinute(prixPublic) : prixPublic;
  const effectiveNights = nights > 0 ? nights : minNuits;
  const sousTotalNuits = prixParNuit * effectiveNights;

  // 1. Calcul du supplément personnes si nbPersonnes > personnesBase
  const pBase = personnesBase ?? 1;
  let supplementPersonnes = 0;
  if (nbPersonnes > pBase && Array.isArray(tarifsPersonnes)) {
    const tp = tarifsPersonnes.find(
      (t) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax
    );
    if (tp && tp.supplement) {
      const suppPublicPerNight = getPrixPublic(Number(tp.supplement));
      supplementPersonnes = suppPublicPerNight * effectiveNights;
    }
  }

  // 2. Calcul de la réduction durée / séjour long
  let reductionNuits = 0;
  if (effectiveNights > minNuits && Array.isArray(tarifsNuits)) {
    const tn = tarifsNuits.find(
      (t) => effectiveNights >= t.nuitsMin && (!t.nuitsMax || effectiveNights <= t.nuitsMax)
    );
    if (tn && tn.prix) {
      const prixReduitPublic = getPrixPublic(Number(tn.prix));
      reductionNuits = Math.max(0, (prixPublic - prixReduitPublic) * effectiveNights);
    }
  }

  const totalEstime = Math.max(0, sousTotalNuits + supplementPersonnes - reductionNuits);

  const hasValidNights = nights >= minNuits;
  const canConfirm = Boolean(startDate && endDate && hasValidNights);

  const navigateToCheckout = useCallback(() => {
    router.push(
      `/reserver?listingId=${listingId}&dateDebut=${startDate}&dateFin=${endDate}&personnes=${nbPersonnes}` as any
    );
  }, [listingId, startDate, endDate, nbPersonnes]);

  const { gateState, trigger: triggerGate, complete: completeGate, cancel: cancelGate } = useGatedAction(navigateToCheckout);

  const handleConfirmReservation = () => {
    if (!canConfirm) return;
    const { token, isAuthenticated } = useAuthStore.getState();

    if (!token || !isAuthenticated) {
      onClose();
      setTimeout(() => {
        router.push(
          `/(auth)/login?next=${encodeURIComponent(
            `/reserver?listingId=${listingId}&dateDebut=${startDate}&dateFin=${endDate}&personnes=${nbPersonnes}`
          )}` as any
        );
      }, 400);
      return;
    }

    onClose();
    setTimeout(() => {
      triggerGate();
    }, 400);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropPress}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          {/* Poignée de glissement */}
          <View style={styles.dragHandle} />

          {/* En-tête */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>Réserver ce logement</Text>
              <Text numberOfLines={1} style={styles.headerSubtitle}>
                {titre}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={18} color={colors.neutral[700]} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── 1. Sélecteur de Dates ───────────────────────────────── */}
            <View style={styles.cardBlock}>
              <View style={styles.blockHeader}>
                <Calendar size={16} color={colors.forest[700]} />
                <Text style={styles.blockTitle}>Dates de séjour</Text>
              </View>

              <View style={styles.datesRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowCalendar(!showCalendar)}
                  style={styles.dateBox}
                >
                  <Text style={styles.dateBoxLabel}>ARRIVÉE</Text>
                  <Text style={styles.dateBoxValue}>
                    {startDate ? startDate : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowCalendar(!showCalendar)}
                  style={styles.dateBox}
                >
                  <Text style={styles.dateBoxLabel}>DÉPART</Text>
                  <Text style={styles.dateBoxValue}>
                    {endDate ? endDate : 'Sélectionner'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Calendrier dépliable */}
              {showCalendar && (
                <View style={styles.calendarWrapper}>
                  <AppDateRangeCalendar
                    value={{
                      from: startDate ? new Date(startDate) : null,
                      to: endDate ? new Date(endDate) : null,
                    }}
                    onChange={(range) => {
                      const fromStr = range.from
                        ? range.from.toISOString().split('T')[0]
                        : null;
                      const toStr = range.to
                        ? range.to.toISOString().split('T')[0]
                        : null;
                      setStartDate(fromStr);
                      setEndDate(toStr);
                      if (range.from && range.to) {
                        setShowCalendar(false);
                      }
                    }}
                    minNights={minNuits}
                  />
                </View>
              )}

              {nights > 0 && (
                <View style={styles.nightsBadge}>
                  <Moon size={13} color={colors.forest[700]} />
                  <Text style={styles.nightsBadgeText}>
                    {nights} nuit{nights > 1 ? 's' : ''} sélectionnée{nights > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* ── 2. Sélecteur de Voyageurs ───────────────────────────── */}
            <View style={styles.cardBlock}>
              <View style={styles.blockHeaderBetween}>
                <View style={styles.blockHeader}>
                  <Users size={16} color={colors.forest[700]} />
                  <Text style={styles.blockTitle}>Voyageurs</Text>
                </View>
                <Text style={styles.maxText}>Max {capaciteMax} pers.</Text>
              </View>

              <View style={styles.guestsCounterRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setNbPersonnes(Math.max(1, nbPersonnes - 1))}
                  disabled={nbPersonnes <= 1}
                  style={[
                    styles.counterBtn,
                    nbPersonnes <= 1 && styles.counterBtnDisabled,
                  ]}
                >
                  <Minus size={16} color={colors.forest[950]} />
                </TouchableOpacity>

                <View style={styles.guestsValueBox}>
                  <Text style={styles.guestsCountText}>{nbPersonnes}</Text>
                  <Text style={styles.guestsLabelText}>
                    {nbPersonnes === 1 ? 'voyageur' : 'voyageurs'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setNbPersonnes(Math.min(capaciteMax, nbPersonnes + 1))
                  }
                  disabled={nbPersonnes >= capaciteMax}
                  style={[
                    styles.counterBtn,
                    nbPersonnes >= capaciteMax && styles.counterBtnDisabled,
                  ]}
                >
                  <Plus size={16} color={colors.forest[950]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── 3. Récapitulatif Tarifaire ──────────────────────────── */}
            <View style={styles.recapCard}>
              <View style={styles.recapRow}>
                <Text style={styles.recapLabel}>
                  {formatMoney(prixParNuit)} FCFA × {effectiveNights} nuit
                  {effectiveNights > 1 ? 's' : ''}
                </Text>
                <Text style={styles.recapValue}>
                  {formatMoney(sousTotalNuits)} FCFA
                </Text>
              </View>

              {supplementPersonnes > 0 && (
                <View style={styles.recapRow}>
                  <Text style={styles.recapLabel}>
                    Supplément ({nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.recapValue}>
                    + {formatMoney(supplementPersonnes)} FCFA
                  </Text>
                </View>
              )}

              {reductionNuits > 0 && (
                <View style={styles.recapRow}>
                  <Text style={styles.recapDiscountLabel}>
                    Réduction séjour long
                  </Text>
                  <Text style={styles.recapDiscountValue}>
                    - {formatMoney(reductionNuits)} FCFA
                  </Text>
                </View>
              )}

              <View style={styles.dividerLine} />

              <View style={styles.recapTotalRow}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(totalEstime)} FCFA
                </Text>
              </View>
            </View>

            {/* ── Erreurs & Alertes Nuits Minimum ─────────────────────── */}
            {startDate && endDate && !hasValidNights && (
              <View style={styles.alertBox}>
                <AlertCircle size={16} color={colors.error[600]} />
                <Text style={styles.alertText}>
                  Séjour minimum requis : {minNuits} nuits ({nights} choisie
                  {nights > 1 ? 's' : ''}).
                </Text>
              </View>
            )}

            {/* ── Case à Cocher CGU ──────────────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCguAccepted(!cguAccepted)}
              style={styles.cguRow}
            >
              <View
                style={[
                  styles.checkbox,
                  cguAccepted && styles.checkboxActive,
                ]}
              >
                {cguAccepted && (
                  <CheckCircle2 size={14} color={colors.neutral[0]} />
                )}
              </View>
              <Text style={styles.cguText}>
                J'accepte les conditions de réservation et la politique d'annulation Klef.
              </Text>
            </TouchableOpacity>

            {/* ── Bouton Valider ──────────────────────────────────────── */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleConfirmReservation}
              disabled={!canConfirm}
              style={[
                styles.confirmButton,
                !canConfirm && styles.confirmButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  !canConfirm && styles.confirmButtonTextDisabled,
                ]}
              >
                {!startDate || !endDate
                  ? 'Sélectionnez vos dates'
                  : !hasValidNights
                  ? `Min. ${minNuits} nuits requises`
                  : 'Confirmer et réserver'}
              </Text>
              {canConfirm && <ChevronRight size={18} color={colors.forest[950]} />}
            </TouchableOpacity>

            {/* Micro-signaux de confiance */}
            <View style={styles.trustSignalsRow}>
              <View style={styles.trustItem}>
                <ShieldCheck size={14} color={colors.forest[600]} />
                <Text style={styles.trustText}>Séquestre garanti</Text>
              </View>
              <View style={styles.trustItem}>
                <Lock size={14} color={colors.forest[600]} />
                <Text style={styles.trustText}>Paiement sécurisé</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Action Gate Modal (Profil, Téléphone, KYC) */}
    <TenantActionGateModal
      visible={gateState.open}
      steps={gateState.steps}
      block={gateState.block}
      onComplete={completeGate}
      onCancel={cancelGate}
    />
  </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingTop: 10,
    paddingBottom: 24,
    ...shadows.lg,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTitleBox: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  cardBlock: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  maxText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 10,
    gap: 2,
  },
  dateBoxLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.4,
  },
  dateBoxValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  calendarWrapper: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 8,
    marginTop: 4,
  },
  nightsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  nightsBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },

  // Counter voyageurs
  guestsCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    backgroundColor: colors.neutral[200],
    opacity: 0.5,
  },
  guestsValueBox: {
    alignItems: 'center',
  },
  guestsCountText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[950],
  },
  guestsLabelText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Récap
  recapCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.inner,
    padding: 14,
    gap: 8,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recapLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.forest[200],
  },
  recapValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  recapDiscountLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.lime[300],
  },
  recapDiscountValue: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.lime[300],
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  recapTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  totalValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.lime[300],
  },

  // Alert
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    padding: 10,
    borderRadius: radius.inner,
  },
  alertText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.error[700],
  },

  // CGU
  cguRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.forest[600],
    borderColor: colors.forest[600],
  },
  cguText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
    lineHeight: 15,
  },

  // CTA Confirm
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
    marginTop: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  confirmButtonText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  confirmButtonTextDisabled: {
    color: colors.neutral[500],
    fontFamily: typography.fontBodyMedium,
  },

  // Trust
  trustSignalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
});
