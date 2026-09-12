import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radius, shadows } from '../../theme/tokens';

function SkeletonBox({
  width,
  height,
  borderRadius = radius.inner,
  style,
  animatedValue,
  backgroundColor = colors.neutral[200],
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  animatedValue: Animated.Value;
  backgroundColor?: string;
}) {
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity: animatedValue,
        },
        style,
      ]}
    />
  );
}

export function OwnerDashboardSkeleton() {
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
      {/* ── Welcome Header Skeleton ──────────────────────────── */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox
          width={180}
          height={26}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
        />
        <SkeletonBox
          width={240}
          height={14}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />
      </View>

      {/* ── 1. Revenue Wallet Card Skeleton (Dark Card) ──────── */}
      <View style={styles.darkCardSkeleton}>
        <View style={styles.darkRowBetween}>
          <View style={styles.darkLeftGroup}>
            <SkeletonBox
              width={36}
              height={36}
              borderRadius={radius.inner}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={70}
              height={14}
              borderRadius={radius.pill}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
          </View>
          <SkeletonBox
            width={36}
            height={36}
            borderRadius={radius.pill}
            backgroundColor="rgba(255,255,255,0.12)"
            animatedValue={pulseAnim}
          />
        </View>

        <View style={{ gap: 6, marginVertical: 4 }}>
          <SkeletonBox
            width={190}
            height={32}
            borderRadius={radius.inner}
            backgroundColor="rgba(255,255,255,0.20)"
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={120}
            height={12}
            borderRadius={radius.pill}
            backgroundColor="rgba(255,255,255,0.12)"
            animatedValue={pulseAnim}
          />
        </View>

        <View style={styles.darkDivider} />

        <View style={styles.darkRowBetween}>
          <View style={{ gap: 4 }}>
            <SkeletonBox
              width={100}
              height={11}
              borderRadius={radius.pill}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={130}
              height={18}
              borderRadius={radius.inner}
              backgroundColor="rgba(255,255,255,0.20)"
              animatedValue={pulseAnim}
            />
          </View>

          <SkeletonBox
            width={90}
            height={38}
            borderRadius={radius.pill}
            backgroundColor="rgba(211,242,110,0.50)"
            animatedValue={pulseAnim}
          />
        </View>
      </View>

      {/* ── 2. Synthèse d'Activité KPIs Skeleton (Grille 2x2) ──── */}
      <View style={styles.sectionSkeleton}>
        <SkeletonBox
          width={130}
          height={14}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />

        <View style={styles.gridRow}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.kpiCardSkeleton}>
              <View style={styles.darkRowBetween}>
                <SkeletonBox
                  width={36}
                  height={36}
                  borderRadius={radius.inner}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={16}
                  height={16}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>

              <View style={{ gap: 4, marginTop: 8 }}>
                <SkeletonBox
                  width={80}
                  height={11}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={60}
                  height={22}
                  borderRadius={radius.inner}
                  animatedValue={pulseAnim}
                />
              </View>

              <View style={styles.cardFooterDivider}>
                <SkeletonBox
                  width={90}
                  height={10}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── 3. Actions Rapides Skeleton List ────────────────────── */}
      <View style={styles.sectionSkeleton}>
        <SkeletonBox
          width={110}
          height={14}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />

        <View style={{ gap: 10 }}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.actionCardSkeleton}>
              <View style={styles.actionLeftGroup}>
                <SkeletonBox
                  width={38}
                  height={38}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <View style={{ gap: 4, flex: 1 }}>
                  <SkeletonBox
                    width={130}
                    height={14}
                    borderRadius={radius.inner}
                    animatedValue={pulseAnim}
                  />
                  <SkeletonBox
                    width={200}
                    height={11}
                    borderRadius={radius.pill}
                    animatedValue={pulseAnim}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 110,
  },
  headerSkeleton: {
    gap: 6,
  },

  // Dark Card Skeleton
  darkCardSkeleton: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
    ...shadows.float,
  },
  darkRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  darkDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 2,
  },

  // Section & Grid Skeleton
  sectionSkeleton: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCardSkeleton: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  cardFooterDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 8,
    marginTop: 4,
  },

  // Action List Skeleton
  actionCardSkeleton: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  actionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
