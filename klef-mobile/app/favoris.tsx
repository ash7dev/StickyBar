import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Check, ChevronLeft, Heart, Minus, Play, Search, Sparkles } from 'lucide-react-native';
import { colors, radius, typography } from '../shared/theme/tokens';
import { getPrixDerniereMinute, getPrixPublic } from '../shared/components/ui/TenantPriceDisplay';
import { INK, PAPER, PillButton, tap } from '../features/reservations/tenant/components/ui';
import { formatAmount } from '../features/owner-home/lib/format';
import { useFavorite, useFavoritesList, type FavoriteItem } from '../features/favorites/useFavorites';

type View_ = 'list' | 'compare';

const nightly = (l: FavoriteItem['logement']) => {
  const pub = getPrixPublic(l.prixBase);
  return l.derniereMinuteActive ? getPrixDerniereMinute(pub) : pub;
};
const rating = (l: FavoriteItem['logement']) => (l.note ? Number(l.note) : 0);

/**
 * Conseil Paixi : le mieux noté parmi les logements encore disponibles (à note égale, le moins cher),
 * avec l'écart de prix par nuit face au moins cher. Rien d'inventé : seulement les données de l'annonce.
 */
function recommend(items: FavoriteItem[]) {
  const open = items.filter((f) => f.logement.statut === 'PUBLISHED');
  if (open.length < 2) return null;
  const best = [...open].sort((a, b) => rating(b.logement) - rating(a.logement) || nightly(a.logement) - nightly(b.logement))[0];
  const cheapest = [...open].sort((a, b) => nightly(a.logement) - nightly(b.logement))[0];
  const reasons = [
    rating(best.logement) ? `la mieux notée (${rating(best.logement).toFixed(1).replace('.', ',')})` : null,
    best.logement.videoUrl ? 'visite vidéo' : null,
    `jusqu’à ${best.logement.capaciteMax} voyageurs`,
  ].filter(Boolean);
  const diff = nightly(best.logement) - nightly(cheapest.logement);
  return { best, text: `${reasons.join(', ')}${diff > 0 ? `, pour ${formatAmount(diff)} FCFA de plus par nuit que la moins chère` : ', et c’est aussi la moins chère'}.` };
}

/** « Mes gardés » : la liste des logements mis de côté, et un tableau pour les comparer. */
export default function FavorisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useFavoritesList();
  const items = data ?? [];
  const [view, setView] = useState<View_>('list');
  const advice = useMemo(() => recommend(items), [items]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tenant)/profile' as never));
  const open = (id: string) => router.push(`/listing/${id}` as never);

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={goBack} style={styles.round} accessibilityRole="button" accessibilityLabel="Retour">
          <ChevronLeft size={18} color={INK} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mes gardés</Text>
          <Text style={styles.sub}>{items.length ? `${items.length} logement${items.length > 1 ? 's' : ''}` : 'Vos coups de cœur'}</Text>
        </View>
        {items.length > 1 && (
          <View style={styles.seg} accessibilityRole="tablist">
            {(['list', 'compare'] as const).map((k) => (
              <TouchableOpacity key={k} onPress={() => { tap(); setView(k); }} style={[styles.segItem, view === k && styles.segOn]} accessibilityRole="tab" accessibilityState={{ selected: view === k }}>
                <Text style={[styles.segText, view === k && { color: colors.lime[400] }]}>{k === 'list' ? 'Liste' : 'Comparer'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.forest[600]} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Heart size={28} color={INK} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Rien de gardé pour l’instant</Text>
          <Text style={styles.emptyText}>Touchez le cœur d’une annonce pour la retrouver ici et la comparer.</Text>
          <PillButton label="Explorer les logements" flex={0} icon={<Search size={16} color={colors.lime[400]} />} onPress={() => router.navigate('/(tenant)/explorer' as never)} />
        </View>
      ) : view === 'compare' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 14 }}>
          {advice && <Advice best={advice.best} text={advice.text} onOpen={open} />}
          <CompareTable items={items} bestId={advice?.best.logementId} onOpen={open} />
          <Text style={styles.note}>Prix par nuit, frais de service inclus. Le total exact s’affiche dès que vous choisissez vos dates sur l’annonce.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.logementId}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 10 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.forest[600]} />}
          ListHeaderComponent={advice ? <View style={{ marginBottom: 10 }}><Advice best={advice.best} text={advice.text} onOpen={open} /></View> : null}
          renderItem={({ item }) => <Row item={item} best={item.logementId === advice?.best.logementId} onOpen={() => open(item.logementId)} />}
        />
      )}
    </View>
  );
}

function Advice({ best, text, onOpen }: { best: FavoriteItem; text: string; onOpen: (id: string) => void }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onOpen(best.logementId); }} style={styles.advice} accessibilityRole="button">
      <Sparkles size={20} color={colors.lime[400]} />
      <Text style={styles.adviceText}>
        <Text style={styles.adviceStrong}>Paixi conseille {best.logement.titre}</Text> : {text}
      </Text>
    </TouchableOpacity>
  );
}

