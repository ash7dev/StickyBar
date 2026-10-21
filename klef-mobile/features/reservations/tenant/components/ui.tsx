import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Check, ChevronLeft, CircleHelp, Lock, MessageCircle, Phone } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';

// Briques visuelles du détail de réservation locataire (maquettes « Séjour | Dossier »).

export const INK = colors.forest[950];
export const PAPER = colors.neutral[50];
export const MUTED_DARK = colors.forest[200];

export const tap = () => Haptics.selectionAsync().catch(() => {});

// ── Barre du haut : retour, Séjour | Dossier, aide ───────────────────────────

export type DetailTab = 'stay' | 'dossier';

export function StayTopBar({
  tab,
  onTab,
  onBack,
  onHelp,
}: {
  tab: DetailTab;
  onTab: (tab: DetailTab) => void;
  onBack: () => void;
  onHelp: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={onBack} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Retour">
        <ChevronLeft size={18} color={INK} strokeWidth={2.4} />
      </TouchableOpacity>
      <View style={styles.segment} accessibilityRole="tablist">
        {(
          [
            { key: 'stay', label: 'Séjour' },
            { key: 'dossier', label: 'Dossier' },
          ] as const
        ).map(({ key, label }) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => {
                tap();
                onTab(key);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onHelp} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="Aide">
        <CircleHelp size={18} color={INK} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

// ── Pastille de statut ───────────────────────────────────────────────────────

export type ChipTone = 'lime' | 'gold' | 'red' | 'green' | 'grey' | 'ink';

const CHIP: Record<ChipTone, { bg: string; fg: string; dot: string }> = {
  lime: { bg: 'rgba(211,242,110,0.16)', fg: colors.lime[400], dot: colors.lime[400] },
  ink: { bg: INK, fg: colors.lime[400], dot: colors.lime[400] },
  gold: { bg: colors.gold[50], fg: colors.gold[700], dot: colors.gold[400] },
  red: { bg: colors.error[50], fg: colors.error[700], dot: colors.error[500] },
  green: { bg: colors.success[50], fg: colors.success[700], dot: colors.success[500] },
  grey: { bg: colors.neutral[100], fg: colors.neutral[600], dot: colors.neutral[400] },
};

export function StatusChip({ label, tone }: { label: string; tone: ChipTone }) {
  const c = CHIP[tone];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── En-tête du séjour (carte sombre compacte) ────────────────────────────────

export function StayHero({
  photoUrl,
  chip,
  title,
  meta,
  dimmed,
}: {
  photoUrl?: string | null;
  chip: React.ReactNode;
  title: string;
  meta: string;
  dimmed?: boolean;
}) {
  return (
    <View style={[styles.hero, dimmed && styles.heroDimmed]}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={[styles.heroPhoto, dimmed && { opacity: 0.6 }]} contentFit="cover" />
      ) : (
        <View style={[styles.heroPhoto, { backgroundColor: colors.forest[800] }]} />
      )}
      <View style={styles.flex}>
        {chip}
        <Text style={[styles.heroTitle, dimmed && { color: colors.neutral[600] }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.heroMeta, dimmed && { color: colors.neutral[500] }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
    </View>
  );
}

/** Grand titre éditorial (jour J, terminé, litige…) : deux lignes, la seconde en vert. */
export function StageHeadline({ chip, line1, line2 }: { chip: React.ReactNode; line1: string; line2?: string }) {
  return (
    <View style={styles.headline}>
      {chip}
      <Text style={styles.headlineText}>
        {line1}
        {line2 ? <Text style={styles.headlineAccent}>{'\n'}{line2}</Text> : null}
      </Text>
    </View>
  );
}

// ── Carte « Maintenant » ─────────────────────────────────────────────────────

export type NowTone = 'white' | 'lime' | 'gold' | 'dark';

export function NowCard({
  tone = 'white',
  label = 'MAINTENANT',
  aside,
  children,
  style,
}: {
  tone?: NowTone;
  label?: string;
  aside?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const t = NOW[tone];
  return (
    <View style={[styles.now, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <View style={styles.nowTop}>
        <Text style={[styles.nowLabel, { color: t.label }]}>{label}</Text>
        {aside ? <Text style={[styles.nowAside, { color: t.label }]}>{aside}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const NOW: Record<NowTone, { bg: string; border: string; label: string }> = {
  white: { bg: colors.neutral[0], border: colors.neutral[200], label: colors.forest[600] },
  lime: { bg: colors.lime[400], border: colors.lime[400], label: colors.forest[800] },
  gold: { bg: colors.gold[50], border: colors.gold[200], label: colors.gold[700] },
  dark: { bg: INK, border: INK, label: colors.lime[400] },
};

export function NowTitle({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <Text style={[styles.nowTitle, light && { color: PAPER }]}>{children}</Text>;
}

export function Body({ children, light, style }: { children: React.ReactNode; light?: boolean; style?: object }) {
  return <Text style={[styles.body, light && { color: '#C9DBD1' }, style]}>{children}</Text>;
}

// ── Montant en grand ─────────────────────────────────────────────────────────

export function BigAmount({ amount, light, size = 34 }: { amount: string; light?: boolean; size?: number }) {
  return (
    <View style={styles.amountRow}>
      <Text style={[styles.amount, { fontSize: size }, light && { color: PAPER }]} numberOfLines={1} adjustsFontSizeToFit>
        {amount}
      </Text>
      <Text style={[styles.amountCur, light && { color: colors.lime[400] }]}>FCFA</Text>
    </View>
  );
}

// ── Frise du séquestre : payé → bloqué → versé ───────────────────────────────

export function EscrowTrack({ paidOn, step }: { paidOn: string; step: 'blocked' | 'released' }) {
  const released = step === 'released';
  return (
    <View style={styles.escrow}>
      <EscrowNode done label="Payé" sub={paidOn} />
      <View style={[styles.escrowLine, { backgroundColor: colors.forest[600] }]} />
      <EscrowNode current={!released} done={released} label="Bloqué" sub="chez Paixi" lock />
      <View style={[styles.escrowLine, { backgroundColor: released ? colors.forest[600] : colors.neutral[200] }]} />
      <EscrowNode done={released} label="Versé à l’hôte" sub="à votre arrivée" />
    </View>
  );
}

function EscrowNode({ done, current, label, sub, lock }: { done?: boolean; current?: boolean; label: string; sub: string; lock?: boolean }) {
  return (
    <View style={styles.escrowNode}>
      <View
        style={[
          styles.escrowDot,
          done && { backgroundColor: colors.forest[600], borderColor: colors.forest[600] },
          current && { backgroundColor: colors.lime[400], borderColor: colors.lime[400] },
        ]}
      >
        {current && lock ? <Lock size={14} color={INK} strokeWidth={2.4} /> : done ? <Check size={14} color={PAPER} strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.escrowLabel, !done && !current && { color: colors.neutral[600] }]}>{label}</Text>
      <Text style={styles.escrowSub}>{sub}</Text>
    </View>
  );
}

// ── Suivi vertical en étapes (paiement, remboursement, litige…) ─────────────

export type StepState = 'done' | 'current' | 'todo';

export function Steps({ items, light }: { items: Array<{ label: string; meta?: string; state: StepState }>; light?: boolean }) {
  return (
    <View style={styles.steps}>
      {items.map((s, i) => (
        <View key={i} style={styles.stepRow}>
          <View
            style={[
              styles.stepDot,
              s.state === 'done' && { backgroundColor: colors.forest[600], borderColor: colors.forest[600] },
              s.state === 'current' && { borderColor: light ? colors.lime[400] : colors.forest[600] },
            ]}
          >
            {s.state === 'done' ? <Check size={11} color={PAPER} strokeWidth={3.4} /> : null}
            {s.state === 'current' ? <View style={[styles.stepInner, light && { backgroundColor: colors.lime[400] }]} /> : null}
          </View>
          <Text
            style={[
              styles.stepLabel,
              s.state === 'current' && { fontFamily: typography.fontBodyBold },
              s.state === 'todo' && { color: light ? colors.forest[300] : colors.neutral[400] },
              light && s.state !== 'todo' && { color: PAPER },
            ]}
          >
            {s.label}
          </Text>
          {s.meta ? (
            <Text style={[styles.stepMeta, s.state === 'current' && { color: light ? colors.lime[400] : colors.forest[600] }]}>{s.meta}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── Fiche de l'hôte ──────────────────────────────────────────────────────────

export function HostRow({
  prenom,
  nom,
  phone,
  phoneLocked,
  subtitle,
}: {
  prenom: string;
  nom?: string;
  phone?: string | null;
  phoneLocked: boolean;
  subtitle?: string;
}) {
  const initials = `${prenom.charAt(0)}${nom?.charAt(0) ?? ''}`.toUpperCase();
  const canCall = !!phone && !phoneLocked;
  return (
    <View style={styles.host}>
      <View style={styles.hostAvatar}>
        <Text style={styles.hostInitials}>{initials}</Text>
      </View>
      <View style={styles.flex}>
        <Text style={styles.hostName}>
          {prenom}
          {nom ? ` ${nom.charAt(0)}.` : ''}
        </Text>
        <Text style={styles.hostSub} numberOfLines={1}>
          {subtitle ?? (phoneLocked ? 'Numéro visible 24 h avant l’arrivée' : 'Votre hôte')}
        </Text>
      </View>
      {canCall && (
        <>
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${phone}`)}
            style={styles.hostBtn}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${prenom}`}
          >
            <Phone size={17} color={INK} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(`sms:${phone}`)}
            style={styles.hostBtn}
            accessibilityRole="button"
            accessibilityLabel={`Écrire à ${prenom}`}
          >
            <MessageCircle size={17} color={INK} strokeWidth={2} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Ligne d'information (icône + texte) ──────────────────────────────────────

export function InfoNote({ icon, children, tone = 'mint' }: { icon: React.ReactNode; children: React.ReactNode; tone?: 'mint' | 'white' | 'red' }) {
  return (
    <View
      style={[
        styles.note,
        tone === 'white' && { backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
        tone === 'red' && { backgroundColor: colors.error[50] },
      ]}
    >
      <View style={styles.noteIcon}>{icon}</View>
      <Text style={[styles.noteText, tone === 'red' && { color: colors.error[700] }]}>{children}</Text>
    </View>
  );
}

// ── Barre d'action du bas ────────────────────────────────────────────────────

export function StickyBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.sticky, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>{children}</View>;
}

export function PillButton({
  label,
  onPress,
  variant = 'ink',
  icon,
  flex = 1,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'ink' | 'lime' | 'ghost' | 'danger' | 'dangerGhost';
  icon?: React.ReactNode;
  flex?: number;
  disabled?: boolean;
  loading?: boolean;
}) {
  const v = PILL[variant];
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled || loading}
      style={[styles.pill, { flex, backgroundColor: v.bg, borderColor: v.border }, (disabled || loading) && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {icon}
      <Text style={[styles.pillText, { color: v.fg }]} numberOfLines={1}>
        {loading ? 'Un instant…' : label}
      </Text>
    </TouchableOpacity>
  );
}

const PILL = {
  ink: { bg: INK, border: INK, fg: colors.lime[400] },
  lime: { bg: colors.lime[400], border: colors.lime[400], fg: INK },
  ghost: { bg: colors.neutral[0], border: colors.neutral[200], fg: INK },
  danger: { bg: colors.error[700], border: colors.error[700], fg: colors.neutral[0] },
  dangerGhost: { bg: colors.neutral[0], border: colors.error[100] ?? colors.error[50], fg: colors.error[700] },
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  roundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.forest[50] },
  segmentItem: { height: 34, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center' },
  segmentItemActive: { backgroundColor: INK },
  segmentText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },
  segmentTextActive: { color: PAPER },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', height: 26, paddingHorizontal: 10, borderRadius: radius.pill },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 11 },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 26, backgroundColor: INK },
  heroDimmed: { backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  heroPhoto: { width: 64, height: 64, borderRadius: 16 },
  heroTitle: { marginTop: 6, fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: PAPER },
  heroMeta: { marginTop: 1, fontFamily: typography.fontBody, fontSize: 12, color: MUTED_DARK },

  headline: { gap: 10 },
  headlineText: { fontFamily: typography.fontDisplaySemiBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.8, color: INK },
  headlineAccent: { color: colors.forest[600] },

  now: { gap: 12, padding: 18, borderRadius: 28, borderWidth: 1 },
  nowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nowLabel: { flexShrink: 1, fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.1 },
  nowAside: { fontFamily: typography.fontBodyBold, fontSize: 12 },
  nowTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, lineHeight: 25, letterSpacing: -0.3, color: INK },
  body: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600] },

  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  amount: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, letterSpacing: -0.8, color: INK },
  amountCur: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },

  escrow: { flexDirection: 'row', alignItems: 'flex-start' },
  escrowLine: { flex: 1, height: 2, marginTop: 15 },
  escrowNode: { width: 84, alignItems: 'center', gap: 4 },
  escrowDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowLabel: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK, textAlign: 'center' },
  escrowSub: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600], textAlign: 'center' },

  steps: { gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.forest[600] },
  stepLabel: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  stepMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  host: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  hostAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  hostInitials: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },
  hostName: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  hostSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600], marginTop: 1 },
  hostBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.forest[50] },
  noteIcon: { marginTop: 1 },
  noteText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12, lineHeight: 18, color: colors.forest[800] },

  sticky: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  pill: {
    height: 54,
    // flex dans un conteneur en colonne (pied des feuilles) écraserait la hauteur
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  pillText: { fontFamily: typography.fontBodyBold, fontSize: 15 },
});
