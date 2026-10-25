import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, Check, Info, Search, UserPlus, Users } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { useListingWizardFormStore } from '../../features/listings/stores/useListingWizardFormStore';
import { useManagedListings } from '../../features/manager/hooks/useManagerToday';
import { INK, LIME, LINE, MUTED } from '../../features/manager/components/today/ui';

interface OwnerOption {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  logementsCount?: number;
  managed?: boolean;
}

const tap = () => Haptics.selectionAsync().catch(() => {});
const initials = (o: { prenom: string; nom: string }) => `${o.prenom.charAt(0)}${o.nom.charAt(0)}`.toUpperCase();
/** « 77 ••• •• 45 » : on reconnaît le numéro sans l'exposer en entier. */
const maskPhone = (p: string) => {
  const d = p.replace(/\D/g, '').replace(/^221/, '');
  return d.length >= 4 ? `${d.slice(0, 2)} ••• •• ${d.slice(-2)}` : p;
};

/**
 * Étape 0 de la création d'un bien par un gestionnaire : pour quel propriétaire ?
 * Les étapes suivantes sont celles de l'hôte, inchangées.
 */
export default function ManagerNewListingOwnerStep() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { reset, setManagedOwner } = useListingWizardFormStore();

  const [mode, setMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OwnerOption | null>(null);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');

  // Écran rangé parmi les onglets (il reste monté) : chaque visite repart d'une page blanche
  useFocusEffect(
    React.useCallback(() => {
      setMode('EXISTING');
      setQuery('');
      setSelected(null);
      setPrenom('');
      setNom('');
      setTelephone('');
    }, []),
  );

  const listingsQ = useManagedListings();
  const allOwnersQ = useQuery({
    queryKey: ['manager', 'owners-all'],
    queryFn: async () => {
      const res = await apiClient.get('/gestionnaire/proprietaires-all');
      return ((res.data?.data ?? res.data) as OwnerOption[]) ?? [];
    },
    staleTime: 5 * 60_000,
  });

  // Vos propriétaires d'abord (ceux dont vous gérez déjà des biens), puis les autres
  const owners = useMemo(() => {
    const managed = new Map<string, OwnerOption>();
    for (const l of listingsQ.data ?? []) {
      if (user?.id && l.gestionnaireId && l.gestionnaireId !== user.id) continue;
      if (!l.proprietaire) continue;
      const o = managed.get(l.proprietaireId) ?? {
        id: l.proprietaireId,
        prenom: l.proprietaire.prenom,
        nom: l.proprietaire.nom,
        telephone: l.proprietaire.telephone ?? '',
        logementsCount: 0,
        managed: true,
      };
      o.logementsCount = (o.logementsCount ?? 0) + 1;
      managed.set(l.proprietaireId, o);
    }
    const others = (allOwnersQ.data ?? []).filter((o) => !managed.has(o.id) && o.id !== user?.id);
    return { managed: [...managed.values()], others };
  }, [listingsQ.data, allOwnersQ.data, user?.id]);

  const q = query.trim().toLowerCase();
  const match = (o: OwnerOption) => !q || `${o.prenom} ${o.nom} ${o.telephone}`.toLowerCase().includes(q);
  const managedShown = owners.managed.filter(match);
  // Les autres propriétaires de la plateforme ne s'affichent qu'en cherchant
  const othersShown = q.length >= 2 ? owners.others.filter(match).slice(0, 20) : [];

  const phoneDigits = telephone.replace(/\D/g, '');
  const ready = mode === 'EXISTING' ? !!selected?.telephone : prenom.trim().length > 1 && nom.trim().length > 1 && phoneDigits.length >= 9;

  const next = () => {
    if (!ready) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    reset();
    setManagedOwner(
      mode === 'EXISTING' && selected
        ? { mode: 'EXISTING', id: selected.id, prenom: selected.prenom, nom: selected.nom, telephone: selected.telephone }
        : { mode: 'NEW', prenom: prenom.trim(), nom: nom.trim(), telephone: phoneDigits.startsWith('221') ? `+${phoneDigits}` : `+221${phoneDigits}` },
    );
    router.push('/(manager)/add-listing' as never);
  };

  const ownerRow = (o: OwnerOption) => {
    const on = selected?.id === o.id;
    return (
      <TouchableOpacity
        key={o.id}
        onPress={() => {
          tap();
          setSelected(on ? null : o);
        }}
        style={[styles.owner, on && styles.ownerOn]}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
      >
        <View style={[styles.avatar, on && { backgroundColor: LIME }]}>
          <Text style={styles.avatarText}>{initials(o)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.ownerName} numberOfLines={1}>
            {o.prenom} {o.nom}
          </Text>
          <Text style={styles.ownerMeta} numberOfLines={1}>
            {maskPhone(o.telephone)}
            {o.logementsCount ? ` · ${o.logementsCount} bien${o.logementsCount > 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <View style={[styles.radio, on && styles.radioOn]}>{on && <Check size={12} color={INK} strokeWidth={3.2} />}</View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Retour">
          <ArrowLeft size={18} color={INK} />
        </TouchableOpacity>

        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>NOUVEAU BIEN · ÉTAPE 0</Text>
        </View>
        <Text style={styles.title}>
          Pour quel{'\n'}
          <Text style={styles.accent}>propriétaire ?</Text>
        </Text>
        <Text style={styles.lead}>Le bien est publié à son nom. Vous le gérez pour lui, et vos actions restent tracées.</Text>

        <View style={styles.segment}>
          {(
            [
              ['EXISTING', 'Propriétaire existant', Users],
              ['NEW', 'Nouveau propriétaire', UserPlus],
            ] as const
          ).map(([k, t, Icon]) => {
            const on = mode === k;
            return (
              <TouchableOpacity
                key={k}
                onPress={() => {
                  tap();
                  setMode(k);
                }}
                style={[styles.segItem, on && styles.segOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Icon size={15} color={on ? LIME : MUTED} />
                <Text style={[styles.segText, { color: on ? LIME : MUTED }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {mode === 'EXISTING' ? (
          <>
            <View style={styles.search}>
              <Search size={17} color={MUTED} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Nom ou numéro de téléphone"
                placeholderTextColor={colors.neutral[400]}
                style={styles.searchInput}
                autoCorrect={false}
              />
            </View>

            {listingsQ.isLoading || allOwnersQ.isLoading ? (
              <ActivityIndicator color={colors.forest[600]} style={{ marginTop: 20 }} />
            ) : (
              <>
                {managedShown.length > 0 && (
                  <View style={styles.group}>
                    <Text style={styles.label}>VOS PROPRIÉTAIRES</Text>
                    {managedShown.map(ownerRow)}
                  </View>
                )}
                {othersShown.length > 0 && (
                  <View style={styles.group}>
                    <Text style={styles.label}>AUTRES PROPRIÉTAIRES PAIXI</Text>
                    {othersShown.map(ownerRow)}
                  </View>
                )}
                {managedShown.length === 0 && othersShown.length === 0 && (
                  <View style={styles.empty}>
                    <Text style={styles.emptyTitle}>{q ? 'Aucun propriétaire trouvé' : 'Aucun propriétaire pour l’instant'}</Text>
                    <Text style={styles.emptyText}>
                      {q.length === 1 ? 'Tapez au moins 2 lettres pour chercher parmi tous les propriétaires Paixi.' : 'Ajoutez-le en « Nouveau propriétaire » : il suffit de son nom et de son numéro.'}
                    </Text>
                    <TouchableOpacity onPress={() => setMode('NEW')} style={styles.emptyBtn} accessibilityRole="button">
                      <UserPlus size={15} color={LIME} />
                      <Text style={styles.emptyBtnText}>Nouveau propriétaire</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        ) : (
          <View style={styles.form}>
            <View style={styles.row2}>
              <View style={styles.flex}>
                <Text style={styles.label}>PRÉNOM</Text>
                <TextInput value={prenom} onChangeText={setPrenom} placeholder="Moussa" placeholderTextColor={colors.neutral[400]} style={styles.input} autoCapitalize="words" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.label}>NOM</Text>
                <TextInput value={nom} onChangeText={setNom} placeholder="Diop" placeholderTextColor={colors.neutral[400]} style={styles.input} autoCapitalize="words" />
              </View>
            </View>
            <Text style={styles.label}>TÉLÉPHONE</Text>
            <View style={styles.phone}>
              <Text style={styles.phonePrefix}>+221</Text>
              <TextInput
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                placeholder="77 123 45 67"
                placeholderTextColor={colors.neutral[400]}
                style={styles.phoneInput}
              />
            </View>
            <View style={styles.note}>
              <Info size={15} color={colors.forest[700]} />
              <Text style={styles.noteText}>
                S’il a déjà un compte Paixi avec ce numéro, le bien y est rattaché. Sinon, un compte propriétaire est créé : il pourra s’y connecter avec ce numéro et suivre ses revenus.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity onPress={next} disabled={!ready} style={[styles.cta, !ready && styles.ctaOff]} accessibilityRole="button">
          <Text style={styles.ctaText}>
            {ready
              ? `Continuer pour ${mode === 'EXISTING' ? selected?.prenom : prenom.trim()}`
              : mode === 'EXISTING'
              ? 'Choisissez un propriétaire'
              : 'Nom et téléphone requis'}
          </Text>
          {ready && <ArrowRight size={17} color={LIME} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: 20, paddingBottom: 140, gap: 14 },
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  stepPill: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 11, borderRadius: 13, backgroundColor: INK, justifyContent: 'center', marginTop: 6 },
  stepPillText: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1, color: LIME },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: INK },
  accent: { fontStyle: 'italic', color: colors.forest[600] },
  lead: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: colors.neutral[600] },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: '#EEF2EA' },
  segItem: { flex: 1, flexDirection: 'row', gap: 6, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: INK },
  segText: { fontFamily: typography.fontBodyBold, fontSize: 12.5 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, fontFamily: typography.fontBodyMedium, fontSize: 14.5, color: INK, paddingVertical: 0 },
  group: { gap: 8 },
  label: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.2, color: MUTED, marginBottom: 2 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  ownerOn: { borderColor: INK, borderWidth: 1.5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.forest[100], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  ownerName: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  ownerMeta: { fontFamily: typography.fontBody, fontSize: 12, color: MUTED, marginTop: 1 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral[300], alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: LIME, borderColor: LIME },
  empty: { alignItems: 'center', gap: 6, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF' },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: INK, textAlign: 'center' },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600], textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8, height: 42, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: INK },
  emptyBtnText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: LIME },
  form: { gap: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  input: { height: 50, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', fontFamily: typography.fontBodyMedium, fontSize: 15, color: INK },
  phone: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  phonePrefix: { paddingHorizontal: 14, fontFamily: typography.fontBodyBold, fontSize: 15, color: INK, borderRightWidth: 1, borderRightColor: LINE, lineHeight: 50 },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontFamily: typography.fontBodyMedium, fontSize: 15, color: INK },
  note: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.forest[50], marginTop: 4 },
  noteText: { flex: 1, fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 18, color: colors.forest[800] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(248,251,244,0.96)', borderTopWidth: 1, borderTopColor: LINE },
  cta: { flexDirection: 'row', gap: 8, height: 56, borderRadius: radius.pill, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.4 },
  ctaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: LIME },
});
