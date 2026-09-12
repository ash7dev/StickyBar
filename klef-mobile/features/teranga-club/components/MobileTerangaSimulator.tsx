import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Calculator, Coins, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

interface MobileTerangaSimulatorProps {
  cashbackPct?: number;
}

const AMOUNTS = [100_000, 250_000, 500_000, 1_000_000];

function formatFcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function MobileTerangaSimulator({ cashbackPct = 1.5 }: MobileTerangaSimulatorProps) {
  const [amount, setAmount] = useState(250_000);

  const coinsEarned = Math.round(amount * (cashbackPct / 100));

  const handleSelectAmount = (val: number) => {
    Haptics.selectionAsync().catch(() => {});
    setAmount(val);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Calculator size={16} color={colors.forest[700]} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Simulateur d’économies</Text>
          <Text style={styles.headerSubtitle}>Calculez vos coins gagnés sur votre prochain séjour</Text>
        </View>
      </View>

      {/* Boutons d'incrément rapides */}
      <View style={styles.amountsRow}>
        {AMOUNTS.map((val) => {
          const selected = amount === val;
          return (
            <TouchableOpacity
              key={val}
              activeOpacity={0.8}
              onPress={() => handleSelectAmount(val)}
              style={[styles.amountChip, selected && styles.amountChipSelected]}
            >
              <Text style={[styles.amountChipText, selected && styles.amountChipTextSelected]}>
                {val >= 1_000_000 ? '1M FCFA' : `${val / 1000}k FCFA`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Résultat du calcul */}
      <View style={styles.resultBox}>
        <View style={styles.resultTop}>
          <Text style={styles.resultLabel}>SÉJOUR DE {formatFcfa(amount)} FCFA</Text>
          <View style={styles.cashbackPill}>
            <Sparkles size={11} color="#B45309" />
            <Text style={styles.cashbackText}>Taux {cashbackPct}%</Text>
          </View>
        </View>

        <View style={styles.coinsRow}>
          <Text style={styles.coinsAmount}>+ {formatFcfa(coinsEarned)}</Text>
          <Text style={styles.coinsUnit}>coins Teranga</Text>
        </View>

        <Text style={styles.resultFoot}>
          Soit <Text style={styles.resultBold}>{formatFcfa(coinsEarned)} FCFA</Text> utilisables en déduction immédiate sur votre réservation suivante.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },

  amountsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountChip: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountChipSelected: {
    backgroundColor: colors.forest[900],
    borderColor: colors.forest[900],
  },
  amountChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
  },
  amountChipTextSelected: {
    color: colors.neutral[0],
  },

  resultBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.inner,
    padding: 14,
    gap: 6,
  },
  resultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9.5,
    color: '#92400E',
    letterSpacing: 0.8,
  },
  cashbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  cashbackText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#B45309',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  coinsAmount: {
    fontFamily: typography.fontDisplay,
    fontSize: 26,
    color: '#B45309',
  },
  coinsUnit: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#B45309',
  },
  resultFoot: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  resultBold: {
    fontFamily: typography.fontBodyBold,
    color: '#78350F',
  },
});
