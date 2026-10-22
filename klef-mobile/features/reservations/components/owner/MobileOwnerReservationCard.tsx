import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Banknote, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { nameCase } from '../../../home/lib/home';
import { formatExpiry } from '../../../calendar/lib/agenda';

export interface OwnerReservationItem {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  nbPersonnes?: number;
  totalLocataire?: number;
  netProprietaire?: number;
  typePaiement?: string;
  montantAcompte?: number | string | null;
  montantCommission?: number | string | null;
  montantSoldeRestant?: number | string | null;
  delaiConfirmation?: string | null;
  proprietaireId?: string;
  avis?: Array<{ auteurId: string }>;
  logement?: {
    id?: string;
    titre?: string;
    ville?: string;
    quartier?: string;
    photos?: Array<{ url: string; estPrincipale?: boolean }>;
  };
  locataire?: {
    id?: string;
    prenom?: string;
    nom?: string;
    telephone?: string;
    avatarUrl?: string;
  };
}

const INK = colors.forest[950];
const DAY = 86_400_000;
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

type Tone = 'gold' | 'lime' | 'green' | 'grey' | 'red';

/** Statut vu par l'hôte (libellé de la pastille). */
const STATUS: Record<string, { label: string; tone: Tone }> = {
  PAID: { label: 'À décider', tone: 'gold' },
  PENDING: { label: 'Paiement en cours', tone: 'grey' },
  CONFIRMED: { label: 'Confirmée', tone: 'green' },
  CHECKED_IN: { label: 'En séjour', tone: 'lime' },
  COMPLETED: { label: 'Terminée', tone: 'grey' },
  DISPUTED: { label: 'Litige', tone: 'red' },
  CANCELLED: { label: 'Annulée', tone: 'grey' },
  EXPIRED: { label: 'Expirée', tone: 'grey' },
};

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  gold: { bg: colors.gold[50], fg: colors.gold[700], dot: colors.gold[400] },
  lime: { bg: INK, fg: colors.lime[400], dot: colors.lime[400] },
  green: { bg: colors.forest[50], fg: colors.forest[800], dot: colors.forest[500] },
  grey: { bg: colors.neutral[100], fg: colors.neutral[600], dot: colors.neutral[400] },
  red: { bg: colors.error[50], fg: colors.error[700], dot: colors.error[500] },
};

/** « 24 oct. » en heure de Dakar (UTC). */
export const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};

const hourOf = (iso: string) => {
  const t = new Date(iso).toISOString().slice(11, 16);
  return t === '00:00' ? null : t.replace(':', ' h ');
};

/** Jours calendaires entre aujourd'hui et la date (Dakar = UTC). */
function daysUntil(iso: string, now = new Date()): number {
  const a = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const d = new Date(iso);
  const b = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((b - a) / DAY);
}

function whenLabel(iso: string): string {
  const n = daysUntil(iso);
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'demain';
  if (n > 1 && n < 7) return `dans ${n} jours`;
  return `le ${shortDate(iso)}`;
}

/** Ce que l'hôte touche via Paixi (acompte moins commission en formule acompte). */
export function payoutOf(r: OwnerReservationItem): number {
  if (r.typePaiement?.toUpperCase() === 'DEPOSIT') {
    return Math.max(0, Number(r.montantAcompte ?? 0) - Number(r.montantCommission ?? 0));
  }
  return Number(r.netProprietaire ?? r.totalLocataire ?? 0);
}

function cashOf(r: OwnerReservationItem): number {
  return r.typePaiement?.toUpperCase() === 'DEPOSIT' ? Number(r.montantSoldeRestant ?? 0) : 0;
}

/** Une phrase : ce qui se passe maintenant pour ce séjour. */
function stageLine(r: OwnerReservationItem): { text: string; tone: Tone } {
  switch (r.statut) {
    case 'PAID':
      return { text: r.delaiConfirmation ? `Répondez vite · ${formatExpiry(r.delaiConfirmation)}` : 'Le voyageur attend votre réponse', tone: 'gold' };
    case 'PENDING':
      return { text: 'Le voyageur finalise son paiement', tone: 'grey' };
    case 'CONFIRMED': {
      const h = hourOf(r.dateDebut);
      return { text: `Arrivée ${whenLabel(r.dateDebut)}${h && daysUntil(r.dateDebut) <= 1 ? ` à ${h}` : ''}`, tone: daysUntil(r.dateDebut) <= 1 ? 'lime' : 'green' };
    }
    case 'CHECKED_IN':
      return { text: `Chez vous · départ ${whenLabel(r.dateFin)}`, tone: 'lime' };
    case 'COMPLETED': {
      const rated = (r.avis ?? []).some((a) => a.auteurId === r.proprietaireId);
      return { text: rated ? 'Séjour terminé' : 'Séjour terminé · notez votre voyageur', tone: rated ? 'grey' : 'gold' };
    }
    case 'DISPUTED':
      return { text: 'Litige en cours d’examen par Paixi', tone: 'red' };
    default:
      return { text: STATUS[r.statut]?.label ?? 'Réservation', tone: 'grey' };
  }
}

const fcfa = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

interface Props {
  reservation: OwnerReservationItem;
}

