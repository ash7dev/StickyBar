import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react-native';
import { colors, radius, typography } from '../shared/theme/tokens';
import { apiClient } from '../shared/api/api-client';
import { useAuthStore } from '../features/auth/stores/auth.store';
import { BottomSheet } from '../features/calendar/components/BottomSheet';
import { InfoNote, INK, PAPER, PillButton, Steps, tap } from '../features/reservations/tenant/components/ui';
import { formatAmount } from '../features/owner-home/lib/format';
import { apiMessage, depositOf, nightsBetween, rangeLabel, usePricePreview } from '../features/booking/lib/booking';
import { useGatedAction } from '../shared/hooks/useGatedAction';
import { TenantActionGateModal } from '../shared/components/gate/TenantActionGateModal';

type Timing = 'DEPOSIT' | 'FULL';
type Operator = 'WAVE' | 'ORANGE_MONEY';

const OPERATORS: Record<Operator, { label: string; logo: number }> = {
  WAVE: { label: 'Wave', logo: require('../assets/images/wavelogo.jpeg') },
  ORANGE_MONEY: { label: 'Orange Money', logo: require('../assets/images/orangeMoneylogo.png') },
};

/** « MAGATH » ou « magath » → « Magath » */
const nameCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase());

/**
 * Récapitulatif et paiement : un montant du jour, le chemin de l'argent, trois lignes.
 * Tous les montants viennent de l'API (price-preview) ; l'acompte suit create-reservation.
 */
