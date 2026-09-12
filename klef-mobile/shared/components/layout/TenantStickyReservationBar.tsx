import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { TenantPriceDisplay } from '../ui/TenantPriceDisplay';

interface TenantStickyReservationBarProps {
  prixBase: number | string;
  nuitesMinimum?: number | null;
  derniereMinuteActive?: boolean;
  selectedNights?: number;
  selectedGuests?: number;
  onOpenModal: () => void;
}

export function TenantStickyReservationBar({
  prixBase,
  nuitesMinimum = 1,
  derniereMinuteActive = false,
  selectedNights = 0,
  selectedGuests = 1,
  onOpenModal,
}: TenantStickyReservationBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  const isNightsSelected = selectedNights > 0;
  const minNuits = nuitesMinimum ?? 1;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.barContainer}>
        {/* Prix & Résumé */}
        <View style={styles.priceInfo}>
          <TenantPriceDisplay
            prixBase={prixBase}
            derniereMinuteActive={derniereMinuteActive}
            size="sm"
            showBadge={false}
            isInverse={true}
          />
          <Text numberOfLines={1} style={styles.summaryText}>
            {isNightsSelected
              ? `${selectedNights} nuit${selectedNights > 1 ? 's' : ''} · ${selectedGuests} pers.`
              : `Min. ${minNuits} nuit${minNuits > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Bouton CTA Réserver */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onOpenModal}
          style={styles.reserveButton}
        >
          <Text style={styles.reserveButtonText}>Réserver</Text>
          <ChevronRight size={16} color={colors.forest[950]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(248, 251, 244, 0.85)',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadows.float,
  },
  priceInfo: {
    flex: 1,
    gap: 1,
  },
  summaryText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[200],
    marginTop: 1,
  },
  reserveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  reserveButtonText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
});
