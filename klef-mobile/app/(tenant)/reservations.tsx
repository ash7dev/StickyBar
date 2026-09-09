import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';

export default function ReservationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { activeRole } = useRoleStore();

  const isGuarded = !isAuthenticated || activeRole === 'PROPRIETAIRE';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Mes Réservations</Text>

        {isGuarded ? (
          <AuthRequiredCard
            subtitle="Accédez à l’historique complet de vos séjours, vos contrats de réservation et vos reçus sécurisés par le séquestre Klef."
            title="Connectez-vous pour voir vos réservations"
          />
        ) : (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Vos séjours à venir</Text>
            <View style={styles.emptyCard}>
              <CalendarDays size={32} color={colors.forest[600]} />
              <Text style={styles.emptyText}>Vous n'avez aucune réservation en cours ou à venir.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 20, gap: 20 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.neutral[900] },
  content: { gap: 16 },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.neutral[900] },
  emptyCard: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
