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

export function OwnerWalletSkeleton() {
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
      {/* ── 1. Balance Dark Card Skeleton ──────────────────────────────────── */}
      <View style={styles.darkBalanceCard}>
        {/* Top Header Row */}
        <View style={styles.rowBetween}>
          <View style={styles.leftGroup}>
            <SkeletonBox
              width={38}
              height={38}
              borderRadius={radius.inner}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
            <View style={{ gap: 4 }}>
              <SkeletonBox
                width={120}
                height={12}
                borderRadius={radius.pill}
                backgroundColor="rgba(255,255,255,0.20)"
                animatedValue={pulseAnim}
              />
              <SkeletonBox
                width={80}
                height={10}
                borderRadius={radius.pill}
                backgroundColor="rgba(255,255,255,0.12)"
                animatedValue={pulseAnim}
              />
            </View>
          </View>

          <SkeletonBox
            width={70}
            height={24}
            borderRadius={radius.pill}
            backgroundColor="rgba(211,242,110,0.25)"
            animatedValue={pulseAnim}
          />
        </View>

        {/* Big Balance Amount */}
        <View style={{ gap: 6, marginVertical: 6 }}>
          <SkeletonBox
            width={210}
            height={36}
            borderRadius={radius.inner}
            backgroundColor="rgba(211,242,110,0.40)"
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={140}
            height={12}
            borderRadius={radius.pill}
            backgroundColor="rgba(255,255,255,0.15)"
            animatedValue={pulseAnim}
          />
        </View>

        {/* Withdraw Action Button Skeleton */}
        <SkeletonBox
          width="100%"
          height={48}
          borderRadius={radius.pill}
          backgroundColor="rgba(211,242,110,0.50)"
          animatedValue={pulseAnim}
        />

        {/* Divider */}
        <View style={styles.darkDivider} />

        {/* Sub Info Row (Pending / Séquestre) */}
        <View style={styles.rowBetween}>
          <View style={{ gap: 4 }}>
            <SkeletonBox
              width={95}
              height={10}
              borderRadius={radius.pill}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={110}
              height={16}
              borderRadius={radius.inner}
              backgroundColor="rgba(255,255,255,0.20)"
              animatedValue={pulseAnim}
            />
          </View>

          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            <SkeletonBox
              width={85}
              height={10}
              borderRadius={radius.pill}
              backgroundColor="rgba(255,255,255,0.15)"
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={100}
              height={16}
              borderRadius={radius.inner}
              backgroundColor="rgba(255,255,255,0.20)"
              animatedValue={pulseAnim}
            />
          </View>
        </View>
      </View>

      {/* ── 2. Transactions Card Skeleton ──────────────────────────────────── */}
      <View style={styles.transactionsCard}>
        {/* Card Header */}
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SkeletonBox
              width={34}
              height={34}
              borderRadius={radius.inner}
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={150}
              height={14}
              borderRadius={radius.inner}
              animatedValue={pulseAnim}
            />
          </View>

          <SkeletonBox
            width={60}
            height={22}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
        </View>

        {/* Transaction Items */}
        <View style={{ gap: 12, marginTop: 4 }}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.txRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <SkeletonBox
                  width={38}
                  height={38}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <View style={{ gap: 5, flex: 1 }}>
                  <SkeletonBox
                    width="80%"
                    height={13}
                    borderRadius={radius.inner}
                    animatedValue={pulseAnim}
                  />
                  <SkeletonBox
                    width={100}
                    height={10}
                    borderRadius={radius.pill}
                    animatedValue={pulseAnim}
                  />
                </View>
              </View>

              <SkeletonBox
                width={85}
                height={16}
                borderRadius={radius.inner}
                animatedValue={pulseAnim}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 110,
  },

  // Dark Balance Card
  darkBalanceCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
    ...shadows.float,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  darkDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 4,
  },

  // Transactions Card
  transactionsCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
});
