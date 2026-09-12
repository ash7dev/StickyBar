import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView } from 'react-native';
import { colors, radius, shadows } from '../../theme/tokens';

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

function SectionSkeleton({ animatedValue }: { animatedValue: Animated.Value }) {
  return (
    <View style={styles.sectionContainer}>
      {/* Header de section */}
      <View style={styles.headerRow}>
        <View style={{ gap: 4 }}>
          <SkeletonBox
            width={170}
            height={22}
            borderRadius={radius.inner}
            animatedValue={animatedValue}
          />
          <SkeletonBox
            width={230}
            height={14}
            borderRadius={radius.pill}
            animatedValue={animatedValue}
          />
        </View>
        <SkeletonBox
          width={72}
          height={28}
          borderRadius={radius.pill}
          animatedValue={animatedValue}
        />
      </View>

      {/* Carrousel horizontal de cartes skeleton */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContent}
        scrollEnabled={false}
      >
        {[1, 2, 3].map((key) => (
          <View key={key} style={styles.cardContainer}>
            {/* Zone Image */}
            <SkeletonBox
              width={280}
              height={180}
              borderRadius={0}
              animatedValue={animatedValue}
            />

            {/* Infos Carte */}
            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <SkeletonBox
                  width="70%"
                  height={18}
                  borderRadius={radius.inner}
                  animatedValue={animatedValue}
                />
                <SkeletonBox
                  width={36}
                  height={16}
                  borderRadius={radius.pill}
                  animatedValue={animatedValue}
                />
              </View>

              <SkeletonBox
                width="50%"
                height={14}
                borderRadius={radius.pill}
                animatedValue={animatedValue}
                style={{ marginTop: 4 }}
              />

              <SkeletonBox
                width="65%"
                height={12}
                borderRadius={radius.pill}
                animatedValue={animatedValue}
                style={{ marginTop: 4 }}
              />

              <View style={styles.cardPriceRow}>
                <SkeletonBox
                  width={90}
                  height={22}
                  borderRadius={radius.pill}
                  animatedValue={animatedValue}
                />
                <SkeletonBox
                  width={70}
                  height={20}
                  borderRadius={radius.pill}
                  animatedValue={animatedValue}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function TenantFeedSkeleton() {
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
      <SectionSkeleton animatedValue={pulseAnim} />
      <SectionSkeleton animatedValue={pulseAnim} />
      <SectionSkeleton animatedValue={pulseAnim} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingVertical: 12,
  },
  skeletonBase: {
    backgroundColor: colors.neutral[200],
  },
  sectionContainer: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  cardsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardContainer: {
    width: 280,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardContent: {
    padding: 12,
    gap: 4,
    minHeight: 128,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardPriceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
});
