import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Check, FileText, Navigation, Phone, Star } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { PaixiLogo } from '../../../shared/components/brand/PaixiLogo';
import { apiClient } from '../../../shared/api/api-client';
import { formatAmount } from '../../owner-home/lib/format';
import { INK, PAPER, tap } from '../../reservations/tenant/components/ui';
import { countdown, pad2, reviewDaysLeft, type MyReservation } from '../lib/stays';
import { nameCase } from '../lib/home';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const when = (iso: string) => {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} à ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const placeOf = (r: MyReservation) => r.logement?.quartier || r.logement?.ville || '';

/** Bascule « Mon séjour | Accueil » en haut des écrans de séjour. */
export function StaySwitch({ onHome }: { onHome: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
      <PaixiLogo size={20} tone="inverse" />
      <View style={styles.switch} accessibilityRole="tablist">
        <View style={[styles.switchItem, styles.switchOn]}>
          <Text style={[styles.switchText, { color: INK }]}>Mon séjour</Text>
        </View>
        <TouchableOpacity onPress={() => { tap(); onHome(); }} style={styles.switchItem} accessibilityRole="tab">
          <Text style={styles.switchText}>Accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Séjour dans 3 jours ou moins (ou en cours) : le compte à rebours devient l'accueil.
 * Fond vert foncé, anneau « prêt », raccourcis ; la bascule ramène à l'accueil normal.
 */
export function StayCountdown({ res, inStay, onHome }: { res: MyReservation; inStay: boolean; onHome: () => void }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const target = inStay ? res.dateFin : res.dateDebut;
  const c = countdown(target, now);
  const photo = res.logement?.photos?.[0]?.url;
  const balance = Number(res.montantSoldeRestant ?? 0);
  const host = nameCase(res.proprietaire?.prenom) ?? 'votre hôte';
  // Numéro de l'hôte : échangé 24 h avant l'arrivée (même règle que le détail du séjour)
  const phoneOpen = inStay || new Date(res.dateDebut).getTime() - now.getTime() <= 86_400_000;

  const checklist = inStay
    ? [
        { label: 'Arrivée validée', done: true },
        { label: balance ? `Solde de ${formatAmount(balance)} réglé à ${host}` : 'Séjour réglé', done: !balance },
        { label: `Départ ${when(res.dateFin)}`, done: false },
      ]
    : [
        { label: 'Paiement reçu et bloqué', done: true },
        { label: `Acceptée par ${host}`, done: res.statut === 'CONFIRMED' },
        ...(balance ? [{ label: `Prévoir ${formatAmount(balance)} FCFA pour ${host}`, done: false }] : [{ label: 'Lire le guide d’accueil', done: false }]),
      ];
  const done = checklist.filter((i) => i.done).length;

  return (
    <View style={styles.screen}>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, { backgroundColor: colors.forest[800] }]} />}
      <LinearGradient colors={['rgba(4,25,18,0.55)', 'rgba(4,25,18,0.35)', INK]} locations={[0, 0.4, 1]} style={styles.photo} />
      <StaySwitch onHome={onHome} />

      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <Text style={styles.eyebrow}>{inStay ? 'VOTRE SÉJOUR EN COURS' : 'VOTRE PROCHAIN SÉJOUR'}</Text>
          <Text style={styles.small} numberOfLines={1}>
            {res.logement?.titre}
            {placeOf(res) ? ` · ${placeOf(res)}` : ''}
          </Text>
        </View>
        <View style={styles.clock} accessibilityLabel={`${c.d} jours ${c.h} heures ${c.m} minutes`}>
          <Unit n={pad2(c.d)} u="jours" />
          <Unit n={pad2(c.h)} u="heures" />
          <Unit n={pad2(c.m)} u="min" />
        </View>
        <Text style={styles.until}>{inStay ? `avant le départ, ${when(res.dateFin)}` : `avant d’ouvrir la porte, ${when(res.dateDebut)}`}</Text>

        <View style={styles.ready}>
          <Ring pct={done / checklist.length} label={`${done}/${checklist.length}`} />
          <View style={{ flex: 1, gap: 10 }}>
            {checklist.map((i) => (
              <View key={i.label} style={styles.check}>
                <View style={[styles.checkDot, i.done && styles.checkDotOn]}>{i.done ? <Check size={11} color={INK} strokeWidth={3.4} /> : null}</View>
                <Text style={[styles.checkText, i.done && styles.checkDone]} numberOfLines={2}>{i.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.shortcuts}>
          <Shortcut
            label="Y aller"
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([res.logement?.titre, placeOf(res), res.logement?.ville].filter(Boolean).join(', '))}`)}
          >
            <Navigation size={18} color={colors.lime[400]} />
          </Shortcut>
          <Shortcut label="Mon séjour" onPress={() => router.push(`/reservation/${res.id}` as never)}>
            <FileText size={18} color={colors.lime[400]} />
          </Shortcut>
          <Shortcut
            label={host}
            onPress={() => (phoneOpen && res.proprietaire?.telephone ? Linking.openURL(`tel:${res.proprietaire.telephone}`) : router.push(`/reservation/${res.id}` as never))}
          >
            <Phone size={18} color={colors.lime[400]} />
          </Shortcut>
        </View>
        <TouchableOpacity onPress={() => { tap(); onHome(); }} accessibilityRole="button" style={{ alignSelf: 'center' }}>
          <Text style={styles.explore}>Explorer d’autres logements → Accueil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Après le séjour : « Comment était Saly ? », une note en un tap, ou « plus tard ». */
export function AfterStay({ res, onHome, onRated }: { res: MyReservation; onHome: () => void; onRated: () => void }) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const photo = res.logement?.photos?.[0]?.url;
  const place = placeOf(res) || res.logement?.titre || 'votre séjour';
  const days = reviewDaysLeft(res);

  const rate = async (n: number) => {
    setNote(n);
    tap();
    setSending(true);
    try {
      await apiClient.post(`/reservations/${res.id}/rate-owner`, { note: n });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSent(true);
      setTimeout(onRated, 1400);
    } catch {
      // On ouvre le détail du séjour pour réessayer avec un commentaire
      router.push(`/reservation/${res.id}` as never);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <LinearGradient colors={['rgba(4,25,18,0.55)', 'rgba(4,25,18,0.1)', 'rgba(4,25,18,0.9)']} locations={[0, 0.35, 0.7]} style={StyleSheet.absoluteFill} />
      <StaySwitch onHome={onHome} />
      <View style={[styles.afterHead, { top: insets.top + 80 }]}>
        <Text style={styles.eyebrow}>
          {res.logement?.titre?.toUpperCase()} · {new Date(res.dateDebut).getDate()} → {new Date(res.dateFin).getDate()} {MONTHS[new Date(res.dateFin).getMonth()].toUpperCase()}
        </Text>
        <Text style={styles.afterTitle}>
          Comment{'\n'}était {place} ?
        </Text>
      </View>
      <View style={styles.afterSheet}>
        <View style={styles.grip} />
        {sent ? (
          <Text style={styles.thanks}>Merci ! Votre avis aide {nameCase(res.proprietaire?.prenom) ?? 'votre hôte'} et les prochains voyageurs.</Text>
        ) : (
          <>
            <Text style={styles.afterSub}>Votre avis aide {nameCase(res.proprietaire?.prenom) ?? 'votre hôte'} et les prochains voyageurs</Text>
            <View style={styles.stars} accessibilityRole="adjustable" accessibilityLabel={`${note} étoiles sur 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => rate(n)} disabled={sending} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}>
                  <Star size={40} color={INK} fill={n <= note ? INK : 'transparent'} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
            </View>
            {sending ? <ActivityIndicator color={colors.forest[600]} /> : null}
            <Text style={styles.afterSub}>
              encore {days} jour{days > 1 ? 's' : ''} pour noter ·{' '}
              <Text style={styles.later} onPress={onHome}>
                plus tard
              </Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function Unit({ n, u }: { n: string; u: string }) {
  return (
    <View>
      <Text style={styles.unitN}>{n}</Text>
      <Text style={styles.unitU}>{u}</Text>
    </View>
  );
}

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: 108, height: 108 }}>
      <Svg width={108} height={108} viewBox="0 0 108 108">
        <Circle cx={54} cy={54} r={r} stroke="rgba(248,251,244,0.12)" strokeWidth={9} fill="none" />
        <Circle cx={54} cy={54} r={r} stroke={colors.lime[400]} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${c}`} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 54 54)" />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringN}>{label}</Text>
        <Text style={styles.ringU}>prêt</Text>
      </View>
    </View>
  );
}

function Shortcut({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.shortcut} accessibilityRole="button">
      {children}
      <Text style={styles.shortcutText} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: INK },
  photo: { position: 'absolute', left: 0, right: 0, top: 0, height: '62%' },
  top: { position: 'absolute', left: 20, right: 20, top: 0, zIndex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.6, color: '#FFFFFF' },
  switch: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: 'rgba(248,251,244,0.14)' },
  switchItem: { height: 36, paddingHorizontal: 16, borderRadius: 999, justifyContent: 'center' },
  switchOn: { backgroundColor: colors.lime[400] },
  switchText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: '#FFFFFF' },

  body: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 108, gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingHorizontal: 4 },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 12, letterSpacing: 1.4, color: colors.lime[400] },
  small: { flexShrink: 1, fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
  clock: { flexDirection: 'row', gap: 14, paddingHorizontal: 4 },
  unitN: { fontFamily: typography.fontDisplaySemiBold, fontSize: 76, lineHeight: 74, letterSpacing: -3, color: '#FFFFFF' },
  unitU: { fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
  until: { paddingHorizontal: 4, fontFamily: typography.fontDisplaySemiBold, fontStyle: 'italic', fontSize: 18, color: '#FFFFFF' },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 28, backgroundColor: 'rgba(248,251,244,0.08)' },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringN: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, color: '#FFFFFF' },
  ringU: { fontFamily: typography.fontBody, fontSize: 10, color: '#C9DBD1' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  checkDotOn: { backgroundColor: colors.lime[400] },
  checkText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 13, color: '#FFFFFF' },
  checkDone: { color: '#8FB3A3', textDecorationLine: 'line-through' },
  shortcuts: { flexDirection: 'row', gap: 8 },
  shortcut: { flex: 1, height: 64, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.1)', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 6 },
  shortcutText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },
  explore: { fontFamily: typography.fontBodyBold, fontSize: 12, color: '#C9DBD1' },

  afterHead: { position: 'absolute', left: 20, right: 20 },
  afterTitle: { marginTop: 8, fontFamily: typography.fontDisplaySemiBold, fontSize: 46, lineHeight: 48, letterSpacing: -1.6, color: '#FFFFFF' },
  afterSheet: { position: 'absolute', left: 8, right: 8, bottom: 96, minHeight: 250, borderRadius: 34, backgroundColor: PAPER, padding: 18, paddingTop: 10, gap: 14, alignItems: 'center' },
  grip: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.neutral[200] },
  afterSub: { textAlign: 'center', fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  later: { fontFamily: typography.fontBodyBold, color: INK, textDecorationLine: 'underline' },
  stars: { flexDirection: 'row', gap: 10 },
  thanks: { marginTop: 30, textAlign: 'center', fontFamily: typography.fontDisplaySemiBold, fontSize: 20, lineHeight: 26, color: INK },
});
