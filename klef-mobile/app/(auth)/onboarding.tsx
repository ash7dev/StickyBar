import React from 'react';
import { View, Text, StyleSheet, ImageBackground, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Sparkles, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';
import { AppBadge } from '../../shared/components/ui/AppBadge';

export default function OnboardingScreen() {
  const router = useRouter();
  const setHasSeenOnboarding = useAuthStore((s) => s.setHasSeenOnboarding);

  const handleStartExplorer = async () => {
    await setHasSeenOnboarding(true);
    router.replace('/(tenant)');
  };

  const handleLoginPress = async () => {
    await setHasSeenOnboarding(true);
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Image de fond Haute Définition avec Dégradé Vert Forêt */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
        }}
        style={styles.backgroundImage}
      >
        <View style={styles.gradientOverlay}>
          {/* Header Badge */}
          <View style={styles.header}>
            <AppBadge
              label="KLEF SÉRÉNITÉ"
              leftIcon={<Shield size={12} color={colors.lime[400]} />}
              variant="brand"
            />
          </View>

          {/* Core Value Proposition (Bas de page) */}
          <View style={styles.footerContent}>
            <View style={styles.pillTag}>
              <Sparkles size={14} color={colors.lime[300]} />
              <Text style={styles.pillTagText}>IMMOBILIER HAUT DE GAMME</Text>
            </View>

            <Text style={styles.title}>
              Trouvez votre havre à Dakar {'\n'}& au Sénégal
            </Text>

            <Text style={styles.subtitle}>
              Court séjour d’exception, hébergements 100% vérifiés et paiements locaux simplifiés via Wave & Orange Money.
            </Text>

            {/* Actions (CTA Principal + Lien Se Connecter) */}
            <View style={styles.actionSection}>
              <AppButton
                label="Commencer l'expérience"
                onPress={handleStartExplorer}
                rightIcon={<ArrowRight size={18} color={colors.forest[800]} />}
                size="lg"
                variant="action"
              />

              <TouchableOpacity activeOpacity={0.7} onPress={handleLoginPress} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                  Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.forest[950],
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.72)',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 44,
  },
  header: {
    alignItems: 'flex-start',
  },
  footerContent: {
    gap: 12,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(211, 242, 110, 0.14)',
    borderColor: 'rgba(211, 242, 110, 0.30)',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  pillTagText: {
    color: colors.lime[300],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.neutral[0],
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.forest[200],
    lineHeight: 22,
    marginBottom: 12,
  },
  actionSection: {
    width: '100%',
    gap: 16,
    marginTop: 8,
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
