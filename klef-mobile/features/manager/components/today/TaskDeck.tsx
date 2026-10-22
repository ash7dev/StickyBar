import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Banknote, Camera, Check, Clock, MessageCircle, Phone, Users } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { fmt, type Task, type TaskKind } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from './ui';

const tap = () => Haptics.selectionAsync().catch(() => {});

const ICON: Record<TaskKind, typeof Clock> = {
  DECISION: Clock,
  INSPECTION_IN: Camera,
  INSPECTION_OUT: Camera,
  CASH: Banknote,
  LEAD: Users,
};

const PRIMARY: Record<TaskKind, string> = {
  DECISION: 'Accepter ou refuser',
  INSPECTION_IN: 'Faire l’état des lieux',
  INSPECTION_OUT: 'Faire l’état des lieux',
  CASH: 'Voir le séjour',
  LEAD: 'Appeler',
};

export interface TaskHandlers {
  onOpen: (task: Task) => void;
  onCall: (task: Task) => void;
  onWhatsApp: (task: Task) => void;
  onContacted: (task: Task) => void;
}

/** « À faire maintenant » : une tâche à la fois, en pile (comme le dashboard hôte). */
export function TaskDeck({ tasks, index, onNext, handlers }: { tasks: Task[]; index: number; onNext: () => void; handlers: TaskHandlers }) {
  if (tasks.length === 0) {
    return (
      <View style={styles.calm}>
        <View style={styles.calmIcon}>
          <Check size={18} color={INK} strokeWidth={3} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.calmTitle}>Rien ne presse</Text>
          <Text style={styles.calmText}>Aucune demande, aucun état des lieux en retard, aucun prospect en attente.</Text>
        </View>
      </View>
    );
  }
  const task = tasks[index % tasks.length];
  const Icon = ICON[task.kind];
  const isLead = task.kind === 'LEAD';
  const count = tasks.length;

  return (
    <View style={[styles.stack, { paddingBottom: count > 2 ? 22 : count > 1 ? 11 : 0 }]}>
      {count > 2 && <View style={[styles.layer, styles.layerBack]} />}
      {count > 1 && <View style={[styles.layer, styles.layerMid, { bottom: count > 2 ? 11 : 0 }]} />}
      <View style={styles.card}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>À FAIRE MAINTENANT</Text>
          </View>
          {count > 1 ? (
            <TouchableOpacity
              onPress={() => {
                tap();
                onNext();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Tâche suivante"
            >
              <Text style={styles.counter}>
                {(index % count) + 1} sur {count} ›
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.counter}>1 sur 1</Text>
          )}
        </View>
        <View style={styles.kickerRow}>
          <Icon size={13} color={colors.forest[800]} strokeWidth={2.4} />
          <Text style={styles.kicker} numberOfLines={1}>
            {task.kicker}
          </Text>
        </View>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.sub}>{task.sub}</Text>
        <View style={styles.actions}>
          {isLead && (
            <TouchableOpacity onPress={() => handlers.onWhatsApp(task)} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
              <MessageCircle size={16} color={INK} />
              <Text style={styles.btnGhostText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => (isLead ? handlers.onCall(task) : handlers.onOpen(task))}
            style={[styles.btn, styles.btnInk]}
            accessibilityRole="button"
          >
            {isLead && <Phone size={16} color={LIME} />}
            <Text style={styles.btnInkText}>{PRIMARY[task.kind]}</Text>
          </TouchableOpacity>
        </View>
        {isLead && (
          <TouchableOpacity onPress={() => handlers.onContacted(task)} style={styles.contacted} accessibilityRole="button">
            <Text style={styles.contactedText}>Déjà contacté · retirer de la liste</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const TILE: Record<TaskKind, { bg: string; fg: string; kc: string; iconBg: string; iconFg: string; label: string; border?: string }> = {
  DECISION: { bg: INK, fg: '#FFFFFF', kc: LIME, iconBg: LIME, iconFg: INK, label: 'DEMANDE' },
  INSPECTION_IN: { bg: LIME, fg: INK, kc: colors.forest[800], iconBg: INK, iconFg: LIME, label: 'ÉTAT DES LIEUX' },
  INSPECTION_OUT: { bg: LIME, fg: INK, kc: colors.forest[800], iconBg: INK, iconFg: LIME, label: 'ÉTAT DES LIEUX' },
  LEAD: { bg: '#FFFFFF', fg: INK, kc: colors.forest[600], iconBg: colors.forest[100], iconFg: INK, label: 'PROSPECT MANAGED', border: LINE },
  CASH: { bg: colors.gold[50], fg: INK, kc: colors.gold[700], iconBg: colors.gold[400], iconFg: '#FFFFFF', label: 'SOLDE À ENCAISSER', border: '#F0E2BF' },
};

/** « Ensuite » : les autres tâches en tuiles qui défilent ; toucher une tuile la met en haut de la pile. */
export function NextTiles({ tasks, currentKey, onSelect, handlers }: { tasks: Task[]; currentKey?: string; onSelect: (key: string) => void; handlers: TaskHandlers }) {
  const others = tasks.filter((t) => t.key !== currentKey);
  if (others.length === 0) return null;
  return (
    <View style={styles.next}>
      <View style={styles.nextHead}>
        <Text style={styles.h2}>Ensuite</Text>
        <Text style={styles.nextCount}>
          {others.length} tâche{others.length > 1 ? 's' : ''}
          {others.length > 1 ? ' · faites glisser' : ''}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
        {others.map((t) => {
          const s = TILE[t.kind];
          const Icon = ICON[t.kind];
          return (
            <TouchableOpacity
              key={t.key}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                onSelect(t.key);
              }}
              style={[styles.tile, { backgroundColor: s.bg }, s.border ? { borderWidth: 1, borderColor: s.border } : null]}
              accessibilityRole="button"
              accessibilityLabel={`${s.label} : ${t.title}`}
            >
              <View style={styles.tileTop}>
                <View style={[styles.tileIcon, { backgroundColor: s.iconBg }]}>
                  <Icon size={16} color={s.iconFg} />
                </View>
                {t.kind === 'LEAD' && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NOUVEAU</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tileKicker, { color: s.kc }]}>{s.label}</Text>
              {t.kind === 'CASH' && t.amount ? (
                <View style={styles.amountRow}>
                  <Text style={[styles.tileAmount, { color: s.fg }]}>{fmt(t.amount)}</Text>
                  <Text style={[styles.tileCur, { color: s.kc }]}>FCFA</Text>
                </View>
              ) : (
                <Text style={[styles.tileTitle, { color: s.fg }]} numberOfLines={2}>
                  {t.short}
                </Text>
              )}
              <View style={styles.tileFoot}>
                {t.kind === 'LEAD' ? (
                  <View style={styles.leadBtns}>
                    <TouchableOpacity onPress={() => handlers.onCall(t)} style={[styles.leadBtn, { backgroundColor: INK }]} accessibilityLabel="Appeler">
                      <Phone size={14} color={LIME} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handlers.onWhatsApp(t)} style={[styles.leadBtn, { borderWidth: 1, borderColor: LINE }]} accessibilityLabel="WhatsApp">
                      <MessageCircle size={14} color={colors.forest[600]} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.tileWhen}>
                    <Clock size={12} color={s.kc} strokeWidth={2.4} />
                    <Text style={[styles.tileWhenText, { color: s.kc }]} numberOfLines={1}>
                      {t.kind === 'DECISION' ? t.kicker.replace('DEMANDE · ', '').toLowerCase() : t.kind === 'CASH' ? `${t.short} · ${t.at}` : `avant ${t.at}`}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },

  calm: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  calmIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  calmTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK },
  calmText: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: MUTED, marginTop: 2 },

  stack: { position: 'relative' },
  layer: { position: 'absolute', borderRadius: 28 },
  layerBack: { left: 22, right: 22, top: 22, bottom: 0, backgroundColor: '#D2DCC9' },
  layerMid: { left: 11, right: 11, top: 11, backgroundColor: '#2E5A47' },
  card: {
    padding: 16,
    borderRadius: 28,
    backgroundColor: LIME,
    shadowColor: INK,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: INK, justifyContent: 'center' },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 0.6, color: LIME },
  counter: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  kicker: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.1, color: colors.forest[800] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 23, lineHeight: 27, letterSpacing: -0.4, color: INK, marginTop: 6 },
  sub: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.forest[800], marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flexDirection: 'row', gap: 7, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(4,25,18,0.25)' },
  btnGhostText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  btnInk: { flex: 2, backgroundColor: INK },
  btnInkText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: LIME },
  contacted: { alignSelf: 'center', paddingTop: 10 },
  contactedText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[800], textDecorationLine: 'underline' },

  next: { gap: 12 },
  nextHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20 },
  nextCount: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED },
  tiles: { gap: 10, paddingHorizontal: 16 },
  tile: { width: 168, height: 184, padding: 14, borderRadius: 24 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  newBadge: { height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.error[500], justifyContent: 'center' },
  newBadgeText: { fontFamily: typography.fontBodyBold, fontSize: 9.5, letterSpacing: 0.5, color: '#FFFFFF' },
  tileKicker: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1, marginTop: 12 },
  tileTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, lineHeight: 20, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 },
  tileAmount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, letterSpacing: -0.5 },
  tileCur: { fontFamily: typography.fontBodySemiBold, fontSize: 10.5 },
  tileFoot: { marginTop: 'auto' },
  tileWhen: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tileWhenText: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 11.5 },
  leadBtns: { flexDirection: 'row', gap: 6 },
  leadBtn: { flex: 1, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
