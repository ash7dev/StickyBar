import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, ChevronLeft, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { AppButton } from '../../shared/components/ui/AppButton';
import { WeekCard } from '../../features/calendar/components/WeekCard';
import { WeekFrise } from '../../features/calendar/components/WeekFrise';
import { DayJournal } from '../../features/calendar/components/DayJournal';
import { MonthOverview } from '../../features/calendar/components/MonthOverview';
import { LogementPricing } from '../../features/calendar/components/LogementPricing';
import { BlockDatesSheet } from '../../features/calendar/components/BlockDatesSheet';
import { CalendarEventSheet } from '../../features/calendar/components/CalendarEventSheet';
import { BottomSheet } from '../../features/calendar/components/BottomSheet';
import { apiErrorMessage, useOwnerCalendar } from '../../features/calendar/hooks/useOwnerCalendar';
import { addDays, addMonths, formatLong, startOfMonth, startOfWeek, todayDay, type Day } from '../../features/calendar/lib/days';
import type { BlockDraft, OwnerCalendarEvent } from '../../features/calendar/types';

type Mode = 'week' | 'month' | 'logement';

/**
 * Calendrier hôte, plein écran (sans barre d'onglets) :
 * Semaine = carte de la semaine + frise des biens + journal du jour ;
 * Mois = grille tous biens ; un bien = ses nuits, prix et blocages.
 */
