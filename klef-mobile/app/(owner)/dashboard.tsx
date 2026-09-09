import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LayoutDashboard, TrendingUp, Building2, Repeat } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { AppCard } from '../../shared/components/ui/AppCard';
import { AppBadge } from '../../shared/components/ui/AppBadge';
import { AppButton } from '../../shared/components/ui/AppButton';

export default function OwnerDashboardScreen() {
  const { user } = useAuthStore();
  const { setActiveRole } = useRoleStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppBadge label="ESPACE HÔTE & PROPRIÉTAIRE" variant="verified" />
            <Text style={styles.title}>Tableau de Bord 📊</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveRole('LOCATAIRE')}
            style={styles.switchRoleBtn}
          >
            <Repeat size={14} color={colors.forest[800]} />
            <Text style={styles.switchRoleText}>Mode Voyageur</Text>
          </TouchableOpacity>
        </View>

        {/* Chiffre d'Affaires Card */}
        <AppCard style={styles.caCard} variant="inverse">
          <Text style={styles.caLabel}>Revenus Nets du Mois (FCFA)</Text>
          <Text style={styles.caAmount}>1 450 000 FCFA</Text>
          <View style={styles.caFooter}>
            <TrendingUp size={16} color={colors.lime[300]} />
            <Text style={styles.caTrendText}>+18.4% vs le mois dernier</Text>
          </View>
        </AppCard>

        {/* Statistics Grid */}
        <View style={styles.grid}>
          <AppCard style={styles.gridCard} variant="card">
            <Building2 size={22} color={colors.forest[600]} />
            <Text style={styles.gridNumber}>3</Text>
            <Text style={styles.gridLabel}>Biens Actifs</Text>
          </AppCard>

          <AppCard style={styles.gridCard} variant="card">
            <LayoutDashboard size={22} color={colors.forest[600]} />
            <Text style={styles.gridNumber}>12</Text>
            <Text style={styles.gridLabel}>Réservations</Text>
          </AppCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 20, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 26, fontWeight: '700', color: colors.neutral[900], marginTop: 6 },
  switchRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  switchRoleText: { fontSize: typography.sizes.xs, fontWeight: '700', color: colors.forest[800] },
  caCard: { gap: 8, padding: 22, backgroundColor: colors.forest[950] },
  caLabel: { fontSize: typography.sizes.xs, color: colors.forest[200], fontWeight: '600' },
  caAmount: { fontSize: 32, fontWeight: '700', color: colors.lime[400] },
  caFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  caTrendText: { fontSize: typography.sizes.xs, color: colors.lime[300], fontWeight: '600' },

  grid: { flexDirection: 'row', gap: 12 },
  gridCard: { flex: 1, gap: 8, padding: 18 },
  gridNumber: { fontSize: 24, fontWeight: '700', color: colors.neutral[900] },
  gridLabel: { fontSize: typography.sizes.xs, color: colors.neutral[600] },
});
