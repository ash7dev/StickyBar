import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import type { ManagedListing, ManagerReservation } from '../../hooks/useManagerToday';
import { addDays, dayNumber, guestName, hourOf, ownerNameOf, weekdayShort } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from '../today/ui';

const DAY_MS = 86_400_000;
const NAME_COL = 98;
const SHOWN = new Set(['PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'DISPUTED']);
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const dayStart = (day: string) => new Date(`${day}T00:00:00.000Z`).getTime();
const label = (day: string) => `${dayNumber(day)} ${MONTHS[new Date(`${day}T00:00:00Z`).getUTCMonth()]}`;

function barStyle(statut: string) {
  if (statut === 'PAID') return { bg: colors.gold[50], fg: colors.gold[700], border: colors.gold[700], dashed: true };
  if (statut === 'COMPLETED') return { bg: '#C9D3BF', fg: '#3F4A3B' };
  if (statut === 'DISPUTED') return { bg: colors.error[50], fg: colors.error[700], border: colors.error[500] };
  return { bg: INK, fg: '#FFFFFF' };
}

/**
 * Le planning de poche : une ligne par bien, une barre par séjour sur 7 jours,
 * la ligne rouge « maintenant ». Toucher une barre affiche le séjour en bas.
 */
export function StaysPlanning({
  listings,
  reservations,
  today,
  now,
  onOpen,
}: {
  listings: ManagedListing[];
  reservations: ManagerReservation[];
  today: string;
  now: Date;
  onOpen: (id: string) => void;
}) {
  const { width } = useWindowDimensions();
  const [start, setStart] = useState(today);
  const [picked, setPicked] = useState<string | null>(null);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const cell = (width - 24 - NAME_COL) / 7;
  const from = dayStart(start);
  const to = from + 7 * DAY_MS;

  const byListing = useMemo(() => {
    const map = new Map<string, ManagerReservation[]>();
    for (const r of reservations) {
      if (!SHOWN.has(r.statut)) continue;
      const a = new Date(r.dateDebut).getTime();
      const b = new Date(r.dateFin).getTime();
      if (b <= from || a >= to) continue;
      map.set(r.logementId, [...(map.get(r.logementId) ?? []), r]);
    }
    return map;
  }, [reservations, from, to]);

  const pickedRes = picked ? reservations.find((r) => r.id === picked) : undefined;
  const pickedListing = pickedRes ? listings.find((l) => l.id === pickedRes.logementId) : undefined;
  const nowX = now.getTime() >= from && now.getTime() < to ? NAME_COL + ((now.getTime() - from) / DAY_MS) * cell : null;
  const booked = listings.filter((l) => (byListing.get(l.id)?.length ?? 0) > 0).length;

  const shift = (n: number) => {
    Haptics.selectionAsync().catch(() => {});
    setPicked(null);
    setStart((s) => addDays(s, n));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.range}>
            {label(days[0])} → {label(days[6])}
          </Text>
          <Text style={styles.sub}>
            {booked} bien{booked > 1 ? 's' : ''} occupé{booked > 1 ? 's' : ''} sur {listings.length}
          </Text>
        </View>
        <TouchableOpacity onPress={() => shift(-7)} style={styles.nav} accessibilityLabel="Semaine précédente">
          <ChevronLeft size={16} color={INK} />
        </TouchableOpacity>
        {start !== today && (
          <TouchableOpacity onPress={() => shift(Math.round((dayStart(today) - from) / DAY_MS))} style={styles.todayBtn} accessibilityRole="button">
            <Text style={styles.todayText}>Auj.</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => shift(7)} style={styles.nav} accessibilityLabel="Semaine suivante">
          <ChevronRight size={16} color={INK} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridHead}>
          <Text style={[styles.colLabel, { width: NAME_COL }]}>BIENS</Text>
          {days.map((d) => (
            <View key={d} style={{ width: cell, alignItems: 'center' }}>
              <Text style={[styles.dayName, d === today && { color: INK }]}>{weekdayShort(d)}</Text>
              <Text style={[styles.dayNum, d === today && styles.dayNumToday]}>{dayNumber(d)}</Text>
            </View>
          ))}
        </View>

        {listings.map((l) => {
          const rows = byListing.get(l.id) ?? [];
          return (
            <View key={l.id} style={styles.row}>
              <View style={{ width: NAME_COL, paddingLeft: 12, paddingRight: 6 }}>
                <Text style={styles.listing} numberOfLines={1}>
                  {l.titre}
                </Text>
                <Text style={styles.owner} numberOfLines={1}>
                  {l.proprietaire ? `${l.proprietaire.prenom} ${l.proprietaire.nom.charAt(0)}.` : ''}
                </Text>
              </View>
              <View style={[styles.track, { width: cell * 7 }]}>
                {days.map((d, i) => (
                  <View key={d} style={[styles.cell, { left: i * cell, width: cell }, d === today && styles.cellToday]} />
                ))}
                {rows.length === 0 && <Text style={styles.free}>Libre</Text>}
                {rows.map((r) => {
                  const a = Math.max(from, new Date(r.dateDebut).getTime());
                  const b = Math.min(to, new Date(r.dateFin).getTime());
                  const left = ((a - from) / DAY_MS) * cell;
                  const w = Math.max(18, ((b - a) / DAY_MS) * cell - 3);
                  const st = barStyle(r.statut);
                  const sel = picked === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setPicked(sel ? null : r.id);
                      }}
                      style={[
                        styles.bar,
                        { left: left + 1, width: w, backgroundColor: st.bg },
                        st.border ? { borderWidth: 1.5, borderColor: st.border, borderStyle: st.dashed ? 'dashed' : 'solid' } : null,
                        sel && styles.barSel,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${guestName(r)}, ${l.titre}`}
                    >
                      <Text style={[styles.barText, { color: st.fg }]} numberOfLines={1}>
                        {guestName(r)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {nowX !== null && (
          <>
            <View pointerEvents="none" style={[styles.nowLine, { left: nowX }]} />
            <View pointerEvents="none" style={[styles.nowPill, { left: nowX - 20 }]}>
              <Text style={styles.nowText}>{now.toISOString().slice(11, 16)}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.legend}>
        {[
          [INK, 'Confirmé · en séjour', false],
          [colors.gold[50], 'À décider', true],
          ['#C9D3BF', 'Terminé', false],
        ].map(([c, t, dashed]) => (
          <View key={t as string} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: c as string }, dashed ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.gold[700] } : null]} />
            <Text style={styles.legendText}>{t as string}</Text>
          </View>
        ))}
      </View>

      {pickedRes && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(pickedRes.id)} style={styles.picked} accessibilityRole="button">
          {pickedListing?.photos?.[0]?.url ? (
            <Image source={{ uri: pickedListing.photos[0].url }} style={styles.pickedThumb} contentFit="cover" />
          ) : (
            <View style={[styles.pickedThumb, { backgroundColor: colors.forest[800] }]} />
          )}
          <View style={styles.flex}>
            <Text style={styles.pickedKicker} numberOfLines={1}>
              {(pickedListing?.titre ?? 'Logement').toUpperCase()}
            </Text>
            <Text style={styles.pickedTitle} numberOfLines={1}>
              {guestName(pickedRes)} · {label(pickedRes.dateDebut.slice(0, 10))} → {label(pickedRes.dateFin.slice(0, 10))}
            </Text>
            <Text style={styles.pickedSub} numberOfLines={1}>
              pour {ownerNameOf(pickedListing)} · arrivée {hourOf(pickedRes.dateDebut)}
            </Text>
          </View>
          <ChevronRight size={18} color={LIME} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  wrap: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20 },
  range: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: INK },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
  nav: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  todayBtn: { height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: INK, justifyContent: 'center' },
  todayText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: LIME },
  grid: { marginHorizontal: 12, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE, overflow: 'hidden' },
  gridHead: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 10, paddingBottom: 8 },
  colLabel: { paddingLeft: 12, fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1, color: MUTED },
  dayName: { fontFamily: typography.fontBodyBold, fontSize: 9.5, letterSpacing: 0.4, color: MUTED },
  dayNum: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK, marginTop: 1 },
  dayNumToday: { color: colors.forest[600] },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEF2EA', minHeight: 52 },
  listing: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  owner: { fontFamily: typography.fontBody, fontSize: 10.5, color: MUTED },
  track: { height: 52, position: 'relative' },
  cell: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderLeftColor: '#F1F4EC' },
  cellToday: { backgroundColor: 'rgba(211,242,110,0.12)' },
  free: { position: 'absolute', left: 6, top: 18, fontFamily: typography.fontBodySemiBold, fontSize: 11, color: '#9AA894' },
  bar: { position: 'absolute', top: 11, height: 30, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 7 },
  barSel: { shadowColor: INK, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, transform: [{ scaleY: 1.08 }] },
  barText: { fontFamily: typography.fontBodyBold, fontSize: 11 },
  nowLine: { position: 'absolute', top: 54, bottom: 0, width: 2, backgroundColor: colors.error[500] },
  nowPill: { position: 'absolute', top: 44, height: 18, paddingHorizontal: 6, borderRadius: 9, backgroundColor: colors.error[500], justifyContent: 'center' },
  nowText: { fontFamily: typography.fontBodyBold, fontSize: 9.5, color: '#FFFFFF' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 14, height: 10, borderRadius: 3 },
  legendText: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED },
  picked: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, padding: 14, borderRadius: 22, backgroundColor: INK },
  pickedThumb: { width: 48, height: 48, borderRadius: 14 },
  pickedKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1, color: LIME },
  pickedTitle: { fontFamily: typography.fontBodyBold, fontSize: 14.5, color: '#FFFFFF', marginTop: 1 },
  pickedSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200], marginTop: 1 },
});
