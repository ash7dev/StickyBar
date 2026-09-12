import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

export function MobileListingEditSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPlaceholder}>
        <View style={styles.topRowPlaceholder}>
          <View style={styles.pillSkeleton} />
          <View style={styles.pillSkeletonSmall} />
          <View style={styles.pillSkeleton} />
        </View>
        <View style={styles.tabsRowPlaceholder}>
          <View style={styles.tabSkeleton} />
          <View style={styles.tabSkeleton} />
          <View style={styles.tabSkeleton} />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.cardSkeleton}>
          <ActivityIndicator size="large" color={colors.lime[600]} />
          <Text style={styles.loadingText}>Chargement de l'annonce...</Text>
          <Text style={styles.subText}>Récupération de vos informations en cours</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  headerPlaceholder: {
    backgroundColor: colors.neutral[0],
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 12,
  },
  topRowPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pillSkeleton: {
    width: 80,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
  },
  pillSkeletonSmall: {
    width: 60,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
  },
  tabsRowPlaceholder: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tabSkeleton: {
    width: 90,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardSkeleton: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  loadingText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    marginTop: 8,
  },
  subText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
});
