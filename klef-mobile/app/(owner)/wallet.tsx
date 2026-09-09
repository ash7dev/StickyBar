import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';

export default function OwnerWalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Portefeuille & Retraits</Text>
        <AppCard style={styles.card} variant="card">
          <Wallet size={32} color={colors.forest[600]} />
          <Text style={styles.cardTitle}>Solde Disponible Hôte</Text>
          <Text style={styles.cardSubtitle}>
            Effectuez des retraits instantanés vers vos comptes Wave ou Orange Money.
          </Text>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: colors.neutral[900] },
  card: { padding: 24, alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.neutral[900] },
  cardSubtitle: { fontSize: typography.sizes.xs, color: colors.neutral[600], textAlign: 'center' },
});