export default function ReserverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ listingId?: string; dateDebut?: string; dateFin?: string; personnes?: string }>();
  const user = useAuthStore((s) => s.user);

  const listingId = params.listingId ?? '';
  const start = params.dateDebut ?? '';
  const end = params.dateFin ?? '';
  const guests = Number(params.personnes) || 1;
  const nights = nightsBetween(start, end);

  const [timing, setTiming] = useState<Timing>('DEPOSIT');
  const [operator, setOperator] = useState<Operator>('WAVE');
  const [phone, setPhone] = useState((user as { telephone?: string } | null)?.telephone?.replace(/^\+?221/, '') ?? '');
  const [useCoins, setUseCoins] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // On peut arriver ici juste après la connexion : on revient à l'annonce si l'historique est vide
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((listingId ? `/listing/${listingId}` : '/(tenant)/explorer') as never);
  }, [router, listingId]);

  // Profil, téléphone, identité : vérifiés ici aussi (le retour après connexion saute la fiche annonce)
  const gate = useGatedAction(useCallback(() => {}, []));
  const triggerGate = gate.trigger;
  // Une seule vérification par utilisateur : la resynchronisation du profil modifie `user`
  // et ne doit pas relancer la vérification en boucle
  const userId = user?.id;
  useEffect(() => {
    if (userId) triggerGate();
  }, [userId, triggerGate]);

  const listingQ = useQuery({
    queryKey: ['listing-checkout', listingId],
    queryFn: async () => {
      const res = await apiClient.get(`/listings/${listingId}`);
      return res.data?.data ?? res.data;
    },
    enabled: !!listingId,
  });
  const coinsQ = useQuery({
    queryKey: ['teranga', 'me'],
    queryFn: async () => {
      const res = await apiClient.get('/teranga-club/me');
      return Number((res.data?.data ?? res.data)?.soldeCoins ?? 0);
    },
    retry: false,
  });
  const price = usePricePreview(listingId, start, end, guests);

  const listing = listingQ.data;
  const hostName: string = listing?.proprietaire?.prenom ? nameCase(listing.proprietaire.prenom) : 'l’hôte';
  const photo: string | undefined = Array.isArray(listing?.photos)
    ? typeof listing.photos[0] === 'string'
      ? listing.photos[0]
      : listing.photos[0]?.url
    : undefined;
  const coins = coinsQ.data ?? 0;

  const amounts = useMemo(() => {
    const total = price.data?.totalLocataire ?? 0;
    const deposit = depositOf(total, listing?.acomptePourcentage);
    const isDeposit = timing === 'DEPOSIT' && deposit != null;
    const base = isDeposit ? deposit! : total;
    // Comme l'API : les coins se déduisent du montant encaissé aujourd'hui
    const coinsUsed = useCoins ? Math.min(coins, base) : 0;
    return { total, deposit, isDeposit, today: base - coinsUsed, coinsUsed, balance: isDeposit ? total - deposit! : 0 };
  }, [price.data, listing?.acomptePourcentage, timing, useCoins, coins]);

  const pct = Number(listing?.acomptePourcentage) || 30;
  // Même règle que create-reservation : âge minimum du logement (18 ans par défaut)
  const birth = (user as { dateNaissance?: string | null } | null)?.dateNaissance;
  const ageMin = Number(listing?.ageMin) || 18;
  const age = birth
    ? (() => {
        const b = new Date(birth);
        const t = new Date();
        let a = t.getFullYear() - b.getFullYear();
        if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
        return a;
      })()
    : null;
  const tooYoung = age !== null && age < ageMin;
  const phoneOk = phone.replace(/\D/g, '').length >= 9;
  const op = OPERATORS[operator];

  const pay = async () => {
    setError(null);
    if (!phoneOk) {
      setMethodOpen(true);
      return;
    }
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const res = await apiClient.post('/reservations', {
        logementId: listingId,
        dateDebut: start,
        dateFin: end,
        nbPersonnes: guests,
        typePaiement: amounts.isDeposit ? 'DEPOSIT' : 'FULL',
        fournisseur: operator,
        telephone: `+221${phone.replace(/\D/g, '')}`,
        useCoins,
      });
      const data = res.data?.data ?? res.data;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCreatedId(data?.id ?? data?.reservationId ?? '');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(apiMessage(err, 'Impossible de valider la réservation. Vérifiez vos informations.'));
    } finally {
      setSaving(false);
    }
  };

  // ── Demande envoyée ─────────────────────────────────────────────────────
  if (createdId !== null) {
    return (
      <View style={styles.screen}>
        <View style={[styles.doneTop, { paddingTop: insets.top + 50 }]}>
          <View style={styles.doneCheck}>
            <Check size={30} color={INK} strokeWidth={3} />
          </View>
          <Text style={styles.doneTitle}>
            Demande envoyée{'\n'}
            <Text style={{ color: colors.lime[400] }}>à {hostName}.</Text>
          </Text>
          <Text style={styles.doneText}>
            {formatAmount(amounts.today)} FCFA sont bloqués chez Paixi. {hostName} a 48 h au plus pour répondre.
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.doneBody}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>LA SUITE</Text>
            <Steps
              items={[
                { label: 'Paiement reçu et bloqué', meta: `${op.label} · ${formatAmount(amounts.today)}`, state: 'done' },
                { label: `${hostName} accepte`, meta: 'on vous prévient', state: 'current' },
                { label: 'Adresse et guide d’accueil', meta: 'dès l’acceptation', state: 'todo' },
                {
                  label: `Arrivée ${rangeLabel(start, end).split(' → ')[0]}`,
                  meta: amounts.balance ? `solde ${formatAmount(amounts.balance)} sur place` : undefined,
                  state: 'todo',
                },
              ]}
            />
          </View>
          <InfoNote icon={<Lock size={15} color={colors.forest[600]} strokeWidth={2.2} />}>
            {hostName} refuse ou ne répond pas à temps ? Vous êtes remboursé intégralement, automatiquement.
          </InfoNote>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 4, flexDirection: 'row' }]}>
          <PillButton label="Accueil" variant="ghost" onPress={() => router.replace('/(tenant)/explorer' as never)} />
          <PillButton
            label="Suivre ma réservation"
            flex={1.6}
            onPress={() => router.replace((createdId ? `/reservation/${createdId}` : '/(tenant)/reservations') as never)}
          />
        </View>
      </View>
    );
  }

  const header = (
    <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={goBack} style={styles.round} accessibilityRole="button" accessibilityLabel="Retour">
        <ChevronLeft size={18} color={INK} strokeWidth={2.4} />
      </TouchableOpacity>
      <Text style={styles.topTitle}>Confirmer et payer</Text>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 1 && styles.dotOn, i < 1 && { backgroundColor: INK }]} />
        ))}
      </View>
    </View>
  );

  if (!listingId || !nights) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.center}>
          <AlertTriangle size={30} color={colors.error[600]} />
          <Text style={styles.centerTitle}>Réservation incomplète</Text>
          <Text style={styles.centerText}>Repartez de l’annonce pour choisir vos dates.</Text>
          <PillButton label="Retour" variant="ghost" flex={0} onPress={goBack} />
        </View>
      </View>
    );
  }

  const loading = listingQ.isLoading || price.isLoading;

  return (
    <View style={styles.screen}>
      {header}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest[600]} />
          <Text style={styles.centerText}>On calcule votre prix exact…</Text>
        </View>
      ) : price.error ? (
        <View style={styles.center}>
          <AlertTriangle size={30} color={colors.gold[700]} />
          <Text style={styles.centerTitle}>Ces dates ne sont plus possibles</Text>
          <Text style={styles.centerText}>{apiMessage(price.error, 'Le logement n’est pas disponible sur ces dates.')}</Text>
          <PillButton label="Changer mes dates" flex={0} onPress={goBack} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Le montant du jour, en grand */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>VOUS PAYEZ AUJOURD’HUI</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroAmount} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(amounts.today)}
              </Text>
              <Text style={styles.heroCur}>FCFA</Text>
            </View>
            <TouchableOpacity onPress={() => { tap(); setShowDetail((v) => !v); }} style={styles.detailChip} hitSlop={6} accessibilityRole="button">
              <Text style={styles.heroSub}>
                sur {formatAmount(amounts.total)} FCFA · frais inclus
              </Text>
              <Text style={styles.detailLink}>{showDetail ? 'Masquer' : 'Détail'}</Text>
            </TouchableOpacity>
          </View>

          {amounts.deposit != null && (
            <View style={styles.segment} accessibilityRole="tablist">
              {(
                [
                  { key: 'DEPOSIT', label: `Acompte ${pct} %` },
                  { key: 'FULL', label: 'Tout payer' },
                ] as const
              ).map((t) => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => { tap(); setTiming(t.key); }}
                  style={[styles.segItem, timing === t.key && styles.segItemOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: timing === t.key }}
                >
                  <Text style={[styles.segText, timing === t.key && { color: PAPER }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showDetail && price.data && (
            <View style={[styles.card, { gap: 8 }]}>
              <Line label={`${formatAmount(price.data.prixNuitEffectif)} × ${nights} nuit${nights > 1 ? 's' : ''}`} value={formatAmount(price.data.prixNuitEffectif * nights)} />
              {price.data.reductionNuits > 0 && <Line label="Réductions" value={`− ${formatAmount(price.data.reductionNuits)}`} />}
              <Line label="Frais de service Paixi" value={formatAmount(price.data.montantCommission)} />
              {amounts.coinsUsed > 0 && <Line label="Teranga Coins" value={`− ${formatAmount(amounts.coinsUsed)}`} />}
              <View style={styles.sep} />
              <Line label="Total du séjour" value={`${formatAmount(amounts.total)} FCFA`} strong />
            </View>
          )}

          {/* Le chemin de l'argent */}
          <View style={styles.frise}>
            <View style={styles.friseLine} />
            <Node state="now" title="AUJOURD’HUI" amount={formatAmount(amounts.today)} sub={`par ${op.label}, bloqué chez Paixi`} />
            {amounts.isDeposit ? (
              <Node state="later" title="À L’ARRIVÉE" amount={formatAmount(amounts.balance)} sub={`à régler à ${hostName}`} />
            ) : null}
            <Node state="host" title="ENTRÉE VALIDÉE" sub={`${hostName} reçoit ${amounts.isDeposit ? 'l’acompte' : 'le paiement'}`} />
          </View>

          <View style={styles.list}>
            <Row
              label="Séjour"
              value={listing?.titre ?? 'Votre logement'}
              sub={`${rangeLabel(start, end)} · ${nights} nuit${nights > 1 ? 's' : ''} · ${guests} voyageur${guests > 1 ? 's' : ''}`}
              lead={photo ? <Image source={{ uri: photo }} style={styles.lead} contentFit="cover" /> : <View style={[styles.lead, { backgroundColor: colors.forest[800] }]} />}
              onPress={goBack}
            />
            <Row
              label="Payer avec"
              value={phoneOk ? `${op.label} · ${phone}` : `${op.label} · numéro à saisir`}
              lead={<Brand op={operator} size={42} />}
              onPress={() => setMethodOpen(true)}
              last={coins <= 0}
            />
            {coins > 0 && (
              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <View style={[styles.lead, styles.coinLead]}>
                  <Text style={{ fontSize: 18 }}>🪙</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowLabel}>Teranga Coins</Text>
                  <Text style={styles.rowValue}>{formatAmount(coins)} disponibles</Text>
                </View>
                <Switch value={useCoins} onValueChange={setUseCoins} trackColor={{ true: colors.forest[600], false: colors.neutral[200] }} thumbColor={colors.neutral[0]} />
              </View>
            )}
          </View>

          {tooYoung && (
            <InfoNote tone="red" icon={<AlertTriangle size={15} color={colors.error[700]} strokeWidth={2.2} />}>
              Ce logement est réservé aux voyageurs de {ageMin} ans et plus.
            </InfoNote>
          )}

          {error && (
            <InfoNote tone="red" icon={<AlertTriangle size={15} color={colors.error[700]} strokeWidth={2.2} />}>
              {error}
            </InfoNote>
          )}
        </ScrollView>
      )}

      {!loading && !price.error && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
          <Text style={styles.footNote}>
            Remboursé à 100 % si {hostName} refuse. En payant, vous acceptez les{' '}
            <Text style={styles.underline} onPress={() => router.push('/cgu' as never)}>
              conditions d’annulation
            </Text>
          </Text>
          <View style={styles.payRow}>
            <PillButton
              label={`Payer ${formatAmount(amounts.today)} FCFA`}
              icon={<Brand op={operator} size={26} />}
              loading={saving}
              disabled={tooYoung}
              onPress={pay}
            />
          </View>
          <View style={styles.secure}>
            <Lock size={11} color={colors.neutral[500]} strokeWidth={2.4} />
            <Text style={styles.secureText}>Paiement sécurisé · versé à {hostName} seulement à votre arrivée</Text>
          </View>
        </View>
      )}

      <TenantActionGateModal
        visible={gate.gateState.open}
        steps={gate.gateState.steps}
        block={gate.gateState.block}
        onComplete={gate.complete}
        onCancel={() => {
          gate.cancel();
          goBack();
        }}
      />

      {/* Moyen de paiement */}
      <BottomSheet
        visible={methodOpen}
        onClose={() => setMethodOpen(false)}
        title="Payer avec"
        subtitle="Vous validerez le paiement dans l’app de votre opérateur."
        footer={<PillButton label="Valider" disabled={!phoneOk} onPress={() => setMethodOpen(false)} />}
      >
        <View style={{ gap: 8 }}>
          {(Object.keys(OPERATORS) as Operator[]).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => { tap(); setOperator(k); }}
              style={[styles.method, operator === k && styles.methodOn]}
              accessibilityRole="radio"
              accessibilityState={{ checked: operator === k }}
            >
              <Brand op={k} size={34} />
              <Text style={styles.methodLabel}>{OPERATORS[k].label}</Text>
              <View style={[styles.radio, operator === k && styles.radioOn]} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.eyebrow, { marginTop: 16, marginBottom: 6 }]}>NUMÉRO {op.label.toUpperCase()}</Text>
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
      </BottomSheet>
    </View>
  );
}

