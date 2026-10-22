import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Banknote, Camera, Check, List, Map as MapIcon, Sun } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { fmt, guestName, type Move } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from './ui';

const RED = colors.error[500];

function Badge({ move }: { move: Move }) {
  if (move.done) {
    return <Text style={styles.doneNote}>{move.kind === 'ARRIVAL' ? 'Arrivé' : 'Parti'}</Text>;
  }
  if (move.needsInspection) {
    return (
      <View style={[styles.pill, { backgroundColor: LIME }]}>
        <Camera size={12} color={INK} strokeWidth={2.4} />
        <Text style={[styles.pillText, { color: INK }]}>État des lieux</Text>
      </View>
    );
  }
  if (move.cash > 0) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.gold[50] }]}>
        <Banknote size={12} color={colors.gold[700]} strokeWidth={2.4} />
        <Text style={[styles.pillText, { color: colors.gold[700] }]}>{fmt(move.cash)} à encaisser</Text>
      </View>
    );
  }
  const arr = move.kind === 'ARRIVAL';
  return (
    <View style={[styles.pill, { backgroundColor: arr ? INK : colors.neutral[100] }]}>
      <Text style={[styles.pillText, { color: arr ? LIME : colors.neutral[700] }]}>{arr ? 'Arrivée' : 'Départ'}</Text>
    </View>
  );
}

function Row({ move, next, last, onPress }: { move: Move; next: boolean; last: boolean; onPress: () => void }) {
  const arr = move.kind === 'ARRIVAL';
  const photo = move.listing?.photos?.[0]?.url ?? move.reservation.logement?.photos?.[0]?.url;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.row, move.done && styles.rowDone]} accessibilityRole="button">
      <View style={styles.time}>
        <Text style={[styles.hour, move.done && styles.hourDone]}>{move.at}</Text>
        <Text style={[styles.kind, { color: arr ? colors.forest[600] : MUTED }]}>{arr ? 'ARR.' : 'DÉP.'}</Text>
      </View>
      <View style={styles.rail}>
        {move.done ? (
          <View style={styles.dotDone}>
            <Check size={11} color={LIME} strokeWidth={3} />
          </View>
        ) : (
          <View style={[styles.dot, arr ? styles.dotArr : styles.dotDep, next && styles.dotNext]} />
        )}
        {!last && <View style={[styles.line, move.done && { backgroundColor: INK }]} />}
      </View>
      <View style={[styles.body, next && styles.bodyNext]}>
        {photo ? <Image source={{ uri: photo }} style={styles.thumb} contentFit="cover" /> : <View style={[styles.thumb, { backgroundColor: colors.neutral[200] }]} />}
        <View style={styles.flex}>
          <Text style={styles.guest} numberOfLines={1}>
            {guestName(move.reservation)}
          </Text>
          <Text style={styles.place} numberOfLines={1}>
            {move.listing?.titre ?? move.reservation.logement?.titre ?? 'Logement'} · {move.ownerName}
          </Text>
          <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <Badge move={move} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** La tournée du jour : faits grisés, ligne « maintenant », prochain mouvement mis en avant. */
export function Tour({
  moves,
  now,
  calmLine,
  onOpen,
  onMap,
}: {
  moves: Move[];
  now: string;
  calmLine: string;
  onOpen: (move: Move) => void;
  onMap: () => void;
}) {
  const done = moves.filter((m) => m.done).length;
  const next = moves.find((m) => !m.done);
  const nowIndex = moves.findIndex((m) => m.at > now);
  const insertAt = nowIndex === -1 ? moves.length : nowIndex;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.h2}>La tournée</Text>
          <Text style={styles.sub}>
            {moves.length === 0
              ? 'Aucun mouvement aujourd’hui'
              : `${done} sur ${moves.length} fait${done > 1 ? 's' : ''}${next ? ` · prochain à ${next.at}` : ' · journée bouclée'}`}
          </Text>
        </View>
        {moves.length > 0 && (
          <View style={styles.toggle}>
            <View style={[styles.toggleItem, styles.toggleOn]}>
              <List size={13} color={LIME} />
              <Text style={[styles.toggleText, { color: LIME }]}>Liste</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onMap();
              }}
              style={styles.toggleItem}
              accessibilityRole="button"
              accessibilityLabel="Ouvrir la tournée dans Maps"
            >
              <MapIcon size={13} color={MUTED} />
              <Text style={[styles.toggleText, { color: MUTED }]}>Carte</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {moves.length === 0 ? (
        <View style={styles.calm}>
          <View style={styles.calmIcon}>
            <Sun size={18} color={INK} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.calmTitle}>Journée calme</Text>
            <Text style={styles.calmText}>{calmLine}</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.progress}>
            {moves.map((m) => (
              <View key={m.key} style={[styles.seg, m.done && { backgroundColor: INK }, m === next && { backgroundColor: LIME }]} />
            ))}
          </View>
          {moves.map((m, i) => (
            <React.Fragment key={m.key}>
              {i === insertAt && <NowLine now={now} />}
              <Row move={m} next={m === next} last={i === moves.length - 1} onPress={() => onOpen(m)} />
            </React.Fragment>
          ))}
          {insertAt === moves.length && <NowLine now={now} />}
        </>
      )}
    </View>
  );
}

function NowLine({ now }: { now: string }) {
  return (
    <View style={styles.now}>
      <View style={styles.nowPill}>
        <Text style={styles.nowPillText}>{now}</Text>
      </View>
      <View style={styles.nowLine} />
      <Text style={styles.nowText}>MAINTENANT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  card: { padding: 16, borderRadius: 28, backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: LINE },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 2 },
  toggle: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: '#EEF2EA' },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 11, borderRadius: 15 },
  toggleOn: { backgroundColor: INK },
  toggleText: { fontFamily: typography.fontBodyBold, fontSize: 12 },
  progress: { flexDirection: 'row', gap: 4, marginTop: 12, marginBottom: 8 },
  seg: { flex: 1, height: 5, borderRadius: 3, backgroundColor: LINE },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  rowDone: { opacity: 0.5 },
  time: { width: 42, alignItems: 'flex-end' },
  hour: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  hourDone: { textDecorationLine: 'line-through' },
  kind: { fontFamily: typography.fontBodyBold, fontSize: 9.5, letterSpacing: 0.5 },
  rail: { width: 22, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 3 },
  dotArr: { backgroundColor: LIME, borderColor: INK },
  dotDep: { backgroundColor: '#FFFFFF', borderColor: '#9AA894' },
  dotNext: { shadowColor: LIME, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, transform: [{ scale: 1.15 }] },
  dotDone: { width: 20, height: 20, borderRadius: 10, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', top: '62%', bottom: -10, width: 2, backgroundColor: LINE },
  body: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  bodyNext: {
    padding: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: INK,
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  thumb: { width: 42, height: 42, borderRadius: 12 },
  guest: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  place: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 24, paddingHorizontal: 9, borderRadius: radius.pill },
  pillText: { fontFamily: typography.fontBodyBold, fontSize: 11 },
  doneNote: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: MUTED },

  now: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4, marginLeft: 30 },
  nowPill: { height: 22, paddingHorizontal: 9, borderRadius: 11, backgroundColor: RED, justifyContent: 'center' },
  nowPillText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, color: '#FFFFFF' },
  nowLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: RED },
  nowText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 0.6, color: RED },

  calm: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  calmIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
  calmText: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: MUTED, marginTop: 2 },
});
