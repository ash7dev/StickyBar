import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ArrowLeft, Check, Clock, Phone, Send, X } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { WhatsAppIcon, WHATSAPP_GREEN } from '../../../shared/components/brand/WhatsAppIcon';
import { useAuthStore } from '../../../features/auth/stores/auth.store';
import {
  managerKeys,
  useManagedListings,
  useManagedOwner,
  useManagerOverview,
  useManagerReservations,
} from '../../../features/manager/hooks/useManagerToday';
import { computeMoney } from '../../../features/manager/lib/money';
import { listingDay } from '../../../features/manager/lib/park';
import { fmt, todayKey } from '../../../features/manager/lib/today';
import { PayoutSheet } from '../../../features/manager/components/owners/PayoutSheet';
import { callOwner, inviteText, maskPhone, whatsappOwner } from '../../../features/manager/components/owners/contact';
import { INK, LIME, LINE, MUTED } from '../../../features/manager/components/today/ui';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
};
const METHOD: Record<string, string> = { WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', VIREMENT: 'Virement' };
const METHOD_LOGO: Record<string, number> = {
  WAVE: require('../../../assets/images/wavelogo.jpeg'),
  ORANGE_MONEY: require('../../../assets/images/orangeMoneylogo.png'),
};
const STATUS: Record<string, { label: string; color: string; bg: string; done: boolean }> = {
  EN_ATTENTE: { label: 'En attente', color: colors.gold[700], bg: colors.gold[50], done: false },
  VALIDE: { label: 'Validé', color: colors.forest[600], bg: colors.forest[50], done: false },
  EFFECTUE: { label: 'Versé', color: colors.forest[600], bg: colors.forest[50], done: true },
  SUSPENDU_POUR_LITIGE: { label: 'Suspendu · litige', color: colors.error[700], bg: colors.error[50], done: false },
  REJETE: { label: 'Refusé', color: colors.error[700], bg: colors.error[50], done: false },
};
const STATE_LABEL = { ARRIVAL: 'Arrivée', OCCUPIED: 'Occupé', DEPARTURE: 'Départ', FREE: 'Libre', OFFLINE: 'Hors ligne' } as const;

/** Fiche d'un propriétaire géré : son solde, son mois, ses biens et l'historique de ses reversements. */
export default function ManagerOwnerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const ownerQ = useManagedOwner(id);
  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();
  const overview = useManagerOverview();
  const today = todayKey();
  const month = MONTHS[new Date().getUTCMonth()];

  const listings = useMemo(
    () => (listingsQ.data ?? []).filter((l) => l.proprietaireId === id && (!user?.id || !l.gestionnaireId || l.gestionnaireId === user.id)),
    [listingsQ.data, id, user?.id],
  );
  const ids = useMemo(() => new Set(listings.map((l) => l.id)), [listings]);
  const reservations = useMemo(() => (reservationsQ.data ?? []).filter((r) => ids.has(r.logementId)), [reservationsQ.data, ids]);
  const money = useMemo(() => computeMoney(reservations), [reservations]);
  const occupancy = useMemo(() => new Map((overview.data?.logements ?? []).map((l) => [l.id, l.occupancy.rate])), [overview.data]);

  const owner = ownerQ.data;
  const canPay = (owner?.soldeRetirable ?? 0) >= 10_000;

  if (ownerQ.isLoading && !owner) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.forest[600]} />
      </View>
    );
  }
  if (!owner) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 24 }]}>
        <Text style={styles.h2}>Propriétaire introuvable</Text>
        <Text style={styles.muted}>Vous ne gérez plus de bien pour ce propriétaire.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backCta}>
          <Text style={styles.backCtaText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const since = owner.creeLe ? `${MONTHS[new Date(owner.creeLe).getUTCMonth()]} ${new Date(owner.creeLe).getUTCFullYear()}` : null;
  const byWho = (demandeParId?: string | null) =>
    !demandeParId ? null : demandeParId === user?.id ? 'vous' : demandeParId === owner.id ? owner.prenom : 'Paixi';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ownerQ.isRefetching}
            onRefresh={() => qc.invalidateQueries({ queryKey: managerKeys.all })}
            tintColor={LIME}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* En-tête : qui, combien, verser */}
        <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.glass} accessibilityLabel="Retour">
              <ArrowLeft size={19} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.flex} />
            {owner.telephone ? (
              <>
                <TouchableOpacity
                  onPress={() => whatsappOwner(owner.telephone, owner.isShadowAccount ? inviteText(owner.prenom, user?.prenom) : `Bonjour ${owner.prenom}, ici ${user?.prenom ?? 'votre gestionnaire'} de Paixi Managed.`)}
                  style={[styles.round, { backgroundColor: WHATSAPP_GREEN }]}
                  accessibilityLabel="WhatsApp"
                >
                  <WhatsAppIcon size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => callOwner(owner.telephone)} style={[styles.round, { backgroundColor: LIME }]} accessibilityLabel="Appeler">
                  <Phone size={17} color={INK} />
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          <View style={styles.who}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{`${owner.prenom.charAt(0)}${owner.nom.charAt(0)}`.toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.kicker}>{since ? `PROPRIÉTAIRE · DEPUIS ${since.toUpperCase()}` : 'PROPRIÉTAIRE'}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {owner.prenom} {owner.nom}
              </Text>
              <Text style={styles.whoMeta}>
                {listings.length} bien{listings.length > 1 ? 's' : ''}
                {owner.telephone ? ` · ${maskPhone(owner.telephone)}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>Solde retirable</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
              {fmt(owner.soldeRetirable)}
            </Text>
            <Text style={styles.balanceUnit}>FCFA</Text>
          </View>
          {(owner.soldeGeleLitige > 0 || owner.dettePenalites > 0) && (
            <Text style={styles.held}>
              {owner.soldeGeleLitige > 0 ? `${fmt(owner.soldeGeleLitige)} gelés par un litige` : ''}
              {owner.soldeGeleLitige > 0 && owner.dettePenalites > 0 ? ' · ' : ''}
              {owner.dettePenalites > 0 ? `${fmt(owner.dettePenalites)} de pénalités dues` : ''}
            </Text>
          )}
          <TouchableOpacity onPress={() => setPayoutOpen(true)} disabled={!canPay} style={[styles.payBtn, !canPay && { opacity: 0.45 }]} accessibilityRole="button">
            <Send size={16} color={INK} />
            <Text style={styles.payText}>{canPay ? 'Demander un reversement' : 'Rien à reverser pour l’instant'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {owner.isShadowAccount && (
            <TouchableOpacity onPress={() => whatsappOwner(owner.telephone, inviteText(owner.prenom, user?.prenom))} style={styles.invite} accessibilityRole="button">
              <Send size={16} color={colors.gold[700]} />
              <View style={styles.flex}>
                <Text style={styles.inviteTitle}>Compte pas encore activé</Text>
                <Text style={styles.inviteText}>Envoyez-lui le lien pour qu’il suive ses réservations et ses revenus.</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Le mois */}
          <View style={styles.card}>
            <Text style={styles.h2}>{month.charAt(0).toUpperCase() + month.slice(1)}</Text>
            {[
              ['Séjours réservés', String(money.stays)],
              ['Payé par les voyageurs', `${fmt(money.revenue)} FCFA`],
              ['Commission Paixi', money.commission ? `− ${fmt(money.commission)} FCFA` : '0 FCFA'],
              ['Part du propriétaire', `${fmt(money.ownersShare)} FCFA`],
            ].map(([k, v], i) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.kvKey}>{k}</Text>
                <Text style={[styles.kvValue, i === 3 && { color: colors.forest[600] }]}>{v}</Text>
              </View>
            ))}
            <Text style={styles.foot}>Relevé certifié en PDF : espace gestionnaire web.</Text>
          </View>

          {/* Ses biens */}
          <Text style={styles.label}>SES BIENS · {listings.length}</Text>
          {listings.length === 0 ? (
            <Text style={styles.muted}>Aucun bien géré pour ce propriétaire.</Text>
          ) : (
            listings.map((l) => {
              const d = listingDay(l, reservations, today);
              const occ = occupancy.get(l.id);
              return (
                <View key={l.id} style={styles.listing}>
                  {l.photos?.[0]?.url ? (
                    <Image source={{ uri: l.photos[0].url }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, { backgroundColor: colors.forest[800] }]} />
                  )}
                  <View style={styles.flex}>
                    <Text style={styles.listingTitle} numberOfLines={1}>
                      {l.titre}
                    </Text>
                    <Text style={styles.listingMeta} numberOfLines={1}>
                      {l.quartier ?? l.ville ?? ''}
                      {occ != null ? ` · ${Math.round(occ * 100)} % sur 30 j` : ''}
                    </Text>
                  </View>
                  <View style={[styles.state, d.state === 'ARRIVAL' || d.state === 'OCCUPIED' ? { backgroundColor: INK } : null]}>
                    <Text style={[styles.stateText, d.state === 'ARRIVAL' || d.state === 'OCCUPIED' ? { color: LIME } : null]}>
                      {d.state === 'OFFLINE' ? d.line : STATE_LABEL[d.state]}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Reversements */}
          <Text style={styles.label}>REVERSEMENTS RÉCENTS</Text>
          {owner.retraits.length === 0 ? (
            <View style={styles.emptyPayout}>
              <Text style={styles.muted}>Aucun reversement pour l’instant.</Text>
            </View>
          ) : (
            <View style={styles.payouts}>
              {owner.retraits.map((r, i) => {
                const st = STATUS[r.statut] ?? { label: r.statut, color: MUTED, bg: colors.neutral[100], done: false };
                const who = byWho(r.demandeParId);
                return (
                  <View key={r.id} style={[styles.payout, i > 0 && styles.payoutBorder]}>
                    <View style={[styles.payoutIcon, { backgroundColor: st.bg }]}>
                      {st.done ? <Check size={14} color={st.color} strokeWidth={3} /> : r.statut === 'REJETE' ? <X size={14} color={st.color} /> : <Clock size={14} color={st.color} />}
                    </View>
                    <View style={styles.flex}>
                      <View style={styles.payoutTitleRow}>
                        {METHOD_LOGO[r.methode] ? <Image source={METHOD_LOGO[r.methode]} style={styles.methodLogo} contentFit="cover" /> : null}
                        <Text style={styles.payoutTitle}>
                          {fmt(r.montant)} FCFA · {METHOD[r.methode] ?? r.methode}
                        </Text>
                      </View>
                      <Text style={styles.payoutMeta} numberOfLines={1}>
                        {shortDate(r.demandeeLe)}
                        {who ? ` · demandé par ${who}` : ''} · {r.destinataire}
                      </Text>
                    </View>
                    <Text style={[styles.payoutStatus, { color: st.color }]}>{st.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <PayoutSheet
        owner={owner}
        visible={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        onDone={() => qc.invalidateQueries({ queryKey: managerKeys.all })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingBottom: 60 },
  hero: { paddingHorizontal: 20, paddingBottom: 22, backgroundColor: INK, overflow: 'hidden', gap: 2 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 300, height: 300, borderRadius: 150, top: -120, right: -90 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glass: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(248,251,244,0.12)', alignItems: 'center', justifyContent: 'center' },
  round: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 20, color: INK },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.2, color: LIME },
  name: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, letterSpacing: -0.6, color: '#FFFFFF' },
  whoMeta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[200] },
  balanceLabel: { fontFamily: typography.fontBody, fontSize: 12.5, color: colors.forest[200], marginTop: 20 },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  balance: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 46, letterSpacing: -1.6, color: '#FFFFFF' },
  balanceUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.forest[200] },
  held: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.gold[300] },
  payBtn: { flexDirection: 'row', gap: 8, height: 52, borderRadius: radius.pill, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  payText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },

  body: { padding: 16, gap: 12 },
  invite: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 20, backgroundColor: colors.gold[50], borderWidth: 1, borderColor: '#F0E2BF' },
  inviteTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.gold[700] },
  inviteText: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.gold[700], marginTop: 1 },
  card: { padding: 16, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK, marginBottom: 6 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#EEF2EA' },
  kvKey: { fontFamily: typography.fontBody, fontSize: 13, color: MUTED },
  kvValue: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  foot: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 8 },
  label: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: MUTED, marginTop: 8, paddingHorizontal: 4 },
  muted: { fontFamily: typography.fontBody, fontSize: 13, color: MUTED, textAlign: 'center' },
  listing: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  thumb: { width: 48, height: 48, borderRadius: 12 },
  listingTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  listingMeta: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 1 },
  state: { height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: '#EEF2EA', justifyContent: 'center' },
  stateText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#3F4A3B' },
  payouts: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  payout: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  payoutBorder: { borderTopWidth: 1, borderTopColor: '#EEF2EA' },
  payoutIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  payoutTitle: { fontFamily: typography.fontBodyBold, fontSize: 13.5, color: INK },
  payoutTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodLogo: { width: 18, height: 18, borderRadius: 5 },
  payoutMeta: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 1 },
  payoutStatus: { fontFamily: typography.fontBodyBold, fontSize: 11.5 },
  emptyPayout: { padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  backCta: { marginTop: 10, height: 44, paddingHorizontal: 20, borderRadius: radius.pill, backgroundColor: INK, justifyContent: 'center' },
  backCtaText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: LIME },
});
