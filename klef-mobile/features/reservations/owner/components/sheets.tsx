import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CalendarX, Check, CircleEllipsis, Clock, Minus, Phone, Plus, ShieldCheck, Users, Wrench } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/api-client';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { BottomSheet } from '../../../calendar/components/BottomSheet';
import { formatFCFA } from '../../../owner-home/lib/format';
import { InfoNote, INK, PillButton, tap } from '../../tenant/components/ui';
import {
  CANCEL_REASONS,
  HOST_DISPUTE_MOTIFS,
  REFUSE_REASONS,
  type OwnerActions,
} from '../hooks/useOwnerActions';

const REFUSE_ICONS = { dates: CalendarX, maintenance: Wrench, capacity: Users, other: CircleEllipsis } as const;

// ── Accepter : horaires d'arrivée et de départ ───────────────────────────────

function shift(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(23 * 60 + 30, Math.max(0, h * 60 + m + minutes));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function TimeStepper({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <View style={styles.time}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeRow}>
        <TouchableOpacity onPress={() => { tap(); onChange(shift(value, -30)); }} style={styles.timeBtn} accessibilityLabel={`${label} : 30 minutes plus tôt`}>
          <Text style={styles.timeBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{value}</Text>
        <TouchableOpacity onPress={() => { tap(); onChange(shift(value, 30)); }} style={styles.timeBtn} accessibilityLabel={`${label} : 30 minutes plus tard`}>
          <Text style={styles.timeBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.timeHint}>{hint}</Text>
    </View>
  );
}

export function AcceptSheet({
  visible,
  guestName,
  payoutLabel,
  arrivalDay,
  departureDay,
  actions,
  onClose,
}: {
  visible: boolean;
  guestName: string;
  payoutLabel: string;
  arrivalDay: string;
  departureDay: string;
  actions: OwnerActions;
  onClose: () => void;
}) {
  const [arrival, setArrival] = useState('14:00');
  const [departure, setDeparture] = useState('12:00');
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`Accepter ${guestName}`}
      subtitle="Ces horaires seront envoyés au voyageur avec l’adresse."
      footer={
        <PillButton
          label={`Accepter · ${payoutLabel}`}
          loading={actions.pending === 'accept'}
          onPress={async () => {
            if (await actions.accept(arrival, departure)) onClose();
          }}
        />
      }
    >
      <View style={styles.timePair}>
        <TimeStepper label={`Arrivée · ${arrivalDay}`} value={arrival} onChange={setArrival} hint="à partir de" />
        <TimeStepper label={`Départ · ${departureDay}`} value={departure} onChange={setDeparture} hint="au plus tard" />
      </View>
      <View style={styles.list}>
        <Line icon={<Check size={15} color={colors.forest[600]} strokeWidth={2.6} />} title="Adresse et guide d’accueil" sub="envoyés tout de suite" />
        <Line icon={<Phone size={15} color={colors.forest[600]} strokeWidth={2.2} />} title="Numéros échangés" sub="24 h avant l’arrivée" />
        <Line icon={<Clock size={15} color={colors.forest[600]} strokeWidth={2.2} />} title="État des lieux d’entrée" sub="ouvert 4 h avant l’arrivée" />
      </View>
    </BottomSheet>
  );
}

// ── Refuser une demande ──────────────────────────────────────────────────────

