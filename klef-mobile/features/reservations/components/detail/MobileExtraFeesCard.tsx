import React, { useState } from 'react';
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
} from 'react-native';
import {
  Banknote,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { apiClient } from '../../../../shared/api/api-client';

export interface DemandeFraisItem {
  id: string;
  reservationId: string;
  titre: string;
  description?: string | null;
  montant: number | string;
  statut: 'EN_ATTENTE' | 'PAYE' | 'REFUSE' | 'CONTESTE';
  methodePaiement?: string | null;
  creeLe: string;
  payeLe?: string | null;
  refuseLe?: string | null;
}

interface MobileExtraFeesCardProps {
  reservationId: string;
  demandesFrais?: DemandeFraisItem[];
  onRefresh: () => void;
  onOpenDispute: () => void;
}

function formatFCFA(n: number | string) {
  const val = Math.round(Number(n) || 0);
  return `${val.toLocaleString('fr-FR')} FCFA`;
}

export function MobileExtraFeesCard({
  reservationId,
  demandesFrais = [],
  onRefresh,
  onOpenDispute,
}: MobileExtraFeesCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const [feeToPay, setFeeToPay] = useState<DemandeFraisItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WAVE' | 'ORANGE_MONEY' | 'CARD'>('WAVE');
  const [phoneNumber, setPhoneNumber] = useState('');

  const pendingFees = demandesFrais.filter((item) => item.statut === 'EN_ATTENTE');
  const hasFees = demandesFrais.length > 0;

  if (!hasFees && pendingFees.length === 0) {
    return null;
  }

  const handlePayFee = async () => {
    if (!feeToPay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${reservationId}/frais/${feeToPay.id}/payer`, {
        methodePaiement: paymentMethod,
        telephone: phoneNumber || undefined,
      });
      setFeeToPay(null);
      Alert.alert('Paiement validé 🎉', 'Le supplément a été réglé avec succès.');
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors du règlement du supplément.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuseFee = async (fraisItem: DemandeFraisItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setSubmitting(true);
    try {
      await apiClient.post(`/reservations/${reservationId}/frais/${fraisItem.id}/refuser`, {
        raison: `Contestation du supplément ${fraisItem.titre}`,
      });
      Alert.alert('Contestation envoyée 🚨', 'Un litige a été ouvert concernant ce supplément.');
      onOpenDispute();
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors du refus du supplément.';
      Alert.alert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.cardContainer}>
        {/* En-tête */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Banknote size={18} color={colors.forest[700]} />
          </View>
          <View style={styles.headerTextStack}>
            <Text style={styles.headerTitle}>Frais & Suppléments séjour</Text>
            <Text style={styles.headerSub}>
              {pendingFees.length > 0
                ? `${pendingFees.length} demande${pendingFees.length > 1 ? 's' : ''} en attente`
                : 'Historique des suppléments'}
            </Text>
          </View>
        </View>

        {/* Liste des suppléments */}
        <View style={styles.feesList}>
          {demandesFrais.map((item) => {
            const isPending = item.statut === 'EN_ATTENTE';
            const isPaid = item.statut === 'PAYE';
            const isRefused = item.statut === 'REFUSE' || item.statut === 'CONTESTE';

            return (
              <View
                key={item.id}
                style={[
                  styles.feeBox,
                  isPending && styles.feeBoxPending,
                  isPaid && styles.feeBoxPaid,
                  isRefused && styles.feeBoxRefused,
                ]}
              >
                {/* Titre et Badge de statut */}
                <View style={styles.feeTopRow}>
                  <Text style={styles.feeTitle} numberOfLines={2}>
                    {item.titre}
                  </Text>
                  <View style={styles.badgeWrapper}>
                    {isPending && (
                      <View style={styles.badgeWarning}>
                        <Clock size={10} color="#92400E" />
                        <Text style={styles.badgeWarningText}>En attente</Text>
                      </View>
                    )}
                    {isPaid && (
                      <View style={styles.badgeSuccess}>
                        <CheckCircle2 size={10} color="#065F46" />
                        <Text style={styles.badgeSuccessText}>Réglé</Text>
                      </View>
                    )}
                    {isRefused && (
                      <View style={styles.badgeDanger}>
                        <AlertTriangle size={10} color="#991B1B" />
                        <Text style={styles.badgeDangerText}>Contesté</Text>
                      </View>
                    )}
                  </View>
                </View>

                {item.description ? (
                  <Text style={styles.feeDesc}>{item.description}</Text>
                ) : null}

                {/* Ligne Montant */}
                <View style={styles.feePriceRow}>
                  <Text style={styles.feePriceLabel}>Montant du supplément :</Text>
                  <Text style={styles.feePriceVal}>{formatFCFA(item.montant)}</Text>
                </View>

                {/* Boutons d'action Locataire */}
                {isPending && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => setFeeToPay(item)}
                      style={styles.payBtn}
                    >
                      <CreditCard size={14} color={colors.forest[950]} />
                      <Text style={styles.payBtnText} numberOfLines={1}>
                        Régler le supplément
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRefuseFee(item)}
                      style={styles.contestBtn}
                    >
                      <Text style={styles.contestBtnText} numberOfLines={1}>
                        Contester
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Modale de règlement */}
      <Modal visible={!!feeToPay} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Règlement du supplément</Text>
              <TouchableOpacity onPress={() => setFeeToPay(null)}>
                <X size={20} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            {feeToPay && (
              <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Motif du supplément</Text>
                  <Text style={styles.summaryTitle} numberOfLines={2}>{feeToPay.titre}</Text>
                  <Text style={styles.summaryAmount}>{formatFCFA(feeToPay.montant)}</Text>
                </View>

                <Text style={styles.inputLabel}>Mode de paiement</Text>
                <View style={styles.methodsRow}>
                  {[
                    { id: 'WAVE' as const, label: 'Wave' },
                    { id: 'ORANGE_MONEY' as const, label: 'Orange Money' },
                    { id: 'CARD' as const, label: 'Carte' },
                  ].map((m) => {
                    const selected = paymentMethod === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        onPress={() => setPaymentMethod(m.id)}
                        style={[styles.methodChip, selected && styles.methodChipActive]}
                      >
                        <Text
                          style={[styles.methodChipText, selected && styles.methodChipTextActive]}
                          numberOfLines={1}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {paymentMethod !== 'CARD' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Numéro Mobile Money (Sénégal)</Text>
                    <TextInput
                      keyboardType="phone-pad"
                      onChangeText={setPhoneNumber}
                      placeholder="Ex: 77 123 45 67"
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textInput}
                      value={phoneNumber}
                    />
                  </View>
                )}

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity onPress={() => setFeeToPay(null)} style={styles.modalGhostBtn}>
                    <Text style={styles.modalGhostBtnText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={submitting}
                    onPress={handlePayFee}
                    style={styles.modalPrimaryBtn}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.forest[950]} />
                    ) : (
                      <Text style={styles.modalPrimaryBtnText} numberOfLines={1}>
                        Payer {formatFCFA(feeToPay.montant)}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
    gap: 14,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextStack: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  headerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  feesList: {
    gap: 10,
  },
  feeBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    gap: 8,
  },
  feeBoxPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  feeBoxPaid: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  feeBoxRefused: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },

  feeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  feeTitle: {
    flex: 1,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  badgeWrapper: {
    flexShrink: 0,
  },

  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE68A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeWarningText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: '#92400E' },

  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#A7F3D0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeSuccessText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: '#065F46' },

  badgeDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCA5A5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeDangerText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: '#991B1B' },

  feeDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[700],
    lineHeight: 16,
  },
  feePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  feePriceLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
  feePriceVal: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  payBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  contestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  contestBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.error[700],
  },

  // Modal
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
    maxHeight: '85%',
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
  summaryBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 4,
  },
  summaryLabel: { fontFamily: typography.fontBodyMedium, fontSize: 10, color: colors.neutral[500] },
  summaryTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 14, color: colors.forest[950] },
  summaryAmount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.forest[900], marginTop: 4 },

  inputGroup: { gap: 6 },
  inputLabel: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.neutral[900] },
  textInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    padding: 12,
    fontFamily: typography.fontBody,
    fontSize: 14,
    color: colors.neutral[900],
  },

  methodsRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  methodChipActive: { backgroundColor: colors.forest[50], borderColor: colors.forest[600] },
  methodChipText: { fontFamily: typography.fontBodyMedium, fontSize: 11, color: colors.neutral[700] },
  methodChipTextActive: { fontFamily: typography.fontBodyBold, color: colors.forest[900] },

  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalGhostBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.neutral[100], alignItems: 'center' },
  modalGhostBtnText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.neutral[700] },
  modalPrimaryBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.pill, backgroundColor: colors.lime[400], alignItems: 'center' },
  modalPrimaryBtnText: { fontFamily: typography.fontBodyExtraBold, fontSize: 12, color: colors.forest[950] },
});
