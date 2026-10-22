import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Building2, CalendarRange, Sun, User, Users } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';

const INK = colors.forest[950];

const TABS: Record<string, { label: string; Icon: typeof Sun }> = {
  index: { label: 'Aujourd’hui', Icon: Sun },
  sejours: { label: 'Séjours', Icon: CalendarRange },
  biens: { label: 'Biens', Icon: Building2 },
  proprietaires: { label: 'Propriétaires', Icon: Users },
  profile: { label: 'Profil', Icon: User },
};

/** Barre d'onglets de l'espace gestionnaire : sombre, pour le distinguer d'un coup d'œil de l'espace hôte. */
export function ManagerTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index];
  if (descriptors[current?.key]?.options?.tabBarStyle?.display === 'none') return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12) }]}>
      <View style={styles.bar}>
        {state.routes
          .filter((route: any) => TABS[route.name] && descriptors[route.key]?.options?.href !== null)
          .map((route: any) => {
            const focused = state.routes[state.index]?.key === route.key;
            const { label, Icon } = TABS[route.name];
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
              >
                <View style={[styles.pill, focused && styles.pillOn]}>
                  <Icon size={19} color={focused ? INK : 'rgba(248,251,244,0.6)'} strokeWidth={focused ? 2.4 : 1.8} />
                </View>
                <Text numberOfLines={1} style={[styles.label, focused && styles.labelOn]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 66,
    paddingHorizontal: 4,
    borderRadius: 26,
    backgroundColor: INK,
    shadowColor: INK,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.lime[400] },
  label: { fontFamily: typography.fontBodySemiBold, fontSize: 10, color: 'rgba(248,251,244,0.6)' },
  labelOn: { fontFamily: typography.fontBodyBold, color: '#FFFFFF' },
});
