import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Wallet, Coins, Smartphone, Check, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

export type PaymentTiming = 'DEPOSIT' | 'FULL';
export type PaymentOperator = 'WAVE' | 'ORANGE_MONEY';

const WAVE_LOGO = require('../../../assets/images/wavelogo.jpeg');
const ORANGE_MONEY_LOGO = require('../../../assets/images/orangeMoneylogo.png');

interface MobileCheckoutPaymentSectionProps {
  typePaiement: PaymentTiming;
  setTypePaiement: (t: PaymentTiming) => void;
  acomptePct?: number;
  acompteAmount: number;
  totalAmount: number;
  acompteDisponible?: boolean;

  soldeCoins?: number;
  coinsMax?: number;
  useCoins: boolean;
  setUseCoins: (u: boolean) => void;

  fournisseur: PaymentOperator;
  setFournisseur: (f: PaymentOperator) => void;

  telephone: string;
  setTelephone: (t: string) => void;

  cguAccepted: boolean;
  setCguAccepted: (c: boolean) => void;

  errors?: {
    telephone?: string;
    cgu?: string;
  };
}

export function MobileCheckoutPaymentSection({
  typePaiement,
  setTypePaiement,
  acomptePct = 30,
  acompteAmount,
  totalAmount,
  acompteDisponible = true,

  soldeCoins = 0,
  coinsMax = 0,
  useCoins,
  setUseCoins,

  fournisseur,
  setFournisseur,

  telephone,
  setTelephone,

  cguAccepted,
  setCguAccepted,

  errors,
}: MobileCheckoutPaymentSectionProps) {
  const handleSelectTiming = (timing: PaymentTiming) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTypePaiement(timing);
  };

  const handleSelectOperator = (op: PaymentOperator) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFournisseur(op);
  };

  const handleToggleCoins = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setUseCoins(!useCoins);
  };

  const handleToggleCgu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCguAccepted(!cguAccepted);
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Quand payer (DEPOSIT vs FULL) ───────────────────────── */}
      {acompteDisponible && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Wallet size={16} color={colors.forest[700]} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Modalités de règlement</Text>
              <Text style={styles.cardSubtitle}>
                Choisissez la répartition de votre paiement
              </Text>
            </View>
          </View>

          <View style={styles.timingOptionsGrid}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectTiming('DEPOSIT')}
              style={[
                styles.timingOptionCard,
                typePaiement === 'DEPOSIT' && styles.timingOptionCardSelected,
              ]}
            >
              <View style={styles.timingRadioCircle}>
                {typePaiement === 'DEPOSIT' && <View style={styles.timingRadioDot} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.timingTitle}>Acompte {acomptePct}% maintenant</Text>
                <Text style={styles.timingDesc}>
                  {acompteAmount.toLocaleString('fr-FR')} FCFA aujourd'hui, le solde à la remise des clés.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSelectTiming('FULL')}
              style={[
                styles.timingOptionCard,
                typePaiement === 'FULL' && styles.timingOptionCardSelected,
              ]}
            >
              <View style={styles.timingRadioCircle}>
                {typePaiement === 'FULL' && <View style={styles.timingRadioDot} />}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.timingTitle}>Règlement en totalité (100%)</Text>
                <Text style={styles.timingDesc}>
                  {totalAmount.toLocaleString('fr-FR')} FCFA en une fois, aucun frais sur place.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 2. Klef Coins ───────────────────────────────────────────── */}
      {soldeCoins > 0 && coinsMax > 0 && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleCoins}
          style={[styles.card, styles.coinsCard, useCoins && styles.coinsCardActive]}
        >
          <View style={styles.checkboxRow}>
            <View style={[styles.checkboxCircle, useCoins && styles.checkboxCircleActive]}>
              {useCoins && <Check size={12} color={colors.forest[950]} strokeWidth={3} />}
            </View>

            <View style={styles.coinsIconCircle}>
              <Coins size={16} color="#B45309" />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.coinsTitle}>Utiliser mes Klef Coins</Text>
              <Text style={styles.coinsDesc}>
                {coinsMax.toLocaleString('fr-FR')} FCFA déduits de ce paiement · solde{' '}
                {soldeCoins.toLocaleString('fr-FR')} coins
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── 3. Sélection de l'opérateur Mobile Money ─────────────────── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Smartphone size={16} color={colors.forest[700]} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Moyen de paiement</Text>
            <Text style={styles.cardSubtitle}>
              Sélectionnez votre opérateur Mobile Money
            </Text>
          </View>
        </View>

        <View style={styles.operatorsGrid}>
          {/* Wave Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectOperator('WAVE')}
            style={[
              styles.operatorCard,
              fournisseur === 'WAVE' && styles.operatorCardSelected,
            ]}
          >
            <Image source={WAVE_LOGO} style={styles.operatorLogo} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={styles.operatorName}>Wave</Text>
              <Text style={styles.operatorNote}>Paiement instantané sans frais</Text>
            </View>
            <View style={styles.operatorRadio}>
              {fournisseur === 'WAVE' && <View style={styles.operatorRadioDot} />}
            </View>
          </TouchableOpacity>

          {/* Orange Money Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelectOperator('ORANGE_MONEY')}
            style={[
              styles.operatorCard,
              fournisseur === 'ORANGE_MONEY' && styles.operatorCardSelected,
            ]}
          >
            <Image
              source={ORANGE_MONEY_LOGO}
              style={styles.operatorLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.operatorName}>Orange Money</Text>
              <Text style={styles.operatorNote}>Selon conditions opérateur</Text>
            </View>
            <View style={styles.operatorRadio}>
              {fournisseur === 'ORANGE_MONEY' && <View style={styles.operatorRadioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Saisie du Numéro de téléphone */}
        <View style={styles.phoneBlock}>
          <Text style={styles.phoneLabel}>
            Numéro {fournisseur === 'WAVE' ? 'Wave' : 'Orange Money'} *
          </Text>
          <TextInput
            style={[styles.phoneInput, errors?.telephone && styles.inputError]}
            value={telephone}
            onChangeText={setTelephone}
            keyboardType="phone-pad"
            placeholder="+221 77 000 00 00"
            placeholderTextColor={colors.neutral[400]}
          />
          {errors?.telephone ? (
            <View style={styles.errorRow}>
              <AlertCircle size={12} color={colors.error[600]} />
              <Text style={styles.errorText}>{errors.telephone}</Text>
            </View>
          ) : (
            <Text style={styles.phoneHint}>
              La notification de validation sera envoyée sur ce numéro.
            </Text>
          )}
        </View>
      </View>

      {/* ── 4. CGU Checkbox (Validation légale finale) ────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleToggleCgu}
        style={[styles.card, errors?.cgu && styles.cardError]}
      >
        <View style={styles.checkboxRow}>
          <View style={[styles.checkboxSquare, cguAccepted && styles.checkboxSquareActive]}>
            {cguAccepted && <Check size={12} color={colors.neutral[0]} strokeWidth={3} />}
          </View>
          <Text style={styles.cguText}>
            J'accepte les <Text style={styles.cguLink}>conditions de location</Text> et la
            politique d'annulation Klef.
          </Text>
        </View>
        {errors?.cgu && (
          <View style={[styles.errorRow, { marginTop: 8 }]}>
            <AlertCircle size={12} color={colors.error[600]} />
            <Text style={styles.errorText}>{errors.cgu}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  cardError: {
    borderColor: colors.error[500],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Timing
  timingOptionsGrid: {
    gap: 10,
  },
  timingOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
  },
  timingOptionCardSelected: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[600],
  },
  timingRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timingRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.forest[800],
  },
  timingTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  timingDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    lineHeight: 15,
  },

  // Klef Coins
  coinsCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  coinsCardActive: {
    backgroundColor: '#FDE68A',
    borderColor: '#F59E0B',
  },
  coinsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinsTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#78350F',
  },
  coinsDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#92400E',
  },

  // Operators
  operatorsGrid: {
    gap: 10,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
  },
  operatorCardSelected: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[600],
  },
  operatorLogo: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
  },
  operatorName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  operatorNote: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  operatorRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.forest[800],
  },

  // Phone Block
  phoneBlock: {
    gap: 6,
    marginTop: 4,
  },
  phoneLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  phoneInput: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.forest[950],
  },
  inputError: {
    borderColor: colors.error[500],
  },
  phoneHint: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    lineHeight: 15,
  },

  // CGU & Checkboxes
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D97706',
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[400],
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareActive: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },
  cguText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 16,
  },
  cguLink: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.forest[800],
    textDecorationLine: 'underline',
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[700],
  },
});
