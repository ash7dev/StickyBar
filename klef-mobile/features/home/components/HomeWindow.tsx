import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronUp, Heart, Play, Search, Share2, X } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { PaixiLogo } from '../../../shared/components/brand/PaixiLogo';
import { apiClient } from '../../../shared/api/api-client';
import type { ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { getPrixPublic } from '../../../shared/components/ui/TenantPriceDisplay';
import { useFavorite } from '../../favorites/useFavorites';
import { useAutoplay } from '../../explorer/VideoFeed';
import { prefetchListing } from '../../../shared/lib/prefetch-listing';
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

  // Les logements de l'escale défilent en fond, le logement filmé d'abord
  const slides = useMemo(() => slidesOf(escale), [escale]);
  const [slide, setSlide] = useState(0);
  useEffect(() => setSlide(0), [index]);
  const current = slides[slide] ?? slides[0];
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setTimeout(() => setSlide((n) => (n + 1) % slides.length), current?.videoUrl && autoplay ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [slide, slides.length, current?.videoUrl, autoplay]);

  // Texte de l'escale : fondu à chaque changement
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    if (escale) homeMemory.saveEscale(escale.key);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // La feuille : rangée en bas (0), question (1), logements quand les deux réponses sont données (2)
  const answered = !!when && !!who;
  const [hidden, setHidden] = useState(false);
  const mode = answered ? 2 : hidden ? 0 : 1;
  const sheet = useRef(new Animated.Value(mode)).current;
  useEffect(() => {
    Animated.spring(sheet, { toValue: mode, useNativeDriver: false, friction: 9, tension: 60 }).start();
  }, [mode, sheet]);
  const peekTop = height - TAB_BAR_SPACE - 64;
  const collapsedTop = height * 0.56;
  const expandedTop = insets.top + 150;
  const sheetTop = sheet.interpolate({ inputRange: [0, 1, 2], outputRange: [peekTop, collapsedTop, expandedTop] });

  // Glisser la poignée vers le bas range la question, vers le haut la ressort
  const hiddenRef = useRef(hidden);
  hiddenRef.current = hidden;
  const grip = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dy > 30 && !hiddenRef.current) { tap(); setHidden(true); }
          else if (g.dy < -30 && hiddenRef.current) { tap(); setHidden(false); }
        },
      }),
    [],
  );

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
        extraData={`${index}-${slide}-${autoplay}`}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {i === index ? (
              <Backdrop listing={current} fallback={item.cover} autoplay={autoplay} />
            ) : item.cover ? (
              <Image source={{ uri: item.cover }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            ) : null}
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
      {!answered && escales.length > 1 && index === 0 && <Text style={[styles.swipeHint, { top: (hidden ? peekTop : collapsedTop) - (current ? 92 : 34) }]}>Glissez pour longer la côte →</Text>}

      {/* Le logement à l'écran : on peut l'ouvrir */}
      {!answered && current ? (
        <TouchableOpacity
          onPressIn={() => prefetchListing(current)}
          onPress={() => { tap(); router.push(`/listing/${current.id}` as never); }}
          style={[styles.caption, { top: (hidden ? peekTop : collapsedTop) - 66 }]}
          accessibilityRole="button"
          accessibilityLabel={`Voir ${current.titre}`}
        >
          {slides.length > 1 ? (
            <View style={styles.capBars}>
              {slides.map((l, i) => (
                <View key={l.id} style={[styles.capBar, i === slide && styles.capBarOn]} />
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {current.videoUrl ? <Play size={10} color={colors.lime[400]} fill={colors.lime[400]} /> : null}
            <Text style={styles.capTitle} numberOfLines={1}>{current.titre}</Text>
            <Text style={styles.capPrice}>{formatAmount(nightlyOf(current))}/nuit ›</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* La feuille : question, puis logements */}
      <Animated.View style={[styles.sheet, { top: sheetTop, bottom: TAB_BAR_SPACE }]}>
        {answered ? (
          <View style={styles.grip} />
        ) : (
          <TouchableOpacity
            {...grip.panHandlers}
            onPress={() => { tap(); setHidden((h) => !h); }}
            style={styles.gripHit}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Afficher la question' : 'Ranger la question'}
          >
            <View style={[styles.grip, { marginBottom: 0 }]} />
          </TouchableOpacity>
        )}
        {!answered && hidden ? (
          <TouchableOpacity onPress={() => { tap(); setHidden(false); }} style={styles.peek} accessibilityRole="button">
            <View style={[styles.pAvatar, { width: 28, height: 28, borderRadius: 14 }]}>
              <Text style={[styles.pLetter, { fontSize: 15 }]}>p</Text>
            </View>
            <Text style={styles.peekTitle}>{when ? 'Avec qui ?' : 'Vous partez quand ?'}</Text>
            <ChevronUp size={18} color={INK} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : !answered ? (
          <Question when={when} onWhen={(w) => answer({ when: w })} onWho={(w) => answer({ who: w })} onBack={() => { tap(); setWhen(undefined); }} />
        ) : (
          <Results escale={escale} when={when!} who={who!} onReset={(field) => (field === 'when' ? setWhen(undefined) : setWho(undefined))} />
        )}
      </Animated.View>
    </View>
  );
}

function Question({ when, onWhen, onWho, onBack }: { when?: When; onWhen: (w: When) => void; onWho: (w: Who) => void; onBack: () => void }) {
  const step = when ? 2 : 1;
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.qHead}>
        <View style={styles.pAvatar}>
          <Text style={styles.pLetter}>p</Text>
        </View>
        <Text style={styles.qTitle}>{step === 1 ? 'Vous partez quand ?' : 'Avec qui ?'}</Text>
        {step === 2 ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Revenir à « Vous partez quand ? »">
            <Text style={styles.qStep}>‹ 2/2</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.qStep}>1/2</Text>
        )}
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
    <TouchableOpacity onPressIn={() => prefetchListing(l)} onPress={() => { tap(); router.push(`/listing/${l.id}` as never); }} style={styles.row} accessibilityRole="button">
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
          {l.prixSejour ? formatAmount(l.prixSejour) : formatAmount(getPrixPublic(l.prixBase))}
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
            {on && (
              <View style={styles.coastLabelPill} pointerEvents="none">
                <Text style={styles.coastLabel} numberOfLines={1}>
                  {e.label}
                </Text>
              </View>
            )}
            <View style={[styles.coastDot, on && styles.coastDotOn]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function slidesOf(e?: Escale): ListingItem[] {
  if (!e) return [];
  return e.listings.filter((l) => coverOf(l) || l.videoUrl).sort((a, b) => Number(!!b.videoUrl) - Number(!!a.videoUrl));
}

const nightlyOf = (l: ListingItem) => getPrixPublic(l.prixBase);

/** Fond de l'escale active : fondu d'un logement à l'autre, lent zoom, vidéo si le logement est filmé. */
function Backdrop({ listing, fallback, autoplay }: { listing?: ListingItem; fallback?: string; autoplay: boolean }) {
  const uri = coverOf(listing) ?? fallback;
  const [under, setUnder] = useState(uri);
  const fade = useRef(new Animated.Value(1)).current;
  const zoom = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    zoom.setValue(1);
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start(({ finished }) => finished && setUnder(uri));
    Animated.timing(zoom, { toValue: 1.08, duration: 9000, useNativeDriver: true }).start();
  }, [uri, listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {under ? <Image source={{ uri: under }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, transform: [{ scale: zoom }] }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        {autoplay && listing?.videoUrl ? <BackgroundVideo key={listing.videoUrl} url={listing.videoUrl} /> : null}
      </Animated.View>
    </View>
  );
}

function BackgroundVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  // Le lecteur natif capte les gestes sur iOS : sans ça, impossible de glisser vers l'escale suivante
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
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
  caption: { position: 'absolute', left: 16, right: 64, alignSelf: 'flex-start', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, backgroundColor: 'rgba(4,25,18,0.55)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  capBars: { flexDirection: 'row', gap: 4 },
  capBar: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  capBarOn: { backgroundColor: colors.lime[400] },
  capTitle: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 13, color: '#FFFFFF' },
  capPrice: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.lime[400] },
  swipeHint: { position: 'absolute', left: 20, fontFamily: typography.fontBodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  coast: { position: 'absolute', right: 18, width: 20 },
  coastLine: { position: 'absolute', left: 9, top: 4, width: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  coastDotWrap: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  coastDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: 'rgba(255,255,255,0.65)' },
  coastDotOn: { width: 16, height: 16, borderRadius: 8, marginRight: 2, backgroundColor: colors.lime[400], borderWidth: 3, borderColor: 'rgba(211,242,110,0.35)' },
  coastLabelPill: {
    position: 'absolute',
    right: 24,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    backgroundColor: 'rgba(4,25,18,0.55)',
    justifyContent: 'center',
  },
  coastLabel: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.lime[400] },

  sheet: { position: 'absolute', left: 8, right: 8, borderRadius: 34, backgroundColor: PAPER, paddingHorizontal: 18, paddingTop: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 12 },
  grip: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.neutral[200], marginBottom: 12 },
  gripHit: { alignSelf: 'stretch', alignItems: 'center', marginTop: -10, paddingTop: 10, paddingBottom: 12 },
  peek: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4 },
  peekTitle: { flex: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 17, color: INK },
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
