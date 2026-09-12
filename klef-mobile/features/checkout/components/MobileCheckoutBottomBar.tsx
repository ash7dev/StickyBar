import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import type { PaymentOperator } from './MobileCheckoutPaymentSection';

interface MobileCheckoutBottomBarProps {
  aDebiter: number;
  fournisseur: PaymentOperator;
  loading: boolean;
  onPay: () => void;
}

function formatFcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function MobileCheckoutBottomBar({
  aDebiter,
  fournisseur,
  loading,
  onPay,
}: MobileCheckoutBottomBarProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPay();
  };

  const opLabel = fournisseur === 'WAVE' ? 'Wave' : 'Orange Money';

  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.label}>À régler aujourd'hui</Text>
          <Text style={styles.amount}>{formatFcfa(aDebiter)} FCFA</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handlePress}
          disabled={loading}
          style={[styles.ctaButton, loading && styles.btnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={`Payer via ${opLabel}`}
        >
          {loading ? (
            <ActivityIndicator color={colors.forest[950]} />
          ) : (
            <>
              <ShieldCheck size={16} color={colors.forest[950]} />
              <Text style={styles.ctaText}>
                Payer {formatFcfa(aDebiter)} FCFA via {opLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    zIndex: 50,
  },
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.forest[200],
  },
  amount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.lime[300],
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  ctaText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
