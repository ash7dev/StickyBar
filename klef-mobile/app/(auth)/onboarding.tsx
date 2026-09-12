import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Star,
  Lock,
  BadgeCheck,
} from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';

// =============================================================================
// Onboarding Hero Screen — Premium Klef Mobile
//
// Design inspiré du web HeroSection : immersion photo plein écran,
// dégradé forest-950 progressif, trust badges, typographie Display,
// animations d'entrée « klef-rise » avec react-native-reanimated.
// =============================================================================

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_IMAGE_URI =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop';

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: 'Paiements sous séquestre' },
  { icon: BadgeCheck, text: 'Logements vérifiés' },
  { icon: Lock, text: 'Données chiffrées' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  // ── Animations d'entrée ─────────────────────────────────────────────
  const heroScale = useSharedValue(1.15);
  const contentOpacity = useSharedValue(0);
  const contentTranslate = useSharedValue(24);
  const badgeOpacity = useSharedValue(0);
  const trustOpacity = useSharedValue(0);

  useEffect(() => {
    // Image zoom-out (Ken Burns léger)
    heroScale.value = withTiming(1, {
      duration: 8000,
      easing: Easing.out(Easing.cubic),
    });

    // Badge d'entrée
    badgeOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );

    // Contenu principal (titre + sous-titre + CTA)
    contentOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    contentTranslate.value = withDelay(
      400,
      withSpring(0, { damping: 20, stiffness: 90 }),
    );

    // Trust badges
    trustOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, []);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [
      { translateY: interpolate(badgeOpacity.value, [0, 1], [8, 0]) },
    ],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslate.value }],
  }));

  const trustAnimatedStyle = useAnimatedStyle(() => ({
    opacity: trustOpacity.value,
    transform: [
      { translateY: interpolate(trustOpacity.value, [0, 1], [12, 0]) },
    ],
  }));

  // ── Handlers ────────────────────────────────────────────────────────
  const handleStartExplorer = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(tenant)' as any);
  };

  const handleLoginPress = async () => {
    await setHasSeenOnboarding(true);
    router.push('/(auth)/login' as any);
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Background Image avec Ken Burns ──────────────────────────── */}
      <Animated.View style={[styles.heroImageWrapper, heroAnimatedStyle]}>
        <Image
          source={{ uri: HERO_IMAGE_URI }}
          style={styles.heroImage}
          contentFit="cover"
          transition={400}
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* ── Gradient Overlay (progressive: transparent → forest-950) ── */}
      <View style={styles.gradientOverlay}>
        {/* Top: transparent → subtle dark */}
        <View style={styles.gradientTop} />

        {/* Bottom: heavy dark for text legibility */}
        <View style={styles.gradientBottom} />
      </View>

      {/* ── Content Layer ──────────────────────────────────────────── */}
      <View style={styles.contentLayer}>
        {/* Header — Brand Badge */}
        <Animated.View style={[styles.headerSection, badgeAnimatedStyle]}>
          <View style={styles.brandBadge}>
            <View style={styles.brandDot} />
            <Text style={styles.brandBadgeText}>KLEF</Text>
          </View>
        </Animated.View>

        {/* Spacer to push content down */}
        <View style={{ flex: 1 }} />

        {/* Main Content */}
        <Animated.View style={[styles.mainContent, contentAnimatedStyle]}>
          {/* Category Pill */}
          <View style={styles.categoryPill}>
            <Sparkles size={13} color={colors.lime[300]} />
            <Text style={styles.categoryPillText}>IMMOBILIER HAUT DE GAMME</Text>
          </View>

          {/* Display Title */}
          <Text style={styles.heroTitle}>
            Trouvez votre{'\n'}havre à Dakar
          </Text>

          {/* Subtitle */}
          <Text style={styles.heroSubtitle}>
            Court séjour d'exception, hébergements 100%{'\u00A0'}vérifiés et paiements
            locaux simplifiés via Wave{'\u00A0'}&{'\u00A0'}Orange Money.
          </Text>

          {/* ── Trust Indicators ──────────────────────────────────── */}
          <Animated.View style={[styles.trustRow, trustAnimatedStyle]}>
            {TRUST_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <View key={i} style={styles.trustItem}>
                  <Icon size={13} color={colors.forest[300]} />
                  <Text style={styles.trustItemText}>{item.text}</Text>
                </View>
              );
            })}
          </Animated.View>

          {/* ── CTA Section ───────────────────────────────────────── */}
          <View style={styles.ctaSection}>
            <AppButton
              label="Commencer l'expérience"
              onPress={handleStartExplorer}
              rightIcon={<ArrowRight size={18} color={colors.forest[800]} />}
              size="lg"
              variant="action"
              fullWidth
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLoginPress}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Déjà un compte ?{' '}
                <Text style={styles.loginLinkBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.forest[950],
  },

  // ── Hero Image ──────────────────────────────────────────────────────
  heroImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // ── Gradient Overlay ────────────────────────────────────────────────
  // Deux couches : haut transparent, bas opaque (pour la lisibilité du texte)
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    flex: 0.45,
    backgroundColor: 'rgba(4, 25, 18, 0.25)',
  },
  gradientBottom: {
    flex: 0.55,
    // Dégradé simulé : du transparent au forest-950 opaque
    backgroundColor: 'rgba(4, 25, 18, 0.85)',
  },

  // ── Content Layer ──────────────────────────────────────────────────
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
  },

  // ── Header ─────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'flex-start',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.lime[400],
  },
  brandBadgeText: {
    color: colors.neutral[0],
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.5,
  },

  // ── Main Content ──────────────────────────────────────────────────
  mainContent: {
    gap: 14,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderColor: 'rgba(211, 242, 110, 0.25)',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  categoryPillText: {
    color: colors.lime[300],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.neutral[0],
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.forest[200],
    lineHeight: 22,
  },

  // ── Trust Indicators ──────────────────────────────────────────────
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustItemText: {
    fontSize: 11,
    color: colors.forest[300],
    fontWeight: '500',
  },

  // ── CTA Section ───────────────────────────────────────────────────
  ctaSection: {
    width: '100%',
    gap: 14,
    marginTop: 10,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[0],
  },
  loginLinkBold: {
    fontWeight: '700',
    color: colors.lime[400],
    textDecorationLine: 'underline',
  },
});
