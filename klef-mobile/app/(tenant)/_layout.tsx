import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSpaceWarmup } from '../../features/warmup/useSpaceWarmup';
import { TenantTopHeader } from '../../shared/components/layout/TenantTopHeader';
import { TenantFloatingTabBar } from '../../shared/components/layout/TenantFloatingTabBar';

export default function TenantTabsLayout() {
  useSpaceWarmup('tenant');
  return (
    <View style={styles.container}>
      <Tabs backBehavior="history"
        tabBar={(props) => <TenantFloatingTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: () => <TenantTopHeader />,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            // La fenêtre et le compte à rebours occupent tout l'écran : l'accueil a son propre en-tête
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="explorer"
          options={{
            title: 'Explorer',
            // Vidéos et carte en plein écran : Explorer a sa propre barre du haut
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="reservations"
          options={{
            title: 'Réservations',
            // « Vos séjours » a son propre titre éditorial
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
          }}
        />
        <Tabs.Screen
          name="listing/[id]"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

