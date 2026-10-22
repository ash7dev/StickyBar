import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Heart, Play, Search, Share2, X } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { PaixiLogo } from '../../../shared/components/brand/PaixiLogo';
import { apiClient } from '../../../shared/api/api-client';
import type { ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { getPrixDerniereMinute, getPrixPublic } from '../../../shared/components/ui/TenantPriceDisplay';
import { useFavorite } from '../../favorites/useFavorites';
import { useAutoplay } from '../../explorer/VideoFeed';
import { shareEscale } from '../../share/share';
import { formatAmount } from '../../owner-home/lib/format';
import { INK, PAPER, tap } from '../../reservations/tenant/components/ui';
import { WHEN_OPTIONS, WHO_OPTIONS, coverOf, datesFor, dayTint, homeMemory, type Answers, type Escale, type When, type Who } from '../lib/home';

const TAB_BAR_SPACE = 96;

/**
 * L'accueil « fenêtre » : une escale en plein écran, on glisse le long de la côte,
 * et Paixi demande « Vous partez quand ? » puis « Avec qui ? » avant d'ouvrir les logements.
 */
export function HomeWindow({ escales, initialKey, initialAnswers, onBack }: { escales: Escale[]; initialKey?: string | null; initialAnswers?: Answers | null; onBack?: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Escale>>(null);
  const startIndex = Math.max(0, escales.findIndex((e) => e.key === initialKey));
  const [index, setIndex] = useState(startIndex);
  const [when, setWhen] = useState<When | undefined>(initialAnswers?.when);
  const [who, setWho] = useState<Who | undefined>(initialAnswers?.who);
  const [autoplay] = useAutoplay();
  const escale = escales[index] ?? escales[0];
  const tint = dayTint();

  // Texte de l'escale : fondu à chaque changement
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    if (escale) homeMemory.saveEscale(escale.key);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // La feuille monte quand les deux réponses sont données
  const answered = !!when && !!who;
  const sheet = useRef(new Animated.Value(answered ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(sheet, { toValue: answered ? 1 : 0, useNativeDriver: false, friction: 9, tension: 60 }).start();
  }, [answered, sheet]);
  const collapsedTop = height * 0.56;
  const expandedTop = insets.top + 150;
  const sheetTop = sheet.interpolate({ inputRange: [0, 1], outputRange: [collapsedTop, expandedTop] });

  const answer = (patch: { when?: When; who?: Who }) => {
    tap();
    const next = { when: patch.when ?? when, who: patch.who ?? who };
    if (patch.when !== undefined) setWhen(patch.when);
    if (patch.who !== undefined) setWho(patch.who);
    homeMemory.saveAnswers({ escale: escale.key, ...next, savedAt: new Date().toISOString() });
  };

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const i = viewableItems.find((v) => v.isViewable)?.index;
    if (i != null) {
      setIndex(i);
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  const goTo = (i: number) => {
    tap();
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  if (!escale) return null;

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={listRef}
        data={escales}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        keyExtractor={(e) => e.key}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {item.cover ? <Image source={{ uri: item.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} /> : null}
            {i === index && autoplay && item.videoUrl ? <BackgroundVideo url={item.videoUrl} /> : null}
          </View>
        )}
      />
      <LinearGradient colors={['rgba(4,25,18,0.55)', 'rgba(4,25,18,0.05)', 'rgba(4,25,18,0.25)', tint]} locations={[0, 0.28, 0.5, 0.8]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* En-tête */}
      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onBack ? (
            <RoundGlass label="Retour à l’accueil" onPress={onBack}>
              <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
            </RoundGlass>
          ) : null}
          <PaixiLogo size={22} tone="inverse" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <RoundGlass label="Partager cette escale" onPress={() => shareEscale({ label: escale.label, count: escale.listings.length, fromPrice: escale.fromPrice })}>
            <Share2 size={16} color="#FFFFFF" />
          </RoundGlass>
          <RoundGlass label="Rechercher" onPress={() => router.navigate({ pathname: '/(tenant)/explorer', params: { openSearch: 'true' } } as never)}>
            <Search size={17} color="#FFFFFF" strokeWidth={2.4} />
          </RoundGlass>
        </View>
      </View>

      {/* L'escale */}
      <Animated.View style={[styles.escale, { top: insets.top + (answered ? 64 : 104), opacity: fade }]} pointerEvents="none">
        {!answered && <Text style={styles.region}>{escale.region}</Text>}
        <Text style={[styles.name, answered && { fontSize: 46, lineHeight: 48 }]} numberOfLines={1} adjustsFontSizeToFit>
          {escale.label}
        </Text>
        {!answered && (
          <>
            <Text style={styles.tagline}>{escale.tagline}</Text>
            <Text style={styles.stats}>
              <Text style={styles.statsStrong}>{escale.listings.length}</Text> logement{escale.listings.length > 1 ? 's' : ''}
              {escale.videos ? (
                <>
                  {'   '}
                  <Text style={styles.statsStrong}>{escale.videos}</Text> vidéo{escale.videos > 1 ? 's' : ''}
                </>
              ) : null}
              {'   '}dès <Text style={styles.statsStrong}>{formatAmount(escale.fromPrice)}</Text>/nuit
            </Text>
          </>
        )}
      </Animated.View>

      {/* La côte : où l'on est, du nord au sud */}
      <Coast escales={escales} index={index} onPick={goTo} top={insets.top + 140} />
      {!answered && escales.length > 1 && index === 0 && <Text style={[styles.swipeHint, { top: collapsedTop - 34 }]}>Glissez pour longer la côte →</Text>}

      {/* La feuille : question, puis logements */}
      <Animated.View style={[styles.sheet, { top: sheetTop, bottom: TAB_BAR_SPACE }]}>
        <View style={styles.grip} />
        {!answered ? (
          <Question when={when} onWhen={(w) => answer({ when: w })} onWho={(w) => answer({ who: w })} />
        ) : (
          <Results escale={escale} when={when!} who={who!} onReset={(field) => (field === 'when' ? setWhen(undefined) : setWho(undefined))} />
        )}
      </Animated.View>
    </View>
  );
}

function Question({ when, onWhen, onWho }: { when?: When; onWhen: (w: When) => void; onWho: (w: Who) => void }) {
  const step = when ? 2 : 1;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.qHead}>
        <View style={styles.pAvatar}>
          <Text style={styles.pLetter}>p</Text>
        </View>
        <Text style={styles.qTitle}>{step === 1 ? 'Vous partez quand ?' : 'Avec qui ?'}</Text>
        <Text style={styles.qStep}>{step}/2</Text>
      </View>
      <View style={styles.chips}>
        {step === 1
          ? WHEN_OPTIONS.map((o) => <Chip key={o.key} label={o.label} onPress={() => onWhen(o.key)} />)
          : WHO_OPTIONS.map((o) => <Chip key={o.key} label={o.label} onPress={() => onWho(o.key)} />)}
      </View>
    </View>
  );
}

