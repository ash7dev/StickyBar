import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Check,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Smartphone,
  Star,
  X,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  FileText,
  Home,
  Key,
  Sparkles,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { apiClient } from '../../../../shared/api/api-client';
import { ReservationDetail } from '../../types/reservation-detail.types';
import { MobileCancelReservationModal } from './MobileCancelReservationModal';
import { MobileConfirmCheckinModal } from './MobileConfirmCheckinModal';

const ABSENCE_TOLERANCE_MS = 30 * 60 * 1000;

interface MobileTenantActionStickyBarProps {
  id: string;
  res: ReservationDetail;
  onRefetch: () => void;
}

export function MobileTenantActionStickyBar({ id, res, onRefetch }: MobileTenantActionStickyBarProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmCheckinModal, setShowConfirmCheckinModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [disputeMotif, setDisputeMotif] = useState('LOGEMENT_NON_CONFORME');
  const [disputeDescription, setDisputeDescription] = useState('');

  const { statut, photosEtatLieu, dateDebut, absenceSignaleeLe } = res;
  const isDisputeActive = statut === 'DISPUTED' || (!!res.litige && res.litige.statut === 'EN_ATTENTE');

  const checkinPhotos = useMemo(
    () => (photosEtatLieu || []).filter((p) => p.type === 'CHECKIN'),
    [photosEtatLieu]
  );

  const formattedCheckinDate = useMemo(() => {
    if (!dateDebut) return null;
    try {
      const d = new Date(dateDebut);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return null;
    }
  }, [dateDebut]);

  const isToday = useMemo(() => {
    if (!dateDebut) return false;
    try {
      const d = new Date(dateDebut);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  }, [dateDebut]);

  const hasPhotos = checkinPhotos.length > 0;

  const waitingNoticeContent = useMemo(() => {
    if (hasPhotos) {
      return 'Photos d’état des lieux ajoutées — en attente de validation';
    }
    if (isToday) {
      return 'État des lieux d’entrée prévu aujourd’hui';
    }
    if (formattedCheckinDate) {
      return `État des lieux d’entrée prévu le ${formattedCheckinDate}`;
    }
    return 'État des lieux d’entrée prévu le jour de votre arrivée';
  }, [hasPhotos, isToday, formattedCheckinDate]);
  const hasOwnerCheckin = !!res.checkinProprioLe;
  const hasTenantCheckin = !!res.checkinLocataireLe;

  const now = Date.now();
  const debutMs = new Date(dateDebut).getTime();
  const isCheckinTimePassed = now > debutMs + ABSENCE_TOLERANCE_MS;
  const alreadyReported = !!absenceSignaleeLe;

  // Déterminer le sous-état (uniquement pertinent pendant la fenêtre "check-in", cf. uiSection ci-dessous)
  const subState: 'owner-ready' | 'photos-pending' | 'absent-reported' | 'absent-time' | 'waiting' =
    hasOwnerCheckin
      ? 'owner-ready'
      : hasPhotos
        ? 'photos-pending'
        : isCheckinTimePassed
          ? alreadyReported
            ? 'absent-reported'
            : 'absent-time'
          : 'waiting';

  /**
   * FIX PRINCIPAL — état unique et exclusif de la barre.
   *
   * Avant : chaque bloc JSX avait sa propre condition indépendante
   * (`statut === 'PAID'`, `subState === 'owner-ready'`, etc.) sans jamais
   * s'exclure explicitement les unes des autres. Si `subState` calculait
   * par exemple 'owner-ready' ou 'absent-time' alors que `statut` valait
   * encore 'PAID'/'PENDING' (ex: décalage de synchro entre le check-in
   * propriétaire et la confirmation de paiement), DEUX blocs de boutons
   * s'affichaient en même temps, empilés dans le même conteneur. Résultat :
   * la barre devenait plus haute que prévu et certains boutons se
   * retrouvaient poussés hors de la zone visible ("je vois pas certains
   * boutons").
   *
   * Maintenant : un seul `switch` détermine LE bloc à afficher, avec le
   * statut de la réservation toujours prioritaire.
   */
  type UiSection =
    | 'dispute-locked'
    | 'pending-payment'
    | 'paid-waiting-owner'
    | 'owner-ready'
    | 'photos-pending'
    | 'absent-reported'
    | 'absent-time'
    | 'waiting'
    | 'checked-in'
    | 'completed'
    | 'none';

  const uiSection: UiSection = useMemo(() => {
    if (isDisputeActive) return 'dispute-locked';
    if (hasTenantCheckin) return statut === 'COMPLETED' ? 'completed' : 'checked-in';
    if (statut === 'COMPLETED') return 'completed';
    if (statut === 'PENDING') return 'pending-payment';
    if (statut === 'PAID') return 'paid-waiting-owner';
    if (statut === 'CONFIRMED' || statut === 'CHECKED_IN') return subState;
    return 'none';
  }, [isDisputeActive, hasTenantCheckin, statut, subState]);

  /* ── 1. Action API : Valider le Check-in ───────────────────────────────── */
  const handleConfirmCheckin = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${id}/checkin/confirm`);
      setShowConfirmCheckinModal(false);
      Alert.alert('Succès 🎉', 'Check-in validé ! Bon séjour dans votre logement.');
      onRefetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la validation du check-in.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 2. Action API : Signaler l'hôte absent ────────────────────────────── */
  const handleReportAbsent = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${id}/absent`);
      setShowAbsentModal(false);
      Alert.alert('Signalement transmis', 'L’hôte dispose de 2h pour réagir. À défaut, la réservation sera annulée et remboursée à 100%.');
      onRefetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors du signalement.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 3. Action API : Accorder 2h supplémentaires ──────────────────────── */
  const handleExtendAbsent = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${id}/extend-absent-timeout`);
      Alert.alert('Délai prolongé', '2 heures supplémentaires ont été accordées à l’hôte.');
      onRefetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l’extension du délai.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };



  /* ── 5. Action API : Évaluer l'hôte ────────────────────────────────────── */
  const handleSubmitRating = async () => {
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${id}/rate-owner`, {
        note: rating,
        commentaire: ratingComment.trim() || undefined,
      });
      setShowRatingModal(false);
      Alert.alert('Évaluation publiée', 'Merci d’avoir partagé votre avis !');
      onRefetch();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la publication de la note.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 6. Action API : Ouvrir un Litige ──────────────────────────────────── */
  const handleCreateDispute = async () => {
    if (disputeDescription.trim().length < 10) {
      Alert.alert('Description trop courte', 'Veuillez décrire le problème avec au moins 10 caractères.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
    setSubmitting(true);
    try {
      await apiClient.post('/disputes', {
        reservationId: id,
        motif: disputeMotif,
        description: disputeDescription.trim(),
      });
      setShowDisputeModal(false);
      setDisputeDescription('');
      Alert.alert('Litige ouvert 🚨', "Votre dossier a été transmis à l'équipe support Klef. Les fonds sous séquestre restent gelés pendant l'examen.");
      onRefetch();
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg)
        ? rawMsg.join('\n')
        : typeof rawMsg === 'string'
        ? rawMsg
        : "Erreur lors de l'ouverture du litige.";
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!['PENDING', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED'].includes(statut)) return null;

  return (
    <>
      {/* ── Sticky Bottom Bar Principal ───────────────────────────────────── */}
      <View style={styles.stickyBarContainer}>
        {/* Ligne d'avertissement si litige actif (affichée en plus, jamais seule) */}
        {uiSection === 'dispute-locked' && (
          <View style={styles.disputeBar}>
            <AlertTriangle size={16} color="#991B1B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.disputeBarText}>Dossier de litige en cours par le support Klef</Text>
              <Text style={styles.disputeBarSub}>Les fonds sous séquestre restent gelés pendant l’examen.</Text>
            </View>
          </View>
        )}

        {uiSection === 'owner-ready' && (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowConfirmCheckinModal(true)}
              disabled={submitting}
              style={styles.primaryActionBtn}
            >
              {submitting ? (
                <ActivityIndicator color={colors.forest[950]} />
              ) : (
                <>
                  <Check size={18} color={colors.forest[950]} strokeWidth={2.5} />
                  <Text style={styles.primaryActionText}>Valider le check-in</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDisputeModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <AlertTriangle size={14} color={colors.error[700]} />
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Litige</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiSection === 'absent-time' && (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowAbsentModal(true)}
              style={styles.dangerActionBtn}
            >
              <ShieldAlert size={18} color={colors.neutral[0]} />
              <Text style={styles.dangerActionText}>Signaler l’hôte absent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDisputeModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <AlertTriangle size={14} color={colors.error[700]} />
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Litige</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiSection === 'absent-reported' && (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleExtendAbsent}
              disabled={submitting}
              style={styles.warningActionBtn}
            >
              <Clock size={16} color={colors.forest[950]} />
              <Text style={styles.warningActionText}>Accorder 2h supplémentaires à l’hôte</Text>
            </TouchableOpacity>
          </View>
        )}

        {(uiSection === 'waiting' || uiSection === 'photos-pending') && (
          <View style={styles.actionGroup}>
            <View style={styles.waitingNoticeBlock}>
              <Clock size={14} color={colors.forest[700]} />
              <Text numberOfLines={2} style={styles.waitingNoticeText}>
                {waitingNoticeContent}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCancelModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* État PAID : En attente de confirmation de l'hôte */}
        {uiSection === 'paid-waiting-owner' && (
          <View style={styles.actionGroup}>
            <View style={styles.waitingNoticeBlock}>
              <ShieldCheck size={14} color={colors.forest[700]} />
              <Text style={styles.waitingNoticeText}>Paiement sous séquestre — en attente de confirmation</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCancelModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* État PENDING : En attente de paiement */}
        {uiSection === 'pending-payment' && (
          <View style={styles.actionGroup}>
            <View style={styles.waitingNoticeBlockAmber}>
              <Clock size={14} color="#92400E" />
              <Text style={styles.waitingNoticeTextAmber}>Paiement en attente de validation</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowCancelModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiSection === 'checked-in' && (
          <View style={styles.actionGroup}>
            <View style={styles.checkedInBadgeBlock}>
              <ShieldCheck size={16} color={colors.forest[700]} />
              <Text style={styles.checkedInBadgeText}>Séjour en cours</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDisputeModal(true)}
              style={styles.secondaryDangerBtn}
            >
              <AlertTriangle size={14} color={colors.error[700]} />
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Litige</Text>
            </TouchableOpacity>
          </View>
        )}

        {uiSection === 'completed' && (
          <View style={styles.actionGroup}>
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Évaluer le séjour"
              accessibilityHint="Ouvre le formulaire d'évaluation de l'hôte et du logement"
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                setShowRatingModal(true);
              }}
              style={styles.primaryActionBtn}
            >
              <Star size={16} color={colors.forest[950]} fill={colors.forest[950]} />
              <Text style={styles.primaryActionText}>Évaluer le séjour</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Litige"
              accessibilityHint="Déclarer un problème ou ouvrir un litige"
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                setShowDisputeModal(true);
              }}
              style={styles.secondaryDangerBtn}
            >
              <AlertTriangle size={14} color={colors.error[700]} />
              <Text numberOfLines={1} style={styles.secondaryDangerText}>Litige</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── MODALE CENTRALE PREMIUM : Validation Check-in ────────────────── */}
      <MobileConfirmCheckinModal
        visible={showConfirmCheckinModal}
        onClose={() => setShowConfirmCheckinModal(false)}
        onConfirm={handleConfirmCheckin}
        loading={submitting}
        photos={res.photosEtatLieu || []}
      />

      {/* ── MODALE 1 : Annulation de la Réservation ───────────────────────── */}
      <MobileCancelReservationModal
        visible={showCancelModal}
        reservationId={id}
        dateDebut={dateDebut}
        montantPaye={res.totalLocataire}
        onSuccess={onRefetch}
        onClose={() => setShowCancelModal(false)}
      />

      {/* ── MODALE 2 : Signaler l'hôte absent ────────────────────────────── */}
      <Modal visible={showAbsentModal} animationType="slide" transparent onRequestClose={() => setShowAbsentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signaler l'hôte absent</Text>
              <TouchableOpacity onPress={() => setShowAbsentModal(false)}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.warningNoticeBox}>
                <Clock size={18} color="#92400E" />
                <Text style={styles.warningNoticeText}>
                  Une fois le signalement envoyé, l'hôte dispose de 2 heures pour réagir. Passé ce délai, votre réservation sera annulée et remboursée à 100%.
                </Text>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  onPress={() => setShowAbsentModal(false)}
                  style={styles.modalGhostBtn}
                >
                  <Text style={styles.modalGhostBtnText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={submitting}
                  onPress={handleReportAbsent}
                  style={styles.modalDangerBtn}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.neutral[0]} />
                  ) : (
                    <Text style={styles.modalDangerBtnText}>Confirmer le signalement</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODALE 3 : Évaluation de l'hôte ──────────────────────────────── */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRatingModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Évaluer votre séjour</Text>
              <TouchableOpacity onPress={() => setShowRatingModal(false)} style={{ padding: 4 }}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalSub}>Donnez une note à l'hôte et à la qualité du logement :</Text>

              {/* Star Picker */}
              <View style={styles.starsContainer}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.6}
                      hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                      style={{ padding: 4 }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
                        setRating(star);
                      }}
                    >
                      <Star
                        size={34}
                        color={star <= rating ? colors.gold[400] : colors.neutral[300]}
                        fill={star <= rating ? colors.gold[400] : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingBadgeLabel}>
                  {rating === 5 && '🌟 5.0 / 5 — Parfait !'}
                  {rating === 4 && '👍 4.0 / 5 — Très bien'}
                  {rating === 3 && '😐 3.0 / 5 — Moyen'}
                  {rating === 2 && '👎 2.0 / 5 — Décevant'}
                  {rating === 1 && '⚠️ 1.0 / 5 — Inacceptable'}
                </Text>
              </View>

              <Text style={styles.label}>Commentaire (Optionnel)</Text>
              <TextInput
                multiline
                numberOfLines={3}
                onChangeText={setRatingComment}
                placeholder="Propreté, réactivité de l'hôte, conformité de l'annonce..."
                placeholderTextColor={colors.neutral[400]}
                style={styles.textArea}
                value={ratingComment}
                selectionColor={colors.forest[700]}
                cursorColor={colors.forest[900]}
              />

              <TouchableOpacity
                disabled={submitting}
                onPress={handleSubmitRating}
                style={styles.primaryActionBtn}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <Text style={styles.primaryActionText}>Publier mon avis</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODALE 4 : Déclarer un Litige ───────────────────────────────── */}
      <Modal visible={showDisputeModal} animationType="slide" transparent onRequestClose={() => setShowDisputeModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Déclarer un litige</Text>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.warningNoticeBox}>
                <AlertTriangle size={18} color="#991B1B" />
                <Text style={[styles.warningNoticeText, { color: '#7F1D1D' }]}>
                  En ouvrant un litige, les fonds sous séquestre restent gelés jusqu’à arbitrage par l'équipe support Klef (48-72h).
                </Text>
              </View>

              <Text style={styles.label}>Motif du litige</Text>
              <View style={styles.motifStack}>
                {[
                  { key: 'LOGEMENT_NON_CONFORME', label: 'Logement non conforme à l’annonce', Icon: Home },
                  { key: 'LOGEMENT_INACCESSIBLE', label: 'Logement inaccessible / Clés manquantes', Icon: Key },
                  { key: 'DOMMAGES', label: 'Propreté ou dégradation du logement', Icon: Sparkles },
                  { key: 'DEPASSEMENT_PERSONNES', label: 'Dépassement de personnes ou nuisances', Icon: AlertTriangle },
                  { key: 'NON_PAIEMENT', label: 'Non-paiement de frais supplémentaires', Icon: Info },
                  { key: 'AUTRE', label: 'Autre motif', Icon: HelpCircle },
                ].map((item) => {
                  const selected = disputeMotif === item.key;
                  const IconComp = item.Icon;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
                        setDisputeMotif(item.key);
                      }}
                      style={[styles.motifChip, selected && styles.motifChipActive]}
                    >
                      <IconComp size={16} color={selected ? '#991B1B' : colors.neutral[500]} />
                      <Text style={[styles.motifChipText, selected && styles.motifChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Description détaillée du problème *</Text>
              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={setDisputeDescription}
                placeholder="Décrivez précisément ce qui ne va pas (photos/preuves recommandées)..."
                placeholderTextColor={colors.neutral[400]}
                style={styles.textArea}
                value={disputeDescription}
                selectionColor={colors.forest[700]}
                cursorColor={colors.forest[900]}
              />
              <Text style={styles.helperText}>
                Minimum 10 caractères · {disputeDescription.trim().length} saisis
              </Text>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  onPress={() => setShowDisputeModal(false)}
                  style={styles.modalGhostBtn}
                >
                  <Text style={styles.modalGhostBtnText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={submitting || disputeDescription.trim().length < 10}
                  onPress={handleCreateDispute}
                  style={[styles.modalDangerBtn, disputeDescription.trim().length < 10 && styles.btnDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.neutral[0]} />
                  ) : (
                    <Text style={styles.modalDangerBtnText}>Ouvrir le litige</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  stickyBarContainer: {
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 8,
    zIndex: 100,
    ...shadows.float,
  },

  disputeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 10,
    borderRadius: radius.inner,
  },
  disputeBarText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#991B1B',
  },
  disputeBarSub: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 2,
  },

  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  primaryActionText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  dangerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error[500],
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  dangerActionText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  warningActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.warning[500],
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  warningActionText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  secondaryDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  secondaryDangerText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.error[700],
  },

  waitingNoticeBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[50],
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  waitingNoticeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
    flex: 1,
  },

  waitingNoticeBlockAmber: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  waitingNoticeTextAmber: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#92400E',
  },

  checkedInBadgeBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.forest[50],
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  checkedInBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.forest[900],
  },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  modalBody: {
    gap: 14,
  },
  modalSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  label: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[900],
  },
  textArea: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    padding: 12,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[900],
    textAlignVertical: 'top',
    minHeight: 80,
    maxHeight: 160,
  },
  warningNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    borderRadius: radius.inner,
  },
  warningNoticeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
  },

  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalGhostBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  modalGhostBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[700],
  },
  modalDangerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.error[500],
    alignItems: 'center',
  },
  modalDangerBtnText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.neutral[0],
  },
  btnDisabled: {
    opacity: 0.5,
  },

  starsContainer: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
    backgroundColor: colors.neutral[50],
    paddingVertical: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  ratingBadgeLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: colors.forest[900],
  },

  motifStack: {
    gap: 8,
  },
  motifChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  motifChipActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  motifChipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[700],
    flex: 1,
  },
  motifChipTextActive: {
    fontFamily: typography.fontBodyBold,
    color: '#991B1B',
  },
  helperText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[500],
  },

  refundScaleBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    gap: 8,
  },
  refundScaleTitle: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  refundTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierWindow: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },
  tierPctGreen: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#065F46',
  },
  tierPctAmber: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#92400E',
  },
  tierPctRed: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#991B1B',
  },
});