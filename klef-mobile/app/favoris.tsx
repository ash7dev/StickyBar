import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bath, BedDouble, Check, ChevronLeft, ChevronRight, Heart, MapPin, Minus, Play, Search, Sparkles, Star, Users } from 'lucide-react-native';
import { colors, radius, typography } from '../shared/theme/tokens';
import { getPrixPublic } from '../shared/components/ui/TenantPriceDisplay';
import { INK, PAPER, PillButton, tap } from '../features/reservations/tenant/components/ui';
import { formatAmount } from '../features/owner-home/lib/format';
import { prefetchListing } from '../shared/lib/prefetch-listing';
import { useFavorite, useFavoritesList, type FavoriteItem } from '../features/favorites/useFavorites';

type View_ = 'list' | 'compare';
type Logement = FavoriteItem['logement'];

// Prix normal : la remise dernière minute ne vaut que pour une arrivée sous 48 h, connue seulement à la réservation
const nightly = (l: Logement) => getPrixPublic(l.prixBase);
const rating = (l: Logement) => (l.note ? Number(l.note) : 0);
const fmtRating = (n: number) => n.toFixed(1).replace('.', ',');
const placeOf = (l: Logement) => [l.quartier, l.ville].filter(Boolean).join(', ');

/** « Gardé aujourd'hui », « il y a 3 j », « il y a 2 sem. » */
function keptSince(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Gardé aujourd’hui';
  if (days === 1) return 'Gardé hier';
  if (days < 14) return `Gardé il y a ${days} j`;
  if (days < 60) return `Gardé il y a ${Math.floor(days / 7)} sem.`;
  return `Gardé il y a ${Math.floor(days / 30)} mois`;
}

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
    rating(best.logement) ? `★ ${fmtRating(rating(best.logement))}, la mieux notée` : null,
    best.logement.videoUrl ? 'Visite vidéo' : null,
    `Jusqu’à ${best.logement.capaciteMax} voyageurs`,
  ].filter(Boolean) as string[];
  const diff = nightly(best.logement) - nightly(cheapest.logement);
  return { best, reasons, verdict: diff > 0 ? `${formatAmount(diff)} FCFA de plus par nuit que la moins chère.` : 'Et c’est aussi la moins chère.' };
}
type Advice_ = NonNullable<ReturnType<typeof recommend>>;