function Results({ escale, when, who, onReset }: { escale: Escale; when: When; who: Who; onReset: (f: 'when' | 'who') => void }) {
  const dates = datesFor(when);
  const guests = WHO_OPTIONS.find((o) => o.key === who)!.guests;
  const params = useMemo(
    () => ({ ville: escale.label, nbPersonnes: guests, ...(dates && { dateDebut: dates.start, dateFin: dates.end }), limit: 20 }),
    [escale.label, guests, dates?.start, dates?.end], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const { data, isLoading } = useQuery<ListingItem[]>({
    queryKey: ['home-results', params],
    queryFn: async () => {
      const res = await apiClient.get('/listings/search', { params });
      const d = res.data?.data ?? res.data?.items ?? [];
      return Array.isArray(d) ? d : [];
    },
    staleTime: 60_000,
  });
  const items = data ?? [];
  const whenLabel = WHEN_OPTIONS.find((o) => o.key === when)!.label;
  const whoLabel = WHO_OPTIONS.find((o) => o.key === who)!.label;

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={styles.chips}>
        <AnswerPill label={whenLabel} onPress={() => onReset('when')} />
        <AnswerPill label={who === 'amis' || who === 'famille' ? `${whoLabel} · ${guests}` : whoLabel} onPress={() => onReset('who')} />
      </View>
      <Text style={styles.resTitle}>
        {isLoading ? 'On cherche…' : items.length ? `${items.length} logement${items.length > 1 ? 's' : ''} libre${items.length > 1 ? 's' : ''}` : 'Rien de libre ici'}
        {'\n'}
        <Text style={{ color: colors.forest[600] }}>{items.length ? (guests > 2 ? `pour vous ${guests === 6 ? 'six' : 'quatre'}.` : 'pour vous.') : 'glissez vers une autre escale.'}</Text>
      </Text>
      {isLoading ? (
        <ActivityIndicator color={colors.forest[600]} style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
          {items.map((l) => (
            <ResultRow key={l.id} l={l} />
          ))}
          {items.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                router.navigate({
                  pathname: '/(tenant)/explorer',
                  params: { ville: escale.label, nbPersonnes: String(guests), ...(dates && { arrivee: dates.start, depart: dates.end }) },
                } as never)
              }
              style={styles.more}
              accessibilityRole="button"
            >
              <Text style={styles.moreText}>Voir sur la carte et en vidéo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ResultRow({ l }: { l: ListingItem }) {
  const [kept, toggle] = useFavorite(l.id);
  return (
    <TouchableOpacity onPress={() => { tap(); router.push(`/listing/${l.id}` as never); }} style={styles.row} accessibilityRole="button">
      <View>
        {coverOf(l) ? <Image source={{ uri: coverOf(l) }} style={styles.rowPhoto} contentFit="cover" /> : <View style={[styles.rowPhoto, { backgroundColor: colors.forest[100] }]} />}
        {l.videoUrl ? (
          <View style={styles.rowPlay}>
            <Play size={10} color={colors.lime[400]} fill={colors.lime[400]} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{l.titre}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {[l.quartier, l.ville].filter(Boolean).join(', ')}
          {l.note ? ` · ★ ${Number(l.note).toFixed(1).replace('.', ',')}` : ''}
        </Text>
        <Text style={styles.rowPrice}>
          {l.prixSejour ? formatAmount(l.prixSejour) : formatAmount(l.derniereMinuteActive ? getPrixDerniereMinute(getPrixPublic(l.prixBase)) : getPrixPublic(l.prixBase))}
          <Text style={styles.rowSub}>{l.prixSejour ? ` · ${l.nbNuits} nuit${(l.nbNuits ?? 0) > 1 ? 's' : ''}, frais inclus` : ' / nuit'}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={toggle} hitSlop={10} accessibilityRole="button" accessibilityLabel={kept ? 'Ne plus garder' : 'Garder'}>
        <Heart size={20} color={INK} fill={kept ? INK : 'transparent'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

/** Mini-côte : un point par escale, l'escale affichée en vert citron. */
function Coast({ escales, index, onPick, top }: { escales: Escale[]; index: number; onPick: (i: number) => void; top: number }) {
  if (escales.length < 2) return null;
  const gap = Math.min(40, 220 / (escales.length - 1));
  return (
    <View style={[styles.coast, { top, height: gap * (escales.length - 1) + 16 }]}>
      <View style={[styles.coastLine, { height: gap * (escales.length - 1) }]} />
      {escales.map((e, i) => {
        const on = i === index;
        return (
          <TouchableOpacity key={e.key} onPress={() => onPick(i)} hitSlop={8} style={[styles.coastDotWrap, { top: i * gap }]} accessibilityRole="button" accessibilityLabel={e.label}>
            {on && <Text style={styles.coastLabel}>{e.label}</Text>}
            <View style={[styles.coastDot, on && styles.coastDotOn]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function BackgroundVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function RoundGlass({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.glass} accessibilityRole="button" accessibilityLabel={label}>
      {children}
    </TouchableOpacity>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.chip} accessibilityRole="button">
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function AnswerPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.answer} accessibilityRole="button" accessibilityLabel={`Changer : ${label}`}>
      <Text style={styles.answerText}>{label}</Text>
      <X size={12} color={colors.forest[300]} strokeWidth={2.6} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: INK },
  top: { position: 'absolute', left: 20, right: 20, top: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, letterSpacing: -0.6, color: '#FFFFFF' },
  glass: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(248,251,244,0.18)', alignItems: 'center', justifyContent: 'center' },

  escale: { position: 'absolute', left: 20, right: 64 },
  region: { fontFamily: typography.fontBodyBold, fontSize: 12, letterSpacing: 1.6, color: colors.lime[400] },
  name: { marginTop: 6, fontFamily: typography.fontDisplaySemiBold, fontSize: 84, lineHeight: 84, letterSpacing: -3.5, color: '#FFFFFF' },
  tagline: { marginTop: 10, maxWidth: 250, fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: '#DDE8E1' },
  stats: { marginTop: 14, fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
  statsStrong: { fontFamily: typography.fontBodyBold, color: '#FFFFFF' },
  swipeHint: { position: 'absolute', left: 20, fontFamily: typography.fontBodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  coast: { position: 'absolute', right: 18, width: 20 },
  coastLine: { position: 'absolute', left: 9, top: 4, width: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  coastDotWrap: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  coastDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.65)' },
  coastDotOn: { width: 16, height: 16, borderRadius: 8, marginRight: 2, backgroundColor: colors.lime[400], borderWidth: 3, borderColor: 'rgba(211,242,110,0.35)' },
  coastLabel: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.lime[400] },

  sheet: { position: 'absolute', left: 8, right: 8, borderRadius: 34, backgroundColor: PAPER, paddingHorizontal: 18, paddingTop: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 12 },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.neutral[200], marginBottom: 12 },
  qHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  pLetter: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: colors.lime[400], marginTop: -2 },
  qTitle: { flex: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },
  qStep: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.neutral[500] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 42, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], justifyContent: 'center' },
  chipText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999, backgroundColor: INK },
  answerText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.lime[400] },

  resTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, lineHeight: 27, color: INK },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  rowPhoto: { width: 84, height: 84, borderRadius: 16 },
  rowPlay: { position: 'absolute', left: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(4,25,18,0.65)', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  rowSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  rowPrice: { marginTop: 4, fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
  more: { alignSelf: 'center', marginTop: 4, height: 44, paddingHorizontal: 20, borderRadius: 999, backgroundColor: INK, justifyContent: 'center' },
  moreText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },
});
