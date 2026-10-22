import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, CircleEllipsis, Home, KeyRound, Lock } from 'lucide-react-native';
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
        Un litige est ouvert, l’hôte est prévenu et votre paiement ({amountLabel}) reste gelé jusqu’à la décision de l’équipe Paixi.
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

// ── Contester un supplément « voyageurs en plus » ────────────────────────────

export function FeeSheet({
  fee,
  hostName,
  actions,
  onClose,
}: {
  fee: DemandeFraisReservation | null;
  hostName: string;
  actions: TenantActions;
  onClose: () => void;
}) {
  if (!fee) return null;
  const amount = formatFCFA(fee.montant);

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Contester le supplément"
      subtitle={`${fee.titre} · ${amount} · demandé par ${hostName}`}
      footer={
        <View style={styles.footer}>
          <PillButton label="Retour" variant="ghost" onPress={onClose} />
          <PillButton
            label="Contester"
            variant="danger"
            flex={1.6}
            loading={actions.pending === 'contest-fee'}
            onPress={async () => {
              if (await actions.contestFee(fee.id, fee.titre)) onClose();
            }}
          />
        </View>
      }
    >
      {fee.description ? <Text style={styles.quote}>« {fee.description} »</Text> : null}
      <InfoNote icon={<AlertTriangle size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
        Vous ne payez rien en attendant : un médiateur Paixi examine la demande avec vous et {hostName}, photos d’état des lieux à l’appui.
      </InfoNote>
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
  quote: { padding: 12, borderRadius: 14, backgroundColor: colors.gold[50], fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.gold[800] },
});
