import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';

export default function OwnerListingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Mes Biens Immobiliers</Text>
        <AppCard style={styles.card} variant="card">
          <Building2 size={32} color={colors.forest[600]} />
          <Text style={styles.cardTitle}>Vos Logements en Gestion</Text>
          <Text style={styles.cardSubtitle}>
            Modifiez vos équipements, vos photos ou ajoutez une nouvelle annonce.
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
