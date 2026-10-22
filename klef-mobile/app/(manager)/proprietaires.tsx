import React, { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, ChevronRight, FileText, Phone, Search, Send, X } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { WhatsAppIcon, WHATSAPP_GREEN } from '../../shared/components/brand/WhatsAppIcon';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import {
  managerKeys,
  useManagedListings,
  useManagedOwners,
  useManagerReservations,
  type ManagedOwnerWallet,
} from '../../features/manager/hooks/useManagerToday';
import { computeMoney } from '../../features/manager/lib/money';
import { fmt } from '../../features/manager/lib/today';
import { PayoutSheet } from '../../features/manager/components/owners/PayoutSheet';
import { callOwner, inviteText, whatsappOwner } from '../../features/manager/components/owners/contact';
import { INK, LIME, LINE, MUTED } from '../../features/manager/components/today/ui';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const tap = () => Haptics.selectionAsync().catch(() => {});

/** Les propriétaires partenaires : ce qu'on leur doit, ce que leurs biens rapportent, et le contact. */
export default function ManagerOwnersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [payoutFor, setPayoutFor] = useState<ManagedOwnerWallet | null>(null);

  const ownersQ = useManagedOwners();
  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();
  const now = new Date();
  const monthLabel = MONTHS[now.getUTCMonth()];

  // Biens confiés à ce gestionnaire, par propriétaire : base des montants du mois
  const listingsByOwner = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of listingsQ.data ?? []) {
      if (user?.id && l.gestionnaireId && l.gestionnaireId !== user.id) continue;
      m.set(l.proprietaireId, (m.get(l.proprietaireId) ?? new Set()).add(l.id));
    }
    return m;
  }, [listingsQ.data, user?.id]);

  const monthByOwner = useMemo(() => {
    const m = new Map<string, number>();
    for (const [ownerId, ids] of listingsByOwner) {
      m.set(ownerId, computeMoney((reservationsQ.data ?? []).filter((r) => ids.has(r.logementId))).revenue);
    }
    return m;
  }, [listingsByOwner, reservationsQ.data]);

  const owners = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (ownersQ.data ?? [])
      .filter((o) => !q || `${o.prenom} ${o.nom} ${o.telephone ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.soldeRetirable - a.soldeRetirable || a.nom.localeCompare(b.nom));
  }, [ownersQ.data, query]);

  const all = ownersQ.data ?? [];
  const totals = {
    owners: all.length,
    listings: all.reduce((s, o) => s + o.logementsCount, 0),
    payable: all.reduce((s, o) => s + o.soldeRetirable, 0),
    month: [...monthByOwner.values()].reduce((s, v) => s + v, 0),
    disputes: all.filter((o) => o.soldeGeleLitige > 0).length,
    toActivate: all.filter((o) => o.isShadowAccount).length,
  };

  const refreshing = ownersQ.isRefetching || reservationsQ.isRefetching;
  const onRefresh = () => qc.invalidateQueries({ queryKey: managerKeys.all });

  if (ownersQ.isLoading && !ownersQ.data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.forest[600]} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest[600]} />}
      >
        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.kicker}>ESPACE GESTIONNAIRE</Text>
            <Text style={styles.title}>Propriétaires</Text>
          </View>
          {all.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                tap();
                setSearching((v) => !v);
                if (searching) setQuery('');
              }}
              style={styles.iconBtn}
              accessibilityLabel="Rechercher un propriétaire"
            >
              {searching ? <X size={18} color={INK} /> : <Search size={18} color={INK} />}
            </TouchableOpacity>
          )}
        </View>

        {searching && (
          <View style={styles.search}>
            <Search size={17} color={MUTED} />
            <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Nom ou téléphone" placeholderTextColor={colors.neutral[400]} style={styles.searchInput} />
          </View>
        )}

        {all.length === 0 ? (
          <View style={styles.hero}>
            <View style={[styles.ring, styles.ringOuter]} />
            <Text style={styles.heroKicker}>VOS PROPRIÉTAIRES</Text>
            <Text style={styles.heroTitle}>
              Pas encore de{'\n'}
              <Text style={styles.accent}>propriétaire partenaire.</Text>
            </Text>
            <Text style={styles.heroText}>Ajoutez un bien pour un propriétaire : il apparaîtra ici avec son solde, ses revenus et ses reversements.</Text>
            <TouchableOpacity onPress={() => router.push('/(manager)/nouveau-bien' as never)} style={styles.heroCta} accessibilityRole="button">
              <Text style={styles.heroCtaText}>Ajouter un bien</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <View style={[styles.ring, styles.ringOuter]} />
              <Text style={styles.heroKicker}>
                {totals.owners} PROPRIÉTAIRE{totals.owners > 1 ? 'S' : ''} · {totals.listings} BIEN{totals.listings > 1 ? 'S' : ''}
              </Text>
              <Text style={styles.summaryLabel}>Disponible à reverser</Text>
              <View style={styles.amountRow}>
                <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
                  {fmt(totals.payable)}
                </Text>
                <Text style={styles.unit}>FCFA</Text>
              </View>
              <View style={styles.tiles}>
                {[
                  [fmt(totals.month), `réservé en ${monthLabel}`],
                  [String(totals.disputes), totals.disputes > 1 ? 'litiges en cours' : 'litige en cours'],
                  [String(totals.toActivate), totals.toActivate > 1 ? 'comptes à activer' : 'compte à activer'],
                ].map(([v, l]) => (
                  <View key={l} style={styles.tile}>
                    <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
                      {v}
                    </Text>
                    <Text style={styles.tileLabel} numberOfLines={1}>
                      {l}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {owners.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Aucun propriétaire trouvé</Text>
                <Text style={styles.emptyText}>Aucun nom ni numéro ne correspond à « {query} ».</Text>
              </View>
            ) : (
              owners.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/(manager)/proprietaire/${o.id}` as never)}
                  style={styles.card}
                  accessibilityRole="button"
                  accessibilityLabel={`${o.prenom} ${o.nom}`}
                >
                  <View style={styles.cardHead}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{`${o.prenom.charAt(0)}${o.nom.charAt(0)}`.toUpperCase()}</Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.name} numberOfLines={1}>
                        {o.prenom} {o.nom}
                      </Text>
                      <Text style={styles.meta}>
                        {o.logementsCount} bien{o.logementsCount > 1 ? 's' : ''} géré{o.logementsCount > 1 ? 's' : ''}
                      </Text>
                    </View>
                    {o.telephone ? (
                      <>
                        <TouchableOpacity
                          onPress={() =>
                            whatsappOwner(o.telephone, o.isShadowAccount ? inviteText(o.prenom, user?.prenom) : `Bonjour ${o.prenom}, ici ${user?.prenom ?? 'votre gestionnaire'} de Paixi Managed.`)
                          }
                          style={[styles.round, { backgroundColor: WHATSAPP_GREEN }]}
                          accessibilityLabel={`WhatsApp ${o.prenom}`}
                        >
                          <WhatsAppIcon size={16} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => callOwner(o.telephone)} style={[styles.round, { backgroundColor: INK }]} accessibilityLabel={`Appeler ${o.prenom}`}>
                          <Phone size={15} color={LIME} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <ChevronRight size={18} color={MUTED} />
                    )}
                  </View>

                  <View style={styles.money}>
                    <View style={[styles.moneyBox, { backgroundColor: INK }]}>
                      <Text style={styles.moneyLabelDark}>Solde retirable</Text>
                      <Text style={styles.moneyValueDark} numberOfLines={1} adjustsFontSizeToFit>
                        {fmt(o.soldeRetirable)} <Text style={styles.moneyUnitDark}>FCFA</Text>
                      </Text>
                    </View>
                    <View style={[styles.moneyBox, { backgroundColor: '#F4F7F0' }]}>
                      <Text style={styles.moneyLabel}>Réservé en {monthLabel}</Text>
                      <Text style={styles.moneyValue} numberOfLines={1} adjustsFontSizeToFit>
                        {fmt(monthByOwner.get(o.id) ?? 0)} <Text style={styles.moneyUnit}>FCFA</Text>
                      </Text>
                    </View>
                  </View>

                  {o.soldeGeleLitige > 0 && (
                    <View style={[styles.flag, { backgroundColor: colors.error[50] }]}>
                      <AlertTriangle size={13} color={colors.error[700]} />
                      <Text style={[styles.flagText, { color: colors.error[700] }]}>{fmt(o.soldeGeleLitige)} FCFA gelés par un litige</Text>
                    </View>
                  )}
                  {o.isShadowAccount && (
                    <TouchableOpacity
                      onPress={() => whatsappOwner(o.telephone, inviteText(o.prenom, user?.prenom))}
                      style={[styles.flag, { backgroundColor: colors.gold[50] }]}
                      accessibilityRole="button"
                    >
                      <Send size={13} color={colors.gold[700]} />
                      <Text style={[styles.flagText, { color: colors.gold[700] }]}>Compte pas encore activé · lui envoyer le lien</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.actions}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(manager)/proprietaire/${o.id}` as never)}
                      style={[styles.action, styles.actionGhost]}
                      accessibilityRole="button"
                    >
                      <FileText size={14} color={INK} />
                      <Text style={styles.actionGhostText}>Mois de {monthLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        tap();
                        setPayoutFor(o);
                      }}
                      disabled={o.soldeRetirable < 10_000}
                      style={[styles.action, styles.actionLime, o.soldeRetirable < 10_000 && styles.actionOff]}
                      accessibilityRole="button"
                    >
                      <Send size={14} color={INK} />
                      <Text style={styles.actionLimeText}>{o.soldeRetirable < 10_000 ? 'Rien à reverser' : 'Reverser'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      <PayoutSheet
        owner={payoutFor}
        visible={!!payoutFor}
        onClose={() => setPayoutFor(null)}
        onDone={() => qc.invalidateQueries({ queryKey: managerKeys.all })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  center: { alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 16, paddingBottom: 130, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 4 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: colors.forest[600] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, letterSpacing: -1, color: INK, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, fontFamily: typography.fontBodyMedium, fontSize: 14.5, color: INK, paddingVertical: 0 },

  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 220, height: 220, borderRadius: 110, top: -110, right: -70 },
  accent: { fontStyle: 'italic', color: LIME },
  summary: { gap: 4, padding: 18, borderRadius: 28, overflow: 'hidden', backgroundColor: INK },
  heroKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.2, color: LIME },
  summaryLabel: { fontFamily: typography.fontBody, fontSize: 12.5, color: colors.forest[200], marginTop: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  amount: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 40, letterSpacing: -1.4, color: '#FFFFFF' },
  unit: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.forest[200] },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tile: { flex: 1, padding: 10, borderRadius: 16, backgroundColor: 'rgba(248,251,244,0.07)' },
  tileValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: '#FFFFFF' },
  tileLabel: { fontFamily: typography.fontBody, fontSize: 10.5, color: colors.forest[200], marginTop: 1 },

  card: { gap: 12, padding: 16, borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 16, color: LIME },
  name: { fontFamily: typography.fontBodyBold, fontSize: 16, color: INK },
  meta: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  money: { flexDirection: 'row', gap: 8 },
  moneyBox: { flex: 1, padding: 12, borderRadius: 18 },
  moneyLabelDark: { fontFamily: typography.fontBody, fontSize: 10.5, color: colors.forest[200] },
  moneyValueDark: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: '#FFFFFF', marginTop: 2 },
  moneyUnitDark: { fontFamily: typography.fontBody, fontSize: 10, color: colors.forest[200] },
  moneyLabel: { fontFamily: typography.fontBody, fontSize: 10.5, color: MUTED },
  moneyValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: INK, marginTop: 2 },
  moneyUnit: { fontFamily: typography.fontBody, fontSize: 10, color: MUTED },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 28, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  flagText: { fontFamily: typography.fontBodyBold, fontSize: 11.5 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, flexDirection: 'row', gap: 6, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  actionGhost: { borderWidth: 1, borderColor: LINE },
  actionGhostText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  actionLime: { backgroundColor: LIME },
  actionLimeText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  actionOff: { opacity: 0.45 },

  hero: { gap: 12, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7, color: '#FFFFFF' },
  heroText: { fontFamily: typography.fontBody, fontSize: 13.5, lineHeight: 20, color: colors.forest[200] },
  heroCta: { height: 50, borderRadius: radius.pill, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heroCtaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  empty: { alignItems: 'center', gap: 6, padding: 24, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600], textAlign: 'center' },
});
