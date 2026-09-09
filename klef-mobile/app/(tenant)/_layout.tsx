import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Compass, CalendarDays, Settings } from 'lucide-react-native';
import { colors } from '../../shared/theme/tokens';

export default function TenantTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest[800],
        tabBarInactiveTintColor: colors.neutral[600],
        tabBarStyle: {
          backgroundColor: colors.neutral[0],
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size || 22} />,
        }}
      />
      <Tabs.Screen
        name="explorer"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size || 22} />,
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size || 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size || 22} />,
        }}
      />
    </Tabs>
  );
}