function Row({ item, best, onOpen }: { item: FavoriteItem; best: boolean; onOpen: () => void }) {
  const [isFavorite, toggle] = useFavorite(item.logementId);
  const l = item.logement;
  const unavailable = l.statut !== 'PUBLISHED';
  return (
    <TouchableOpacity onPress={() => { tap(); onOpen(); }} style={[styles.row, best && styles.rowBest, unavailable && { opacity: 0.55 }]} accessibilityRole="button">
      <View>
        {l.photos?.[0]?.url ? <Image source={{ uri: l.photos[0].url }} style={styles.photo} contentFit="cover" /> : <View style={[styles.photo, { backgroundColor: colors.forest[100] }]} />}
        {l.videoUrl ? (
          <View style={styles.play}>
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.place} numberOfLines={1}>{[l.quartier, l.ville].filter(Boolean).join(', ')}</Text>
          {best && <Text style={styles.bestTag}>CONSEILLÉ</Text>}
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>{l.titre}</Text>
        <Text style={styles.meta}>
          {unavailable ? 'Plus disponible pour le moment' : `${formatAmount(nightly(l))} FCFA / nuit · ${l.capaciteMax} voyageurs`}
        </Text>
      </View>
      <TouchableOpacity onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Ne plus garder' : 'Garder'}>
        <Heart size={22} color={INK} fill={isFavorite ? INK : 'transparent'} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const ROWS: Array<{ label: string; value: (l: FavoriteItem['logement']) => React.ReactNode; strong?: boolean }> = [
  { label: 'Par nuit', value: (l) => formatAmount(nightly(l)), strong: true },
  { label: 'Voyageurs', value: (l) => `${l.capaciteMax} max.` },
  { label: 'Chambres', value: (l) => l.nombreChambres },
  { label: 'Salles de bain', value: (l) => l.nombreSallesBain ?? '—' },
  { label: 'Note', value: (l) => (rating(l) ? `★ ${rating(l).toFixed(1).replace('.', ',')}` : 'Nouveau') },
  { label: 'Vidéo', value: (l) => (l.videoUrl ? <Check size={16} color={colors.forest[600]} strokeWidth={3} /> : <Minus size={16} color={colors.neutral[400]} />) },
  { label: 'Dernière min.', value: (l) => (l.derniereMinuteActive ? '−15 %' : <Minus size={16} color={colors.neutral[400]} />) },
];

function CompareTable({ items, bestId, onOpen }: { items: FavoriteItem[]; bestId?: string; onOpen: (id: string) => void }) {
  return (
    <View style={styles.table}>
      <View style={styles.labels}>
        <View style={{ height: 136 }} />
        {ROWS.map((r) => (
          <View key={r.label} style={styles.cellLabel}>
            <Text style={styles.labelText}>{r.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
        {items.map((f) => {
          const l = f.logement;
          const best = f.logementId === bestId;
          return (
            <TouchableOpacity key={f.logementId} onPress={() => { tap(); onOpen(f.logementId); }} style={[styles.col, best && styles.colBest]} accessibilityRole="button">
              {best && <Text style={styles.colTag}>CONSEILLÉ</Text>}
              {l.photos?.[0]?.url ? <Image source={{ uri: l.photos[0].url }} style={styles.colPhoto} contentFit="cover" /> : <View style={[styles.colPhoto, { backgroundColor: colors.forest[100] }]} />}
              <Text style={styles.colTitle} numberOfLines={2}>{l.titre}</Text>
              {ROWS.map((r) => (
                <View key={r.label} style={styles.cell}>
                  {(() => {
                    const v = r.value(l);
                    return typeof v === 'string' || typeof v === 'number' ? <Text style={[styles.cellText, r.strong && styles.cellStrong]}>{v}</Text> : v;
                  })()}
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, color: INK },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  seg: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.forest[50] },
  segItem: { height: 32, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center' },
  segOn: { backgroundColor: INK },
  segText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, color: INK, textAlign: 'center' },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600], textAlign: 'center', marginBottom: 8 },

  advice: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 22, backgroundColor: INK },
  adviceText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: '#C9DBD1' },
  adviceStrong: { fontFamily: typography.fontBodyBold, color: PAPER },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  rowBest: { borderWidth: 2, borderColor: INK },
  photo: { width: 92, height: 92, borderRadius: 18 },
  play: { position: 'absolute', left: '50%', top: '50%', marginLeft: -15, marginTop: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(4,25,18,0.55)', alignItems: 'center', justifyContent: 'center' },
  place: { flexShrink: 1, fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  bestTag: { overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.lime[400], fontFamily: typography.fontBodyBold, fontSize: 9, letterSpacing: 0.5, color: INK },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  meta: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  table: { flexDirection: 'row', gap: 8 },
  labels: { width: 86 },
  cellLabel: { height: 46, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  labelText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.neutral[600] },
  col: { width: 128, padding: 8, paddingBottom: 0, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  colBest: { borderWidth: 2, borderColor: INK },
  colTag: { position: 'absolute', zIndex: 2, top: 14, left: 14, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.lime[400], fontFamily: typography.fontBodyBold, fontSize: 9, color: INK },
  colPhoto: { width: '100%', height: 82, borderRadius: 14 },
  colTitle: { height: 46, paddingTop: 6, fontFamily: typography.fontBodyBold, fontSize: 12, lineHeight: 15, color: INK, textAlign: 'center' },
  cell: { height: 46, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  cellText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  cellStrong: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15 },
  note: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600], textAlign: 'center' },
});
