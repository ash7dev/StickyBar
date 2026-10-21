import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CircleAlert, Lock, Square, SquareCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { AppButton } from '../../../shared/components/ui/AppButton';
import { AppDateRangeCalendar, type DateRange } from '../../../shared/components/ui/AppDateRangeCalendar';
import type { BlockDraft, OwnerCalendarLogement } from '../types';
import { addDays, dayFromLocalDate, diffDays, formatLong, localDateFromDay } from '../lib/days';
import { apiErrorMessage, useCreateCalendarBlocks } from '../hooks/useOwnerCalendar';
import { BottomSheet } from './BottomSheet';

const MOTIFS = ['Usage personnel', 'Travaux / entretien', 'Réservé ailleurs', 'Autre'] as const;
type Motif = (typeof MOTIFS)[number];

interface BlockDatesSheetProps {
  logements: OwnerCalendarLogement[];
  /** Pré-remplissage depuis une sélection sur le calendrier */
  draft: BlockDraft | null;
  onClose: () => void;
}

/**
 * Bloquer une période sur un ou plusieurs logements.
 * À monter à chaque ouverture (l'état est initialisé depuis `draft`).
 */
export function BlockDatesSheet({ logements, draft, onClose }: BlockDatesSheetProps) {
  const createBlocks = useCreateCalendarBlocks();

  const [logementIds, setLogementIds] = useState<string[]>(
    () => draft?.logementIds ?? (logements.length === 1 ? [logements[0].id] : []),
  );
  // `to` = jour de fin exclu, comme un départ (convention du sélecteur et de l'API)
  const [range, setRange] = useState<DateRange>(() => ({
    from: draft ? localDateFromDay(draft.start) : null,
    to: draft ? localDateFromDay(draft.end) : null,
  }));
  const [motif, setMotif] = useState<Motif>(MOTIFS[0]);
  const [customMotif, setCustomMotif] = useState('');

  const start = range.from ? dayFromLocalDate(range.from) : null;
  const end = range.to ? dayFromLocalDate(range.to) : null;
  const nights = start && end ? diffDays(start, end) : 0;
  const finalMotif = motif === 'Autre' ? customMotif.trim() : motif;
  const canSubmit = logementIds.length > 0 && nights > 0 && !createBlocks.isPending;
  const allSelected = logementIds.length === logements.length;

  const toggleLogement = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setLogementIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const submit = () => {
    if (!canSubmit || !start || !end) return;
    createBlocks.mutate(
      { logementIds, dateDebut: start, dateFin: end, ...(finalMotif ? { motif: finalMotif } : {}) },
      { onSuccess: onClose },
    );
  };

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title="Bloquer des dates"
      subtitle="Les voyageurs ne pourront pas réserver ces nuits."
      icon={<Lock size={18} color={colors.forest[700]} strokeWidth={2.2} />}
      footer={
        <AppButton
          fullWidth
          label={
            createBlocks.isPending
              ? 'Blocage…'
              : nights > 0
                ? `Bloquer ${nights} nuit${nights > 1 ? 's' : ''}`
                : 'Choisissez les dates'
          }
          onPress={submit}
          disabled={!canSubmit}
          loading={createBlocks.isPending}
          size="lg"
        />
      }
    >
      {createBlocks.isError && (
        <View style={styles.error} accessibilityRole="alert">
          <CircleAlert size={15} color={colors.error[700]} />
          <Text style={styles.errorText}>
            {apiErrorMessage(createBlocks.error, 'Impossible de bloquer ces dates.')}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logements</Text>
          {logements.length > 1 && (
            <TouchableOpacity onPress={() => setLogementIds(allSelected ? [] : logements.map((l) => l.id))}>
              <Text style={styles.link}>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</Text>
            </TouchableOpacity>
          )}
        </View>
        {logements.map((l) => {
          const checked = logementIds.includes(l.id);
          const CheckIcon = checked ? SquareCheck : Square;
          return (
            <TouchableOpacity
              key={l.id}
              activeOpacity={0.8}
              onPress={() => toggleLogement(l.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              style={[styles.option, checked && styles.optionActive]}
            >
              <CheckIcon size={20} color={checked ? colors.forest[600] : colors.neutral[400]} />
              <Text style={styles.optionText} numberOfLines={1}>
                {l.titre}
              </Text>
              <Text style={styles.optionMeta}>{l.ville}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Période</Text>
        <AppDateRangeCalendar value={range} onChange={setRange} minNights={1} />
        {start && end && (
          <Text style={styles.summary}>
            Du {formatLong(start)} au {formatLong(addDays(end, -1))} inclus
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Motif</Text>
        <View style={styles.motifs}>
          {MOTIFS.map((m) => {
            const active = motif === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMotif(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.motif, active && styles.motifActive]}
              >
                <Text style={[styles.motifText, active && styles.motifTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {motif === 'Autre' && (
          <TextInput
            value={customMotif}
            onChangeText={setCustomMotif}
            maxLength={200}
            placeholder="Précisez (facultatif)"
            placeholderTextColor={colors.neutral[400]}
            accessibilityLabel="Motif personnalisé"
            style={styles.input}
          />
        )}
      </View>

      <Text style={styles.hint}>
        Si ces dates touchent un blocage existant, les deux sont fusionnés automatiquement.
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  error: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  errorText: { flex: 1, fontFamily: typography.fontBodyMedium, fontSize: 12, color: colors.error[700] },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.neutral[900] },
  link: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.link },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  optionActive: { borderColor: colors.forest[500], backgroundColor: colors.forest[50] },
  optionText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[900] },
  optionMeta: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  summary: { fontFamily: typography.fontBodyMedium, fontSize: 12, color: colors.forest[700] },
  motifs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  motif: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    justifyContent: 'center',
  },
  motifActive: { backgroundColor: colors.forest[600], borderColor: colors.forest[600] },
  motifText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[900] },
  motifTextActive: { color: colors.neutral[0] },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.fontBody,
    fontSize: 14,
    color: colors.neutral[900],
  },
  hint: { fontFamily: typography.fontBody, fontSize: 11.5, color: colors.neutral[600] },
});
