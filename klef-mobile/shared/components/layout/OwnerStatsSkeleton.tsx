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

export function OwnerStatsSkeleton() {
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
      {/* ── 1. Header & Timeframe Filter Selector Skeleton ─────── */}
      <View style={styles.headerSkeleton}>
        <View style={styles.topRow}>
          <SkeletonBox
            width={80}
            height={20}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={34}
            height={34}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
          />
        </View>

        <SkeletonBox
          width={210}
          height={26}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
        />
        <SkeletonBox
          width={260}
          height={12}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />

        {/* Timeframe Selector Pills Skeleton */}
        <View style={styles.timeframePillsRow}>
          {[80, 75, 75, 90].map((w, idx) => (
            <SkeletonBox
              key={idx}
              width={w}
              height={32}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
              backgroundColor={idx === 1 ? colors.forest[950] : colors.neutral[200]}
            />
          ))}
        </View>
      </View>

      {/* ── 2. Synthèse KPIs Globaux (Grille 2x2) ────────────────── */}
      <View style={styles.sectionSkeleton}>
        <SkeletonBox
          width={130}
          height={12}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />

        <View style={styles.gridRow}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.kpiCardSkeleton}>
              <View style={styles.cardHeaderRow}>
                <SkeletonBox
                  width={34}
                  height={34}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={50}
                  height={16}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>

              <View style={{ gap: 4, marginTop: 6 }}>
                <SkeletonBox
                  width={85}
                  height={11}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={75}
                  height={22}
                  borderRadius={radius.inner}
                  animatedValue={pulseAnim}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── 3. Graphique Revenus & Période Skeleton ──────────────── */}
      <View style={styles.cardSkeletonShell}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SkeletonBox
              width={34}
              height={34}
              borderRadius={radius.inner}
              animatedValue={pulseAnim}
            />
            <View style={{ gap: 4 }}>
              <SkeletonBox
                width={120}
                height={14}
                borderRadius={radius.inner}
                animatedValue={pulseAnim}
              />
              <SkeletonBox
                width={90}
                height={10}
                borderRadius={radius.pill}
                animatedValue={pulseAnim}
              />
            </View>
          </View>
        </View>

        <SkeletonBox
          width="100%"
          height={140}
          borderRadius={radius.inner}
          animatedValue={pulseAnim}
        />
      </View>

      {/* ── 4. Indicateurs Avancés (ADR, Nuits, Taux, Séquestre) ──── */}
      <View style={styles.cardSkeletonShell}>
        <SkeletonBox
          width={160}
          height={12}
          borderRadius={radius.pill}
          animatedValue={pulseAnim}
        />

        <View style={styles.gridRow}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.metricCardSkeleton}>
              <View style={styles.cardHeaderRow}>
                <SkeletonBox
                  width={28}
                  height={28}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={40}
                  height={14}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>
              <SkeletonBox
                width={70}
                height={18}
                borderRadius={radius.inner}
                animatedValue={pulseAnim}
              />
              <SkeletonBox
                width={90}
                height={10}
                borderRadius={radius.pill}
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
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  headerSkeleton: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeframePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },

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
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },

  cardSkeletonShell: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metricCardSkeleton: {
    width: '48%',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200] + '80',
  },
});
