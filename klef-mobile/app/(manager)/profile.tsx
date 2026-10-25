import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { BadgeCheck, Building2, ChevronRight, Compass, ExternalLink, Headphones, Home, ShieldAlert } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useRoleStore } from '../../shared/stores/role.store';
import { useSwitchRole } from '../../features/auth/hooks/useSwitchRole';
import { SITE_URL } from '../../features/share/share';
import { managerKeys, useManagedListings, useManagerReservations } from '../../features/manager/hooks/useManagerToday';
import { computeMoney } from '../../features/manager/lib/money';
import { MobileProfileInfoCard } from '../../features/profile/components/MobileProfileInfoCard';
import { MobileProfileKycCard } from '../../features/profile/components/MobileProfileKycCard';
import { MobileSecurityCard } from '../../features/profile/components/MobileSecurityCard';
import { MobileProfileLegalCard } from '../../features/profile/components/MobileProfileLegalCard';
import { MobileProfileActionsCard } from '../../features/profile/components/MobileProfileActionsCard';
import { TenantActionGateModal } from '../../shared/components/gate/TenantActionGateModal';
import { INK, LIME, LINE, MUTED } from '../../features/manager/components/today/ui';

const tap = () => Haptics.selectionAsync().catch(() => {});

function Section({ label }: { label: string }) {
  return <Text style={styles.section}>{label}</Text>;
}

