import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2, Sparkles, XCircle, AlertCircle, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    glowColor: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
    shouldPulse?: boolean;
  }
> = {
  PENDING: { label: 'En attente', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', glowColor: 'rgba(253, 230, 138, 0.4)', Icon: Clock, shouldPulse: true },
  PAID: { label: 'Sous séquestre', bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', glowColor: 'rgba(167, 243, 208, 0.35)', Icon: ShieldCheck },
  CONFIRMED: { label: 'Confirmée', bg: '#D1FAE5', text: '#065F46', border: '#34D399', glowColor: 'rgba(52, 211, 153, 0.3)', Icon: CheckCircle2 },
  CHECKED_IN: { label: 'Séjour en cours', bg: 'rgba(211, 242, 110, 0.2)', text: colors.forest[800], border: colors.lime[400], glowColor: 'rgba(211, 242, 110, 0.35)', Icon: Sparkles, shouldPulse: true },
  COMPLETED: { label: 'Terminée', bg: '#F1F5F9', text: '#334155', border: '#E2E8F0', glowColor: 'rgba(226, 232, 240, 0.3)', Icon: CheckCircle2 },
  CANCELLED: { label: 'Annulée', bg: '#FFE4E6', text: '#9F1239', border: '#FECDD3', glowColor: 'rgba(254, 205, 211, 0.3)', Icon: XCircle },
  DISPUTED: { label: 'Litige', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', glowColor: 'rgba(252, 165, 165, 0.35)', Icon: AlertCircle, shouldPulse: true },
  EXPIRED: { label: 'Expirée', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', glowColor: 'rgba(229, 231, 235, 0.3)', Icon: Clock },
};

interface MobileDetailTopBarProps {
  id: string;
  statut?: string;
  onBack?: () => void;
}

export function MobileDetailTopBar({ id, statut = 'PENDING', onBack }: MobileDetailTopBarProps) {
  const cfg = STATUS_CONFIG[statut] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.Icon;

  // Subtle pulse animation for active statuses
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (cfg.shouldPulse) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [cfg.shouldPulse]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onBack) {
      onBack();
    } else {
      router.navigate('/(tenant)/reservations');
    }
  };

  return (
    <View style={styles.topBar}>
      {/* Back button with forest depth */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handleBack}
        style={styles.backButton}
      >
        <ArrowLeft size={18} color={colors.forest[950]} strokeWidth={2.4} />
      </TouchableOpacity>

      <View style={styles.rightGroup}>
        {/* Status Badge with optional glow */}
        <View style={styles.statusBadgeWrapper}>
          {cfg.shouldPulse && (
            <Animated.View
              style={[
                styles.statusGlow,
                { backgroundColor: cfg.glowColor, opacity: pulseAnim },
              ]}
            />
          )}
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <StatusIcon size={12} color={cfg.text} />
            <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1.2,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  statusBadgeWrapper: {
    position: 'relative',
  },
  statusGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.pill,
    transform: [{ scale: 1.25 }],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.2,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    letterSpacing: 0.1,
  },

  refPill: {
    backgroundColor: colors.forest[950],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  refText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10,
    color: colors.forest[300],
    letterSpacing: 0.6,
  },
});
