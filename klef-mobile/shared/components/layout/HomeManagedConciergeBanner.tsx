import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Building2, ArrowRight, Sparkles } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { MobileKlefManagedModal } from './MobileKlefManagedModal';

export function HomeManagedConciergeBanner() {
  const [modalVisible, setModalVisible] = useState(false);

  // Entrée (une seule fois, équivalent RN de .klef-rise)
  const entrance = useRef(new Animated.Value(0)).current;
  // Feedback tactile
  const scale = useRef(new Animated.Value(1)).current;
  // Halo pulsé derrière l'icône — très discret, jamais un bloc lime plein
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [entrance, glow]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    setModalVisible(true);
  };

  return (
    <Animated.View
      style={[
        styles.paddingHorizontal,
        {
          opacity: entrance,
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleOpenModal}
          accessibilityRole="button"
          accessibilityLabel="Faire estimer les revenus locatifs via Paixi Managed"
          accessibilityHint="Ouvre le formulaire de conciergerie 100% déléguée"
        >
          <LinearGradient
            colors={[colors.forest[950], colors.forest[900] ?? colors.forest[950]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardContainer}
          >
            {/* Icône avec halo pulsé */}
            <View style={styles.iconWrapper}>
              <Animated.View
                style={[
                  styles.iconGlow,
                  {
                    opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }),
                    transform: [
                      { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                    ],
                  },
                ]}
              />
              <View style={styles.iconSquircle}>
                <Building2 size={20} color={colors.lime[400]} />
              </View>
            </View>

            {/* Textes au centre */}
            <View style={styles.textBox}>
              <View style={styles.headlineRow}>
                <Text numberOfLines={1} style={styles.titleText}>
                  Faites estimer vos revenus
                </Text>
                <Sparkles size={12} color={colors.lime[400]} />
              </View>

              <Text numberOfLines={1} style={styles.subtitleText}>
                Conciergerie Paixi Managed • 100% délégué
              </Text>
            </View>

            {/* Pilule d'action */}
            <View style={styles.actionPill}>
              <Text style={styles.actionPillText}>Estimer</Text>
              <ArrowRight size={12} color={colors.forest[950]} />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <MobileKlefManagedModal
        onClose={() => setModalVisible(false)}
        visible={modalVisible}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paddingHorizontal: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  cardContainer: {
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.28)',
    ...shadows.sm,
    overflow: 'hidden',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.lime[400],
  },
  iconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
    gap: 2,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.sm,
    color: colors.neutral[0],
  },
  subtitleText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[200],
    letterSpacing: 0.2,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  actionPillText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 11,
    color: colors.forest[950],
    letterSpacing: 0.3,
  },
});