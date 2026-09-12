import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LayoutDashboard,
  Building2,
  Plus,
  CalendarDays,
  Wallet,
  Repeat,
  X,
  ShieldAlert,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { useSwitchRole } from '../../../features/auth/hooks/useSwitchRole';
import { useGatedAction } from '../../hooks/useGatedAction';
import { TenantActionGateModal } from '../gate/TenantActionGateModal';

export function OwnerFloatingTabBar({ state, descriptors, navigation }: any) {
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute?.key];
  const tabBarStyle = focusedDescriptor?.options?.tabBarStyle;
  const currentRoute = focusedRoute?.name;

  if (
    tabBarStyle?.display === 'none' ||
    currentRoute === 'add-listing' ||
    currentRoute === 'reservations/[id]' ||
    currentRoute === 'stats' ||
    currentRoute?.includes('reservations/') ||
    currentRoute?.includes('logements/') ||
    currentRoute?.includes('stats')
  ) {
    return null;
  }

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { switchRole, isSwitching, error } = useSwitchRole();
  const [modalVisible, setModalVisible] = useState(false);

  const goToAddListing = React.useCallback(() => {
    router.push('/(owner)/add-listing' as any);
  }, [router]);

  const {
    gateState,
    trigger: triggerGate,
    complete: completeGate,
    cancel: cancelGate,
  } = useGatedAction(goToAddListing);

  const handleTabPress = (route: { key: string; name: string }, isFocused: boolean) => {
    Haptics.selectionAsync().catch(() => {});

    if (route.name === 'add-listing') {
      triggerGate();
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleOpenSwitchModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setModalVisible(true);
  };

  const handleConfirmSwitch = async () => {
    const success = await switchRole('LOCATAIRE');
    if (success) {
      setModalVisible(false);
    }
  };

  const ALLOWED_TABS = ['dashboard', 'listings', 'add-listing', 'reservations', 'wallet'];

  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    return options?.href !== null && ALLOWED_TABS.includes(route.name);
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingWrapper,
        { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 12) },
      ]}
    >
      {/* ── Top Row Action: Bouton Lime de Bascule Mode Voyageur (en haut à droite du TabBar) ── */}
      <View pointerEvents="box-none" style={styles.topRowActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenSwitchModal}
          style={styles.switchRoleLimeBtn}
        >
          <Repeat size={14} color={colors.forest[950]} />
          <Text style={styles.switchRoleLimeBtnText}>Mode Voyageur</Text>
        </TouchableOpacity>
      </View>

      {/* ── Floating Nav Card ───────────────────────────────────────────────────────────────── */}
      <View style={styles.floatingNavCard}>
        {visibleRoutes.map((route: any) => {
          const index = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === index;
          const isFab = route.name === 'add-listing';

          if (isFab) {
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.85}
                onPress={() => handleTabPress(route, isFocused)}
                style={styles.fabItem}
              >
                <View style={styles.fabInner}>
                  <Plus size={22} color={colors.lime[400]} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          let IconComponent = LayoutDashboard;
          let label = 'Accueil';

          if (route.name === 'dashboard') {
            IconComponent = LayoutDashboard;
            label = 'Accueil';
          } else if (route.name === 'listings') {
            IconComponent = Building2;
            label = 'Biens';
          } else if (route.name === 'reservations') {
            IconComponent = CalendarDays;
            label = 'Séjours';
          } else if (route.name === 'wallet') {
            IconComponent = Wallet;
            label = 'Wallet';
          }

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.7}
              onPress={() => handleTabPress(route, isFocused)}
              style={styles.tabItem}
            >
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

      {/* ── Modale Centrée de Confirmation ──────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSwitching && setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSwitching && setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.alertIconCircle}>
                <Repeat size={16} color={colors.forest[800]} />
              </View>
              <Text style={styles.modalCardTitle} numberOfLines={1}>
                Passer en mode Voyageur ?
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isSwitching}
                style={styles.closeBtn}
              >
                <X size={16} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.formStack}>
              <Text style={styles.modalDesc}>
                Basculer vers l’espace Voyageur pour explorer et réserver des logements.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <ShieldAlert size={14} color={colors.error[700]} />
                  <Text style={styles.errorBoxText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmSwitch}
                disabled={isSwitching}
                style={styles.confirmBtn}
              >
                {isSwitching ? (
                  <ActivityIndicator color={colors.forest[950]} />
                ) : (
                  <>
                    <Repeat size={15} color={colors.forest[950]} />
                    <Text style={styles.confirmBtnText} numberOfLines={1}>
                      Confirmer et basculer
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(false)}
                disabled={isSwitching}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText} numberOfLines={1}>
                  Rester en mode Hôte
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Action Gate Modal (Profil, Téléphone, KYC) */}
      <TenantActionGateModal
        visible={gateState.open}
        steps={gateState.steps}
        block={gateState.block}
        onComplete={completeGate}
        onCancel={cancelGate}
      />
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
  topRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
  },
  switchRoleLimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  switchRoleLimeBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.forest[950],
  },

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
  fabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  fabInner: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    borderWidth: 1.5,
    borderColor: colors.action.edge,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.action,
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

  // Modale Centrée
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.float,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  alertIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  formStack: {
    gap: 12,
  },
  modalDesc: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorBoxText: {
    fontSize: 11,
    color: colors.error[700],
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  confirmBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[600],
  },
});
