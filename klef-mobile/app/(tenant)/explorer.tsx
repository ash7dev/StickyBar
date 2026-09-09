import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal, Map, List } from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppCard } from '../../shared/components/ui/AppCard';
import { AuthGuardModal } from '../../features/auth/components/AuthGuardModal';

export default function ExplorerScreen() {
  const { isAuthenticated } = useAuthStore();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Toggle Mode Carte / Liste (Miroir exact de mobile-bottom-nav.tsx) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          style={styles.toggleViewBtn}
        >
          {viewMode === 'list' ? (
            <>
              <Map size={16} color={colors.lime[300]} />
              <Text style={styles.toggleViewText}>Carte</Text>
            </>
          ) : (
            <>
              <List size={16} color={colors.lime[300]} />
              <Text style={styles.toggleViewText}>Liste</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Barre de Recherche */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.forest[600]} />
          <Text style={styles.searchPlaceholder}>Rechercher un logement à Dakar...</Text>
          <View style={styles.filterTile}>
            <SlidersHorizontal size={16} color={colors.forest[800]} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <AppCard style={styles.card} variant="card">
          <Text style={styles.cardTitle}>Catalogue Logements (Mode {viewMode === 'list' ? 'Liste' : 'Carte'})</Text>
          <Text style={styles.cardSubtitle}>
            Consultez toutes les offres vérifiées de la Petite-Côte, Saly, Almadies et Plateau.
          </Text>
        </AppCard>

        {!isAuthenticated ? (
          <TouchableOpacity onPress={() => setAuthModalVisible(true)} style={styles.protectedBtn}>
            <Text style={styles.protectedBtnText}>⚡ Réserver sans attendre</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <AuthGuardModal onClose={() => setAuthModalVisible(false)} visible={authModalVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  header: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  toggleViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.forest[950],
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  toggleViewText: { color: colors.neutral[0], fontSize: typography.sizes.xs, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    paddingLeft: 14,
    paddingRight: 6,
    height: 48,
    gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: typography.sizes.xs, color: colors.neutral[500], fontWeight: '600' },
  filterTile: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { padding: 20, gap: 16 },
  card: { gap: 8 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: '700', color: colors.neutral[900] },
  cardSubtitle: { fontSize: typography.sizes.xs, color: colors.neutral[600] },
  protectedBtn: {
    padding: 16,
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    alignItems: 'center',
  },
  protectedBtnText: { color: colors.lime[400], fontWeight: '700', fontSize: typography.sizes.xs },
});
