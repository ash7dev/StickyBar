import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import { colors, radius, shadows } from '../../../../../shared/theme/tokens';

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

export function MobileOwnerReservationDetailSkeleton() {
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
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Hero Card Skeleton (Fond sombre Forest) ───────────────────── */}
      <View style={styles.heroCardSkeleton}>
        {/* En-tête : Badge statut & N° de réservation */}
        <View style={styles.rowBetween}>
          <SkeletonBox
            width={120}
            height={26}
            borderRadius={radius.pill}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={90}
            height={14}
            borderRadius={radius.pill}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            animatedValue={pulseAnim}
          />
        </View>

        {/* dates du séjour */}
        <View style={{ gap: 8, marginVertical: 4 }}>
          <SkeletonBox
            width={210}
            height={22}
            borderRadius={radius.inner}
            backgroundColor="rgba(255, 255, 255, 0.22)"
            animatedValue={pulseAnim}
          />
          <SkeletonBox
            width={140}
            height={13}
            borderRadius={radius.pill}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            animatedValue={pulseAnim}
          />
        </View>

        <View style={styles.darkDivider} />

        {/* Logement & Revenu Net */}
        <View style={styles.rowBetween}>
          <View style={styles.logementRow}>
            <SkeletonBox
              width={48}
              height={48}
              borderRadius={radius.inner}
              backgroundColor="rgba(255, 255, 255, 0.15)"
              animatedValue={pulseAnim}
            />
            <View style={{ gap: 5, flex: 1 }}>
              <SkeletonBox
                width={150}
                height={14}
                borderRadius={radius.inner}
                backgroundColor="rgba(255, 255, 255, 0.20)"
                animatedValue={pulseAnim}
              />
              <SkeletonBox
                width={100}
                height={11}
                borderRadius={radius.pill}
                backgroundColor="rgba(255, 255, 255, 0.12)"
                animatedValue={pulseAnim}
              />
            </View>
          </View>
        </View>

        {/* Encart Revenu Net */}
        <View style={styles.revenueBoxSkeleton}>
          <View style={{ gap: 4 }}>
            <SkeletonBox
              width={110}
              height={11}
              borderRadius={radius.pill}
              backgroundColor="rgba(255, 255, 255, 0.15)"
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width={150}
              height={24}
              borderRadius={radius.inner}
              backgroundColor="rgba(211, 242, 110, 0.50)"
              animatedValue={pulseAnim}
            />
          </View>
          <SkeletonBox
            width={80}
            height={28}
            borderRadius={radius.pill}
            backgroundColor="rgba(255, 255, 255, 0.15)"
            animatedValue={pulseAnim}
          />
        </View>
      </View>

      {/* ── 2. Action Panel Card Skeleton (Card blanche) ──────────────────── */}
      <View style={styles.whiteCardSkeleton}>
        {/* Accent Bar */}
        <View style={styles.accentBarSkeleton} />

        <View style={styles.cardPadding}>
          <View style={styles.rowHeader}>
            <SkeletonBox
              width={42}
              height={42}
              borderRadius={12}
              animatedValue={pulseAnim}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.rowBetween}>
                <SkeletonBox
                  width={140}
                  height={16}
                  borderRadius={radius.inner}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={70}
                  height={20}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>
              <SkeletonBox
                width={200}
                height={12}
                borderRadius={radius.pill}
                animatedValue={pulseAnim}
              />
            </View>
          </View>

          <View style={styles.lightDivider} />

          {/* Action button skeleton */}
          <View style={{ gap: 10 }}>
            <SkeletonBox
              width="100%"
              height={48}
              borderRadius={radius.pill}
              backgroundColor={colors.lime[200]}
              animatedValue={pulseAnim}
            />
          </View>
        </View>
      </View>

      {/* ── 3. Fiche Locataire Skeleton (Guest Info Card) ────────────────── */}
      <View style={styles.whiteCardSkeleton}>
        <View style={styles.cardPadding}>
          <SkeletonBox
            width={130}
            height={13}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
            style={{ marginBottom: 12 }}
          />

          <View style={styles.rowHeader}>
            <SkeletonBox
              width={52}
              height={52}
              borderRadius={26}
              animatedValue={pulseAnim}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SkeletonBox
                  width={120}
                  height={16}
                  borderRadius={radius.inner}
                  animatedValue={pulseAnim}
                />
                <SkeletonBox
                  width={60}
                  height={18}
                  borderRadius={radius.pill}
                  animatedValue={pulseAnim}
                />
              </View>
              <SkeletonBox
                width={160}
                height={12}
                borderRadius={radius.pill}
                animatedValue={pulseAnim}
              />
            </View>
          </View>

          <View style={styles.lightDivider} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SkeletonBox
              width="50%"
              height={40}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
            <SkeletonBox
              width="46%"
              height={40}
              borderRadius={radius.pill}
              animatedValue={pulseAnim}
            />
          </View>
        </View>
      </View>

      {/* ── 4. Financial Breakdown Card Skeleton ─────────────────────────── */}
      <View style={styles.whiteCardSkeleton}>
        <View style={styles.cardPadding}>
          <SkeletonBox
            width={160}
            height={14}
            borderRadius={radius.pill}
            animatedValue={pulseAnim}
            style={{ marginBottom: 14 }}
          />

          <View style={{ gap: 10 }}>
            <View style={styles.rowBetween}>
              <SkeletonBox width={140} height={12} borderRadius={radius.pill} animatedValue={pulseAnim} />
              <SkeletonBox width={80} height={12} borderRadius={radius.pill} animatedValue={pulseAnim} />
            </View>
            <View style={styles.rowBetween}>
              <SkeletonBox width={120} height={12} borderRadius={radius.pill} animatedValue={pulseAnim} />
              <SkeletonBox width={70} height={12} borderRadius={radius.pill} animatedValue={pulseAnim} />
            </View>

            <View style={styles.lightDivider} />

            <View style={styles.rowBetween}>
              <SkeletonBox width={130} height={16} borderRadius={radius.inner} animatedValue={pulseAnim} />
              <SkeletonBox width={100} height={18} borderRadius={radius.inner} animatedValue={pulseAnim} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Hero Card Dark
  heroCardSkeleton: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 18,
    gap: 12,
    ...shadows.float,
  },
  darkDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginVertical: 4,
  },
  logementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  revenueBoxSkeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.inner,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  // Card blanche
  whiteCardSkeleton: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.xs,
  },
  accentBarSkeleton: {
    height: 4,
    backgroundColor: colors.neutral[300],
    width: '100%',
  },
  cardPadding: {
    padding: 16,
  },
  lightDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 14,
  },
});
