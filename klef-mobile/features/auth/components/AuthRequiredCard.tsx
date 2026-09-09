import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, ShieldCheck, KeyRound, Building2, Repeat } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { AppCard } from '../../../shared/components/ui/AppCard';
import { AppButton } from '../../../shared/components/ui/AppButton';
import { AppBadge } from '../../../shared/components/ui/AppBadge';
import { useAuthStore } from '../stores/auth.store';
import { useRoleStore } from '../../../shared/stores/role.store';

export interface AuthRequiredCardProps {
  title: string;
  subtitle: string;
  redirectTo?: string;
}

export function AuthRequiredCard({ title, subtitle, redirectTo = '/(auth)/login' }: AuthRequiredCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { activeRole, setActiveRole } = useRoleStore();

  // Cas 1 : Non connecté
  if (!isAuthenticated) {
    return (
      <AppCard style={styles.cardContainer} variant="inverse">
        <View style={styles.badgeRow}>
          <AppBadge
            label="ACCÈS RÉSERVÉ"
            leftIcon={<KeyRound size={12} color={colors.lime[300]} />}
            variant="brand"
          />
        </View>

        <View style={styles.iconBox}>
          <Lock size={26} color={colors.lime[300]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.actions}>
          <AppButton
            label="Se connecter"
            onPress={() => router.push('/(auth)/login')}
            size="lg"
            variant="action"
          />
          <AppButton
            label="Créer un compte"
            onPress={() => router.push('/(auth)/register')}
            size="lg"
            variant="ghost"
          />
        </View>

        <View style={styles.reassuranceRow}>
          <ShieldCheck size={16} color={colors.lime[300]} />
          <Text style={styles.reassuranceText}>Garantie Séquestre Klef · Réservation 100% sécurisée</Text>
        </View>
      </AppCard>
    );
  }

  // Cas 2 : Connecté en Mode Propriétaire sur un espace Locataire
  if (activeRole === 'PROPRIETAIRE') {
    return (
      <AppCard style={styles.cardContainer} variant="inverse">
        <View style={styles.badgeRow}>
          <AppBadge
            label="MODE PROPRIÉTAIRE ACTIF"
            leftIcon={<Building2 size={12} color={colors.gold[400]} />}
            variant="verified"
          />
        </View>

        <View style={styles.iconBox}>
          <Repeat size={26} color={colors.lime[300]} />
        </View>

        <Text style={styles.title}>Vous êtes en Mode Propriétaire</Text>
        <Text style={styles.subtitle}>
          Pour consulter vos voyages personnels et vos réservations locataire, basculez en un clic vers le Mode Locataire.
        </Text>

        <View style={styles.actions}>
          <AppButton
            label="Passer en Mode Locataire"
            onPress={() => setActiveRole('LOCATAIRE')}
            size="lg"
            variant="action"
          />
        </View>
      </AppCard>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[800],
    borderWidth: 1,
  },
  badgeRow: {
    alignSelf: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[900],
    borderColor: colors.forest[700],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[0],
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.forest[200],
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    width: '100%',
    justifyContent: 'center',
  },
  reassuranceText: {
    fontSize: typography.sizes.xs,
    color: colors.forest[300],
    fontWeight: '500',
  },
});
