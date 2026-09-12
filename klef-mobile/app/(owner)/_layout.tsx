import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { OwnerFloatingTabBar } from '../../shared/components/layout/OwnerFloatingTabBar';
import { OwnerTopHeader } from '../../shared/components/layout/OwnerTopHeader';

export default function OwnerTabsLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <OwnerFloatingTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: () => <OwnerTopHeader />,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Accueil',
          }}
        />

        <Tabs.Screen
          name="listings"
          options={{
            title: 'Biens',
          }}
        />

        <Tabs.Screen
          name="add-listing"
          options={{
            title: 'Ajouter',
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />

        <Tabs.Screen
          name="reservations"
          options={{
            title: 'Séjours',
          }}
        />

        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
          }}
        />

        <Tabs.Screen
          name="calendar"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="logements/[id]"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />

        <Tabs.Screen
          name="reservations/[id]"
          options={{
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />

        <Tabs.Screen
          name="stats"
          options={{
            title: 'Statistiques & Performance',
            href: null,
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Mon Profil & Compte Hôte',
            href: null,
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
