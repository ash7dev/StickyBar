import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, Minus, Plus } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { BottomSheet } from '../../calendar/components/BottomSheet';
import { AppDateRangeCalendar, type DisabledDateItem } from '../../../shared/components/ui/AppDateRangeCalendar';
import { InfoNote, INK, PillButton, tap } from '../../reservations/tenant/components/ui';
import { formatAmount } from '../../owner-home/lib/format';
import { apiMessage, fromLocalISODate, nightsBetween, toLocalISODate, type PriceBreakdown } from '../lib/booking';

export interface StaySelection {
  start: string | null;
  end: string | null;
  guests: number;
}

/** Fenêtre « Vos dates » : calendrier, voyageurs et prix exact calculé par l'API. */
export function DatesSheet({
  visible,
  titre,
  value,
  onChange,
  minNights,
  maxGuests,
  includedGuests,
  disabledDates,
  price,
  priceLoading,
  priceError,
  onContinue,
  onClose,
}: {
  visible: boolean;
  titre: string;
  value: StaySelection;
  onChange: (v: StaySelection) => void;
  minNights: number;
  maxGuests: number;
  includedGuests: number;
  disabledDates: DisabledDateItem[];
  price?: PriceBreakdown;
  priceLoading: boolean;
  priceError: unknown;
  onContinue: () => void;
  onClose: () => void;
}) {
  const nights = nightsBetween(value.start, value.end);
  const tooShort = nights > 0 && nights < minNights;
  const ready = nights >= minNights && !!price && !priceError;

  const footer = (
    <View style={styles.footer}>
      <View style={styles.flex}>
        {priceLoading ? (
          <ActivityIndicator color={colors.forest[600]} style={{ alignSelf: 'flex-start' }} />
        ) : price && !priceError ? (
          <>
            <Text style={styles.total}>
              {formatAmount(price.totalLocataire)} <Text style={styles.cur}>FCFA</Text>
            </Text>
            <Text style={styles.sub}>
              {nights} nuit{nights > 1 ? 's' : ''} · frais de service inclus
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.totalMuted}>{nights ? 'Dates à ajuster' : 'Choisissez vos dates'}</Text>
            <Text style={styles.sub}>minimum {minNights} nuit{minNights > 1 ? 's' : ''}</Text>
          </>
        )}
      </View>
      <PillButton label="Continuer" flex={0} disabled={!ready} onPress={onContinue} />
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Vos dates" subtitle={`${titre} · minimum ${minNights} nuit${minNights > 1 ? 's' : ''}`} footer={footer}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: INK }]} />
          <Text style={styles.legendText}>Vos dates</Text>
        </View>
        <Text style={[styles.legendText, { textDecorationLine: 'line-through' }]}>27</Text>
        <Text style={[styles.legendText, { marginLeft: -6 }]}>Déjà pris</Text>
        {value.start ? (
          <TouchableOpacity onPress={() => onChange({ ...value, start: null, end: null })} style={{ marginLeft: 'auto' }} hitSlop={8}>
            <Text style={styles.clear}>Effacer</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <AppDateRangeCalendar
        value={{ from: value.start ? fromLocalISODate(value.start) : null, to: value.end ? fromLocalISODate(value.end) : null }}
        onChange={(range) =>
          onChange({ ...value, start: range.from ? toLocalISODate(range.from) : null, end: range.to ? toLocalISODate(range.to) : null })
        }
        minNights={minNights}
        disabledDates={disabledDates}
      />

      {(tooShort || (!!priceError && nights > 0)) && (
        <View style={{ marginTop: 12 }}>
          <InfoNote tone="red" icon={<AlertTriangle size={15} color={colors.error[700]} strokeWidth={2.2} />}>
            {tooShort
              ? `Ce logement demande ${minNights} nuits minimum (${nights} choisie${nights > 1 ? 's' : ''}).`
              : apiMessage(priceError, 'Ces dates ne sont pas disponibles.')}
          </InfoNote>
        </View>
      )}

      <View style={styles.guests}>
        <View style={styles.flex}>
          <Text style={styles.guestsTitle}>Voyageurs</Text>
          <Text style={styles.sub}>
            {maxGuests} maximum · tarif identique jusqu’à {includedGuests}
          </Text>
        </View>
        <Stepper icon="minus" disabled={value.guests <= 1} onPress={() => onChange({ ...value, guests: value.guests - 1 })} />
        <Text style={styles.guestsValue}>{value.guests}</Text>
        <Stepper icon="plus" disabled={value.guests >= maxGuests} onPress={() => onChange({ ...value, guests: value.guests + 1 })} />
      </View>
    </BottomSheet>
  );
}

function Stepper({ icon, disabled, onPress }: { icon: 'minus' | 'plus'; disabled: boolean; onPress: () => void }) {
  const Icon = icon === 'minus' ? Minus : Plus;
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled}
      style={[styles.stepper, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'minus' ? 'Un voyageur de moins' : 'Un voyageur de plus'}
    >
      <Icon size={16} color={INK} strokeWidth={2.4} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  total: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.4, color: INK },
  totalMuted: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.neutral[600] },
  cur: { fontFamily: typography.fontBodyMedium, fontSize: 13, color: colors.neutral[600] },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  clear: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK, textDecorationLine: 'underline' },
  guests: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200] },
  guestsTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  guestsValue: { width: 24, textAlign: 'center', fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  stepper: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
});
