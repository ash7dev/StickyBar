import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { LogOut, Repeat } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AppButton } from '../../shared/components/ui/AppButton';
import { AppCard } from '../../shared/components/ui/AppCard';
import { AppBadge } from '../../shared/components/ui/AppBadge';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';

export default function ProfileScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { activeRole, setActiveRole } = useRoleStore();
  const { logout } = useAuth();

  const handleToggleRole = () => {
    const nextRole = activeRole === 'PROPRIETAIRE' ? 'LOCATAIRE' : 'PROPRIETAIRE';
    setActiveRole(nextRole);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Paramètres</Text>

        {!isAuthenticated ? (
          <AuthRequiredCard
            subtitle="Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Klef."
            title="Connectez-vous pour accéder à vos paramètres"
          />
        ) : (
          <View style={styles.profileContent}>
            {/* Card Utilisateur */}
            <AppCard style={styles.userCard} variant="card">
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
                <Text style={styles.userEmail}>{user?.email || user?.telephone}</Text>
                <AppBadge label={`Statut KYC : ${user?.statutKyc || 'NON_VERIFIE'}`} variant="soft" />
              </View>
            </AppCard>

            {/* Role Switcher */}
            <AppCard style={styles.roleCard} variant="alt">
              <View style={styles.roleHeader}>
                <Repeat size={20} color={colors.forest[600]} />
                <Text style={styles.roleTitle}>Espace Actif : {activeRole}</Text>
              </View>
              <AppButton
                label={`Basculer en Espace ${activeRole === 'PROPRIETAIRE' ? 'Voyageur' : 'Hôte'}`}
                onPress={handleToggleRole}
                size="md"
                variant="forest"
              />
            </AppCard>

            {/* Logout Button */}
            <TouchableOpacity activeOpacity={0.7} onPress={logout} style={styles.logoutBtn}>
              <LogOut size={18} color={colors.error[500]} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
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

  profileContent: { gap: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  avatarBox: {
    width: 54,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.lime[400], fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontWeight: '700', color: colors.neutral[900] },
  userEmail: { fontSize: typography.sizes.xs, color: colors.neutral[600] },

  roleCard: { gap: 12, padding: 16 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleTitle: { fontSize: typography.sizes.sm, fontWeight: '700', color: colors.neutral[900] },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    marginTop: 12,
  },
  logoutText: { color: colors.error[700], fontWeight: '700', fontSize: typography.sizes.sm },
});
