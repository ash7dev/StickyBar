import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Unlock, X, Wrench, Home, ShieldAlert, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { apiClient } from '../../../../../shared/api/api-client';

export interface MobileOwnerDetailCalendarProps {
  listingId: string;
}

interface IndispoItem {
  id: string;
  dateDebut: string;
  dateFin: string;
  motif?: string | null;
}

const DAYS_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const PRESET_MOTIFS = [
  { id: 'travaux', label: '🛠️ Travaux' },
  { id: 'perso', label: '🏠 Usage personnel' },
  { id: 'hors_klef', label: '🔒 Réservé hors-Klef' },
  { id: 'entretien', label: '🧹 Entretien' },
];

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDateFr = (iso: string) => {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()].slice(0, 4)}.`;
};

export function MobileOwnerDetailCalendar({ listingId }: MobileOwnerDetailCalendarProps) {
  const queryClient = useQueryClient();
  const today = new Date();
  const todayStr = isoDay(today);

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectStart, setSelectStart] = useState<string | null>(null);
  const [selectEnd, setSelectEnd] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ── Fetch calendar blocked dates ─────────────────────────────────────
  const { data: calData } = useQuery<{ indisponibilites: IndispoItem[] }>({
    queryKey: ['calendrier', listingId],
    queryFn: async () => {
      const res = await apiClient.get(`/calendrier/${listingId}`);
      return res.data;
    },
  });

  const indisponibilites = calData?.indisponibilites || [];

  // ── Mutations ────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (body: { dateDebut: string; dateFin: string; motif?: string }) => {
      return apiClient.post(`/calendrier/${listingId}`, body);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['calendrier', listingId] });
      setSelectStart(null);
      setSelectEnd(null);
      setMotif('');
      setBlockError(null);
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setBlockError(err?.response?.data?.message || err?.message || 'Erreur lors du blocage.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (indispoId: string) => {
      return apiClient.delete(`/calendrier/${listingId}/${indispoId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['calendrier', listingId] });
    },
    onError: (err: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de débloquer ce créneau.');
    },
  });

  const blockedMap = useMemo(() => {
    const m = new Map<string, IndispoItem>();
    for (const ind of indisponibilites) {
      const cur = new Date(ind.dateDebut);
      cur.setHours(0, 0, 0, 0);
      const end = new Date(ind.dateFin);
      end.setHours(0, 0, 0, 0);
      while (cur <= end) {
        m.set(isoDay(cur), ind);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return m;
  }, [indisponibilites]);

  const dayKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDayClick = (day: number) => {
    const key = dayKey(day);
    const dayDate = new Date(year, month, day);

    if (dayDate < startOfToday) return;

    Haptics.selectionAsync().catch(() => {});

    // If day is already blocked, offer 1-tap unblock action modal
    if (blockedMap.has(key)) {
      const indispo = blockedMap.get(key)!;
      Alert.alert(
        'Débloquer cette date ?',
        `La période du ${indispo.dateDebut} au ${indispo.dateFin} est actuellement bloquée${indispo.motif ? ` pour : "${indispo.motif}"` : ''}.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Débloquer la période',
            style: 'destructive',
            onPress: () => deleteMutation.mutate(indispo.id),
          },
        ]
      );
      setSelectStart(null);
      setSelectEnd(null);
      return;
    }

    if (selectEnd) {
      setSelectStart(key);
      setSelectEnd(null);
      return;
    }

    if (!selectStart) {
      setSelectStart(key);
    } else if (selectStart === key) {
      // Toggle off
      setSelectStart(null);
    } else {
      if (key < selectStart) {
        setSelectStart(key);
        setSelectEnd(null);
      } else {
        setSelectEnd(key);
      }
    }
  };

  const isInSelection = (key: string) => {
    if (!selectStart) return false;
    const end = selectEnd || selectStart;
    const [a, b] = selectStart <= end ? [selectStart, end] : [end, selectStart];
    return key >= a && key <= b;
  };

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.markerCircle}>
            <CalendarIcon size={16} color={colors.forest[800]} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Disponibilités & Blocage</Text>
            <Text style={styles.cardSubtitle}>Sélectionnez une plage ou débloquez en 1-tap</Text>
          </View>
        </View>
      </View>

      {/* Legend Indicators Bar */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.neutral[100], borderColor: colors.neutral[300] }]} />
          <Text style={styles.legendText}>Dispo</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]} />
          <Text style={styles.legendText}>Bloqué</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.lime[400], borderColor: colors.lime[600] }]} />
          <Text style={styles.legendText}>Sélection</Text>
        </View>
      </View>

      {/* Month Selector Controls */}
      <View style={styles.monthControlsHeader}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setViewDate(new Date(year, month - 1, 1))}
          style={styles.monthArrowBtn}
        >
          <ChevronLeft size={16} color={colors.forest[950]} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>
          {MONTHS_FR[month]} {year}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setViewDate(new Date(year, month + 1, 1))}
          style={styles.monthArrowBtn}
        >
          <ChevronRight size={16} color={colors.forest[950]} />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={styles.daysHeaderRow}>
        {DAYS_FR.map((d) => (
          <Text key={d} style={styles.dayColHeader}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={styles.dayCellEmpty} />;

          const key = dayKey(day);
          const isBlocked = blockedMap.has(key);
          const isPast = new Date(year, month, day) < startOfToday;
          const isSelected = isInSelection(key);
          const isToday = key === todayStr;

          return (
            <TouchableOpacity
              key={day}
              activeOpacity={0.8}
              disabled={isPast}
              onPress={() => handleDayClick(day)}
              style={[
                styles.dayCell,
                isPast && styles.dayCellPast,
                isToday && styles.dayCellToday,
                isBlocked && styles.dayCellBlocked,
                isSelected && styles.dayCellSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayCellText,
                  isPast && styles.dayCellTextPast,
                  isToday && styles.dayCellTextToday,
                  isBlocked && styles.dayCellTextBlocked,
                  isSelected && styles.dayCellTextSelected,
                ]}
              >
                {day}
              </Text>
              {isBlocked ? (
                <View style={styles.blockedBadgeDot}>
                  <Lock size={8} color="#92400E" strokeWidth={2.5} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selection Action Box */}
      {selectStart ? (
        <View style={styles.blockFormBox}>
          <View style={styles.formHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTitle}>
                {selectEnd && selectEnd !== selectStart
                  ? `Du ${formatDateFr(selectStart)} au ${formatDateFr(selectEnd)}`
                  : `Journée du ${formatDateFr(selectStart)}`}
              </Text>
              <Text style={styles.formSubTitle}>
                {selectEnd ? 'Période complète sélectionnée' : 'Touchez une 2e date pour définir une plage'}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSelectStart(null);
                setSelectEnd(null);
              }}
              style={styles.closeFormBtn}
            >
              <X size={16} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          {/* Quick Preset Motif Chips */}
          <View style={styles.motifChipsSection}>
            <Text style={styles.motifChipsLabel}>Raison rapide :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.motifChipsScroll}>
              {PRESET_MOTIFS.map((preset) => {
                const isActive = motif === preset.label;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setMotif(isActive ? '' : preset.label);
                    }}
                    style={[styles.motifChip, isActive && styles.motifChipActive]}
                  >
                    <Text style={[styles.motifChipText, isActive && styles.motifChipTextActive]}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.formInputsStack}>
            <TextInput
              value={motif}
              onChangeText={setMotif}
              placeholder="Ou saisissez un motif personnalisé..."
              placeholderTextColor={colors.neutral[400]}
              style={styles.motifInput}
            />

            {blockError ? <Text style={styles.errorText}>{blockError}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={createMutation.isPending}
              onPress={() => {
                const end = selectEnd || selectStart;
                const [a, b] = selectStart <= end ? [selectStart, end] : [end, selectStart];
                createMutation.mutate({
                  dateDebut: a,
                  dateFin: b,
                  motif: motif.trim() || undefined,
                });
              }}
              style={styles.submitBlockBtn}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.forest[950]} />
              ) : (
                <>
                  <Lock size={14} color={colors.forest[950]} strokeWidth={2.2} />
                  <Text style={styles.submitBlockBtnText}>
                    {selectEnd && selectEnd !== selectStart ? 'Bloquer ces dates' : 'Bloquer cette journée'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Blocked Dates List */}
      {indisponibilites.length > 0 ? (
        <View style={styles.blockedListSection}>
          <Text style={styles.blockedListTitle}>
            PÉRIODES BLOQUÉES ENREGISTRÉES ({indisponibilites.length})
          </Text>
          <View style={styles.blockedList}>
            {indisponibilites.map((ind) => (
              <View key={ind.id} style={styles.blockedRow}>
                <View style={styles.blockedInfo}>
                  <Text style={styles.blockedDates}>
                    {formatDateFr(ind.dateDebut)} → {formatDateFr(ind.dateFin)}
                  </Text>
                  {ind.motif ? (
                    <Text style={styles.blockedMotif} numberOfLines={1}>
                      {ind.motif}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    deleteMutation.mutate(ind.id);
                  }}
                  style={styles.unblockBtn}
                >
                  <Unlock size={12} color={colors.error[600]} />
                  <Text style={styles.unblockBtnText}>Débloquer</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markerCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15.5,
    color: colors.forest[950],
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  legendText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[600],
  },

  // Month Controls Header
  monthControlsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  // Grid
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayColHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCellEmpty: {
    width: '13%',
    height: 36,
  },
  dayCell: {
    width: '13%',
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    position: 'relative',
  },
  dayCellPast: {
    backgroundColor: colors.neutral[100],
    borderColor: 'transparent',
    opacity: 0.4,
  },
  dayCellToday: {
    borderColor: colors.forest[600],
    borderWidth: 1.5,
  },
  dayCellBlocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  dayCellSelected: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[600],
  },
  dayCellText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  dayCellTextPast: {
    color: colors.neutral[400],
  },
  dayCellTextToday: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[800],
  },
  dayCellTextBlocked: {
    color: '#92400E',
    fontFamily: typography.fontBodyBold,
  },
  dayCellTextSelected: {
    color: colors.forest[950],
    fontFamily: typography.fontBodyBold,
  },
  blockedBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 3,
  },

  // Form Box
  blockFormBox: {
    backgroundColor: colors.forest[50],
    padding: 12,
    borderRadius: radius.inner,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  formTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  formSubTitle: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.forest[700],
  },
  closeFormBtn: {
    padding: 4,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.pill,
  },

  // Motif chips
  motifChipsSection: {
    gap: 6,
  },
  motifChipsLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10.5,
    color: colors.forest[800],
  },
  motifChipsScroll: {
    gap: 6,
  },
  motifChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  motifChipActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  motifChipText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[900],
  },
  motifChipTextActive: {
    color: colors.lime[400],
    fontFamily: typography.fontBodyBold,
  },

  formInputsStack: {
    gap: 8,
  },
  motifInput: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[950],
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[600],
  },
  submitBlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  submitBlockBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },

  // Blocked List
  blockedListSection: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  blockedListTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  blockedList: {
    gap: 6,
  },
  blockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  blockedInfo: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  blockedDates: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },
  blockedMotif: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  unblockBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.error[700],
  },
});
