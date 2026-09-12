import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { colors, radius, shadows } from '../../../../shared/theme/tokens';

interface Props {
  viewMode?: 'list' | 'grid';
}

export function MobileOwnerListingSkeleton({ viewMode = 'grid' }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  if (viewMode === 'list') {
    return (
      <View style={styles.listCard}>
        <View style={styles.listTopRow}>
          <Animated.View style={[styles.listThumb, { opacity }]} />
          <View style={styles.listContent}>
            <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
            <Animated.View style={[styles.titleSkeleton, { opacity }]} />
            <Animated.View style={[styles.locationSkeleton, { opacity }]} />
          </View>
        </View>
        <View style={styles.listBottomRow}>
          <Animated.View style={[styles.priceSkeleton, { opacity }]} />
          <Animated.View style={[styles.btnSkeleton, { opacity }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      <Animated.View style={[styles.gridImage, { opacity }]} />
      <View style={styles.gridContent}>
        <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <View style={styles.gridBottomRow}>
          <Animated.View style={[styles.priceSkeleton, { opacity }]} />
          <Animated.View style={[styles.btnSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.xs,
  },
  gridImage: {
    height: 160,
    width: '100%',
    backgroundColor: colors.neutral[200],
  },
  gridContent: {
    padding: 14,
    gap: 10,
  },

  listCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 12,
    ...shadows.xs,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listThumb: {
    width: 80,
    height: 70,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[200],
  },
  listContent: {
    flex: 1,
    gap: 6,
  },

  badgeSkeleton: {
    width: 70,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
  },
  titleSkeleton: {
    width: '85%',
    height: 18,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[200],
  },
  locationSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[200],
  },

  gridBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 10,
    marginTop: 4,
  },
  listBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 10,
  },
  priceSkeleton: {
    width: 100,
    height: 20,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[200],
  },
  btnSkeleton: {
    width: 76,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
  },
});
