import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CircleEllipsis, CreditCard, Home, KeyRound, Lock } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { BottomSheet } from '../../../calendar/components/BottomSheet';
import { formatFCFA } from '../../../owner-home/lib/format';
import type { DemandeFraisReservation } from '../../types/reservation-detail.types';
import { DISPUTE_MOTIFS, REFUSE_MOTIFS, type TenantActions } from '../hooks/useTenantActions';
import { INK, InfoNote, PillButton, tap } from './ui';

const REFUSE_ICONS = { ACCES_IMPOSSIBLE: KeyRound, NON_CONFORMITE: Home, DEGATS: AlertTriangle, AUTRE: CircleEllipsis } as const;

// ── Refuser l'état des lieux d'entrée ────────────────────────────────────────

export function RefuseCheckinSheet({
  visible,
  amountLabel,
  actions,
  onClose,
}: {
  visible: boolean;
  amountLabel: string;
  actions: TenantActions;
  onClose: () => void;
}) {
  const [motif, setMotif] = useState<string>('NON_CONFORMITE');
  const [comment, setComment] = useState('');
  const tooShort = comment.trim().length < 10;

  const submit = async () => {
    if (await actions.refuseCheckin(motif, comment.trim())) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Qu’est-ce qui ne va pas ?"
      subtitle="Votre paiement reste bloqué pendant l’examen."
      footer={
        <View style={styles.footer}>
          <PillButton label="Retour" variant="ghost" onPress={onClose} />
          <PillButton
            label="Envoyer le signalement"
            variant="danger"
            flex={2}
            onPress={submit}
            disabled={tooShort}
            loading={actions.pending === 'refuse-checkin'}
          />
        </View>
      }
    >
      <View style={styles.grid} accessibilityRole="radiogroup">
        {REFUSE_MOTIFS.map((m) => {
          const active = motif === m.key;
          const Icon = REFUSE_ICONS[m.key];
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                tap();
                setMotif(m.key);
              }}
              style={[styles.tile, active && styles.tileActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Icon size={20} color={active ? colors.lime[400] : colors.forest[600]} strokeWidth={2} />
              <Text style={[styles.tileTitle, active && { color: colors.neutral[50] }]}>{m.label}</Text>
              <Text style={[styles.tileHint, active && { color: '#C9DBD1' }]}>{m.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>DÉCRIVEZ PRÉCISÉMENT</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Ex. : les photos montraient une cuisine équipée, il n’y a qu’une plaque hors service."
        placeholderTextColor={colors.neutral[400]}
        style={styles.textarea}
        accessibilityLabel="Description du problème"
      />
      {tooShort && comment.length > 0 && <Text style={styles.hint}>10 caractères minimum.</Text>}

      <InfoNote icon={<Lock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
        Un litige est ouvert, l’hôte est prévenu et vos {amountLabel} restent gelés jusqu’à la décision de l’équipe Paixi.
      </InfoNote>
    </BottomSheet>
  );
}

// ── Signaler un problème (pendant ou après le séjour) ────────────────────────

export function ReportProblemSheet({ visible, actions, onClose }: { visible: boolean; actions: TenantActions; onClose: () => void }) {
  const [motif, setMotif] = useState<string>(DISPUTE_MOTIFS[0].key);
  const [description, setDescription] = useState('');
  const tooShort = description.trim().length < 10;

  const submit = async () => {
    if (await actions.openDispute(motif, description)) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Signaler un problème"
      subtitle="Un médiateur Paixi examine votre dossier."
      footer={
        <View style={styles.footer}>
          <PillButton label="Annuler" variant="ghost" onPress={onClose} />
          <PillButton
            label="Envoyer"
            variant="danger"
            flex={2}
            onPress={submit}
            disabled={tooShort}
            loading={actions.pending === 'open-dispute'}
          />
        </View>
      }
    >
      <View style={styles.chips}>
        {DISPUTE_MOTIFS.map((m) => {
          const active = motif === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                tap();
                setMotif(m.key);
              }}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text style={[styles.chipText, active && { color: colors.neutral[50] }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.label}>QUE S’EST-IL PASSÉ ?</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Décrivez le problème le plus précisément possible."
        placeholderTextColor={colors.neutral[400]}
        style={styles.textarea}
        accessibilityLabel="Description du problème"
      />
      <InfoNote icon={<Lock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
        Les fonds encore bloqués restent gelés pendant l’examen.
      </InfoNote>
    </BottomSheet>
  );
}

// ── Payer ou contester un supplément ─────────────────────────────────────────

const METHODS = [
  { key: 'WAVE', label: 'Wave', badge: 'W', color: '#1DC3F1' },
  { key: 'ORANGE_MONEY', label: 'Orange Money', badge: 'OM', color: '#FF7900' },
  { key: 'CARD', label: 'Carte bancaire', badge: null, color: INK },
] as const;

export function FeeSheet({
  fee,
  initialMode = 'pay',
  hostName,
  actions,
  onClose,
}: {
  fee: DemandeFraisReservation | null;
  initialMode?: 'pay' | 'contest';
  hostName: string;
  actions: TenantActions;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'pay' | 'contest'>(initialMode);
  const [method, setMethod] = useState<(typeof METHODS)[number]['key']>('WAVE');
  const [phone, setPhone] = useState('');
  if (!fee) return null;

  const needsPhone = method !== 'CARD';
  const amount = formatFCFA(fee.montant);

  const submit = async () => {
    const ok = mode === 'pay' ? await actions.payFee(fee.id, method, phone) : await actions.contestFee(fee.id, fee.titre);
    if (ok) onClose();
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={amount}
      subtitle={`${fee.titre} · demandé par ${hostName}`}
      footer={
        <PillButton
          label={mode === 'pay' ? `Payer ${amount}` : 'Contester ce supplément'}
          variant={mode === 'pay' ? 'lime' : 'danger'}
          onPress={submit}
          disabled={mode === 'pay' && needsPhone && phone.replace(/\D/g, '').length < 9}
          loading={actions.pending === 'pay-fee' || actions.pending === 'contest-fee'}
        />
      }
    >
      <View style={styles.segment} accessibilityRole="tablist">
        {(
          [
            { key: 'pay', label: 'Payer' },
            { key: 'contest', label: 'Contester' },
          ] as const
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => {
              tap();
              setMode(key);
            }}
            style={[styles.segmentItem, mode === key && styles.segmentItemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === key }}
          >
            <Text style={[styles.segmentText, mode === key && { color: colors.neutral[50] }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {fee.description ? <Text style={styles.quote}>« {fee.description} »</Text> : null}

      {mode === 'pay' ? (
        <>
          <Text style={styles.label}>MOYEN DE PAIEMENT</Text>
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => {
                  tap();
                  setMethod(m.key);
                }}
                style={[styles.method, active && styles.methodActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <View style={[styles.methodBadge, { backgroundColor: m.color }]}>
                  {m.badge ? <Text style={styles.methodBadgeText}>{m.badge}</Text> : <CreditCard size={16} color={colors.lime[400]} />}
                </View>
                <Text style={[styles.methodLabel, active && { fontFamily: typography.fontBodyBold }]}>{m.label}</Text>
                <View style={[styles.radio, active && styles.radioActive]} />
              </TouchableOpacity>
            );
          })}
          {needsPhone && (
            <>
              <Text style={styles.label}>NUMÉRO {method === 'WAVE' ? 'WAVE' : 'ORANGE MONEY'}</Text>
              <View style={styles.phone}>
                <Text style={styles.phonePrefix}>+221</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="77 123 45 67"
                  placeholderTextColor={colors.neutral[400]}
                  style={styles.phoneInput}
                  accessibilityLabel="Numéro de téléphone"
                />
              </View>
            </>
          )}
        </>
      ) : (
        <InfoNote icon={<AlertTriangle size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
          Vous ne payez rien en attendant : l’équipe Paixi examine la demande et tranche avec vous et l’hôte.
        </InfoNote>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48.5%',
    minHeight: 92,
    gap: 6,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  tileActive: { backgroundColor: INK, borderColor: INK },
  tileTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  tileHint: { fontFamily: typography.fontBody, fontSize: 11, lineHeight: 15, color: colors.neutral[600] },
  label: { marginTop: 14, marginBottom: 6, fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },
  textarea: {
    minHeight: 92,
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
    marginBottom: 12,
  },
  hint: { marginTop: -6, marginBottom: 10, fontFamily: typography.fontBody, fontSize: 12, color: colors.error[700] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.neutral[200], justifyContent: 'center', backgroundColor: colors.neutral[0] },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },
  segment: { flexDirection: 'row', alignSelf: 'flex-start', padding: 3, borderRadius: radius.pill, backgroundColor: colors.forest[50], marginBottom: 12 },
  segmentItem: { height: 34, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center' },
  segmentItemActive: { backgroundColor: INK },
  segmentText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },
  quote: { padding: 12, borderRadius: 14, backgroundColor: colors.gold[50], fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.gold[800] },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    marginBottom: 8,
  },
  methodActive: { borderWidth: 2, borderColor: INK },
  methodBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  methodBadgeText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: '#FFFFFF' },
  methodLabel: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 14, color: INK },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.neutral[300] },
  radioActive: { borderWidth: 6, borderColor: INK },
  phone: { flexDirection: 'row', height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.forest[600], backgroundColor: colors.neutral[0], overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: 14, alignSelf: 'center', fontFamily: typography.fontBodySemiBold, fontSize: 15, color: INK },
  phoneInput: { flex: 1, paddingHorizontal: 14, borderLeftWidth: 1, borderLeftColor: colors.neutral[200], fontFamily: typography.fontBodyMedium, fontSize: 16, color: INK },
});