/** Profil du gestionnaire : sa carte de visite Paixi Managed, son activité, ses espaces et son compte. */
export default function ManagerProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, refreshUser } = useAuthStore();
  const estProprietaire = useRoleStore((s) => s.estProprietaire);
  const { switchRole, isSwitching } = useSwitchRole();
  const [gateOpen, setGateOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<'LOCATAIRE' | 'PROPRIETAIRE' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const listingsQ = useManagedListings();
  const reservationsQ = useManagerReservations();

  // Activité : mêmes règles que les autres onglets (biens confiés à ce gestionnaire)
  const stats = useMemo(() => {
    const managed = (listingsQ.data ?? []).filter((l) => !user?.id || !l.gestionnaireId || l.gestionnaireId === user.id);
    const ids = new Set(managed.map((l) => l.id));
    const money = computeMoney((reservationsQ.data ?? []).filter((r) => ids.has(r.logementId)));
    return { listings: managed.length, owners: new Set(managed.map((l) => l.proprietaireId)).size, stays: money.stays };
  }, [listingsQ.data, reservationsQ.data, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), qc.invalidateQueries({ queryKey: managerKeys.all })]);
    setRefreshing(false);
  }, [refreshUser, qc]);

  const go = async (role: 'LOCATAIRE' | 'PROPRIETAIRE') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSwitchingTo(role);
    await switchRole(role);
    setSwitchingTo(null);
  };

  const verified = user?.statutKyc === 'VERIFIE';
  const initials = `${user?.prenom?.charAt(0) ?? ''}${user?.nom?.charAt(0) ?? ''}`.toUpperCase() || '?';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIME} progressViewOffset={insets.top} />}
      >
        {/* Carte de visite */}
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringInner]} />
          <View style={styles.who}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarEmpty]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.kicker}>GESTIONNAIRE · PAIXI MANAGED</Text>
              <Text style={styles.name} numberOfLines={1}>
                {user?.prenom} {user?.nom}
              </Text>
              <TouchableOpacity
                onPress={() => !verified && setGateOpen(true)}
                disabled={verified}
                style={[styles.kyc, verified ? styles.kycOk : styles.kycTodo]}
                accessibilityRole="button"
              >
                {verified ? <BadgeCheck size={13} color={INK} /> : <ShieldAlert size={13} color={colors.gold[700]} />}
                <Text style={[styles.kycText, !verified && { color: colors.gold[700] }]}>
                  {verified ? 'Identité vérifiée' : user?.statutKyc === 'EN_ATTENTE' ? 'Identité en vérification' : 'Vérifier mon identité'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.stats}>
            {listingsQ.isLoading ? (
              <ActivityIndicator color={LIME} style={{ flex: 1, paddingVertical: 14 }} />
            ) : (
              [
                [stats.listings, stats.listings > 1 ? 'biens gérés' : 'bien géré'],
                [stats.owners, stats.owners > 1 ? 'propriétaires' : 'propriétaire'],
                [stats.stays, 'séjours ce mois'],
              ].map(([v, l], i) => (
                <React.Fragment key={l as string}>
                  {i > 0 && <View style={styles.statSep} />}
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{v as number}</Text>
                    <Text style={styles.statLabel}>{l as string}</Text>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Changer d'espace */}
          <Section label="CHANGER D’ESPACE" />
          <View style={styles.spaces}>
            <TouchableOpacity onPress={() => go('LOCATAIRE')} disabled={isSwitching} style={styles.space} accessibilityRole="button">
              <View style={styles.spaceIcon}>{switchingTo === 'LOCATAIRE' ? <ActivityIndicator color={INK} size="small" /> : <Compass size={18} color={INK} />}</View>
              <Text style={styles.spaceTitle}>Voyageur</Text>
              <Text style={styles.spaceSub}>Explorer et réserver</Text>
            </TouchableOpacity>
            {estProprietaire && (
              <TouchableOpacity onPress={() => go('PROPRIETAIRE')} disabled={isSwitching} style={styles.space} accessibilityRole="button">
                <View style={styles.spaceIcon}>{switchingTo === 'PROPRIETAIRE' ? <ActivityIndicator color={INK} size="small" /> : <Home size={18} color={INK} />}</View>
                <Text style={styles.spaceTitle}>Mes biens</Text>
                <Text style={styles.spaceSub}>Mon espace hôte</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Outils */}
          <Section label="OUTILS DU GESTIONNAIRE" />
          <View style={styles.list}>
            {[
              {
                Icon: Building2,
                title: 'Espace gestionnaire web',
                sub: 'Relevés PDF, exports, statistiques détaillées',
                onPress: () => Linking.openURL(`${SITE_URL}/gestionnaire`),
                external: true,
              },
              {
                Icon: Headphones,
                title: 'Équipe Paixi',
                sub: 'Une question sur un séjour, un litige, un reversement',
                onPress: () => router.push('/assistance' as never),
                external: false,
              },
            ].map(({ Icon, title, sub, onPress, external }, i) => (
              <TouchableOpacity
                key={title}
                onPress={() => {
                  tap();
                  onPress();
                }}
                style={[styles.row, i > 0 && styles.rowBorder]}
                accessibilityRole="button"
              >
                <View style={styles.rowIcon}>
                  <Icon size={17} color={INK} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{title}</Text>
                  <Text style={styles.rowSub}>{sub}</Text>
                </View>
                {external ? <ExternalLink size={15} color={MUTED} /> : <ChevronRight size={16} color={MUTED} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Compte */}
          <Section label="MON COMPTE" />
          <MobileProfileInfoCard user={user} onProfileUpdated={onRefresh} />
          {!verified && <MobileProfileKycCard statutKyc={user?.statutKyc} onKycClick={() => setGateOpen(true)} />}
          <MobileSecurityCard userEmail={user?.email} onUpdated={onRefresh} />
          <MobileProfileLegalCard />
          <MobileProfileActionsCard />
        </View>
      </ScrollView>

      {gateOpen && (
        <TenantActionGateModal
          visible={gateOpen}
          steps={['profile', 'phone', 'kyc']}
          block={null}
          onCancel={() => setGateOpen(false)}
          onComplete={() => {
            setGateOpen(false);
            onRefresh();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingBottom: 130 },
  hero: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: INK, overflow: 'hidden', gap: 20 },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 300, height: 300, borderRadius: 150, top: -120, right: -90 },
  ringInner: { width: 180, height: 180, borderRadius: 90, top: -60, right: -30, borderColor: 'rgba(211,242,110,0.2)' },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: LIME },
  avatarEmpty: { backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 24, color: INK },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.2, color: LIME },
  name: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, letterSpacing: -0.6, color: '#FFFFFF', marginTop: 2 },
  kyc: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: 13, marginTop: 6 },
  kycOk: { backgroundColor: LIME },
  kycTodo: { backgroundColor: colors.gold[50] },
  kycText: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: INK },
  stats: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.07)' },
  stat: { flex: 1, alignItems: 'center', gap: 1 },
  statValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: '#FFFFFF' },
  statLabel: { fontFamily: typography.fontBodyMedium, fontSize: 11, color: colors.forest[200] },
  statSep: { width: 1, height: 30, backgroundColor: 'rgba(248,251,244,0.12)' },

  body: { padding: 16, gap: 12 },
  section: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: MUTED, marginTop: 8, paddingHorizontal: 4 },
  spaces: { flexDirection: 'row', gap: 10 },
  space: { flex: 1, gap: 2, padding: 14, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  spaceIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  spaceTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  spaceSub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED },
  list: { paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#EEF2EA' },
  rowIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEF2EA', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  rowSub: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
});
