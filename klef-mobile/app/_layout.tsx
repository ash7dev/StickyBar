import React, { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { persistOptions, queryClient } from '../shared/api/query-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { useRoleStore } from '../shared/stores/role.store';
import { ErrorBoundary } from '../shared/components/layout/ErrorBoundary';
import { usePushNotifications } from '../shared/hooks/usePushNotifications';
import {
  useFonts,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// Empêcher la fermeture automatique du Splash Screen natif
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  usePushNotifications();

  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const hydrate = useAuthStore((s) => s.hydrate);
  const loadRole = useRoleStore((s) => s.loadRole);

  useEffect(() => {
    hydrate();
    loadRole();
  }, []);

  // L'espace affiché fait foi : en espace voyageur on est voyageur, en espace hôte on est hôte.
  // Plus aucun écran ne demande de « basculer » après coup (le rôle part dans X-Active-Role).
  const segments = useSegments();
  const space = segments[0];
  const activeRole = useRoleStore((s) => s.activeRole);
  const setActiveRole = useRoleStore((s) => s.setActiveRole);
  useEffect(() => {
    const expected = space === '(tenant)' ? 'LOCATAIRE' : space === '(owner)' ? 'PROPRIETAIRE' : space === '(manager)' ? 'GESTIONNAIRE' : null;
    if (expected && activeRole !== expected) setActiveRole(expected);
  }, [space, activeRole, setActiveRole]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 250 }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)/login" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="(auth)/otp-verify" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(auth)/register" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="(tenant)" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="(owner)" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="(manager)" options={{ animation: 'fade', gestureEnabled: false }} />
              <Stack.Screen name="listing/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="hote/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="reservation/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="reserver" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="favoris" options={{ headerShown: false }} />
              <Stack.Screen name="assistance" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="support/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="teranga-club" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="cgu" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="politique-confidentialite" options={{ headerShown: false, animation: 'slide_from_right' }} />
            </Stack>
          </PersistQueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

