import React, { useState, useEffect, useCallback } from 'react';
import { FavoritesEntryCard } from '../../features/favorites/FavoritesEntryCard';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { User, ShieldCheck } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { apiClient } from '../../shared/api/api-client';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';
import { MobileProfileHero } from '../../features/profile/components/MobileProfileHero';
import { MobileActiveRoleCard } from '../../features/profile/components/MobileActiveRoleCard';
import { ManagerSpaceCard } from '../../features/manager/components/ManagerSpaceCard';
import { MobileProfileInfoCard } from '../../features/profile/components/MobileProfileInfoCard';
import { MobileProfileKycCard } from '../../features/profile/components/MobileProfileKycCard';
import { MobileKlefAssistanceCard } from '../../features/profile/components/MobileKlefAssistanceCard';
import { MobileSecurityCard } from '../../features/profile/components/MobileSecurityCard';
import { MobileTerangaClubCard } from '../../features/profile/components/MobileTerangaClubCard';
import { MobileProfileActionsCard } from '../../features/profile/components/MobileProfileActionsCard';
import { MobileProfileLegalCard } from '../../features/profile/components/MobileProfileLegalCard';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';

const PAYOUT_CACHE_KEY = 'klef_tenant_payout_cache_v1';
const TERANGA_CACHE_KEY = 'klef_tenant_teranga_cache_v1';

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export default function ProfileScreen() {
  const { user: authUser, isAuthenticated } = useAuthStore();
  const { activeRole } = useRoleStore();

  const [gateOpen, setGateOpen] = useState(false);
  const [cachedPayout, setCachedPayout] = useState<{ methode?: string; telephone?: string } | null>(null);
  const [cachedTeranga, setCachedTeranga] = useState<{
    soldeCoins?: number;
    tier?: string;
    nbSejours?: number;
    gmv12Mois?: number;
  } | null>(null);

  // 1. Hydratation Persistante Instantanée (0ms au lancement)
  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      AsyncStorage.getItem(PAYOUT_CACHE_KEY),
      AsyncStorage.getItem(TERANGA_CACHE_KEY),
    ]).then(([rawPayout, rawTeranga]) => {
      if (rawPayout) {
        try {
          setCachedPayout(JSON.parse(rawPayout));
        } catch (e) {}
      }
      if (rawTeranga) {
        try {
          setCachedTeranga(JSON.parse(rawTeranga));
        } catch (e) {}
      }
    }).catch((err) => console.warn('[ProfileScreen] Disk hydration error:', err));
  }, [isAuthenticated]);

  // 2. React Query: Profil Utilisateur
  const { refetch: refetchUser, isRefetching: isRefetchingUser } = useQuery({
    queryKey: ['tenant', 'profile', 'me'],
    queryFn: async () => {
      // Même source que le reste de l'app : fusion dans le store, requêtes simultanées partagées
      return (await useAuthStore.getState().refreshUser()) ?? null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // 3. React Query: Paramètres de Payout
  const { data: payoutData, refetch: refetchPayout, isRefetching: isRefetchingPayout } = useQuery({
    queryKey: ['tenant', 'profile', 'payout'],
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

  // 4. React Query: Teranga Club
  const { data: terangaData, refetch: refetchTeranga, isRefetching: isRefetchingTeranga } = useQuery({
    queryKey: ['tenant', 'profile', 'teranga'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/teranga-club/me');
      const t = res?.data?.data || res?.data;
      if (t) {
        AsyncStorage.setItem(TERANGA_CACHE_KEY, JSON.stringify(t)).catch(() => {});
      }
      return t || null;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    initialData: cachedTeranga || undefined,
  });

  const payoutSettings = payoutData || cachedPayout;
  const terangaAccount = terangaData || cachedTeranga;

  const isRefreshing = isRefetchingUser || isRefetchingPayout || isRefetchingTeranga;

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await Promise.all([refetchUser(), refetchPayout(), refetchTeranga()]);
  }, [refetchUser, refetchPayout, refetchTeranga]);

  const handleOpenGate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGateOpen(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
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
        {/* En-tête principal — Alignement 1:1 avec l'écran Réservations */}
        <View style={styles.topSection}>
          <View style={styles.contextBadge}>
            <User size={12} color={colors.forest[700]} />
            <Text style={styles.contextText}>Compte Utilisateur · Mon Profil</Text>
          </View>

          <Text style={styles.screenTitle}>Mon Profil & Compte</Text>

          <Text style={styles.screenSubtitle}>
            Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Paixi.
          </Text>
        </View>

        {!isAuthenticated ? (
          <View style={styles.guardedStack}>
            <AuthRequiredCard
              title="Connectez-vous pour accéder à vos paramètres"
              subtitle="Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Paixi."
            />
          </View>
        ) : (
          <View style={styles.contentStack}>
            {/* 1. Carte Hero Profil */}
            <MobileProfileHero
              user={{
                ...authUser,
                terangaTier: terangaAccount?.tier || (authUser as any)?.terangaTier,
              }}
              activeRole={activeRole}
              onKycClick={handleOpenGate}
              onProfileUpdated={handleRefresh}
            />

            {/* 2. Espace Actif (Bascule Rôle Voyageur / Hôte) */}
            <MobileActiveRoleCard />
            <ManagerSpaceCard />

            {/* Logements gardés avec le cœur */}
            <FavoritesEntryCard />

            {/* 3. Coordonnées & Infos Personnelles */}
            <MobileProfileInfoCard
              user={authUser}
              onProfileUpdated={handleRefresh}
            />

            {/* 3. Vérification d'Identité KYC */}
            <MobileProfileKycCard
              statutKyc={authUser?.statutKyc}
              onKycClick={handleOpenGate}
            />

            <SectionDivider label="Paiements & Fidélité" />

            {/* 4. Programme Teranga Club */}
            <MobileTerangaClubCard
              terangaTier={terangaAccount?.tier || (authUser as any)?.terangaTier || 'BRONZE'}
              soldeCoins={terangaAccount?.soldeCoins ?? (authUser as any)?.soldeCoins ?? 0}
              nbSejours={terangaAccount?.nbSejours ?? (authUser as any)?.nbSejours ?? 0}
              gmv12Mois={terangaAccount?.gmv12Mois ?? (authUser as any)?.gmv12Mois ?? 0}
            />

            <SectionDivider label="Assistance & Support" />

            {/* 5. Carte Paixi Assistance 24/7 (Fond Blanc + CTA) */}
            <MobileKlefAssistanceCard />

            <SectionDivider label="Sécurité & Compte" />

            {/* 6. Sécurité & Mot de Passe */}
            <MobileSecurityCard
              userEmail={authUser?.email}
              onUpdated={handleRefresh}
            />

            {/* 6b. Confidentialité & Mentions Légales (CGU 1:1 & Privacy) */}
            <MobileProfileLegalCard />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 16,
  },

  topSection: {
    gap: 6,
    marginBottom: 4,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  contextText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
    letterSpacing: 0.2,
  },
  screenTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: 28,
    color: colors.forest[950],
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  screenSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 17,
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
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[400],
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