export default function OwnerCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = todayDay();

  // ?logementId=… ouvre directement le calendrier d'un bien (depuis l'écran Biens du gestionnaire)
  const { logementId: initialLogementId } = useLocalSearchParams<{ logementId?: string }>();
  const [mode, setMode] = useState<Mode>(initialLogementId ? 'logement' : 'week');
  const [backMode, setBackMode] = useState<'week' | 'month'>('week');
  const [weekStart, setWeekStart] = useState<Day>(() => startOfWeek(today));
  const [selectedDay, setSelectedDay] = useState<Day>(today);
  const [month, setMonth] = useState<Day>(() => startOfMonth(today));
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [focusLogementId, setFocusLogementId] = useState<string | null>(initialLogementId ?? null);
  const [daySheet, setDaySheet] = useState<Day | null>(null);
  const [blockSheet, setBlockSheet] = useState<{ draft: BlockDraft | null } | null>(null);
  const [openedEvent, setOpenedEvent] = useState<OwnerCalendarEvent | null>(null);

  const [from, to] = mode === 'week' ? [weekStart, addDays(weekStart, 7)] : [month, addMonths(month, 1)];
  const { data, isLoading, isError, error, refetch, isRefetching } = useOwnerCalendar(from, to);
  const logements = useMemo(() => data?.logements ?? [], [data]);
  const events = useMemo(() => data?.events ?? [], [data]);

  const tap = () => Haptics.selectionAsync().catch(() => {});

  const goBack = () => {
    tap();
    if (mode === 'logement') {
      setMode(backMode);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.navigate('/(owner)/dashboard' as never);
  };

  const switchMode = (next: 'week' | 'month') => {
    tap();
    setMode(next);
  };

  const openLogement = (logementId: string, fromMode: 'week' | 'month') => {
    tap();
    setDaySheet(null);
    setBackMode(fromMode);
    setFocusLogementId(logementId);
    // L'écran d'un bien travaille au mois : on part du mois de la semaine affichée
    if (fromMode === 'week') setMonth(startOfMonth(selectedDay));
    setMode('logement');
  };

  const shiftWeek = (delta: number) => {
    tap();
    setWeekStart((w) => addDays(w, delta));
    setSelectedDay((d) => addDays(d, delta));
  };

  const openEventFromSheet = (event: OwnerCalendarEvent) => {
    setDaySheet(null);
    setOpenedEvent(event);
  };

  const renderBody = () => {
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

    if (mode === 'logement' && focusLogementId) {
      return (
        <LogementPricing
          logements={logements}
          logementId={focusLogementId}
          onLogementChange={setFocusLogementId}
          month={month}
          onMonthChange={setMonth}
          today={today}
          events={events}
          onBack={goBack}
          onBlock={(draft) => setBlockSheet({ draft })}
          onEventPress={setOpenedEvent}
        />
      );
    }

    if (mode === 'month') {
      return (
        <MonthOverview
          month={month}
          today={today}
          logements={logements}
          events={events}
          filter={monthFilter}
          onFilterChange={(id) => {
            tap();
            setMonthFilter(id);
          }}
          onMonthChange={(m) => {
            tap();
            setMonth(m);
          }}
          onDayPress={(day) => {
            tap();
            setDaySheet(day);
          }}
        />
      );
    }

    return (
      <>
        <WeekCard
          weekStart={weekStart}
          selectedDay={selectedDay}
          today={today}
          events={events}
          logements={logements}
          onSelectDay={(day) => {
            tap();
            setSelectedDay(day);
          }}
          onShiftWeek={shiftWeek}
        />
        <WeekFrise
          weekStart={weekStart}
          today={today}
          logements={logements}
          events={events}
          onEventPress={setOpenedEvent}
          onLogementPress={(id) => openLogement(id, 'week')}
        />
        <DayJournal
          day={selectedDay}
          today={today}
          events={events}
          logements={logements}
          onEventPress={setOpenedEvent}
          onLogementPress={(id) => openLogement(id, 'week')}
        />
      </>
    );
  };

  const showFab = mode !== 'logement' && logements.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + (showFab ? 100 : 32) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.forest[600]} colors={[colors.forest[600]]} />
        }
      >
        {mode !== 'logement' && (
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Retour">
              <ChevronLeft size={18} color={colors.neutral[900]} strokeWidth={2.4} />
            </TouchableOpacity>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>PLANNING</Text>
              <Text style={styles.title}>Calendrier</Text>
            </View>
            {logements.length > 0 && (
              <View style={styles.toggle} accessibilityRole="tablist">
                {(
                  [
                    { key: 'week', label: 'Semaine' },
                    { key: 'month', label: 'Mois' },
                  ] as const
                ).map(({ key, label }) => {
                  const active = mode === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => switchMode(key)}
                      style={[styles.toggleItem, active && styles.toggleItemActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {renderBody()}
      </ScrollView>

      {showFab && (
        <View style={[styles.fabWrap, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
          <TouchableOpacity
            onPress={() => {
              tap();
              setBlockSheet({ draft: null });
            }}
            style={styles.fab}
            accessibilityRole="button"
          >
            <Lock size={16} color={colors.lime[400]} strokeWidth={2.4} />
            <Text style={styles.fabText}>Bloquer des dates</Text>
          </TouchableOpacity>
        </View>
      )}

      {daySheet && (
        <BottomSheet
          visible
          onClose={() => setDaySheet(null)}
          title={formatLong(daySheet).charAt(0).toUpperCase() + formatLong(daySheet).slice(1)}
        >
          <DayJournal
            hideHeader
            day={daySheet}
            today={today}
            events={events}
            logements={logements}
            onEventPress={openEventFromSheet}
            onLogementPress={(id) => openLogement(id, 'month')}
          />
        </BottomSheet>
      )}
      {blockSheet && <BlockDatesSheet logements={logements} draft={blockSheet.draft} onClose={() => setBlockSheet(null)} />}
      {openedEvent && (
        <CalendarEventSheet
          event={openedEvent}
          logement={logements.find((l) => l.id === openedEvent.logementId)}
          onClose={() => setOpenedEvent(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  container: { paddingHorizontal: 16, gap: 18 },
  flex: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.4, color: colors.neutral[600] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, color: colors.neutral[900] },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.forest[50] },
  toggleItem: { height: 32, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center' },
  toggleItemActive: { backgroundColor: colors.forest[950] },
  toggleText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[600] },
  toggleTextActive: { color: colors.neutral[50] },

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

  fabWrap: { position: 'absolute', right: 16, left: 16, alignItems: 'flex-end' },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: colors.forest[950],
    shadowColor: colors.forest[950],
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fabText: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.neutral[50] },
});
