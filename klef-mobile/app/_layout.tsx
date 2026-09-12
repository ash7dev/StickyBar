import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { useRoleStore } from '../shared/stores/role.store';
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
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );

  const hydrate = useAuthStore((s) => s.hydrate);
  const loadRole = useRoleStore((s) => s.loadRole);

  useEffect(() => {
    hydrate();
    loadRole();
  }, []);

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
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/otp-verify" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(tenant)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(owner)" options={{ animation: 'fade' }} />
            <Stack.Screen name="listing/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="hote/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="reservation/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="reserver" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

