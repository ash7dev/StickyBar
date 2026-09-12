import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { User, ShieldCheck } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { apiClient } from '../../shared/api/api-client';
import { AuthRequiredCard } from '../../features/auth/components/AuthRequiredCard';
import { MobileProfileHero } from '../../features/profile/components/MobileProfileHero';
import { MobileActiveRoleCard } from '../../features/profile/components/MobileActiveRoleCard';
import { MobileProfileInfoCard } from '../../features/profile/components/MobileProfileInfoCard';
import { MobileProfileKycCard } from '../../features/profile/components/MobileProfileKycCard';
import { MobileSecurityCard } from '../../features/profile/components/MobileSecurityCard';
import { MobileTerangaClubCard } from '../../features/profile/components/MobileTerangaClubCard';
import { MobileProfileActionsCard } from '../../features/profile/components/MobileProfileActionsCard';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';

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
  const { user: authUser, isAuthenticated, setUser } = useAuthStore();
  const { activeRole } = useRoleStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [payoutSettings, setPayoutSettings] = useState<{
    methode?: string;
    telephone?: string;
  } | null>(null);
  const [terangaAccount, setTerangaAccount] = useState<{
    soldeCoins?: number;
    tier?: string;
    nbSejours?: number;
    gmv12Mois?: number;
  } | null>(null);

  const fetchProfileData = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [resUser, resPayout, resTeranga] = await Promise.all([
        apiClient.get<any>('/users/me').catch(() => null),
        apiClient.get<any>('/users/payout-settings').catch(() => null),
        apiClient.get<any>('/teranga-club/me').catch(() => null),
      ]);

      if (resUser?.data) {
        const u = resUser.data.data || resUser.data;
        setUser({
          ...authUser,
          ...u,
        });
      }

      if (resPayout?.data) {
        const p = resPayout.data.data || resPayout.data;
        setPayoutSettings(p);
      }

      if (resTeranga?.data) {
        const t = resTeranga.data.data || resTeranga.data;
        setTerangaAccount(t);
      }
    } catch (err) {
      console.warn('[ProfileScreen] Erreur rechargement profil:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, authUser, setUser]);

  useEffect(() => {
    fetchProfileData(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProfileData(true)}
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
            Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Klef.
          </Text>
        </View>

        {!isAuthenticated ? (
          <View style={styles.guardedStack}>
            <AuthRequiredCard
              title="Connectez-vous pour accéder à vos paramètres"
              subtitle="Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Klef."
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
              onKycClick={() => setGateOpen(true)}
            />

            {/* 2. Espace Actif (Bascule Rôle Voyageur / Hôte) */}
            <MobileActiveRoleCard />

            {/* 3. Coordonnées & Infos Personnelles */}
            <MobileProfileInfoCard
              user={authUser}
              onProfileUpdated={() => fetchProfileData(false)}
            />

            {/* 3. Vérification d'Identité KYC */}
            <MobileProfileKycCard
              statutKyc={authUser?.statutKyc}
              onKycClick={() => setGateOpen(true)}
            />

            <SectionDivider label="Paiements & Fidélité" />

            {/* 4. Programme Teranga Club */}
            <MobileTerangaClubCard
              terangaTier={terangaAccount?.tier || (authUser as any)?.terangaTier || 'BRONZE'}
              soldeCoins={terangaAccount?.soldeCoins ?? (authUser as any)?.soldeCoins ?? 0}
              nbSejours={terangaAccount?.nbSejours ?? (authUser as any)?.nbSejours ?? 0}
              gmv12Mois={terangaAccount?.gmv12Mois ?? (authUser as any)?.gmv12Mois ?? 0}
            />

            <SectionDivider label="Sécurité & Compte" />

            {/* 6. Sécurité & Mot de Passe */}
            <MobileSecurityCard
              userEmail={authUser?.email}
              onUpdated={() => fetchProfileData(false)}
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
            fetchProfileData(false);
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
