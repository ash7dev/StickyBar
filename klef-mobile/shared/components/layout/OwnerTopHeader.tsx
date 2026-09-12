import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { User, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../features/auth/stores/auth.store';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { useGatedAction } from '../../hooks/useGatedAction';
import { TenantActionGateModal } from '../gate/TenantActionGateModal';

export function OwnerTopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const goToAddListing = React.useCallback(() => {
    router.push('/(owner)/add-listing' as any);
  }, [router]);

  const {
    gateState,
    trigger: triggerGate,
    complete: completeGate,
    cancel: cancelGate,
  } = useGatedAction(goToAddListing);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 18 ? 'Bonjour' : 'Bonsoir';
  const userFirstName = user?.prenom || 'Hôte';

  const initials = user?.prenom
    ? `${user.prenom[0]}${user.nom ? user.nom[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : null;

  // Determine active route
  const isListings = pathname.includes('listings');
  const isReservations = pathname.includes('reservations');
  const isWallet = pathname.includes('wallet');
  const isCalendar = pathname.includes('calendar');
  const isProfile = pathname.includes('profile');

  let eyebrow: string | null = 'DASHBOARD';
  let title = `${greeting}, ${userFirstName} 👋`;
  let subtitle = 'Aperçu de votre activité en direct';
  let showAddBtn = false;

  if (isListings) {
    eyebrow = 'PROPRIÉTÉS';
    title = 'Mes annonces';
    subtitle = 'Gérez vos biens et leurs disponibilités';
    showAddBtn = true;
  } else if (isReservations) {
    eyebrow = 'RÉSERVATIONS';
    title = 'Séjours & Réservations';
    subtitle = 'Suivez vos arrivées, départs et demandes';
  } else if (isWallet) {
    eyebrow = 'FINANCES';
    title = 'Portefeuille & Revenus';
    subtitle = 'Gérez vos gains, solde et virements';
  } else if (isCalendar) {
    eyebrow = 'PLANNING';
    title = 'Calendrier & Tarifs';
    subtitle = 'Ajustez vos tarifs et vos indisponibilités';
  } else if (isProfile) {
    eyebrow = 'COMPTE';
    title = 'Profil & Paramètres';
    subtitle = 'Gérez vos informations, KYC et préférences';
  }

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerGate();
  };

  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/profile' as any);
  };

  return (
    <View
      style={[
        styles.headerContainer,
        { paddingTop: Math.max(insets.top + 6, Platform.OS === 'ios' ? 50 : 16) },
      ]}
    >
      <View style={styles.headerContent}>
        {/* ── Left Stack: Eyebrow + Dynamic Screen Title + Subtitle ──── */}
        <View style={styles.titleStack}>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        {/* ── Right Actions ────────────────────────────────────────── */}
        <View style={styles.actionsRight}>
          {showAddBtn ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddPress}
              style={styles.addBtn}
            >
              <Plus size={15} color={colors.forest[950]} strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Ajouter</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleProfilePress}
              style={styles.avatarButton}
            >
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {initials ? (
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  ) : (
                    <User size={16} color={colors.forest[900]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
  headerContainer: {
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleStack: {
    flex: 1,
    paddingRight: 14,
  },
  eyebrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: colors.forest[950],
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    marginTop: 2,
    lineHeight: 16,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  addBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  avatarButton: {
    padding: 2,
  },
  avatarRing: {
    padding: 1.5,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[600],
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontFamily: typography.fontBodyBold,
    color: colors.forest[900],
  },
});
