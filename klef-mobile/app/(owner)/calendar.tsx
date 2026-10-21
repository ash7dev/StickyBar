import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, CalendarDays, CalendarRange, ChartGantt, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';
import { OwnerScreenHeader } from '../../features/calendar/components/OwnerScreenHeader';
import { CalendarTimelineView, type PendingSelection } from '../../features/calendar/components/CalendarTimelineView';
import { CalendarMonthView } from '../../features/calendar/components/CalendarMonthView';
import { BlockDatesSheet } from '../../features/calendar/components/BlockDatesSheet';
import { CalendarEventSheet } from '../../features/calendar/components/CalendarEventSheet';
import { apiErrorMessage, useOwnerCalendar } from '../../features/calendar/hooks/useOwnerCalendar';
import {
  addDays,
  addMonths,
  formatLong,
  formatShort,
  startOfMonth,
  startOfWeek,
  todayDay,
  type Day,
} from '../../features/calendar/lib/days';
import { LEGEND, STATUS_STYLES, overlapsReservation } from '../../features/calendar/lib/event-styles';
import type { BlockDraft, OwnerCalendarEvent } from '../../features/calendar/types';

type CalendarView = 'timeline' | 'month';

/** Planning : 4 semaines affichées, navigation par 2 semaines. */
const TIMELINE_DAYS = 28;
const TIMELINE_STEP = 14;