export function RefuseSheet({ visible, guestName, actions, onClose }: { visible: boolean; guestName: string; actions: OwnerActions; onClose: () => void }) {
  const [reason, setReason] = useState<(typeof REFUSE_REASONS)[number]['key']>('dates');
  const [note, setNote] = useState('');
  const needsNote = reason === 'other' && note.trim().length < 3;

  const submit = async () => {
    const label = REFUSE_REASONS.find((r) => r.key === reason)!.label;
    if (await actions.refuse(note.trim() ? `${label} — ${note.trim()}` : label)) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Refuser la demande"
      subtitle={`${guestName} est remboursé intégralement, sans frais pour vous.`}
      footer={
        <View style={styles.footer}>
          <PillButton label="Retour" variant="ghost" onPress={onClose} />
          <PillButton label="Refuser" variant="danger" flex={2} disabled={needsNote} loading={actions.pending === 'refuse'} onPress={submit} />
        </View>
      }
    >
      <View style={styles.grid} accessibilityRole="radiogroup">
        {REFUSE_REASONS.map((r) => {
          const active = reason === r.key;
          const Icon = REFUSE_ICONS[r.key];
          return (
            <TouchableOpacity
              key={r.key}
              onPress={() => { tap(); setReason(r.key); }}
              style={[styles.tile, active && styles.tileActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Icon size={20} color={active ? colors.lime[400] : colors.forest[600]} strokeWidth={2} />
              <Text style={[styles.tileTitle, active && { color: colors.neutral[50] }]}>{r.label}</Text>
              <Text style={[styles.tileHint, active && { color: '#C9DBD1' }]}>{r.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.label}>UN MOT POUR {guestName.toUpperCase()} {reason === 'other' ? '' : '(FACULTATIF)'}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        placeholder="Ex. : désolé, un proche occupe l’appartement ce week-end."
        placeholderTextColor={colors.neutral[400]}
        style={styles.textarea}
        accessibilityLabel="Message au voyageur"
      />
    </BottomSheet>
  );
}

// ── Annuler une réservation confirmée ────────────────────────────────────────

const TIERS = [
  { label: 'Plus de 3 j', value: '0 FCFA' },
  { label: '24 h à 3 j', value: '2 500' },
  { label: 'Moins de 24 h', value: '10 000' },
];

export function CancelSheet({
  visible,
  guestName,
  penalty,
  actions,
  onClose,
}: {
  visible: boolean;
  guestName: string;
  penalty: { amount: number; tier: 0 | 1 | 2 };
  actions: OwnerActions;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof CANCEL_REASONS)[number]['key']>('unavailable');
  const [note, setNote] = useState('');
  const submit = async () => {
    const label = CANCEL_REASONS.find((r) => r.key === reason)!.label;
    if (await actions.cancel(note.trim() ? `${label} — ${note.trim()}` : label)) onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Annuler la réservation"
      subtitle="Plus vous annulez tôt, moins c’est coûteux pour vous et pour votre voyageur."
      footer={
        <View style={styles.footer}>
          <PillButton label="Garder" variant="ghost" onPress={onClose} />
          <PillButton
            label={penalty.amount ? `Annuler · −${formatFCFA(penalty.amount).replace(/\s*FCFA$/, '')}` : 'Annuler sans frais'}
            variant="danger"
            flex={2}
            disabled={reason === 'other' && note.trim().length < 3}
            loading={actions.pending === 'cancel'}
            onPress={submit}
          />
        </View>
      }
    >
      <View style={styles.tiers}>
        {TIERS.map((t, i) => {
          const on = i === penalty.tier;
          return (
            <View key={t.label} style={[styles.tier, on && styles.tierOn]}>
              {on && <Text style={styles.tierTag}>AUJOURD’HUI</Text>}
              <Text style={styles.tierLabel}>{t.label}</Text>
              <Text style={styles.tierValue}>{t.value}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.label}>POURQUOI ANNULEZ-VOUS ?</Text>
      <View style={styles.list}>
        {CANCEL_REASONS.map((r) => (
          <Radio key={r.key} label={r.label} active={reason === r.key} onPress={() => setReason(r.key)} />
        ))}
      </View>
      {reason === 'other' && (
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Précisez la raison"
          placeholderTextColor={colors.neutral[400]}
          style={[styles.textarea, { marginTop: 10 }]}
          accessibilityLabel="Raison de l’annulation"
        />
      )}
      <View style={{ height: 12 }} />
      <InfoNote tone="red" icon={<AlertTriangle size={15} color={colors.error[700]} strokeWidth={2.2} />}>
        {guestName} est remboursé à 100 %.
        {penalty.amount ? ` La pénalité de ${formatFCFA(penalty.amount)} est déduite de votre portefeuille.` : ''} Des annulations répétées suspendent vos annonces.
      </InfoNote>
    </BottomSheet>
  );
}

// ── Voyageurs en plus (seul supplément possible) ─────────────────────────────

interface ExtraGuestsEstimate {
  prevus: number;
  nbVoyageurs: number;
  capacite: number;
  parNuit: number;
  nuits: number;
  montant: number;
}

function apiMessage(err: unknown): string | null {
  const raw = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(' · ');
  return typeof raw === 'string' ? raw : null;
}

/**
 * L'hôte indique seulement le nombre réel de voyageurs : le montant est calculé par
 * le serveur avec la grille « tarif par voyageur » de l'annonce, puis réglé en espèces.
 */
export function FeeCreateSheet({
  visible,
  reservationId,
  guestName,
  booked,
  actions,
  onClose,
}: {
  visible: boolean;
  reservationId: string;
  guestName: string;
  booked: number;
  actions: OwnerActions;
  onClose: () => void;
}) {
  const [count, setCount] = useState(booked + 1);
  const [cash, setCash] = useState(false);

  const estimate = useQuery<ExtraGuestsEstimate>({
    queryKey: ['reservation', reservationId, 'extra-guests', count],
    queryFn: async () => (await apiClient.get(`/reservations/${reservationId}/frais/estimation`, { params: { voyageurs: count } })).data,
    enabled: visible,
    retry: false,
    staleTime: 60_000,
  });
  const calc = estimate.data;
  const error = estimate.error ? apiMessage(estimate.error) ?? 'Calcul impossible pour le moment.' : null;
  const max = calc?.capacite ?? Infinity;

  const submit = async () => {
    if (await actions.createFee(count, cash)) {
      setCash(false);
      onClose();
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Voyageurs en plus"
      subtitle={`La réservation prévoit ${booked} voyageur${booked > 1 ? 's' : ''}. Le supplément est calculé avec votre tarif par voyageur.`}
      footer={
        <PillButton
          label={calc ? `${cash ? 'Enregistrer' : `Envoyer à ${guestName}`} · ${formatFCFA(calc.montant)}` : 'Supplément indisponible'}
          disabled={!calc || estimate.isFetching}
          loading={actions.pending === 'fee'}
          onPress={submit}
        />
      }
    >
      <Text style={styles.label}>NOMBRE RÉEL DE VOYAGEURS</Text>
      <View style={styles.guestStepper}>
        <TouchableOpacity
          onPress={() => { tap(); setCount((c) => Math.max(booked + 1, c - 1)); }}
          disabled={count <= booked + 1}
          style={[styles.stepBtn, count <= booked + 1 && styles.stepBtnOff]}
          accessibilityLabel="Un voyageur de moins"
        >
          <Minus size={18} color={INK} />
        </TouchableOpacity>
        <View style={styles.guestCount}>
          <Text style={styles.guestCountValue}>{count}</Text>
          <Text style={styles.guestCountSub}>au lieu de {booked}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { tap(); setCount((c) => c + 1); }}
          disabled={count >= max}
          style={[styles.stepBtn, count >= max && styles.stepBtnOff]}
          accessibilityLabel="Un voyageur de plus"
        >
          <Plus size={18} color={INK} />
        </TouchableOpacity>
      </View>

      {calc ? (
        <View style={styles.calc}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Supplément par nuit</Text>
            <Text style={styles.calcValue}>{formatFCFA(calc.parNuit)}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Nuits restantes</Text>
            <Text style={styles.calcValue}>× {calc.nuits}</Text>
          </View>
          <View style={styles.calcDivider} />
          <View style={styles.calcRow}>
            <Text style={styles.calcTotalLabel}>À régler par {guestName}</Text>
            <Text style={styles.calcTotal}>{formatFCFA(calc.montant)}</Text>
          </View>
        </View>
      ) : error ? (
        <InfoNote tone="red" icon={<AlertTriangle size={15} color={colors.error[700]} strokeWidth={2.2} />}>
          {error}
        </InfoNote>
      ) : null}

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Déjà reçu en espèces</Text>
          <Text style={styles.switchSub}>Sinon, {guestName} vous le règle sur place ou le conteste</Text>
        </View>
        <Switch value={cash} onValueChange={setCash} trackColor={{ true: colors.forest[600], false: colors.neutral[200] }} thumbColor={colors.neutral[0]} />
      </View>
      <InfoNote tone="mint" icon={<ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
        Un dégât ou un problème ? Utilisez « Signaler un problème » : un médiateur Paixi tranche avec vos photos.
      </InfoNote>
    </BottomSheet>
  );
}

// ── Ouvrir un litige ─────────────────────────────────────────────────────────

const DISPUTE_MIN = 15;

export function HostDisputeSheet({ visible, initialMotif, actions, onClose }: { visible: boolean; initialMotif?: string; actions: OwnerActions; onClose: () => void }) {
  const [motif, setMotif] = useState<string>(initialMotif ?? HOST_DISPUTE_MOTIFS[0].key);
  const [description, setDescription] = useState('');
  const len = description.trim().length;
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Signaler un problème"
      subtitle="Un médiateur Paixi tranche en s’appuyant sur vos photos d’entrée et de sortie."
      footer={
        <View style={styles.footer}>
          <PillButton label="Annuler" variant="ghost" onPress={onClose} />
          <PillButton
            label="Ouvrir le litige"
            variant="danger"
            flex={2}
            disabled={len < DISPUTE_MIN}
            loading={actions.pending === 'dispute'}
            onPress={async () => {
              if (await actions.openDispute(motif, description)) onClose();
            }}
          />
        </View>
      }
    >
      <View style={styles.chips}>
        {HOST_DISPUTE_MOTIFS.map((m) => {
          const active = motif === m.key;
          return (
            <TouchableOpacity key={m.key} onPress={() => { tap(); setMotif(m.key); }} style={[styles.chip, active && styles.chipActive]} accessibilityRole="radio" accessibilityState={{ checked: active }}>
              <Text style={[styles.chipText, active && { color: colors.lime[400] }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.label}>QUE S’EST-IL PASSÉ ?</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Ex. : le miroir de la salle d’eau est fissuré, il était intact à l’entrée."
        placeholderTextColor={colors.neutral[400]}
        style={styles.textarea}
        accessibilityLabel="Description du problème"
      />
      <Text style={[styles.counter, len >= DISPUTE_MIN && { color: colors.forest[600] }]}>
        {len} caractère{len > 1 ? 's' : ''} · {DISPUTE_MIN} minimum
      </Text>
      <InfoNote icon={<ShieldCheck size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
        Vos retraits en attente sont suspendus le temps de l’examen, par précaution.
      </InfoNote>
    </BottomSheet>
  );
}

// ── Signaler un no-show ──────────────────────────────────────────────────────

export function NoshowSheet({ visible, guestName, actions, onClose }: { visible: boolean; guestName: string; actions: OwnerActions; onClose: () => void }) {
  const [comment, setComment] = useState('');
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`${guestName} ne s’est pas présenté ?`}
      subtitle="Vérifiez que vous avez bien essayé de le joindre."
      footer={
        <View style={styles.footer}>
          <PillButton label="Attendre" variant="ghost" onPress={onClose} />
          <PillButton
            label="Signaler le no-show"
            variant="danger"
            flex={2}
            loading={actions.pending === 'noshow'}
            onPress={async () => {
              if (await actions.signalNoshow(comment)) onClose();
            }}
          />
        </View>
      }
    >
      <View style={styles.list}>
        <Line n={1} title={`${guestName} reçoit une alerte urgente`} sub="notification et SMS" />
        <Line n={2} title="Le séjour est clôturé en no-show" sub="environ 15 min après, s’il ne valide pas son arrivée" />
        <Line n={3} title="Il arrive finalement ?" sub="Rouvrez son arrivée en un geste, depuis cet écran" />
      </View>
      <Text style={styles.label}>COMMENTAIRE (FACULTATIF)</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Ex. : appelé 3 fois à 15:30, 15:50 et 16:05, sans réponse."
        placeholderTextColor={colors.neutral[400]}
        style={styles.textarea}
        accessibilityLabel="Commentaire"
      />
    </BottomSheet>
  );
}

// ── Petites briques ──────────────────────────────────────────────────────────

function Radio({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={[styles.radioRow, active && styles.radioRowOn]} accessibilityRole="radio" accessibilityState={{ checked: active }}>
      <View style={[styles.radio, active && styles.radioOn]} />
      <Text style={[styles.radioLabel, active && { fontFamily: typography.fontBodyBold }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Line({ icon, n, title, sub }: { icon?: React.ReactNode; n?: number; title: string; sub: string }) {
  return (
    <View style={styles.line}>
      <View style={styles.lineIcon}>{icon ?? <Text style={styles.lineN}>{n}</Text>}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.lineTitle}>{title}</Text>
        <Text style={styles.lineSub}>{sub}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 10 },
  list: { gap: 8 },
  label: { marginTop: 16, marginBottom: 6, fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },

  timePair: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  time: { flex: 1, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[50] },
  timeLabel: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[600] },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  timeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.forest[50], alignItems: 'center', justifyContent: 'center' },
  timeBtnText: { fontFamily: typography.fontBodyBold, fontSize: 18, color: INK },
  timeValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 26, letterSpacing: -0.6, color: INK, fontVariant: ['tabular-nums'] },
  timeHint: { marginTop: 6, textAlign: 'center', fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48.5%', minHeight: 92, gap: 6, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  tileActive: { backgroundColor: INK, borderColor: INK },
  tileTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  tileHint: { fontFamily: typography.fontBody, fontSize: 11, lineHeight: 15, color: colors.neutral[600] },
  textarea: {
    minHeight: 84,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.forest[600],
    backgroundColor: colors.neutral[0],
    fontFamily: typography.fontBody,
    fontSize: 14,
    lineHeight: 20,
    color: INK,
    textAlignVertical: 'top',
  },
  counter: { marginTop: 6, marginBottom: 12, fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  tiers: { flexDirection: 'row', gap: 8 },
  tier: { flex: 1, gap: 3, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  tierOn: { borderWidth: 1.5, borderColor: colors.error[700], backgroundColor: colors.error[50] },
  tierTag: { fontFamily: typography.fontBodyBold, fontSize: 9, letterSpacing: 0.8, color: colors.error[700] },
  tierLabel: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  tierValue: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },

  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  radioRowOn: { borderWidth: 1.5, borderColor: INK, backgroundColor: '#F6FAEE' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.neutral[300] },
  radioOn: { borderWidth: 6, borderColor: INK },
  radioLabel: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 14, color: INK },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.neutral[200], justifyContent: 'center', backgroundColor: colors.neutral[0] },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },


  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200] },
  switchTitle: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: INK },
  switchSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  line: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.forest[50] },
  lineIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center' },
  lineN: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  lineTitle: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  lineSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  guestStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  stepBtnOff: { opacity: 0.35 },
  guestCount: { alignItems: 'center' },
  guestCountValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 40, lineHeight: 44, color: INK },
  guestCountSub: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[500] },
  calc: { gap: 8, padding: 14, borderRadius: 18, backgroundColor: colors.neutral[50], borderWidth: 1, borderColor: colors.neutral[200], marginBottom: 12 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  calcLabel: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  calcValue: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[900] },
  calcDivider: { height: 1, backgroundColor: colors.neutral[200] },
  calcTotalLabel: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.neutral[900] },
  calcTotal: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
});
