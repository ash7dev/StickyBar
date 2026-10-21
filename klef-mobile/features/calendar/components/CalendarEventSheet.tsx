import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Lock, Moon, Users } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { AppButton } from '../../../shared/components/ui/AppButton';
import type { OwnerCalendarEvent, OwnerCalendarLogement } from '../types';
import { diffDays, formatLong, todayDay } from '../lib/days';
import { STATUS_STYLES, eventLabel, eventStatus } from '../lib/event-styles';
import { apiErrorMessage, useDeleteCalendarBlock } from '../hooks/useOwnerCalendar';
import { BottomSheet } from './BottomSheet';

const formatFCFA = (amount: number) => `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;

interface CalendarEventSheetProps {
  event: OwnerCalendarEvent;
  logement: OwnerCalendarLogement | undefined;
  onClose: () => void;
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

/** Détail d'un séjour ou d'un blocage tapé sur le calendrier. */
export function CalendarEventSheet({ event, logement, onClose }: CalendarEventSheetProps) {
  const router = useRouter();
  const deleteBlock = useDeleteCalendarBlock();

  const status = STATUS_STYLES[eventStatus(event)];
  const nights = diffDays(event.start, event.end);
  const isReservation = event.kind === 'RESERVATION';
  const isPast = event.end <= todayDay();

  const openReservation = () => {
    onClose();
    router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id: event.id } });
  };

  const confirmUnblock = () => {
    Alert.alert('Débloquer ces dates ?', 'Les voyageurs pourront de nouveau réserver ces nuits.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Débloquer',
        style: 'destructive',
        onPress: () =>
          deleteBlock.mutate(event.id, {
            onSuccess: onClose,
            onError: (error) =>
              Alert.alert('Erreur', apiErrorMessage(error, 'Impossible de débloquer ces dates.')),
          }),
      },
    ]);
  };

  const iconColor = colors.neutral[500];

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={isReservation ? eventLabel(event) : 'Dates bloquées'}
      subtitle={logement?.titre}
      icon={
        isReservation ? (
          <CalendarDays size={18} color={colors.forest[700]} />
        ) : (
          <Lock size={18} color={colors.forest[700]} />
        )
      }
      footer={
        isReservation ? (
          <AppButton fullWidth size="lg" variant="primary" label="Ouvrir la réservation" onPress={openReservation} />
        ) : isPast ? null : (
          <AppButton
            fullWidth
            size="lg"
            variant="ghost"
            label="Débloquer ces dates"
            loading={deleteBlock.isPending}
            onPress={confirmUnblock}
          />
        )
      }
    >
      <View style={[styles.badge, { backgroundColor: status.background, borderColor: status.border ?? status.background }]}>
        <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
      </View>

      <View style={styles.rows}>
        <Row
          icon={<CalendarDays size={16} color={iconColor} />}
          label={isReservation ? 'Arrivée' : 'Premier jour bloqué'}
          value={formatLong(event.start)}
        />
        <Row
          icon={<CalendarDays size={16} color={iconColor} />}
          label={isReservation ? 'Départ' : 'Disponible à nouveau le'}
          value={formatLong(event.end)}
        />
        <Row
          icon={<Moon size={16} color={iconColor} />}
          label="Durée"
          value={`${nights} nuit${nights > 1 ? 's' : ''}`}
        />
        {isReservation ? (
          <Row
            icon={<Users size={16} color={iconColor} />}
            label="Voyageurs"
            value={`${event.nbPersonnes} personne${event.nbPersonnes > 1 ? 's' : ''}`}
          />
        ) : event.motif ? (
          <Row icon={<Lock size={16} color={iconColor} />} label="Motif" value={event.motif} />
        ) : null}
      </View>

      {isReservation && (
        <View style={styles.net}>
          <Text style={styles.netLabel}>Votre revenu net</Text>
          <Text style={styles.netValue}>{formatFCFA(event.netProprietaire)}</Text>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: { fontFamily: typography.fontBodySemiBold, fontSize: 12 },
  rows: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: typography.fontBody, fontSize: 11.5, color: colors.neutral[600] },
  rowValue: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[900] },
  net: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  netValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.forest[950] },
});
