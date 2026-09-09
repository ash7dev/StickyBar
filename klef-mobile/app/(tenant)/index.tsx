import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';
import { AppBadge } from '../../shared/components/ui/AppBadge';
import { AuthGuardModal } from '../../features/auth/components/AuthGuardModal';

export default function ExplorerScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <AppBadge label="Dakar & Sénégal" variant="brand" />
            <Text style={styles.greetingTitle}>
              {isAuthenticated && user?.prenom ? `Bonjour, ${user.prenom} 👋` : 'Trouvez votre havre 🌴'}
            </Text>
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity onPress={() => setAuthModalVisible(true)} style={styles.guestPill}>
              <Text style={styles.guestPillText}>Se connecter</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Fake Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.forest[600]} />
          <Text style={styles.searchPlaceholder}>Où souhaitez-vous séjourner ?</Text>
          <View style={styles.filterTile}>
            <SlidersHorizontal size={16} color={colors.forest[800]} />
          </View>
        </View>

        {/* Welcome Section Banner */}
        <AppCard style={styles.bannerCard} variant="card">
          <View style={styles.bannerHeader}>
            <MapPin size={20} color={colors.forest[600]} />
            <Text style={styles.bannerTitle}>Explorez la Petite-Côte & Dakar</Text>
          </View>
          <Text style={styles.bannerSubtitle}>
            Séjours d’exception vérifiés avec support sérénité 24/7 et annulation flexible.
          </Text>
        </AppCard>

        {/* Protected action trigger example */}
        {!isAuthenticated ? (
          <TouchableOpacity onPress={() => setAuthModalVisible(true)} style={styles.demoProtectedAction}>
            <Text style={styles.demoProtectedActionText}>⚡ Exemple : Réserver ou enregistrer un bien</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Modal Auth Guard pour Mode Invité */}
      <AuthGuardModal
        onClose={() => setAuthModalVisible(false)}
        visible={authModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  guestPill: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[200],
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  guestPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.forest[600],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  filterTile: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    gap: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  bannerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  demoProtectedAction: {
    padding: 16,
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    alignItems: 'center',
  },
  demoProtectedActionText: {
    color: colors.lime[400],
    fontWeight: '700',
    fontSize: typography.sizes.xs,
  },
});
