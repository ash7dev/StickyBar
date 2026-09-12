import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Check, User, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../features/auth/stores/auth.store';
import {
  useCurrencyStore,
  SUPPORTED_CURRENCIES,
  CurrencyCode,
} from '../../stores/currency.store';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export function TenantTopHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { currencyInfo, setCurrency, hydrateCurrency } = useCurrencyStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    hydrateCurrency();
  }, []);

  const handleOpenCurrencyModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setModalVisible(true);
  };

  const handleSelectCurrency = (code: CurrencyCode) => {
    Haptics.selectionAsync().catch(() => {});
    setCurrency(code);
    setModalVisible(false);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isAuthenticated) {
      router.push('/(tenant)/profile' as any);
    } else {
      router.push('/(auth)/login' as any);
    }
  };

  const initials = user?.prenom
    ? `${user.prenom[0]}${user.nom ? user.nom[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : null;

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12) }]}>
      <View style={styles.headerContent}>
        {/* ── Left: Wordmark Logo klef. ───────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(tenant)' as any)}
          style={styles.logoButton}
        >

          <Text style={styles.logoTextMain}>
            klef<Text style={styles.logoTextDot}>.</Text>
          </Text>
        </TouchableOpacity>

        {/* ── Right: Currency Selector Pill + Profile Avatar ─────────── */}
        <View style={styles.actionsRight}>
          {/* Currency Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenCurrencyModal}
            style={styles.currencyPill}
          >
            <Text style={styles.currencyFlag}>{currencyInfo.flag}</Text>
            <Text style={styles.currencySymbol}>{currencyInfo.symbol}</Text>
            <ChevronDown size={12} color={colors.forest[600]} />
          </TouchableOpacity>

          {/* Profile / Avatar Trigger */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAvatarPress}
            style={styles.avatarButton}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {initials ? (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                ) : (
                  <User size={16} color={colors.forest[800]} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Currency Modal / Bottom Sheet ───────────────────────────── */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Devise d'affichage</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={18} color={colors.neutral[700]} />
              </TouchableOpacity>
            </View>

            <View style={styles.currencyList}>
              {SUPPORTED_CURRENCIES.map((item) => {
                const isSelected = item.code === currencyInfo.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCurrency(item.code)}
                    style={[
                      styles.currencyOption,
                      isSelected && styles.currencyOptionSelected,
                    ]}
                  >
                    <View style={styles.currencyOptionLeft}>
                      <Text style={styles.currencyOptionFlag}>{item.flag}</Text>
                      <View>
                        <Text style={styles.currencyOptionName}>{item.name}</Text>
                        <Text style={styles.currencyOptionCode}>
                          {item.code} • {item.symbol}
                        </Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <Check size={18} color={colors.forest[600]} strokeWidth={2.5} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },

  // Wordmark Logo klef.
  logoButton: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTextMain: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.forest[800],
    letterSpacing: -0.8,
  },
  logoTextDot: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.lime[600],
  },

  // Right Actions
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Currency Pill
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  currencyFlag: {
    fontSize: 14,
  },
  currencySymbol: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.forest[800],
  },

  // Avatar Button
  avatarButton: {
    padding: 2,
  },
  avatarRing: {
    padding: 1.5,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[600],
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.forest[900],
  },

  // Modal Overlay & Content
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  closeBtn: {
    padding: 4,
  },

  currencyList: {
    gap: 8,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  currencyOptionSelected: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[50],
  },
  currencyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyOptionFlag: {
    fontSize: 20,
  },
  currencyOptionName: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  currencyOptionCode: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    fontWeight: '500',
  },
});
