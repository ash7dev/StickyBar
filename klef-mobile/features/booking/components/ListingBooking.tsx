import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, CalendarDays, ChevronRight, KeyRound, Lock, ShieldCheck, Wallet } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { INK, PAPER, tap } from '../../reservations/tenant/components/ui';
import { formatAmount } from '../../owner-home/lib/format';
import { cancellationTiers, fromLocalISODate, nightsBetween, rangeLabel, type PriceBreakdown } from '../lib/booking';
import type { StaySelection } from './DatesSheet';

// Blocs de la fiche annonce liés à la réservation (maquettes « Annonce & réservation »).

/** « Quand venez-vous ? » tant qu'aucune date n'est choisie, sinon le rappel des dates. */
export function DatesCard({ stay, onPress }: { stay: StaySelection; onPress: () => void }) {
  const has = !!stay.start && !!stay.end;
  if (!has) {
    return (
      <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.ask} accessibilityRole="button">
        <View style={styles.askIcon}>
          <CalendarDays size={18} color={INK} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.askTitle}>Quand venez-vous ?</Text>
          <Text style={styles.askSub}>Choisissez vos dates pour voir le prix exact</Text>
        </View>
        <ChevronRight size={16} color={colors.lime[400]} strokeWidth={2.4} />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.dates} accessibilityRole="button">
      <View style={styles.flex}>
        <Text style={styles.eyebrow}>VOS DATES</Text>
        <Text style={styles.datesValue}>
          {rangeLabel(stay.start!, stay.end!)} · {stay.guests} voyageur{stay.guests > 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.modify}>Modifier</Text>
    </TouchableOpacity>
  );
}

/** Le chemin de l'argent, raconté en 4 temps sur une carte sombre. */
export function HowItWorks({ hostName }: { hostName: string }) {
  const steps = [
    { Icon: Wallet, title: 'Vous payez', text: 'Wave ou Orange Money, acompte possible' },
    { Icon: Lock, title: 'Paixi garde l’argent', text: `${hostName} répond sous 48 h, sinon remboursé` },
    { Icon: KeyRound, title: 'Vous arrivez et vérifiez', text: 'le logement, photos d’état des lieux à l’appui' },
  ];
  return (
    <View style={styles.section}>
      <View style={styles.how}>
        <Text style={styles.howEyebrow}>COMMENT ÇA SE PASSE</Text>
        <Text style={styles.howTitle}>
          Votre argent ne part{'\n'}
          <Text style={{ color: colors.lime[400] }}>qu’une fois les clés en main.</Text>
        </Text>
        <View style={{ gap: 0 }}>
          {steps.map(({ Icon, title, text }, i) => (
            <View key={title} style={styles.howRow}>
              <View style={styles.howRail}>
                <View style={styles.howIcon}>
                  <Icon size={16} color={colors.lime[400]} strokeWidth={2.2} />
                </View>
                <View style={styles.howLine} />
              </View>
              <View style={styles.howBody}>
                <Text style={styles.howStep}>{`0${i + 1}`} · {title}</Text>
                <Text style={styles.howText}>{text}</Text>
              </View>
            </View>
          ))}
          <View style={styles.howFinal}>
            <View style={styles.howFinalIcon}>
              <BadgeCheck size={18} color={INK} strokeWidth={2.4} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.howFinalTitle}>Alors seulement, {hostName} est payé</Text>
              <Text style={styles.howFinalText}>Un problème à l’arrivée ? Votre argent reste bloqué.</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const TIER_COLORS = [colors.lime[400], '#B9DA7A', colors.neutral[200]];
const DAY = 86_400_000;

/** Frise d'annulation : trois zones jusqu'à l'arrivée, avec dates limites et montants si connus. */
export function CancellationCard({ price, start }: { price?: PriceBreakdown; start?: string | null }) {
  const tiers = cancellationTiers(price);
  const arrival = start ? fromLocalISODate(start) : null;
  const limits = arrival
    ? [`jusqu’au ${dayLabel(new Date(arrival.getTime() - 3 * DAY))}`, `jusqu’au ${dayLabel(new Date(arrival.getTime() - DAY))}`, 'la veille et le jour J']
    : ['plus de 3 jours avant', '24 h à 3 jours avant', 'moins de 24 h avant'];
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>Si vous annulez</Text>
      <View style={[styles.card, { gap: 16 }]}>
        {/* La frise, de maintenant à l'arrivée */}
        <View>
          <View style={styles.track}>
            {tiers.map((t, i) => (
              <View key={t.pct} style={[styles.trackSeg, { flex: i === 0 ? 3 : i === 1 ? 2 : 1, backgroundColor: TIER_COLORS[i] }]} />
            ))}
            <View style={styles.trackKey}>
              <KeyRound size={13} color={colors.lime[400]} strokeWidth={2.4} />
            </View>
          </View>
          <View style={styles.trackLabels}>
            <Text style={styles.trackLabel}>Aujourd’hui</Text>
            <Text style={styles.trackLabel}>{arrival ? `Arrivée · ${dayLabel(arrival)}` : 'Arrivée'}</Text>
          </View>
        </View>

        {tiers.map((t, i) => (
          <View key={t.pct} style={styles.tier}>
            <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[i] }]} />
            <View style={styles.flex}>
              <Text style={styles.tierWhen}>{limits[i].charAt(0).toUpperCase() + limits[i].slice(1)}</Text>
              <Text style={styles.small}>{i === 0 ? 'les nuits, hors frais de service' : 'du montant payé'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.tierPct}>{t.pct}</Text>
              {t.amount != null && <Text style={styles.tierAmount}>{formatAmount(t.amount)} FCFA</Text>}
            </View>
          </View>
        ))}

        <View style={styles.tierNote}>
          <ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />
          <Text style={[styles.small, styles.flex]}>Si l’hôte refuse, annule ou ne répond pas, vous êtes remboursé à 100 %, frais compris.</Text>
        </View>
      </View>
    </View>
  );
}

