import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarClock, ChevronLeft, ChevronRight, Hourglass, Lock, LogIn, LogOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';
import { OwnerScreenHeader } from '../../features/calendar/components/OwnerScreenHeader';
import { CalendarEventSheet } from '../../features/calendar/components/CalendarEventSheet';
import { apiErrorMessage, useOwnerCalendar } from '../../features/calendar/hooks/useOwnerCalendar';
import { usePendingDecisions } from '../../features/calendar/hooks/usePendingDecisions';
import { buildAgenda, formatExpiry, type AgendaItem } from '../../features/calendar/lib/agenda';
import { addDays, diffDays, formatLong, formatShort, todayDay, type Day } from '../../features/calendar/lib/days';
import type { OwnerCalendarBlockEvent } from '../../features/calendar/types';

const WEEK = 7;

const ITEM_META: Record<AgendaItem['kind'], { label: string; accent: string; Icon: typeof LogIn }> = {
  DEPARTURE: { label: 'DÉPART', accent: colors.success[600], Icon: LogOut },
  ARRIVAL: { label: 'ARRIVÉE', accent: colors.forest[600], Icon: LogIn },
  BLOCK: { label: 'BLOQUÉ', accent: colors.neutral[500], Icon: Lock },
};

/** Vue C — ce qui se passe cette semaine, jour par jour, tous biens confondus. */
export default function OwnerTodayScreen() {
  const router = useRouter();
  const today = todayDay();
  const [from, setFrom] = useState<Day>(today);
  const to = addDays(from, WEEK);
  const [logementId, setLogementId] = useState<string | null>(null);
  const [openedBlock, setOpenedBlock] = useState<OwnerCalendarBlockEvent | null>(null);

  const calendar = useOwnerCalendar(from, to);
  const decisions = usePendingDecisions();

  const logements = useMemo(() => calendar.data?.logements ?? [], [calendar.data]);
  const agenda = useMemo(
    () => buildAgenda(calendar.data?.events ?? [], from, to, logementId),
    [calendar.data, from, to, logementId],
  );
  const pending = useMemo(
    () => (decisions.data ?? []).filter((d) => !logementId || d.logementId === logementId),
    [decisions.data, logementId],
  );

  const isRefetching = calendar.isRefetching || decisions.isRefetching;
  const refetchAll = () => Promise.all([calendar.refetch(), decisions.refetch()]);

  const openReservation = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push({ pathname: '/(owner)/reservations/[id]' as never, params: { id } });
  };

  const shiftWeek = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setFrom((f) => addDays(f, delta));
  };

  const titleFor = (day: Day) => {
    if (day === today) return `AUJOURD’HUI · ${formatLong(day).toUpperCase()}`;
    if (day === addDays(today, 1)) return `DEMAIN · ${formatLong(day).toUpperCase()}`;
    return formatLong(day).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchAll}
            tintColor={colors.forest[600]}
            colors={[colors.forest[600]]}
          />
        }
      >
        <OwnerScreenHeader title="Aujourd’hui" subtitle="Ce qui se passe, jour par jour" icon={CalendarClock} />

        {logements.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ id: null, titre: 'Tous les biens' }, ...logements].map((l) => {
              const active = logementId === l.id;
              return (
                <TouchableOpacity
                  key={l.id ?? 'all'}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setLogementId(l.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {l.titre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.gold[700] }]}>À DÉCIDER MAINTENANT</Text>
            {pending.map((d) => (
              <TouchableOpacity
                key={d.id}
                activeOpacity={0.85}
                onPress={() => openReservation(d.id)}
                style={[styles.item, styles.itemDecision]}
                accessibilityRole="button"
              >
                <View style={[styles.accent, { backgroundColor: colors.gold[400] }]} />
                <View style={styles.itemBody}>
                  <View style={styles.itemKicker}>
                    <Hourglass size={12} color={colors.gold[700]} />
                    <Text style={[styles.kickerText, { color: colors.gold[700] }]}>
                      DEMANDE · {formatExpiry(d.delaiConfirmation).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {d.locataire?.prenom ?? 'Voyageur'} · {d.logement?.titre ?? ''}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Arrivée le {formatShort(d.dateDebut.slice(0, 10))} · {d.nbNuits} nuit{d.nbNuits > 1 ? 's' : ''}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.gold[600]} style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.weekNav}>
          <TouchableOpacity
            onPress={() => shiftWeek(-WEEK)}
            disabled={from <= today}
            style={[styles.navBtn, from <= today && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Semaine précédente"
          >
            <ChevronLeft size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.weekText}>
            {formatShort(from)} – {formatShort(addDays(to, -1))}
          </Text>
          <TouchableOpacity
            onPress={() => shiftWeek(WEEK)}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Semaine suivante"
          >
            <ChevronRight size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        {calendar.isLoading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.forest[600]} />
          </View>
        ) : calendar.isError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>
              {apiErrorMessage(calendar.error, 'Impossible de charger votre agenda.')}
            </Text>
            <AppButton label="Réessayer" variant="ghost" size="sm" onPress={() => calendar.refetch()} />
          </View>
        ) : agenda.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Rien de prévu sur cette période</Text>
            <Text style={styles.stateText}>Aucune arrivée, aucun départ ni blocage.</Text>
            <AppButton
              label="Ouvrir le calendrier"
              variant="ghost"
              size="sm"
              onPress={() => router.navigate('/(owner)/calendar' as never)}
            />
          </View>
        ) : (
          agenda.map(({ day, items }) => (
            <View key={day} style={styles.section}>
              <Text style={[styles.sectionTitle, day === today && { color: colors.forest[600] }]}>
                {titleFor(day)}
              </Text>
              {items.map((item) => {
                const meta = ITEM_META[item.kind];
                const titre = logements.find((l) => l.id === item.event.logementId)?.titre ?? '';
                const nights = diffDays(item.event.start, item.event.end);
                return (
                  <TouchableOpacity
                    key={`${item.kind}-${item.event.id}`}
                    activeOpacity={0.85}
                    onPress={() =>
                      item.kind === 'BLOCK' ? setOpenedBlock(item.event) : openReservation(item.event.id)
                    }
                    style={styles.item}
                    accessibilityRole="button"
                  >
                    <View style={[styles.accent, { backgroundColor: meta.accent }]} />
                    <View style={styles.itemBody}>
                      <View style={styles.itemKicker}>
                        <meta.Icon size={12} color={meta.accent} />
                        <Text style={[styles.kickerText, { color: meta.accent }]}>
                          {item.kind === 'BLOCK'
                            ? `${meta.label} · JUSQU’AU ${formatShort(addDays(item.event.end, -1)).toUpperCase()}`
                            : meta.label}
                        </Text>
                      </View>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.kind === 'BLOCK'
                          ? `${titre}${item.event.motif ? ` · ${item.event.motif}` : ''}`
                          : `${item.event.locataire.prenom} ${item.event.locataire.nomInitiale} · ${titre}`}
                      </Text>
                      {item.kind === 'ARRIVAL' && (
                        <Text style={styles.itemMeta}>
                          {nights} nuit{nights > 1 ? 's' : ''} · {item.event.nbPersonnes} voyageur
                          {item.event.nbPersonnes > 1 ? 's' : ''} ·{' '}
                          {Math.round(item.event.netProprietaire).toLocaleString('fr-FR')} FCFA net
                        </Text>
                      )}
                      {item.kind === 'DEPARTURE' && (
                        <Text style={styles.itemMeta}>État des lieux de sortie à prévoir</Text>
                      )}
                    </View>
                    <ChevronRight size={16} color={colors.neutral[400]} style={styles.chevron} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {openedBlock && (
        <CalendarEventSheet
          event={openedBlock}
          logement={logements.find((l) => l.id === openedBlock.logementId)}
          onClose={() => setOpenedBlock(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 16, gap: 16, paddingBottom: 120 },

  chips: { gap: 8 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    maxWidth: 200,
  },
  chipActive: { backgroundColor: colors.forest[600], borderColor: colors.forest[600] },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[900] },
  chipTextActive: { color: colors.neutral[0] },

  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  weekText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[900] },

  section: { gap: 10 },
  sectionTitle: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 0.8, color: colors.neutral[500] },
  item: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  itemDecision: { backgroundColor: colors.gold[50], borderColor: colors.gold[200] },
  accent: { width: 4, borderRadius: 4 },
  itemBody: { flex: 1, gap: 3 },
  itemKicker: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kickerText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 0.3 },
  itemTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  itemMeta: { fontFamily: typography.fontBody, fontSize: 11.5, color: colors.neutral[600] },
  chevron: { alignSelf: 'center' },

  state: { paddingVertical: 60, alignItems: 'center' },
  stateCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: radius.card,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  stateTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.neutral[900] },
  stateText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center' },
});
