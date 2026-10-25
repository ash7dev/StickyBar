import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSpaceWarmup } from '../../features/warmup/useSpaceWarmup';
import { colors } from '../../shared/theme/tokens';
import { ManagerTabBar } from '../../features/manager/components/ManagerTabBar';

/** Espace gestionnaire : le terrain (journée, séjours, biens, propriétaires). Le reste se fait sur le web. */
export default function ManagerTabsLayout() {
  useSpaceWarmup('manager');
  return (
    <View style={styles.container}>
      <Tabs backBehavior="history" tabBar={(props) => <ManagerTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
        <Tabs.Screen name="sejours" options={{ title: 'Séjours' }} />
        <Tabs.Screen name="biens" options={{ title: 'Biens' }} />
        <Tabs.Screen name="proprietaires" options={{ title: 'Propriétaires' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="sejour/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="nouveau-bien" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="add-listing" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="calendrier" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="proprietaire/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
});
