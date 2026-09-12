import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Home,
  Compass,
  CalendarDays,
  Settings,
  User,
  Map,
  List,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { useAuthStore } from '../../../features/auth/stores/auth.store';
import { useExplorerViewStore } from '../../stores/explorer-view.store';

export function TenantFloatingTabBar({ state, descriptors, navigation }: any) {

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const { viewMode: explorerView, toggleViewMode } = useExplorerViewStore();

  const currentRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[currentRoute?.key];
  const tabBarStyle = focusedDescriptor?.options?.tabBarStyle;

  const isExplorer = currentRoute?.name === 'explorer';
  const isListingDetail =
    currentRoute?.name?.includes('listing/') || currentRoute?.name === 'listing/[id]';
  const isReservationDetail =
    currentRoute?.name?.includes('reservation/') || currentRoute?.name === 'reservation/[id]';
  const isReserver =
    currentRoute?.name === 'reserver' || currentRoute?.name?.includes('reserver');
  const isTerangaClub =
    currentRoute?.name === 'teranga-club' || currentRoute?.name?.includes('teranga');

  if (
    tabBarStyle?.display === 'none' ||
    isListingDetail ||
    isReservationDetail ||
    isReserver ||
    isTerangaClub
  ) {
    return null;
  }

  const handleTabPress = (route: { key: string; name: string }, isFocused: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };


  const toggleExplorerView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleViewMode();
  };

  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options?.href !== null && !route.name.includes('listing');
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingWrapper,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12) },
      ]}
    >
      {/* ── Floating Action Bar (Carte/Liste pour Explorer) ─────────── */}
      {isExplorer && (
        <View pointerEvents="box-none" style={styles.topRowActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleExplorerView}
            style={styles.actionBtnDark}
          >
            {explorerView === 'list' ? (
              <>
                <Map size={15} color={colors.lime[400]} />
                <Text style={styles.actionBtnDarkText}>Carte</Text>
              </>
            ) : (
              <>
                <List size={15} color={colors.lime[400]} />
                <Text numberOfLines={1} style={styles.actionBtnDarkText}>Liste</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Floating Bottom Navigation Card ──────────────────────── */}
      <View style={styles.floatingNavCard}>
        {visibleRoutes.map((route: any) => {
          const index = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === index;

          let IconComponent = Home;
          let label = 'Accueil';

          if (route.name === 'index') {
            IconComponent = Home;
            label = 'Accueil';
          } else if (route.name === 'explorer') {
            IconComponent = Compass;
            label = 'Explorer';
          } else if (route.name === 'reservations') {
            IconComponent = CalendarDays;
            label = 'Réservations';
          } else if (route.name === 'profile') {
            IconComponent = User;
            label = 'Profil';
          }

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={() => handleTabPress(route, isFocused)}
              style={styles.tabItem}
            >
              {/* Material 3 Active Pill */}
              <View
                style={[
                  styles.tabIconPill,
                  isFocused && styles.tabIconPillActive,
                ]}
              >
                <IconComponent
                  size={20}
                  color={isFocused ? colors.forest[800] : colors.neutral[500]}
                  strokeWidth={isFocused ? 2.4 : 1.8}
                />
              </View>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
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
  floatingWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
    gap: 8,
  },

  // Top Action Row
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  actionBtnDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.float,
  },
  actionBtnDarkText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.neutral[0],
  },

  actionBtnLime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  actionBtnLimeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.forest[900],
  },

  // Floating Nav Card
  floatingNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 6,
    ...shadows.float,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  tabIconPill: {
    width: 44,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPillActive: {
    backgroundColor: 'rgba(211, 242, 110, 0.40)',
  },

  tabLabel: {
    fontSize: 10,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: colors.forest[800],
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: colors.neutral[600],
  },
});
