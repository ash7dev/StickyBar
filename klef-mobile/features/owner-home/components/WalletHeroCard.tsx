import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { PaixiLogo } from '../../../shared/components/brand/PaixiLogo';
import type { OwnerOverviewResponse } from '../types';
import { formatFCFA } from '../lib/format';

interface WalletHeroCardProps {
  wallet: OwnerOverviewResponse['wallet'];
  revenueThisMonth: number;
}

/** Carte « solde » façon carte bancaire : l'argent d'abord (direction M1). */
export function WalletHeroCard({ wallet, revenueThisMonth }: WalletHeroCardProps) {
  const router = useRouter();
  const go = (href: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.navigate(href as never);
  };

  return (
    <View style={styles.card} accessibilityLabel={`Solde disponible ${formatFCFA(wallet.available)}`}>
      <View style={styles.topRow}>
        <Text style={styles.label}>Solde disponible</Text>
        <PaixiLogo size={17} tone="inverse" />
      </View>

      {/* Toujours sur une ligne : la police rétrécit plutôt que de couper le montant */}
      <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {formatFCFA(wallet.available)}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Ce mois-ci</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatFCFA(revenueThisMonth)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>En séquestre</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatFCFA(wallet.upcomingTotal)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => go('/(owner)/wallet')}
          style={[styles.btn, styles.btnPrimary]}
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>Retirer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => go('/(owner)/stats')}
          style={[styles.btn, styles.btnGhost]}
          accessibilityRole="button"
        >
          <Text style={styles.btnGhostText}>Mes revenus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, backgroundColor: colors.forest[950], padding: 22, gap: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[200] },
  amount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 38, color: colors.neutral[50], letterSpacing: -0.6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', gap: 2 },
  statLabel: { fontFamily: typography.fontBody, fontSize: 11, color: colors.forest[200] },
  statValue: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.neutral[50] },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.lime[400] },
  btnPrimaryText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.forest[800] },
  btnGhost: { borderWidth: 1, borderColor: colors.border.inverseStrong },
  btnGhostText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[50] },
});