const WD = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const dayLabel = (d: Date) => `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}`;

/** Barre du bas : le total du séjour dès que les dates sont choisies, sinon le prix par nuit. */
export function BookingBar({
  stay,
  price,
  loading,
  nightlyLabel,
  onChooseDates,
  onBook,
}: {
  stay: StaySelection;
  price?: PriceBreakdown;
  loading: boolean;
  nightlyLabel: string;
  onChooseDates: () => void;
  onBook: () => void;
}) {
  const insets = useSafeAreaInsets();
  const nights = nightsBetween(stay.start, stay.end);
  const ready = nights > 0 && !!price;
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}>
      <TouchableOpacity style={styles.flex} onPress={onChooseDates} accessibilityRole="button">
        {loading ? (
          <ActivityIndicator color={colors.forest[600]} style={{ alignSelf: 'flex-start' }} />
        ) : ready ? (
          <>
            <Text style={styles.barTotal}>
              {formatAmount(price!.totalLocataire)} <Text style={styles.barCur}>FCFA</Text>
            </Text>
            <Text style={styles.barSub}>
              {nights} nuit{nights > 1 ? 's' : ''} · {rangeLabel(stay.start!, stay.end!, false)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.barTotal}>
              {nightlyLabel} <Text style={styles.barCur}>FCFA / nuit</Text>
            </Text>
            <Text style={styles.barSub}>Frais de service inclus</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          tap();
          (ready ? onBook : onChooseDates)();
        }}
        style={styles.barBtn}
        accessibilityRole="button"
      >
        <Text style={styles.barBtnText}>{ready ? 'Réserver' : 'Choisir les dates'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  section: { gap: 12, paddingHorizontal: 16, marginTop: 14 },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.4, color: INK },
  card: { padding: 16, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  small: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600] },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },

  ask: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 22, backgroundColor: INK },
  askIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  askTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: PAPER },
  askSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  datesValue: { marginTop: 2, fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  modify: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.forest[600] },

  how: { gap: 18, padding: 20, borderRadius: 28, backgroundColor: INK },
  howEyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.forest[200] },
  howTitle: { marginTop: -8, fontFamily: typography.fontDisplaySemiBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, color: PAPER },
  howRow: { flexDirection: 'row', gap: 12 },
  howRail: { width: 36, alignItems: 'center' },
  howIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(211,242,110,0.12)', alignItems: 'center', justifyContent: 'center' },
  howLine: { flex: 1, width: 2, minHeight: 12, backgroundColor: 'rgba(211,242,110,0.25)' },
  howBody: { flex: 1, paddingTop: 2, paddingBottom: 14 },
  howStep: { fontFamily: typography.fontBodyBold, fontSize: 14, color: PAPER },
  howText: { marginTop: 2, fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: '#C9DBD1' },
  howFinal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: colors.lime[400] },
  howFinalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(4,25,18,0.1)', alignItems: 'center', justifyContent: 'center' },
  howFinalTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  howFinalText: { marginTop: 1, fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[800] },

  track: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 14 },
  trackSeg: { height: 10, borderRadius: 5 },
  trackKey: { width: 26, height: 26, borderRadius: 13, backgroundColor: INK, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  trackLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.neutral[600] },
  tier: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierDot: { width: 12, height: 32, borderRadius: 6 },
  tierWhen: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  tierPct: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, letterSpacing: -0.3, color: INK },
  tierAmount: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  tierNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.neutral[100] },

  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, paddingHorizontal: 16, backgroundColor: colors.neutral[0], borderTopWidth: 1, borderTopColor: colors.neutral[200] },
  barTotal: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, letterSpacing: -0.4, color: INK },
  barCur: { fontFamily: typography.fontBodyMedium, fontSize: 13, color: colors.neutral[600] },
  barSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], textDecorationLine: 'underline' },
  barBtn: { height: 54, paddingHorizontal: 24, borderRadius: 999, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  barBtnText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.lime[400] },
});