/** « Mes gardés » : la liste des logements mis de côté, et un tableau pour les comparer. */
export default function FavorisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useFavoritesList();
  const items = data ?? [];
  const [view, setView] = useState<View_>('list');
  const [city, setCity] = useState<string | null>(null);
  const advice = useMemo(() => recommend(items), [items]);

  const cities = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((f) => m.set(f.logement.ville, (m.get(f.logement.ville) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const shown = city && cities.some(([c]) => c === city) ? items.filter((f) => f.logement.ville === city) : items;
  const open_ = items.filter((f) => f.logement.statut === 'PUBLISHED');
  const fromPrice = open_.length ? Math.min(...open_.map((f) => nightly(f.logement))) : 0;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tenant)/profile' as never));
  const open = (id: string) => router.push(`/listing/${id}` as never);

  const header = (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 4 }}>
        <Text style={styles.kicker}>VOS COUPS DE CŒUR</Text>
        <Text style={styles.title}>Mes gardés</Text>
        {items.length > 0 && (
          <Text style={styles.summary}>
            <Text style={styles.summaryStrong}>{items.length}</Text> logement{items.length > 1 ? 's' : ''}
            {'  ·  '}
            <Text style={styles.summaryStrong}>{cities.length}</Text> ville{cities.length > 1 ? 's' : ''}
            {fromPrice > 0 && (
              <>
                {'  ·  '}dès <Text style={styles.summaryStrong}>{formatAmount(fromPrice)} F</Text>
              </>
            )}
          </Text>
        )}
      </View>
      {items.length > 1 && (
        <View style={styles.seg} accessibilityRole="tablist">
          {(['list', 'compare'] as const).map((k) => (
            <TouchableOpacity key={k} onPress={() => { tap(); setView(k); }} style={[styles.segItem, view === k && styles.segOn]} accessibilityRole="tab" accessibilityState={{ selected: view === k }}>
              <Text style={[styles.segText, view === k && { color: colors.lime[400] }]}>{k === 'list' ? 'Liste' : `Comparer · ${items.length}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={goBack} style={styles.round} accessibilityRole="button" accessibilityLabel="Retour">
          <ChevronLeft size={18} color={INK} strokeWidth={2.4} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.navigate('/(tenant)/explorer' as never)} style={styles.round} accessibilityRole="button" accessibilityLabel="Explorer les logements">
          <Search size={17} color={INK} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.forest[600]} />
        </View>
      ) : items.length === 0 ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 30, flexGrow: 1 }}>
          {header}
          <Empty onExplore={() => router.navigate('/(tenant)/explorer' as never)} />
        </ScrollView>
      ) : view === 'compare' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 30, gap: 18 }}>
          {header}
          {advice && <AdviceCard advice={advice} onOpen={open} />}
          <CompareTable items={items} bestId={advice?.best.logementId} onOpen={open} />
          <Text style={styles.note}>Prix par nuit, frais de service inclus. Le total exact s’affiche dès que vous choisissez vos dates sur l’annonce.</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(it) => it.logementId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 30, gap: 18 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.forest[600]} />}
          ListHeaderComponent={
            <View style={{ gap: 18 }}>
              {header}
              {advice && <AdviceCard advice={advice} onOpen={open} />}
              {cities.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
                  <View style={{ width: 12 }} />
                  {[['Toutes', items.length] as [string, number], ...cities].map(([c, n]) => {
                    const on = c === 'Toutes' ? !city : city === c;
                    return (
                      <TouchableOpacity key={c} onPress={() => { tap(); setCity(c === 'Toutes' ? null : c); }} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                        <Text style={[styles.chipText, on && { color: colors.lime[400] }]}>{c}</Text>
                        <Text style={[styles.chipCount, on && { color: colors.forest[300] }]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ width: 12 }} />
                </ScrollView>
              )}
            </View>
          }
          renderItem={({ item }) => <KeptCard item={item} best={item.logementId === advice?.best.logementId} onOpen={() => open(item.logementId)} />}
        />
      )}
    </View>
  );
}

function Empty({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.stack}>
        <View style={[styles.ghost, { transform: [{ rotate: '-8deg' }, { translateX: -34 }], backgroundColor: colors.forest[100] }]} />
        <View style={[styles.ghost, { transform: [{ rotate: '7deg' }, { translateX: 34 }], backgroundColor: colors.lime[200] }]} />
        <View style={[styles.ghost, styles.ghostFront]}>
          <View style={styles.ghostHeart}>
            <Heart size={24} color={INK} fill={INK} />
          </View>
          <View style={styles.ghostLine} />
          <View style={[styles.ghostLine, { width: '45%', opacity: 0.6 }]} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Votre sélection commence ici</Text>
      <Text style={styles.emptyText}>Touchez le cœur d’une annonce : on la garde pour vous, on suit son prix, et Paixi vous aide à choisir.</Text>
      <PillButton label="Explorer les logements" flex={0} icon={<Search size={16} color={colors.lime[400]} />} onPress={onExplore} />
    </View>
  );
}

function AdviceCard({ advice, onOpen }: { advice: Advice_; onOpen: (id: string) => void }) {
  const l = advice.best.logement;
  return (
    <TouchableOpacity onPressIn={() => prefetchListing(l)} onPress={() => { tap(); onOpen(advice.best.logementId); }} style={styles.advice} accessibilityRole="button" accessibilityLabel={`Conseil Paixi : ${l.titre}`}>
      <View style={styles.adviceHead}>
        <Sparkles size={14} color={colors.lime[400]} />
        <Text style={styles.adviceKicker}>LE CONSEIL PAIXI</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        {l.photos?.[0]?.url ? <Image source={{ uri: l.photos[0].url }} style={styles.advicePhoto} contentFit="cover" /> : <View style={[styles.advicePhoto, { backgroundColor: colors.forest[800] }]} />}
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.adviceTitle} numberOfLines={2}>{l.titre}</Text>
          <Text style={styles.advicePlace} numberOfLines={1}>{placeOf(l)}</Text>
          <Text style={styles.advicePrice}>
            {formatAmount(nightly(l))} F <Text style={styles.advicePer}>/ nuit</Text>
          </Text>
        </View>
        <View style={styles.adviceGo}>
          <ChevronRight size={18} color={INK} strokeWidth={2.6} />
        </View>
      </View>
      <View style={styles.reasons}>
        {advice.reasons.map((r) => (
          <View key={r} style={styles.reason}>
            <Check size={11} color={colors.lime[400]} strokeWidth={3} />
            <Text style={styles.reasonText}>{r}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.verdict}>{advice.verdict}</Text>
    </TouchableOpacity>
  );
}

function KeptCard({ item, best, onOpen }: { item: FavoriteItem; best: boolean; onOpen: () => void }) {
  const [isFavorite, toggle] = useFavorite(item.logementId);
  const { width } = useWindowDimensions();
  const l = item.logement;
  const unavailable = l.statut !== 'PUBLISHED';
  const photoH = Math.round((width - 40) * 0.62);
  const r = rating(l);
  return (
    <TouchableOpacity onPressIn={() => prefetchListing(l)} onPress={() => { tap(); onOpen(); }} activeOpacity={0.92} style={[styles.card, best && styles.cardBest]} accessibilityRole="button" accessibilityLabel={l.titre}>
      <View style={{ height: photoH }}>
        {l.photos?.[0]?.url ? (
          <Image source={{ uri: l.photos[0].url }} style={[StyleSheet.absoluteFill, styles.cardPhoto]} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardPhoto, { backgroundColor: colors.forest[100] }]} />
        )}
        <LinearGradient colors={['rgba(4,25,18,0.35)', 'transparent', 'rgba(4,25,18,0.78)']} locations={[0, 0.35, 1]} style={[StyleSheet.absoluteFill, styles.cardPhoto]} pointerEvents="none" />

        <View style={styles.cardTags} pointerEvents="none">
          {best && (
            <View style={[styles.tag, { backgroundColor: colors.lime[400] }]}>
              <Sparkles size={10} color={INK} />
              <Text style={[styles.tagText, { color: INK }]}>CONSEILLÉ</Text>
            </View>
          )}
          {l.videoUrl ? (
            <View style={styles.tag}>
              <Play size={9} color={colors.lime[400]} fill={colors.lime[400]} />
              <Text style={styles.tagText}>Vidéo</Text>
            </View>
          ) : null}
          {l.derniereMinuteActive && !unavailable ? (
            <View style={[styles.tag, { backgroundColor: colors.gold[400] }]}>
              <Text style={[styles.tagText, { color: INK }]}>−15 % sous 48 h</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity onPress={toggle} hitSlop={8} style={styles.heart} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Ne plus garder' : 'Garder'}>
          <Heart size={19} color={isFavorite ? colors.lime[400] : '#FFFFFF'} fill={isFavorite ? colors.lime[400] : 'transparent'} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={styles.cardOver} pointerEvents="none">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} color={colors.forest[200]} />
            <Text style={styles.cardPlace} numberOfLines={1}>{placeOf(l)}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2}>{l.titre}</Text>
        </View>

        {unavailable && (
          <View style={[StyleSheet.absoluteFill, styles.cardPhoto, styles.off]} pointerEvents="none">
            <Text style={styles.offText}>Plus disponible pour le moment</Text>
          </View>
        )}
      </View>

      <View style={styles.cardInfo}>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.specs}>
            <Spec icon={<Users size={13} color={colors.neutral[600]} />} label={`${l.capaciteMax}`} />
            <Spec icon={<BedDouble size={13} color={colors.neutral[600]} />} label={`${l.nombreChambres}`} />
            {l.nombreSallesBain ? <Spec icon={<Bath size={13} color={colors.neutral[600]} />} label={`${l.nombreSallesBain}`} /> : null}
            {r ? (
              <Spec icon={<Star size={12} color={colors.gold[400]} fill={colors.gold[400]} />} label={`${fmtRating(r)}${l.totalAvis ? ` (${l.totalAvis})` : ''}`} />
            ) : (
              <Text style={styles.newTag}>Nouveau</Text>
            )}
          </View>
          <Text style={styles.kept}>{keptSince(item.creeLe)}</Text>
        </View>
        {!unavailable ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.price}>
              {formatAmount(nightly(l))} <Text style={styles.priceUnit}>F / nuit</Text>
            </Text>
          </View>
        ) : (
          <TouchableOpacity onPress={toggle} style={styles.remove} accessibilityRole="button">
            <Text style={styles.removeText}>Retirer</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.spec}>
      {icon}
      <Text style={styles.specText}>{label}</Text>
    </View>
  );
}

/** Lignes du tableau ; `score` désigne la meilleure valeur à surligner (plus haut = mieux). */
const ROWS: Array<{ label: string; value: (l: Logement) => React.ReactNode; score?: (l: Logement) => number; strong?: boolean }> = [
  { label: 'Par nuit', value: (l) => `${formatAmount(nightly(l))} F`, score: (l) => -nightly(l), strong: true },
  { label: 'Note', value: (l) => (rating(l) ? `★ ${fmtRating(rating(l))}` : 'Nouveau'), score: rating },
  { label: 'Voyageurs', value: (l) => `${l.capaciteMax} max.`, score: (l) => l.capaciteMax },
  { label: 'Chambres', value: (l) => l.nombreChambres, score: (l) => l.nombreChambres },
  { label: 'Salles de bain', value: (l) => l.nombreSallesBain ?? '—', score: (l) => l.nombreSallesBain ?? 0 },
  { label: 'Vidéo', value: (l) => (l.videoUrl ? <Check size={16} color={colors.forest[600]} strokeWidth={3} /> : <Minus size={16} color={colors.neutral[300]} />) },
  { label: 'Dernière min.', value: (l) => (l.derniereMinuteActive ? '−15 % · 48 h' : <Minus size={16} color={colors.neutral[300]} />) },
];

function CompareTable({ items, bestId, onOpen }: { items: FavoriteItem[]; bestId?: string; onOpen: (id: string) => void }) {
  const open = items.filter((f) => f.logement.statut === 'PUBLISHED');
  // La meilleure valeur de chaque ligne, parmi les logements encore disponibles (seulement s'il y a un écart)
  const tops = ROWS.map((r) => {
    if (!r.score || open.length < 2) return null;
    const scores = open.map((f) => r.score!(f.logement));
    const max = Math.max(...scores);
    return max > Math.min(...scores) ? max : null;
  });
  return (
    <View style={styles.table}>
      <View style={styles.labels}>
        <View style={{ height: 156 }} />
        {ROWS.map((r) => (
          <View key={r.label} style={styles.cellLabel}>
            <Text style={styles.labelText}>{r.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }} style={{ marginRight: -20 }}>
        {items.map((f) => {
          const l = f.logement;
          const best = f.logementId === bestId;
          const off = l.statut !== 'PUBLISHED';
          return (
            <TouchableOpacity key={f.logementId} onPressIn={() => prefetchListing(l)} onPress={() => { tap(); onOpen(f.logementId); }} style={[styles.col, best && styles.colBest, off && { opacity: 0.5 }]} accessibilityRole="button">
              <View>
                {l.photos?.[0]?.url ? <Image source={{ uri: l.photos[0].url }} style={styles.colPhoto} contentFit="cover" /> : <View style={[styles.colPhoto, { backgroundColor: colors.forest[100] }]} />}
                {best && (
                  <View style={styles.colTag}>
                    <Sparkles size={9} color={INK} />
                    <Text style={styles.colTagText}>CONSEILLÉ</Text>
                  </View>
                )}
              </View>
              <Text style={styles.colTitle} numberOfLines={2}>{l.titre}</Text>
              {ROWS.map((r, i) => {
                const v = r.value(l);
                const top = !off && tops[i] != null && r.score!(l) === tops[i];
                return (
                  <View key={r.label} style={styles.cell}>
                    <View style={[styles.cellInner, top && styles.cellTop]}>
                      {typeof v === 'string' || typeof v === 'number' ? <Text style={[styles.cellText, r.strong && styles.cellStrong]}>{v}</Text> : v}
                    </View>
                  </View>
                );
              })}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.4, color: colors.lime[800] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 36, lineHeight: 40, color: INK, letterSpacing: -0.5 },
  summary: { fontFamily: typography.fontBody, fontSize: 13, color: colors.neutral[600] },
  summaryStrong: { fontFamily: typography.fontBodyBold, color: INK },
  seg: { flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.neutral[100], borderWidth: 1, borderColor: colors.neutral[200] },
  segItem: { flex: 1, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: INK },
  segText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  chipOn: { backgroundColor: INK, borderColor: INK },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  chipCount: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.neutral[500] },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  stack: { width: 220, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  ghost: { position: 'absolute', width: 120, height: 150, borderRadius: 22 },
  ghostFront: { backgroundColor: INK, padding: 14, justifyContent: 'flex-end', gap: 7, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  ghostHeart: { position: 'absolute', top: 14, right: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  ghostLine: { width: '75%', height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.22)' },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, color: INK, textAlign: 'center' },
  emptyText: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: colors.neutral[600], textAlign: 'center', marginBottom: 10, maxWidth: 300 },

  advice: { gap: 14, padding: 16, borderRadius: 28, backgroundColor: INK },
  adviceHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adviceKicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: colors.lime[400] },
  advicePhoto: { width: 72, height: 72, borderRadius: 18 },
  adviceTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, lineHeight: 22, color: PAPER },
  advicePlace: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[300] },
  advicePrice: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },
  advicePer: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[300] },
  adviceGo: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.08)' },
  reasonText: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: '#E5EFE9' },
  verdict: { fontFamily: typography.fontBody, fontSize: 12, color: colors.forest[300] },

  card: { borderRadius: 28, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200], padding: 6, shadowColor: INK, shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardBest: { borderWidth: 2, borderColor: INK },
  cardPhoto: { borderRadius: 22 },
  cardTags: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 24, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: 'rgba(4,25,18,0.6)' },
  tagText: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 0.4, color: '#FFFFFF' },
  heart: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(4,25,18,0.45)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  cardOver: { position: 'absolute', left: 14, right: 14, bottom: 12, gap: 3 },
  cardPlace: { flexShrink: 1, fontFamily: typography.fontBodySemiBold, fontSize: 11, color: colors.forest[200] },
  cardTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, lineHeight: 25, color: '#FFFFFF' },
  off: { backgroundColor: 'rgba(248,251,244,0.55)', alignItems: 'center', justifyContent: 'center' },
  offText: { overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: INK, fontFamily: typography.fontBodyBold, fontSize: 12, color: PAPER },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingTop: 12, paddingBottom: 8 },
  specs: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[700] },
  newTag: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.lime[800] },
  kept: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[500] },
  strike: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[500], textDecorationLine: 'line-through' },
  price: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  priceUnit: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  remove: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.neutral[300], justifyContent: 'center' },
  removeText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },

  table: { flexDirection: 'row', gap: 10 },
  labels: { width: 84 },
  cellLabel: { height: 48, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.neutral[200] },
  labelText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.neutral[600] },
  col: { width: 140, padding: 8, paddingBottom: 0, borderRadius: 24, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  colBest: { borderWidth: 2, borderColor: INK },
  colTag: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, height: 20, paddingHorizontal: 7, borderRadius: 999, backgroundColor: colors.lime[400] },
  colTagText: { fontFamily: typography.fontBodyBold, fontSize: 9, color: INK },
  colPhoto: { width: '100%', height: 98, borderRadius: 18 },
  colTitle: { height: 50, paddingTop: 8, fontFamily: typography.fontBodyBold, fontSize: 12, lineHeight: 15, color: INK, textAlign: 'center' },
  cell: { height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  cellInner: { minWidth: 44, height: 30, paddingHorizontal: 9, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cellTop: { backgroundColor: colors.lime[200] },
  cellText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  cellStrong: { fontFamily: typography.fontDisplaySemiBold, fontSize: 14 },
  note: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600], textAlign: 'center' },
});
