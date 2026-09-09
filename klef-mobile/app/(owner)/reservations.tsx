import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';

export default function OwnerReservationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Séjours & Réservations Hôte</Text>
        <AppCard style={styles.card} variant="inverse">
          <CalendarDays size={32} color={colors.lime[300]} />
          <Text style={styles.cardTitle}>Demandes et Réservations de vos Biens</Text>
          <Text style={styles.cardSubtitle}>
            Gérez les arrivées, départs et confirmations instantanées de vos voyageurs.
          </Text>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: colors.neutral[900] },
  card: { padding: 24, alignItems: 'center', gap: 12, backgroundColor: colors.forest[950] },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.neutral[0] },
  cardSubtitle: { fontSize: typography.sizes.xs, color: colors.forest[200], textAlign: 'center' },
});
