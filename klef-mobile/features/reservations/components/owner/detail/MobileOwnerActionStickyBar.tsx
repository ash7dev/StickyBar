import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Camera,
  Star,
  MoreHorizontal,
  ShieldAlert,
  Lock,
  Clock,
  XCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerActionStickyBarProps {
  reservation: ReservationDetail;
  onPrimaryAction: () => void;
  onOpenActionSheet: () => void;
  loading?: boolean;
}

const CHECKIN_GUARD_MS = 4 * 60 * 60 * 1000; // 4h

// États translucides neutres (désactivé / en attente) centralisés au lieu
// d'être répétés en dur à chaque case du switch.
const NEUTRAL_DISABLED_BG = 'rgba(255, 255, 255, 0.12)';
const NEUTRAL_SUBTLE_BG = 'rgba(255, 255, 255, 0.1)';
// Accent ambre réservé au litige : pas un token de marque, gardé local et
// nommé pour rester cohérent avec les autres composants de cet écran.
const DISPUTED_ACCENT = { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24' };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function MobileOwnerActionStickyBar({
  reservation,
  onPrimaryAction,
  onOpenActionSheet,
  loading = false,
}: MobileOwnerActionStickyBarProps) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState<number>(() => Date.now());

  // Horloge vivante pour mise à jour dynamique de la fenêtre de check-in / check-out
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { statut, dateDebut, dateFin, photosEtatLieu, checkinProprioLe, checkoutProprioLe } =
    reservation;

  const debutMs = new Date(dateDebut).getTime();
  const finMs = new Date(dateFin).getTime();

  const checkinWindowStart = debutMs - CHECKIN_GUARD_MS;
  const canStartCheckin = now >= checkinWindowStart;
  const hoursUntilCheckin = Math.max(1, Math.ceil((checkinWindowStart - now) / 3600000));

  const checkoutWindowStart = finMs - CHECKIN_GUARD_MS;
  const canStartCheckout = now >= checkoutWindowStart;
  const hoursUntilCheckout = Math.max(1, Math.ceil((checkoutWindowStart - now) / 3600000));

  const isKycVerified =
    (reservation.locataire as any)?.statutKyc === 'VERIFIE' ||
    reservation.locataire?.estVerifie === true;

  const photosList = photosEtatLieu || [];
  const checkinPhotos = photosList.filter(
    (p) => p.type === 'ENTREE' || (p as any).type === 'CHECKIN',
  );
  const checkoutPhotos = photosList.filter(
    (p) => p.type === 'SORTIE' || (p as any).type === 'CHECKOUT',
  );

  // Configuration du CTA principal selon les règles d'étapes
  const getPrimaryCtaConfig = () => {
    switch (statut) {
      case 'PENDING':
        return {
          label: 'En attente de paiement',
          icon: Clock,
          bgColor: NEUTRAL_SUBTLE_BG,
          textColor: colors.neutral[300],
          disabled: true,
        };

      case 'PAID':
        if (!isKycVerified) {
          return {
            label: 'Confirmer (KYC en attente)',
            icon: Lock,
            bgColor: NEUTRAL_DISABLED_BG,
            textColor: colors.neutral[300],
            disabled: true,
          };
        }
        return {
          label: 'Confirmer la réservation',
          icon: CheckCircle2,
          bgColor: colors.lime[400],
          textColor: colors.forest[950],
          disabled: false,
        };

      case 'CONFIRMED':
        if (checkinProprioLe) {
          return {
            label: 'Attente validation locataire',
            icon: Clock,
            bgColor: NEUTRAL_DISABLED_BG,
            textColor: colors.neutral[300],
            disabled: true,
          };
        }
        if (checkinPhotos.length > 0) {
          return {
            label: 'Confirmer le check-in',
            icon: CheckCircle2,
            bgColor: colors.lime[400],
            textColor: colors.forest[950],
            disabled: false,
          };
        }
        if (canStartCheckin) {
          return {
            label: 'Démarrer le check-in',
            icon: Camera,
            bgColor: colors.lime[400],
            textColor: colors.forest[950],
            disabled: false,
          };
        }
        return {
          label: `Check-in dans ${hoursUntilCheckin} h`,
          icon: Lock,
          bgColor: NEUTRAL_DISABLED_BG,
          textColor: colors.neutral[300],
          disabled: true,
        };

      case 'CHECKED_IN':
        if (canStartCheckout) {
          if (checkoutProprioLe || checkoutPhotos.length > 0) {
            return {
              label: 'Clôturer la réservation',
              icon: CheckCircle2,
              bgColor: colors.lime[400],
              textColor: colors.forest[950],
              disabled: false,
            };
          }
          return {
            label: 'Démarrer le check-out',
            icon: Camera,
            bgColor: colors.lime[400],
            textColor: colors.forest[950],
            disabled: false,
          };
        }
        return {
          label: `Check-out dans ${hoursUntilCheckout} h`,
          icon: Lock,
          bgColor: NEUTRAL_DISABLED_BG,
          textColor: colors.neutral[300],
          disabled: true,
        };

      case 'COMPLETED':
        return {
          label: reservation.avisDonneProprio ? 'Avis publié ✓' : 'Noter le locataire',
          icon: Star,
          bgColor: reservation.avisDonneProprio ? NEUTRAL_SUBTLE_BG : colors.lime[400],
          textColor: reservation.avisDonneProprio ? colors.neutral[300] : colors.forest[950],
          disabled: !!reservation.avisDonneProprio,
        };

      case 'DISPUTED':
        return {
          label: 'Litige en cours',
          icon: ShieldAlert,
          bgColor: DISPUTED_ACCENT.bg,
          textColor: DISPUTED_ACCENT.text,
          disabled: true,
        };

      case 'CANCELLED':
      case 'EXPIRED':
        return {
          label: 'Réservation terminée',
          icon: XCircle,
          bgColor: NEUTRAL_SUBTLE_BG,
          textColor: colors.neutral[400],
          disabled: true,
        };

      default:
        return {
          label: 'Actions disponibles',
          icon: CheckCircle2,
          bgColor: colors.forest[800],
          textColor: colors.neutral[0],
          disabled: false,
        };
    }
  };

  const ctaConfig = getPrimaryCtaConfig();
  const IconComponent = ctaConfig.icon;

  // Anime la barre quand le libellé/état du CTA change de taille, au lieu
  // de la laisser sauter d'un état à l'autre.
  const prevLabelRef = useRef(ctaConfig.label);
  useEffect(() => {
    if (prevLabelRef.current !== ctaConfig.label) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      prevLabelRef.current = ctaConfig.label;
    }
  }, [ctaConfig.label]);

  const handlePrimaryPress = () => {
    if (ctaConfig.disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    onPrimaryAction();
  };

  const handleMorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    onOpenActionSheet();
  };

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.contentRow}>
        <PressableScale
          onPress={handlePrimaryPress}
          disabled={loading || ctaConfig.disabled}
          style={[
            styles.primaryButton,
            { backgroundColor: ctaConfig.bgColor },
            (loading || ctaConfig.disabled) && styles.disabledButton,
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaConfig.label}
          accessibilityState={{ disabled: loading || ctaConfig.disabled, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={ctaConfig.textColor} />
          ) : (
            <IconComponent size={18} color={ctaConfig.textColor} />
          )}
          <Text
            style={[styles.primaryButtonText, { color: ctaConfig.textColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {ctaConfig.label}
          </Text>
        </PressableScale>

        <PressableScale
          onPress={handleMorePress}
          style={styles.moreButton}
          accessibilityRole="button"
          accessibilityLabel="Toutes les actions et litiges"
        >
          <MoreHorizontal size={20} color={colors.neutral[0]} />
        </PressableScale>
      </View>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable avec un léger retour d'échelle au toucher — remplace
 * TouchableOpacity (simple fondu) pour un rendu plus tactile/moderne,
 * sans dépendance à une lib d'animation externe. */
function PressableScale({
  onPress,
  disabled,
  style,
  children,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
}: {
  onPress: () => void;
  disabled?: boolean;
  style: any;
  children: React.ReactNode;
  accessibilityRole?: 'button';
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean };
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      style={[style, { transform: [{ scale }] }]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.forest[950],
    borderRadius: 24,
    padding: 8,
    ...shadows.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
  },
  moreButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: NEUTRAL_SUBTLE_BG,
    borderWidth: 1,
    borderColor: NEUTRAL_DISABLED_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
});