import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { X, ArrowUpRight, CheckCircle2, ShieldCheck, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { requestWithdrawal } from '../services/wallet.service';
import { WithdrawalRequest } from '../types/wallet.types';

const waveLogo = require('../../../assets/images/wavelogo.jpeg');
const omLogo = require('../../../assets/images/orangeMoneylogo.png');

interface MobileWithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  soldeDisponible: number;
  onSuccess?: () => void;
}

type ProviderType = 'WAVE' | 'ORANGE_MONEY';

export function MobileWithdrawModal({
  visible,
  onClose,
  soldeDisponible,
  onSuccess,
}: MobileWithdrawModalProps) {
  const [montant, setMontant] = useState<string>('');
  const [moyenPaiement, setMoyenPaiement] = useState<ProviderType>('WAVE');
  const [telephone, setTelephone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const parsedMontant = Number(montant.replace(/\s/g, '')) || 0;
  const isMontantValid = parsedMontant >= 10000 && parsedMontant <= soldeDisponible;

  const handleQuickAmount = (val: number) => {
    Haptics.selectionAsync().catch(() => {});
    setMontant(String(val));
  };

  const handleWithdraw = async () => {
    if (!isMontantValid) {
      if (parsedMontant < 10000) {
        Alert.alert('Montant insuffisant', 'Le montant minimum de retrait est de 10 000 FCFA.');
      } else {
        Alert.alert('Solde dépassé', 'Le montant demandé dépasse votre solde disponible retirable.');
      }
      return;
    }

    if (!telephone || telephone.trim().length < 8) {
      Alert.alert('Numéro requis', 'Veuillez saisir votre numéro de téléphone de réception Mobile Money.');
      return;
    }

    setLoading(true);
    try {
      const payload: WithdrawalRequest = {
        montant: parsedMontant,
        moyenPaiement,
        numeroTelephone: telephone.trim(),
      };

      await requestWithdrawal(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        'Demande transmise !',
        `Votre demande de retrait de ${parsedMontant.toLocaleString('fr-FR')} FCFA via ${moyenPaiement.replace('_', ' ')} a bien été enregistrée.`
      );
      setMontant('');
      setTelephone('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      console.warn('Erreur demande retrait:', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      Alert.alert('Échec du retrait', serverMsg || 'Impossible de valider votre demande de retrait.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <ArrowUpRight size={18} color={colors.lime[400]} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Demander un Retrait</Text>
                <Text style={styles.modalSub}>
                  Disponible : {soldeDisponible.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={18} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* 1. Sélection Moyen de paiement */}
            <Text style={styles.sectionLabel}>Moyen de réception Mobile Money</Text>
            <View style={styles.providersRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMoyenPaiement('WAVE')}
                style={[styles.providerTile, moyenPaiement === 'WAVE' && styles.providerTileActive]}
              >
                <Image source={waveLogo} style={styles.providerLogo} resizeMode="cover" />
                <Text style={[styles.providerTileText, moyenPaiement === 'WAVE' && styles.providerTileTextActive]}>
                  Wave Senegal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setMoyenPaiement('ORANGE_MONEY')}
                style={[styles.providerTile, moyenPaiement === 'ORANGE_MONEY' && styles.providerTileActive]}
              >
                <Image source={omLogo} style={styles.providerLogo} resizeMode="cover" />
                <Text style={[styles.providerTileText, moyenPaiement === 'ORANGE_MONEY' && styles.providerTileTextActive]}>
                  Orange Money
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Saisie du Montant */}
            <Text style={styles.sectionLabel}>Montant à retirer (FCFA)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: 50000"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="numeric"
                value={montant}
                onChangeText={setMontant}
              />
              <Text style={styles.currencyBadge}>FCFA</Text>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmountsRow}>
              {soldeDisponible >= 25000 && (
                <TouchableOpacity onPress={() => handleQuickAmount(25000)} style={styles.quickPill}>
                  <Text style={styles.quickPillText}>25 000</Text>
                </TouchableOpacity>
              )}
              {soldeDisponible >= 50000 && (
                <TouchableOpacity onPress={() => handleQuickAmount(50000)} style={styles.quickPill}>
                  <Text style={styles.quickPillText}>50 000</Text>
                </TouchableOpacity>
              )}
              {soldeDisponible >= 100000 && (
                <TouchableOpacity onPress={() => handleQuickAmount(100000)} style={styles.quickPill}>
                  <Text style={styles.quickPillText}>100 000</Text>
                </TouchableOpacity>
              )}
              {soldeDisponible >= 10000 && (
                <TouchableOpacity onPress={() => handleQuickAmount(soldeDisponible)} style={styles.quickPillHighlight}>
                  <Text style={styles.quickPillHighlightText}>Tout retirer ({soldeDisponible.toLocaleString('fr-FR')})</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Numéro de Téléphone */}
            <Text style={styles.sectionLabel}>Numéro de compte Mobile Money</Text>
            <View style={styles.inputBox}>
              <Phone size={16} color={colors.neutral[400]} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.textInput, { paddingLeft: 8 }]}
                placeholder="+221 77 000 00 00"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="phone-pad"
                value={telephone}
                onChangeText={setTelephone}
              />
            </View>

            {/* Security Notice */}
            <View style={styles.securityBox}>
              <ShieldCheck size={16} color={colors.forest[700]} />
              <Text style={styles.securityText}>
                Les retraits vers Wave et Orange Money sont traités sous 2 heures ouvrées sans aucun frais masqué.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleWithdraw}
              disabled={loading || !isMontantValid || !telephone}
              style={[
                styles.submitBtn,
                (loading || !isMontantValid || !telephone) && styles.submitBtnDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.forest[950]} size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color={isMontantValid && telephone ? colors.forest[950] : colors.neutral[400]} />
                  <Text style={[styles.submitBtnText, (!isMontantValid || !telephone) && styles.submitBtnTextDisabled]}>
                    Confirmer la demande de retrait
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.60)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 16,
    maxHeight: '85%',
    ...shadows.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: colors.neutral[200],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.neutral[900],
  },
  modalSub: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingVertical: 16,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[700],
    marginTop: 4,
  },
  providersRow: {
    flexDirection: 'row',
    gap: 10,
  },
  providerTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.inner,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    gap: 8,
  },
  providerTileActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  providerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  providerTileText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[700],
  },
  providerTileTextActive: {
    color: colors.lime[400],
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    height: 48,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.neutral[900],
  },
  currencyBadge: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[500],
    paddingRight: 14,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  quickPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.neutral[700],
  },
  quickPillHighlight: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  quickPillHighlightText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[800],
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
    marginTop: 4,
  },
  securityText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[900],
    lineHeight: 15,
  },
  submitBtn: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
    ...shadows.action,
  },
  submitBtnDisabled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  submitBtnTextDisabled: {
    color: colors.neutral[400],
  },
});
