import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { TenantTopHeader } from '../../shared/components/layout/TenantTopHeader';
import { TenantFloatingTabBar } from '../../shared/components/layout/TenantFloatingTabBar';

export default function TenantTabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
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
          }}
        />
        <Tabs.Screen
          name="explorer"
          options={{
            title: 'Explorer',
          }}
        />
        <Tabs.Screen
          name="reservations"
          options={{
            title: 'Réservations',
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

