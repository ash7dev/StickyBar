import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { AppButton } from '../../shared/components/ui/AppButton';
import { useRouter } from 'expo-router';

export default function ReservationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Calendar size={32} color={colors.forest[600]} />
        </View>
        <Text style={styles.title}>Mes Séjours & Réservations</Text>
        <Text style={styles.subtitle}>
          {isAuthenticated
            ? 'Retrouvez ici tous vos séjours à venir, en cours et passés.'
            : 'Connectez-vous pour consulter vos contrats de réservation et vos accès.'}
        </Text>

        {!isAuthenticated ? (
          <AppButton
            label="Se connecter / S'inscrire"
            onPress={() => router.push('/(auth)/login')}
            size="md"
            variant="action"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.neutral[900], marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: typography.sizes.sm, color: colors.neutral[600], textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});