export function MobileOwnerReservationCard({ reservation: r }: Props) {
  const router = useRouter();
  const status = STATUS[r.statut] ?? STATUS.COMPLETED;
  const tone = TONES[status.tone];
  const stage = stageLine(r);
  const stageTone = TONES[stage.tone];
  const isDecision = r.statut === 'PAID';
  const isPast = ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.statut);

  const start = new Date(r.dateDebut);
  const nuits = r.nbNuits ?? Math.max(1, Math.round((new Date(r.dateFin).getTime() - start.getTime()) / DAY));
  const prenom = nameCase(r.locataire?.prenom) ?? '';
  const initial = r.locataire?.nom ? `${r.locataire.nom.charAt(0).toUpperCase()}.` : '';
  const guest = `${prenom} ${initial}`.trim() || 'Voyageur';
  const place = [r.logement?.titre, r.logement?.quartier].filter(Boolean).join(' · ');
  const payout = payoutOf(r);
  const cash = cashOf(r);
  const avatar = r.locataire?.avatarUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        router.push(`/(owner)/reservations/${r.id}` as any);
      }}
      style={[styles.card, isDecision && styles.cardDecision, isPast && styles.cardPast]}
      accessibilityRole="button"
      accessibilityLabel={`${status.label}, ${guest}, du ${shortDate(r.dateDebut)} au ${shortDate(r.dateFin)}`}
    >
      <View style={styles.top}>
        {/* Talon de date : le repère principal d'une liste de séjours */}
        <View style={[styles.dateTile, isPast && styles.dateTilePast]}>
          <Text style={[styles.dateDay, isPast && styles.dateDayPast]}>{start.getUTCDate()}</Text>
          <Text style={[styles.dateMonth, isPast && styles.dateMonthPast]}>{MONTHS[start.getUTCMonth()].replace('.', '').toUpperCase()}</Text>
        </View>

        <View style={styles.main}>
          <View style={styles.guestRow}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarText}>{(prenom.charAt(0) || '?').toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.guest} numberOfLines={1}>
              {guest}
            </Text>
            <View style={[styles.chip, { backgroundColor: tone.bg }]}>
              <View style={[styles.chipDot, { backgroundColor: tone.dot }]} />
              <Text style={[styles.chipText, { color: tone.fg }]}>{status.label}</Text>
            </View>
          </View>
          <Text style={styles.place} numberOfLines={1}>
            {place || 'Logement'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {shortDate(r.dateDebut)} → {shortDate(r.dateFin)} · {nuits} nuit{nuits > 1 ? 's' : ''}
            {r.nbPersonnes ? ` · ${r.nbPersonnes} voy.` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.foot}>
        <View style={[styles.stageDot, { backgroundColor: stageTone.dot }]} />
        <Text style={[styles.stage, stage.tone === 'gold' && styles.stageGold, stage.tone === 'red' && styles.stageRed]} numberOfLines={1}>
          {stage.text}
        </Text>
        {r.statut !== 'CANCELLED' && r.statut !== 'EXPIRED' && payout > 0 && (
          <Text style={styles.amount}>
            {fcfa(payout)} <Text style={styles.amountUnit}>FCFA</Text>
          </Text>
        )}
        <ChevronRight size={16} color={colors.neutral[400]} />
      </View>

      {cash > 0 && !isPast && (
        <View style={styles.cash}>
          <Banknote size={13} color={colors.gold[700]} />
          <Text style={styles.cashText} numberOfLines={1}>
            + {fcfa(cash)} FCFA de solde à encaisser à l’arrivée
          </Text>
        </View>
      )}

      {isDecision && (
        <View style={styles.decisionCta}>
          <Text style={styles.decisionCtaText}>Voir la demande et répondre</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardDecision: { borderColor: colors.gold[300], borderWidth: 1.5 },
  cardPast: { backgroundColor: colors.neutral[50] },
  top: { flexDirection: 'row', gap: 12 },
  dateTile: { width: 54, height: 62, borderRadius: 16, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  dateTilePast: { backgroundColor: colors.neutral[100] },
  dateDay: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, lineHeight: 27, color: '#FFFFFF' },
  dateDayPast: { color: colors.neutral[600] },
  dateMonth: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1, color: colors.lime[400] },
  dateMonthPast: { color: colors.neutral[500] },
  main: { flex: 1, minWidth: 0, gap: 3, justifyContent: 'center' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatar: { width: 22, height: 22, borderRadius: 11 },
  avatarEmpty: { backgroundColor: colors.forest[100], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: INK },
  guest: { flexShrink: 1, fontFamily: typography.fontBodyBold, fontSize: 16, color: colors.neutral[900] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 8, borderRadius: radius.pill, marginLeft: 'auto' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 10.5 },
  place: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[700] },
  meta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[500] },
  divider: { height: 1, backgroundColor: colors.neutral[100] },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageDot: { width: 7, height: 7, borderRadius: 4 },
  stage: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 12.5, color: colors.neutral[700] },
  stageGold: { color: colors.gold[700] },
  stageRed: { color: colors.error[700] },
  amount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 16, color: colors.neutral[900] },
  amountUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 10.5, color: colors.neutral[500] },
  cash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
  },
  cashText: { flexShrink: 1, fontFamily: typography.fontBodyBold, fontSize: 11.5, color: colors.gold[700] },
  decisionCta: { height: 44, borderRadius: radius.pill, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  decisionCtaText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },
});
