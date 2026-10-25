import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Pressable, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ArrowRight, KeyRound, Lock, MapPin, Wallet } from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { PaixiLogo } from '../../shared/components/brand/PaixiLogo';
import { colors, typography } from '../../shared/theme/tokens';

// =============================================================================
// Onboarding — écran unique Paixi
//
// Photo plein écran (embarquée : affichage immédiat, même en 3G), voile en
// dégradé, puis un seul bloc de lecture : promesse, paiement protégé en trois
// temps, moyens de paiement locaux, action. Entrée en cascade, désactivée si
// l'utilisateur a demandé à réduire les animations.
// =============================================================================

const HERO = require('../../assets/images/onboarding-hero.jpg');
const WAVE = require('../../assets/images/wavelogo.jpeg');
const ORANGE_MONEY = require('../../assets/images/orangeMoneylogo.png');

const ESCROW_STEPS = [
  { icon: Wallet, label: 'Vous payez' },
  { icon: Lock, label: 'Paixi bloque', highlight: true },
  { icon: KeyRound, label: 'Versé à l’arrivée' },
] as const;

/** Apparition « rise » : fondu + montée, décalée de `delay` ms. */
function Rise({ delay, children, style }: { delay: number; children: React.ReactNode; style?: object }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(delay, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [delay, reduceMotion, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 18 }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Rejouée depuis le profil : on revient simplement là où l'on était
  const { replay } = useLocalSearchParams<{ replay?: string }>();

  // ── Ken Burns lent sur la photo ─────────────────────────────────────
  const heroScale = useSharedValue(reduceMotion ? 1 : 1.12);
  useEffect(() => {
    if (reduceMotion) return;
    heroScale.value = withTiming(1, { duration: 9000, easing: Easing.out(Easing.cubic) });
  }, [reduceMotion, heroScale]);
  const heroStyle = useAnimatedStyle(() => ({ transform: [{ scale: heroScale.value }] }));

  // ── Pression du CTA ────────────────────────────────────────────────
  const ctaScale = useSharedValue(1);
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await setHasSeenOnboarding(true);
    if (replay && router.canGoBack()) router.back();
    else router.replace('/(tenant)' as any);
  };

  const handleLogin = async () => {
    await setHasSeenOnboarding(true);
    router.push('/(auth)/login' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
        <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>

      <LinearGradient
        style={StyleSheet.absoluteFill}
        colors={['rgba(4,25,18,0.55)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.1)', 'rgba(4,25,18,0.88)', colors.forest[950]]}
        locations={[0, 0.2, 0.38, 0.62, 0.82]}
      />

      <View style={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 18 }]}>
        <Rise delay={150}>
          <PaixiLogo size={26} tone="inverse" />
        </Rise>

        <View style={styles.spacer} />

        <Rise delay={320} style={styles.eyebrow}>
          <MapPin size={13} color={colors.lime[400]} strokeWidth={2.4} />
          <Text style={styles.eyebrowText}>PARTOUT AU SÉNÉGAL</Text>
        </Rise>

        <Rise delay={420}>
          <Text style={styles.title}>
            Votre chez-vous,{'\n'}
            <Text style={styles.titleAccent}>en toute confiance.</Text>
          </Text>
        </Rise>

        <Rise delay={520}>
          <Text style={styles.subtitle}>
            Des logements vérifiés et un paiement protégé&nbsp;: l’hôte n’est payé qu’à votre arrivée.
          </Text>
        </Rise>

        <Rise delay={640} style={styles.escrowCard}>
          {ESCROW_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isHighlight = 'highlight' in step;
            return (
              <React.Fragment key={step.label}>
                {i > 0 && <View style={styles.escrowLink} />}
                <View style={styles.escrowStep}>
                  <View style={[styles.escrowIcon, isHighlight && styles.escrowIconHighlight]}>
                    <Icon
                      size={17}
                      strokeWidth={2.2}
                      color={isHighlight ? colors.forest[950] : colors.lime[400]}
                    />
                  </View>
                  <Text style={styles.escrowLabel} numberOfLines={1}>
                    {step.label}
                  </Text>
                </View>
              </React.Fragment>
            );
          })}
        </Rise>

        <Rise delay={740} style={styles.payRow}>
          <Image source={WAVE} style={styles.payLogo} contentFit="cover" />
          <Image source={ORANGE_MONEY} style={styles.payLogo} contentFit="cover" />
          <Text style={styles.payText}>Wave, Orange Money ou carte</Text>
        </Rise>

        <Rise delay={840}>
          <Animated.View style={ctaStyle}>
            <Pressable
              onPress={handleStart}
              onPressIn={() => (ctaScale.value = withSpring(0.97, { damping: 18, stiffness: 320 }))}
              onPressOut={() => (ctaScale.value = withSpring(1, { damping: 14, stiffness: 260 }))}
              accessibilityRole="button"
              accessibilityLabel="Trouver un logement"
              style={styles.cta}
            >
              <Text style={styles.ctaLabel}>Trouver un logement</Text>
              <View style={styles.ctaArrow}>
                <ArrowRight size={18} color={colors.lime[400]} strokeWidth={2.4} />
              </View>
            </Pressable>
          </Animated.View>

          {!isAuthenticated && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleLogin} style={styles.login} accessibilityRole="button">
              <Text style={styles.loginText}>
                Déjà un compte ? <Text style={styles.loginBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          )}
        </Rise>
      </View>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const PAPER = colors.neutral[50];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.forest[950] },
  content: { flex: 1, paddingHorizontal: 24 },
  spacer: { flex: 1 },

  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eyebrowText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: colors.lime[400],
  },

  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 40,
    lineHeight: 43,
    letterSpacing: -1,
    color: PAPER,
  },
  titleAccent: { color: colors.lime[400] },
  subtitle: {
    marginTop: 12,
    fontFamily: typography.fontBody,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(248,251,244,0.74)',
  },

  escrowCard: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(248,251,244,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(248,251,244,0.22)',
  },
  escrowStep: { flex: 1, alignItems: 'center', gap: 8 },
  escrowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(211,242,110,0.12)',
  },
  escrowIconHighlight: { backgroundColor: colors.lime[400] },
  escrowLink: {
    width: 18,
    height: 1,
    marginTop: 19,
    backgroundColor: 'rgba(248,251,244,0.25)',
  },
  escrowLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: PAPER,
  },

  payRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  payLogo: { width: 20, height: 20, borderRadius: 6 },
  payText: {
    marginLeft: 4,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: 'rgba(248,251,244,0.6)',
  },

  cta: {
    marginTop: 22,
    height: 60,
    borderRadius: 999,
    backgroundColor: colors.lime[400],
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 8,
  },
  ctaLabel: {
    flex: 1,
    fontFamily: typography.fontBodySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  ctaArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },

  login: { alignItems: 'center', paddingVertical: 14 },
  loginText: { fontFamily: typography.fontBody, fontSize: 14, color: 'rgba(248,251,244,0.72)' },
  loginBold: { fontFamily: typography.fontBodySemiBold, color: PAPER },
});
