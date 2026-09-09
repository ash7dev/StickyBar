import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, Building2, Plus, CalendarDays, Wallet } from 'lucide-react-native';
import { colors, radius, shadows } from '../../shared/theme/tokens';

export default function OwnerTabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.lime[300],
        tabBarInactiveTintColor: colors.forest[300],
        tabBarStyle: {
          backgroundColor: colors.forest[950],
          borderTopColor: colors.border.inverse,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size || 22} />,
        }}
      />

      <Tabs.Screen
        name="listings"
        options={{
          title: 'Biens',
          tabBarIcon: ({ color, size }) => <Building2 color={color} size={size || 22} />,
        }}
      />

      {/* Bouton Central FAB (+) Ajouter un bien */}
      <Tabs.Screen
        name="add-listing"
        options={{
          title: 'Ajouter',
          tabBarButton: (props) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/(owner)/listings/new' as any)}
              style={styles.fabContainer}
            >
              <View style={styles.fabInner}>
                <Plus size={24} color={colors.lime[400]} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Séjours',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size || 22} />,
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size || 22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  fabInner: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[900],
    borderWidth: 1.5,
    borderColor: colors.action.edge,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.action,
  },
});
