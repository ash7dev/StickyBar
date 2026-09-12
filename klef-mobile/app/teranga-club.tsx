import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Coins, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../shared/theme/tokens';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { apiClient } from '../shared/api/api-client';
import { AuthRequiredCard } from '../features/auth/components/AuthRequiredCard';

import { MobileTerangaHeader } from '../features/teranga-club/components/MobileTerangaHeader';
import { MobileTerangaTierProgress } from '../features/teranga-club/components/MobileTerangaTierProgress';
import { MobileTerangaPerksGrid } from '../features/teranga-club/components/MobileTerangaPerksGrid';
import { MobileTerangaSimulator } from '../features/teranga-club/components/MobileTerangaSimulator';
import { MobileTerangaQuests, TerangaQuest } from '../features/teranga-club/components/MobileTerangaQuests';
import { MobileTerangaReferral } from '../features/teranga-club/components/MobileTerangaReferral';
import { MobileTerangaHistory, TerangaTransaction } from '../features/teranga-club/components/MobileTerangaHistory';

export default function TerangaClubScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [terangaAccount, setTerangaAccount] = useState<any>(null);
  const [quests, setQuests] = useState<TerangaQuest[]>([]);
  const [referralInfo, setReferralInfo] = useState<any>(null);

  const fetchTerangaData = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [resMe, resQuests, resReferral] = await Promise.all([
        apiClient.get<any>('/teranga-club/me').catch(() => null),
        apiClient.get<any>('/teranga-club/quests').catch(() => null),
        apiClient.get<any>('/teranga-club/referral').catch(() => null),
      ]);

      if (resMe?.data) {
        setTerangaAccount(resMe.data.data || resMe.data);
      }
      if (resQuests?.data) {
        const qList = resQuests.data.data || resQuests.data;
        if (Array.isArray(qList)) setQuests(qList);
      }
      if (resReferral?.data) {
        setReferralInfo(resReferral.data.data || resReferral.data);
      }
    } catch (err) {
      console.warn('[TerangaClubScreen] Erreur chargement Teranga:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTerangaData(false);
  }, [fetchTerangaData]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  const soldeCoins = terangaAccount?.soldeCoins ?? 0;
  const tier = terangaAccount?.tier || 'BRONZE';
  const cashbackPct = terangaAccount?.cashbackPct ?? 1.5;
  const totalEconomise = terangaAccount?.totalEconomise ?? soldeCoins;
  const nbSejours = terangaAccount?.nbSejours ?? 0;
  const gmv12Mois = terangaAccount?.gmv12Mois ?? 0;
  const transactions: TerangaTransaction[] = terangaAccount?.transactions || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Bar Dédiée (Bouton Retour vers le Profil & Badge Header) ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBack}
          style={styles.backButton}
        >
          <ArrowLeft size={18} color={colors.forest[950]} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Klef Teranga Club</Text>
          <Text style={styles.headerSubtitle}>Programme de fidélité & cashback</Text>
        </View>

        <View style={styles.headerCoinsChip}>
          <Coins size={12} color={colors.forest[900]} />
          <Text style={styles.headerCoinsText}>{soldeCoins.toLocaleString('fr-FR')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTerangaData(true)}
              tintColor={colors.forest[800]}
              colors={[colors.forest[800]]}
            />
          ) : undefined
        }
      >
        {!isAuthenticated ? (
          <View style={styles.authStack}>
            <AuthRequiredCard
              title="Connectez-vous pour accéder à votre Teranga Club"
              subtitle="Accumulez des Teranga Coins à chaque séjour et profitez de réductions immédiates en FCFA."
            />
            {/* Mode Découverte pour utilisateurs non connectés */}
            <MobileTerangaPerksGrid />
            <MobileTerangaSimulator cashbackPct={1.5} />
            <MobileTerangaTierProgress currentTier="BRONZE" nbSejours={0} gmv12Mois={0} />
          </View>
        ) : loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.forest[800]} />
            <Text style={styles.loadingText}>Chargement de votre Teranga Club…</Text>
          </View>
        ) : (
          <View style={styles.contentStack}>
            {/* 1. Header principal Teranga Club */}
            <MobileTerangaHeader
              soldeCoins={soldeCoins}
              tier={tier}
              cashbackPct={cashbackPct}
              totalEconomise={totalEconomise}
            />

            {/* 2. Suivi de qualification des paliers (Bronze, Silver, Gold) */}
            <MobileTerangaTierProgress
              currentTier={tier}
              nbSejours={nbSejours}
              gmv12Mois={gmv12Mois}
            />

            {/* 3. Les avantages du programme */}
            <MobileTerangaPerksGrid />

            {/* 4. Simulateur d'économies FCFA */}
            <MobileTerangaSimulator cashbackPct={cashbackPct} />

            {/* 5. Quêtes communautaires & Badges */}
            <MobileTerangaQuests
              quests={quests}
              isAuthenticated={isAuthenticated}
              onClaimSuccess={() => fetchTerangaData(true)}
            />

            {/* 6. Programme Super Parrain */}
            <MobileTerangaReferral
              codeParrainage={referralInfo?.codeParrainage || terangaAccount?.codeParrainage || 'TERANGA2026'}
              parrainagesReussis={referralInfo?.parrainagesReussis || 0}
              totalCoinsGagnes={referralInfo?.totalCoinsGagnesParrainage || 0}
            />

            {/* 7. Historique des transactions */}
            <MobileTerangaHistory transactions={transactions} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    ...shadows.xs,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  headerCoinsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[200],
    borderWidth: 1,
    borderColor: colors.lime[400],
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  headerCoinsText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },

  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[600],
  },

  authStack: {
    gap: 14,
  },
  contentStack: {
    gap: 14,
  },
});
