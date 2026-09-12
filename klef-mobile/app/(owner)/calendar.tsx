import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';

export default function OwnerCalendarScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppCard style={styles.card} variant="card">
          <CalendarIcon size={32} color={colors.forest[600]} />
          <Text style={styles.cardTitle}>Gestion du Planning Hôte</Text>
          <Text style={styles.cardSubtitle}>
            Bloquez des dates ou ajustez vos prix par nuitée en temps réel.
          </Text>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 20, gap: 16 },
  card: { padding: 24, alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.neutral[900] },
  cardSubtitle: { fontSize: typography.sizes.xs, color: colors.neutral[600], textAlign: 'center' },
});
