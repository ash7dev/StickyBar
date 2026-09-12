import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, radius, shadows } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SkeletonBox({
  width,
  height,
  borderRadius = radius.inner,
  style,
  animatedValue,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  animatedValue: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
}

export function TenantListingDetailSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* 1. Hero Galerie Photo Skeleton */}
      <View style={styles.gallerySkeletonContainer}>
        <SkeletonBox
          width={SCREEN_WIDTH}
          height={310}
          borderRadius={0}
          animatedValue={pulseAnim}
        />
        {/* Top Controls Floating Pills */}
        <View style={styles.topControlsRow}>
          <SkeletonBox
            width={40}
            height={40}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
          <View style={styles.topRightActions}>
            <SkeletonBox
              width={40}
              height={40}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={40}
              height={40}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
          </View>
        </View>
      </View>

      {/* 2. Sheet Overlap Spec Container */}
      <View style={styles.sheetContainer}>
        {/* Badges ligne du haut */}
        <View style={styles.badgesRow}>
          <SkeletonBox
            width={90}
            height={24}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={110}
            height={24}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
        </View>

        {/* Titre Logement */}
        <SkeletonBox
          width="80%"
          height={26}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
          style={{ marginTop: 8 }}
        />
        <SkeletonBox
          width="50%"
          height={26}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
          style={{ marginTop: 6 }}
        />

        {/* Localisation & Type */}
        <SkeletonBox
          width="45%"
          height={16}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
          style={{ marginTop: 10 }}
        />

        {/* Grille de caractéristiques */}
        <View style={styles.specsGrid}>
          <SkeletonBox
            width="47%"
            height={44}
            borderRadius={radius.inner}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="47%"
            height={44}
            borderRadius={radius.inner}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="47%"
            height={44}
            borderRadius={radius.inner}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="47%"
            height={44}
            borderRadius={radius.inner}
            animatedValue={pulseAnim}
          />
        </View>
      </View>

      {/* 3. Section Tarifs Dégressifs */}
      <View style={styles.sectionBlock}>
        <SkeletonBox
          width="55%"
          height={20}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
        />
        <View style={styles.cardsStack}>
          <SkeletonBox
            width="100%"
            height={68}
            borderRadius={radius.card}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="100%"
            height={68}
            borderRadius={radius.card}
            animatedValue={pulseAnim}
          />
        </View>
      </View>

      {/* 4. Section Description */}
      <View style={styles.sectionBlock}>
        <SkeletonBox
          width="40%"
          height={20}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
        />
        <View style={{ gap: 6, marginTop: 4 }}>
          <SkeletonBox
            width="100%"
            height={14}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="92%"
            height={14}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width="75%"
            height={14}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
        </View>
      </View>

      {/* 5. Sticky Reservation Bar (Fixée en bas) */}
      <View style={styles.stickyBarContainer}>
        <View style={styles.stickyBarContent}>
          <View style={{ gap: 4 }}>
            <SkeletonBox
              width={90}
              height={22}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={60}
              height={12}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
          </View>
          <SkeletonBox
            width={140}
            height={46}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[0],
  },
  gallerySkeletonContainer: {
    position: 'relative',
    height: 310,
    width: SCREEN_WIDTH,
  },
  skeletonBase: {
    backgroundColor: colors.neutral[200],
  },
  topControlsRow: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetContainer: {
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: 12,
  },
  cardsStack: {
    gap: 10,
    marginTop: 4,
  },
  stickyBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    justifyContent: 'center',
    paddingHorizontal: 20,
    ...shadows.md,
  },
  stickyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