function Brand({ op, size }: { op: Operator; size: number }) {
  return <Image source={OPERATORS[op].logo} style={{ width: size, height: size, borderRadius: size * 0.28 }} contentFit="cover" />;
}

function Node({ state, title, amount, sub }: { state: 'now' | 'later' | 'host'; title: string; amount?: string; sub: string }) {
  return (
    <View style={styles.node}>
      <View style={[styles.nodeDot, state === 'now' && styles.nodeNow, state === 'host' && styles.nodeHost]} />
      <Text style={styles.nodeTitle}>{title}</Text>
      {amount ? (
        <Text style={styles.nodeAmount} numberOfLines={1} adjustsFontSizeToFit>
          {amount}
        </Text>
      ) : (
        <Check size={18} color={colors.forest[600]} strokeWidth={3} />
      )}
      <Text style={styles.nodeSub}>{sub}</Text>
    </View>
  );
}

function Row({ label, value, sub, lead, onPress, last }: { label: string; value: string; sub?: string; lead: React.ReactNode; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={[styles.row, last && { borderBottomWidth: 0 }]} accessibilityRole="button">
      {lead}
      <View style={styles.flex}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={2}>{sub}</Text> : null}
      </View>
      <ChevronRight size={16} color={colors.neutral[400]} strokeWidth={2.2} />
    </TouchableOpacity>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.lineRow}>
      <Text style={[styles.lineLabel, strong && { color: INK, fontFamily: typography.fontBodyBold }]}>{label}</Text>
      <Text style={[styles.lineValue, strong && { fontFamily: typography.fontBodyBold }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1, minWidth: 0 },
  underline: { textDecorationLine: 'underline', color: INK },
  eyebrow: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: colors.neutral[600] },

  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.neutral[200] },
  dotOn: { width: 22, backgroundColor: INK },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  centerTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK, textAlign: 'center' },
  centerText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center', marginBottom: 6 },

  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 30, gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingTop: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, maxWidth: '100%' },
  heroAmount: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 46, letterSpacing: -1.6, color: INK },
  heroCur: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.neutral[600] },
  heroSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 32, paddingLeft: 12, paddingRight: 4, borderRadius: 999, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  detailLink: { overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.forest[50], fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },

  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.forest[50] },
  segItem: { flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segItemOn: { backgroundColor: INK },
  segText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.neutral[600] },

  card: { padding: 16, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200], gap: 12 },
  sep: { height: 1, backgroundColor: colors.neutral[100] },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lineLabel: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  lineValue: { fontFamily: typography.fontBodyMedium, fontSize: 13, color: INK },

  frise: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 6, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  friseLine: { position: 'absolute', left: '17%', right: '17%', top: 24, height: 2, backgroundColor: colors.neutral[200] },
  node: { flex: 1, alignItems: 'center', gap: 5 },
  nodeDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.neutral[300], backgroundColor: colors.neutral[0] },
  nodeNow: { borderWidth: 3, borderColor: INK, backgroundColor: colors.lime[400] },
  nodeHost: { borderWidth: 3, borderColor: colors.forest[600], backgroundColor: colors.forest[600] },
  nodeTitle: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 0.6, color: colors.neutral[600], textAlign: 'center' },
  nodeAmount: { maxWidth: '100%', paddingHorizontal: 4, fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
  nodeSub: { paddingHorizontal: 4, fontFamily: typography.fontBody, fontSize: 11, lineHeight: 15, color: colors.neutral[600], textAlign: 'center' },

  list: { paddingHorizontal: 16, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  lead: { width: 42, height: 42, borderRadius: 12 },
  coinLead: { backgroundColor: colors.gold[50], alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  rowValue: { marginTop: 1, fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  rowSub: { marginTop: 1, fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  footer: { gap: 10, paddingTop: 12, paddingHorizontal: 16, backgroundColor: colors.neutral[0], borderTopWidth: 1, borderTopColor: colors.neutral[200] },
  footNote: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600], textAlign: 'center' },
  payRow: { flexDirection: 'row' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: -2 },
  secureText: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[500] },

  method: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 60, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  methodOn: { borderWidth: 2, borderColor: INK },
  methodLabel: { flex: 1, fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.neutral[300] },
  radioOn: { borderWidth: 6, borderColor: INK },
  phone: { flexDirection: 'row', height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: colors.forest[600], backgroundColor: colors.neutral[0], overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: 14, alignSelf: 'center', fontFamily: typography.fontBodySemiBold, fontSize: 15, color: INK },
  phoneInput: { flex: 1, paddingHorizontal: 14, borderLeftWidth: 1, borderLeftColor: colors.neutral[200], fontFamily: typography.fontBodyMedium, fontSize: 16, color: INK },

  doneTop: { paddingHorizontal: 24, paddingBottom: 28, gap: 14, backgroundColor: INK },
  doneCheck: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: PAPER },
  doneText: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 21, color: '#C9DBD1' },
  doneBody: { padding: 16, gap: 14 },
});
