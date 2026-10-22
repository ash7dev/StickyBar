import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, ShieldCheck } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { apiClient } from '../../../../shared/api/api-client';
import { BottomSheet } from '../../../calendar/components/BottomSheet';
import type { ManagedOwnerWallet } from '../../hooks/useManagerToday';
import { fmt } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from '../today/ui';

const MIN = 10_000;
const METHODS = [
  { key: 'WAVE', label: 'Wave', badge: 'W', color: '#1DC3F1' },
  { key: 'ORANGE_MONEY', label: 'Orange Money', badge: 'OM', color: '#FF7900' },
] as const;

/** Demander le reversement d'un solde propriétaire : montant, destination, puis Paixi vérifie et verse. */
export function PayoutSheet({
  owner,
  visible,
  onClose,
  onDone,
}: {
  owner: ManagedOwnerWallet | null;
  visible: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const max = Math.floor(owner?.soldeRetirable ?? 0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'WAVE' | 'ORANGE_MONEY'>('WAVE');
  const [phone, setPhone] = useState('');
  // Par défaut le numéro du propriétaire ; un autre numéro (un proche…) exige le nom du bénéficiaire
  const [target, setTarget] = useState<'OWNER' | 'OTHER'>('OWNER');
  const [beneficiary, setBeneficiary] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !owner) return;
    setAmount(String(max));
    setPhone((owner.telephone ?? '').replace(/^\+?221/, ''));
    setTarget(owner.telephone ? 'OWNER' : 'OTHER');
    setBeneficiary('');
    setError(null);
  }, [visible, owner, max]);

  if (!owner) return null;
  const value = Number(amount.replace(/\D/g, '')) || 0;
  const phoneDigits = phone.replace(/\D/g, '');
  const ownerPhone = (owner.telephone ?? '').replace(/\D/g, '').replace(/^221/, '');
  const other = target === 'OTHER';
  const ready = value >= MIN && value <= max && phoneDigits.length >= 9 && (!other || beneficiary.trim().length >= 3);

  const chooseTarget = (t: 'OWNER' | 'OTHER') => {
    Haptics.selectionAsync().catch(() => {});
    setTarget(t);
    setPhone(t === 'OWNER' ? ownerPhone : '');
  };
  const presets = [Math.min(100_000, max), Math.floor(max / 2 / 1000) * 1000, max].filter((v, i, a) => v >= MIN && a.indexOf(v) === i);

  const submit = async () => {
    if (!ready) return;
    setSending(true);
    setError(null);
    try {
      await apiClient.post(`/gestionnaire/proprietaires/${owner.id}/retrait`, {
        montant: value,
        methode: method,
        destinataire: phoneDigits.startsWith('221') ? `+${phoneDigits}` : `+221${phoneDigits}`,
        ...(other && { beneficiaire: beneficiary.trim() }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDone();
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const raw = err?.response?.data?.message;
      setError(Array.isArray(raw) ? raw.join(' · ') : raw ?? 'La demande a échoué. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Combien lui verser ?"
      subtitle={`Reversement pour ${owner.prenom} ${owner.nom} · ${fmt(max)} FCFA disponibles`}
      footer={
        <TouchableOpacity onPress={submit} disabled={!ready || sending} style={[styles.cta, (!ready || sending) && styles.ctaOff]} accessibilityRole="button">
          {sending ? (
            <ActivityIndicator color={LIME} />
          ) : (
            <Text style={styles.ctaText}>{value < MIN ? `Minimum ${fmt(MIN)} FCFA` : value > max ? 'Au-delà du solde retirable' : `Demander ${fmt(value)} FCFA`}</Text>
          )}
        </TouchableOpacity>
      }
    >
      <View style={styles.amountBox}>
        <TextInput
          value={amount ? fmt(Number(amount.replace(/\D/g, '') || 0)) : ''}
          onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          style={styles.amount}
          placeholder="0"
          placeholderTextColor={colors.neutral[300]}
          accessibilityLabel="Montant en FCFA"
        />
        <Text style={styles.amountUnit}>FCFA</Text>
        <View style={styles.presets}>
          {presets.map((p) => {
            const on = value === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAmount(String(p));
                }}
                style={[styles.preset, on && styles.presetOn]}
              >
                <Text style={[styles.presetText, on && { color: LIME }]}>{p === max ? `Tout · ${fmt(p)}` : fmt(p)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {owner.soldeGeleLitige > 0 || owner.dettePenalites > 0 ? (
        <Text style={styles.held}>
          {owner.soldeGeleLitige > 0 ? `${fmt(owner.soldeGeleLitige)} FCFA gelés par un litige` : ''}
          {owner.soldeGeleLitige > 0 && owner.dettePenalites > 0 ? ' · ' : ''}
          {owner.dettePenalites > 0 ? `${fmt(owner.dettePenalites)} FCFA de pénalités dues` : ''}
        </Text>
      ) : null}

      <Text style={styles.label}>VERS</Text>
      <View style={styles.methods}>
        {METHODS.map((m) => {
          const on = method === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setMethod(m.key);
              }}
              style={[styles.method, on && styles.methodOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
            >
              <View style={[styles.badge, { backgroundColor: m.color }]}>
                <Text style={styles.badgeText}>{m.badge}</Text>
              </View>
              <Text style={styles.methodLabel}>{m.label}</Text>
              <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={11} color={INK} strokeWidth={3.2} />}</View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.targets}>
        {(
          [
            ['OWNER', `Numéro de ${owner.prenom}`],
            ['OTHER', 'Un autre numéro'],
          ] as const
        ).map(([k, t]) => {
          const on = target === k;
          return (
            <TouchableOpacity key={k} onPress={() => chooseTarget(k)} style={[styles.targetItem, on && styles.targetOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Text style={[styles.targetText, on && { color: LIME }]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={[styles.phone, !other && styles.phoneLocked]}>
        <Text style={styles.prefix}>+221</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          editable={other}
          keyboardType="phone-pad"
          placeholder="77 123 45 67"
          placeholderTextColor={colors.neutral[400]}
          style={styles.phoneInput}
        />
      </View>
      {other && (
        <>
          <TextInput
            value={beneficiary}
            onChangeText={setBeneficiary}
            placeholder="Nom du bénéficiaire (ex. Awa Diop, sa sœur)"
            placeholderTextColor={colors.neutral[400]}
            style={styles.beneficiary}
            autoCapitalize="words"
            maxLength={80}
          />
          <Text style={styles.otherNote}>
            {owner.prenom} recevra une notification avec ce nom et ce numéro avant le versement.
          </Text>
        </>
      )}

      <View style={styles.note}>
        <ShieldCheck size={15} color={colors.forest[600]} />
        <Text style={styles.noteText}>
          Paixi vérifie puis verse sous 48 h. {owner.prenom} est prévenu, et la demande est tracée à votre nom.
        </Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  amountBox: { alignItems: 'center', padding: 16, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  amount: { fontFamily: typography.fontDisplaySemiBold, fontSize: 42, letterSpacing: -1.2, color: INK, textAlign: 'center', minWidth: 180, paddingVertical: 0 },
  amountUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: MUTED },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 },
  preset: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: LINE, justifyContent: 'center' },
  presetOn: { backgroundColor: INK, borderColor: INK },
  presetText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  held: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.gold[700], textAlign: 'center', marginTop: 8 },
  label: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: MUTED, marginTop: 16, marginBottom: 8 },
  methods: { flexDirection: 'row', gap: 8 },
  method: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  methodOn: { borderColor: INK, borderWidth: 1.5 },
  badge: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },
  methodLabel: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: LIME, borderColor: LIME },
  targets: { flexDirection: 'row', padding: 3, marginTop: 10, borderRadius: radius.pill, backgroundColor: '#EEF2EA' },
  targetItem: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  targetOn: { backgroundColor: INK },
  targetText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: MUTED },
  phoneLocked: { backgroundColor: colors.neutral[50] },
  beneficiary: { height: 50, marginTop: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', fontFamily: typography.fontBodyMedium, fontSize: 15, color: INK },
  otherNote: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.gold[700], marginTop: 6 },
  phone: { flexDirection: 'row', alignItems: 'center', height: 50, marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  prefix: { paddingHorizontal: 14, fontFamily: typography.fontBodyBold, fontSize: 15, color: INK, borderRightWidth: 1, borderRightColor: LINE, lineHeight: 50 },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontFamily: typography.fontBodyMedium, fontSize: 15, color: INK },
  note: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.forest[50], marginTop: 14 },
  noteText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.forest[800] },
  error: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.error[700], marginTop: 10 },
  cta: { height: 54, borderRadius: radius.pill, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.4 },
  ctaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: LIME },
});