export default function OwnerCalendarScreen() {
  const router = useRouter();
  const today = todayDay();

  // `null` = choix automatique : planning si plusieurs biens, mois si un seul
  const [chosenView, setChosenView] = useState<CalendarView | null>(null);
  const [timelineStart, setTimelineStart] = useState<Day>(() => startOfWeek(today));
  const [month, setMonth] = useState<Day>(() => startOfMonth(today));
  const [chosenLogementId, setChosenLogementId] = useState<string | null>(null);
  // La liste des logements ne dépend pas de la période : on la garde pour choisir la vue par défaut
  const [logementCount, setLogementCount] = useState<number | null>(null);

  const view: CalendarView = chosenView ?? (logementCount === 1 ? 'month' : 'timeline');
  const [from, to] =
    view === 'timeline'
      ? [timelineStart, addDays(timelineStart, TIMELINE_DAYS)]
      : [month, addMonths(month, 1)];

  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerCalendar(from, to);
  const logements = useMemo(() => data?.logements ?? [], [data]);
  const events = useMemo(() => data?.events ?? [], [data]);

  useEffect(() => {
    if (data) setLogementCount(data.logements.length);
  }, [data]);

  const logementId = chosenLogementId ?? logements[0]?.id ?? '';

  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [blockSheet, setBlockSheet] = useState<{ draft: BlockDraft | null } | null>(null);
  const [openedEvent, setOpenedEvent] = useState<OwnerCalendarEvent | null>(null);

  /** Premier appui = début, second appui = fin (même logement). */
  const handleDayPress = useCallback(
    (id: string, day: Day) => {
      Haptics.selectionAsync().catch(() => {});
      if (!selection || selection.logementId !== id) {
        setSelection({ logementId: id, anchor: day });
        return;
      }
      setSelection(null);
      const first = day < selection.anchor ? day : selection.anchor;
      const end = addDays(day < selection.anchor ? selection.anchor : day, 1);
      if (overlapsReservation(events, id, first, end)) {
        Alert.alert('Dates déjà réservées', 'Cette période contient une réservation. Choisissez des nuits libres.');
        return;
      }
      setBlockSheet({ draft: { logementIds: [id], start: first, end } });
    },
    [selection, events],
  );

  const switchView = (next: CalendarView) => {
    Haptics.selectionAsync().catch(() => {});
    setSelection(null);
    setChosenView(next);
  };

  const shiftTimeline = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setTimelineStart((s) => addDays(s, delta));
  };

  const viewToggle = (
    <View style={styles.toggle} accessibilityRole="tablist">
      {(
        [
          { key: 'timeline', label: 'Planning', Icon: ChartGantt },
          { key: 'month', label: 'Mois', Icon: CalendarDays },
        ] as const
      ).map(({ key, label, Icon }) => {
        const active = view === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => switchView(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.toggleItem, active && styles.toggleItemActive]}
          >
            <Icon size={14} color={active ? colors.neutral[0] : colors.neutral[700]} strokeWidth={2.2} />
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.state}>
          <ActivityIndicator color={colors.forest[600]} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateText}>{apiErrorMessage(error, 'Impossible de charger le calendrier.')}</Text>
          <AppButton label="Réessayer" variant="ghost" size="sm" onPress={() => refetch()} />
        </View>
      );
    }
    if (logements.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Building2 size={28} color={colors.neutral[500]} />
          <Text style={styles.stateTitle}>Aucun logement pour l’instant</Text>
          <Text style={styles.stateText}>Publiez votre premier bien pour gérer ses disponibilités ici.</Text>
          <AppButton label="Publier un bien" onPress={() => router.navigate('/(owner)/add-listing' as never)} />
        </View>
      );
    }

    return view === 'timeline' ? (
      <>
        <View style={styles.navRow}>
          <TouchableOpacity
            onPress={() => shiftTimeline(-TIMELINE_STEP)}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Deux semaines plus tôt"
          >
            <ChevronLeft size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => shiftTimeline(TIMELINE_STEP)}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Deux semaines plus tard"
          >
            <ChevronRight size={16} color={colors.neutral[900]} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimelineStart(startOfWeek(today))}
            disabled={timelineStart === startOfWeek(today)}
            style={[styles.todayBtn, timelineStart === startOfWeek(today) && styles.disabled]}
          >
            <Text style={styles.todayText}>Aujourd’hui</Text>
          </TouchableOpacity>
          <Text style={styles.rangeText}>
            {formatShort(from)} – {formatShort(addDays(to, -1))}
          </Text>
        </View>

        <CalendarTimelineView
          logements={logements}
          events={events}
          start={timelineStart}
          dayCount={TIMELINE_DAYS}
          today={today}
          selection={selection}
          onDayPress={handleDayPress}
          onEventPress={setOpenedEvent}
        />

        <View style={styles.legend}>
          {LEGEND.map((s) => (
            <View key={s} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: STATUS_STYLES[s].background, borderColor: STATUS_STYLES[s].border ?? STATUS_STYLES[s].background },
                ]}
              />
              <Text style={styles.legendText}>{STATUS_STYLES[s].label}</Text>
            </View>
          ))}
        </View>
      </>
    ) : (
      <CalendarMonthView
        logements={logements}
        events={events}
        logementId={logementId}
        onLogementChange={(id) => {
          setSelection(null);
          setChosenLogementId(id);
        }}
        month={month}
        onMonthChange={setMonth}
        today={today}
        selection={selection}
        onDayPress={handleDayPress}
        onEventPress={setOpenedEvent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.forest[600]}
            colors={[colors.forest[600]]}
          />
        }
      >
        <OwnerScreenHeader
          title="Calendrier"
          subtitle={view === 'timeline' ? 'Tous vos biens sur une seule vue' : 'Disponibilités logement par logement'}
          icon={CalendarRange}
          right={logements.length > 0 ? viewToggle : undefined}
        />

        {selection && (
          <View style={styles.banner} accessibilityLiveRegion="polite">
            <Text style={styles.bannerText}>
              Début : {formatLong(selection.anchor)}. Touchez le dernier jour à bloquer.
            </Text>
            <TouchableOpacity onPress={() => setSelection(null)} accessibilityRole="button">
              <Text style={styles.bannerAction}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderContent()}
      </ScrollView>

      {logements.length > 0 && (
        <View style={styles.cta} pointerEvents="box-none">
          <AppButton
            fullWidth
            size="lg"
            label="Bloquer des dates"
            leftIcon={<Lock size={16} color={colors.text.onAction} strokeWidth={2.4} />}
            onPress={() => setBlockSheet({ draft: null })}
          />
        </View>
      )}

      {blockSheet && (
        <BlockDatesSheet logements={logements} draft={blockSheet.draft} onClose={() => setBlockSheet(null)} />
      )}
      {openedEvent && (
        <CalendarEventSheet
          event={openedEvent}
          logement={logements.find((l) => l.id === openedEvent.logementId)}
          onClose={() => setOpenedEvent(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { padding: 16, gap: 14, paddingBottom: 190 },

  toggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  toggleItemActive: { backgroundColor: colors.forest[600] },
  toggleText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[700] },
  toggleTextActive: { color: colors.neutral[0] },

  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  todayBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    justifyContent: 'center',
  },
  todayText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[800] },
  disabled: { opacity: 0.45 },
  rangeText: {
    marginLeft: 'auto',
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[900],
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  bannerText: { flex: 1, fontFamily: typography.fontBodyMedium, fontSize: 12, color: colors.forest[800] },
  bannerAction: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.link },

  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: radius.pill, borderWidth: 1 },
  legendText: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },

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

  cta: { position: 'absolute', left: 16, right: 16, bottom: 100 },
});
