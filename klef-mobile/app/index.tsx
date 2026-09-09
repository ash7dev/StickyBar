import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { useRoleStore } from '../shared/stores/role.store';

export default function IndexScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated, hasSeenOnboarding } = useAuthStore();
  const activeRole = useRoleStore((s) => s.activeRole);

  useEffect(() => {
    if (isLoading) return;

    // Décision de routage de démarrage
    if (!hasSeenOnboarding) {
      router.replace('/(auth)/onboarding');
    } else if (isAuthenticated) {
      if (activeRole === 'PROPRIETAIRE' || activeRole === 'GESTIONNAIRE') {
        router.replace('/(owner)/dashboard' as any);
      } else {
        router.replace('/(tenant)');
      }
    } else {
      // Accès direct en Mode Invité (Guest-First Airbnb Style)
      router.replace('/(tenant)');
    }

    // Extinction du Splash Screen natif une fois la navigation prête
    SplashScreen.hideAsync().catch(() => {});
  }, [isLoading, isAuthenticated, hasSeenOnboarding, activeRole]);

  return null;
}
