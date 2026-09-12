import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { User } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { apiClient } from '../../shared/api/api-client';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';
import { MobileProfileHero } from '../../features/profile/components/MobileProfileHero';
import { MobileActiveRoleCard } from '../../features/profile/components/MobileActiveRoleCard';
import { MobileProfileInfoCard } from '../../features/profile/components/MobileProfileInfoCard';
import { MobileProfileKycCard } from '../../features/profile/components/MobileProfileKycCard';
import { MobilePayoutSettingsCard } from '../../features/profile/components/MobilePayoutSettingsCard';
import { MobileSecurityCard } from '../../features/profile/components/MobileSecurityCard';
import { MobileProfileActionsCard } from '../../features/profile/components/MobileProfileActionsCard';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';

const PAYOUT_CACHE_KEY = 'klef_owner_payout_cache_v1';

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export default function OwnerProfileScreen() {
  const { user: authUser, isAuthenticated, setUser } = useAuthStore();
  const { activeRole } = useRoleStore();

  const [gateOpen, setGateOpen] = useState(false);
  const [cachedPayout, setCachedPayout] = useState<{ methode?: string; telephone?: string } | null>(null);

  // 1. Hydratation Persistante Instantanée (0ms au lancement)
  useEffect(() => {
    if (!isAuthenticated) return;
    AsyncStorage.getItem(PAYOUT_CACHE_KEY)
      .then((rawPayout) => {
        if (rawPayout) {
          try {
            setCachedPayout(JSON.parse(rawPayout));
          } catch (e) {}
        }
      })
      .catch((err) => console.warn('[OwnerProfileScreen] Disk hydration error:', err));
  }, [isAuthenticated]);

  // 2. React Query: Profil Utilisateur
  const { refetch: refetchUser, isRefetching: isRefetchingUser } = useQuery({
    queryKey: ['owner', 'profile', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/users/me');
      const u = res?.data?.data || res?.data;
      if (u) {
        setUser({
          ...authUser,
          ...u,
        });
      }
      return u || null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // 3. React Query: Paramètres de Payout (Coordonnées de versement loyers)
  const { data: payoutData, refetch: refetchPayout, isRefetching: isRefetchingPayout } = useQuery({
    queryKey: ['owner', 'profile', 'payout'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/users/payout-settings');
      const p = res?.data?.data || res?.data;
      if (p) {
        AsyncStorage.setItem(PAYOUT_CACHE_KEY, JSON.stringify(p)).catch(() => {});
      }
      return p || null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    initialData: cachedPayout || undefined,
  });

  const payoutSettings = payoutData || cachedPayout;
  const isRefreshing = isRefetchingUser || isRefetchingPayout;

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await Promise.all([refetchUser(), refetchPayout()]);
  }, [refetchUser, refetchPayout]);

  const handleOpenGate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGateOpen(true);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.forest[800]}
              colors={[colors.forest[800]]}
            />
          ) : undefined
        }
      >
        {!isAuthenticated ? (
          <View style={styles.guardedStack}>
            <AuthRequiredCard
              title="Connectez-vous pour accéder à vos paramètres Hôte"
              subtitle="Gérez vos annonces, vos coordonnées de paiement et la sécurité de votre compte Klef."
            />
          </View>
        ) : (
          <View style={styles.contentStack}>
            {/* 1. Carte Hero Profil Hôte */}
            <MobileProfileHero
              user={authUser}
              activeRole={activeRole || 'OWNER'}
              onKycClick={handleOpenGate}
              onProfileUpdated={handleRefresh}
            />

            {/* 2. Espace Actif (Bascule Rôle Voyageur / Hôte) */}
            <MobileActiveRoleCard />

            {/* 3. Coordonnées & Infos Personnelles */}
            <MobileProfileInfoCard
              user={authUser}
              onProfileUpdated={handleRefresh}
            />

            {/* 4. Vérification d'Identité KYC */}
            <MobileProfileKycCard
              statutKyc={authUser?.statutKyc}
              onKycClick={handleOpenGate}
            />

            <SectionDivider label="Encaissement & Revenus" />

            {/* 5. Coordonnées de Versement Mobile Money (Loyers & Revenus) */}
            <MobilePayoutSettingsCard
              telephoneInitial={payoutSettings?.telephone || authUser?.telephone}
              methodeInitial={(payoutSettings?.methode as any) || 'WAVE'}
              onUpdated={handleRefresh}
            />

            <SectionDivider label="Sécurité & Compte" />

            {/* 6. Sécurité & Mot de Passe */}
            <MobileSecurityCard
              userEmail={authUser?.email}
              onUpdated={handleRefresh}
            />

            {/* 7. Actions de Compte (Bascule Rôle, Déconnexion, Suppression) */}
            <MobileProfileActionsCard />
          </View>
        )}
      </ScrollView>

      {/* Modale KYC Gate */}
      {gateOpen && (
        <TenantActionGateModal
          visible={gateOpen}
          steps={['profile', 'phone', 'kyc']}
          block={null}
          onCancel={() => setGateOpen(false)}
          onComplete={() => {
            setGateOpen(false);
            handleRefresh();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  guardedStack: {
    marginTop: 10,
  },
  contentStack: {
    gap: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[400],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
