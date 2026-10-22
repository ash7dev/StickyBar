import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Share, StyleSheet, Switch, Text, TouchableOpacity, View, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, MapPin, Play, Share2, Star, Volume2, VolumeX, Zap } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { getPrixDerniereMinute, getPrixPublic } from '../../shared/components/ui/TenantPriceDisplay';
import type { ListingItem } from '../../shared/components/ui/TenantListingCard';
import { useFavorite } from '../favorites/useFavorites';
import { shareListing } from '../share/share';
import { formatAmount } from '../owner-home/lib/format';
import { INK, PAPER, tap } from '../reservations/tenant/components/ui';

const AUTOPLAY_KEY = 'klef_video_autoplay_v1';
const HINT_KEY = 'klef_video_hint_seen_v1';

/** Lecture automatique des vidéos (réglage mémorisé : économiser les données mobiles). */
export function useAutoplay(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(AUTOPLAY_KEY).then((v) => v === 'off' && setOn(false)).catch(() => {});
  }, []);
  const set = useCallback((v: boolean) => {
    setOn(v);
    AsyncStorage.setItem(AUTOPLAY_KEY, v ? 'on' : 'off').catch(() => {});
  }, []);
  return [on, set];
}

/**
 * Onglet « Vidéos » d'Explorer : seulement les logements filmés, en plein écran.
 * Une seule vidéo est chargée à la fois (celle à l'écran) ; les autres montrent leur photo.
 */
export function VideoFeed({ params, totalAll, topInset = 10 }: { params: Record<string, unknown>; totalAll: number; topInset?: number }) {
  const [height, setHeight] = useState(0);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [autoplay, setAutoplay] = useAutoplay();
  const [showHint, setShowHint] = useState(false);
  // « Voir toutes les vidéos » : ignorer les critères quand ils excluent tous les logements filmés
  const [ignoreFilters, setIgnoreFilters] = useState(false);
  const effectiveParams = ignoreFilters ? {} : params;
  const hasCriteria = Object.keys(params).length > 0;

  const { data, isLoading, isError, refetch } = useQuery<{ items: ListingItem[]; total: number }>({
    queryKey: ['explorer-videos', effectiveParams],
    queryFn: async () => {
      const res = await apiClient.get('/listings/search', { params: { ...effectiveParams, avecVideo: true, limit: 30 } });
      const items = res.data?.data ?? res.data?.items ?? [];
      return { items: Array.isArray(items) ? items.filter((l: ListingItem) => !!l.videoUrl) : [], total: Number(res.data?.meta?.total ?? res.data?.total ?? 0) };
    },
    staleTime: 2 * 60_000,
  });
  const items = data?.items ?? [];

  // Combien de logements filmés au total, pour expliquer un résultat vide
  const allVideos = useQuery<number>({
    queryKey: ['explorer-videos-count'],
    queryFn: async () => {
      const res = await apiClient.get('/listings/search', { params: { avecVideo: true, limit: 1 } });
      return Number(res.data?.meta?.total ?? res.data?.total ?? 0);
    },
    enabled: !isLoading && items.length === 0 && hasCriteria && !ignoreFilters,
    staleTime: 5 * 60_000,
  });

  // Nouveaux critères : on revient aux résultats filtrés
  const paramsKey = JSON.stringify(params);
  useEffect(() => {
    setIgnoreFilters(false);
  }, [paramsKey]);

  useEffect(() => {
    AsyncStorage.getItem(HINT_KEY).then((v) => !v && setShowHint(true)).catch(() => {});
  }, []);
  const closeHint = () => {
    setShowHint(false);
    AsyncStorage.setItem(HINT_KEY, '1').catch(() => {});
  };

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) setActive(first.index);
  }, []);

  return (
    <View style={styles.wrap} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {isLoading || !height ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.lime[400]} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Play size={30} color={colors.lime[400]} />
          <Text style={styles.emptyTitle}>Les vidéos n’ont pas pu charger</Text>
          <Text style={styles.emptyText}>Vérifiez votre connexion, puis réessayez.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.emptyBtn} accessibilityRole="button">
            <Text style={styles.emptyBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Play size={30} color={colors.lime[400]} />
          <Text style={styles.emptyTitle}>Aucune visite vidéo pour ces critères</Text>
          <Text style={styles.emptyText}>
            {allVideos.data
              ? `Vos critères (ville, dates, voyageurs ou catégorie) excluent les ${allVideos.data} logements filmés.`
              : totalAll > 0
                ? `Les ${totalAll} logements de cette recherche sont dans Liste et Carte.`
                : 'Élargissez la recherche pour voir plus de logements.'}
          </Text>
          {allVideos.data ? (
            <TouchableOpacity onPress={() => { tap(); setIgnoreFilters(true); }} style={styles.emptyBtn} accessibilityRole="button">
              <Text style={styles.emptyBtnText}>Voir les {allVideos.data} vidéos</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          renderItem={({ item, index }) => (
            <Reel
              item={item}
              height={height}
              active={index === active}
              autoplay={autoplay}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              position={`${index + 1} / ${items.length}`}
            />
          )}
        />
      )}

      {/* Bandeau : combien de logements filmés, et la lecture automatique */}
      {items.length > 0 && (
        <View style={[styles.banner, { top: topInset }]} pointerEvents="box-none">
          {ignoreFilters ? (
            <TouchableOpacity onPress={() => setIgnoreFilters(false)} accessibilityRole="button">
              <Text style={styles.bannerText}>Toutes les vidéos · revenir à ma recherche ✕</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.bannerText}>
              {data?.total ?? items.length} filmé{(data?.total ?? 0) > 1 ? 's' : ''} sur {totalAll} · les autres dans Liste et Carte
            </Text>
          )}
          <View style={styles.autoRow}>
            <Text style={styles.bannerText}>Lecture auto</Text>
            <Switch value={autoplay} onValueChange={setAutoplay} trackColor={{ true: colors.lime[600], false: 'rgba(255,255,255,0.3)' }} thumbColor="#FFFFFF" style={{ transform: [{ scale: 0.75 }] }} />
          </View>
        </View>
      )}

      {showHint && items.length > 0 && (
        <TouchableOpacity activeOpacity={1} onPress={closeHint} style={styles.hint} accessibilityRole="button" accessibilityLabel="Fermer l’aide">
          <Text style={styles.hintArrow}>↑</Text>
          <Text style={styles.hintTitle}>Glissez vers le haut</Text>
          <Text style={styles.hintText}>pour passer au logement suivant</Text>
          <View style={styles.hintHeart}>
            <Heart size={28} color={INK} fill={INK} />
          </View>
          <Text style={styles.hintTitle}>Touchez ♥ pour garder</Text>
          <Text style={styles.hintText}>vos gardés vous suivent, prêts à comparer</Text>
          <View style={styles.hintBtn}>
            <Text style={styles.hintBtnText}>C’est parti</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Reel({
  item,
  height,
  active,
  autoplay,
  muted,
  onToggleMute,
  position,
}: {
  item: ListingItem;
  height: number;
  active: boolean;
  autoplay: boolean;
  muted: boolean;
  onToggleMute: () => void;
  position: string;
}) {
  const [isFavorite, toggleFavorite] = useFavorite(item.id);
  const [playRequested, setPlayRequested] = useState(false);
  const poster = typeof item.photos?.[0] === 'string' ? (item.photos[0] as unknown as string) : item.photos?.[0]?.url;
  const playing = active && (autoplay || playRequested);
  const nightly = item.derniereMinuteActive ? getPrixDerniereMinute(getPrixPublic(item.prixBase)) : getPrixPublic(item.prixBase);

  // Reprendre la vidéo au toucher seulement pour le logement à l'écran
  useEffect(() => {
    if (!active) setPlayRequested(false);
  }, [active]);

  return (
    <View style={{ height, backgroundColor: INK }}>
      {poster ? <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      {playing && item.videoUrl ? <ReelVideo url={item.videoUrl} muted={muted} /> : null}
      <LinearGradient colors={['rgba(4,25,18,0.55)', 'transparent', 'transparent', 'rgba(4,25,18,0.92)']} locations={[0, 0.2, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {!playing && (
        <TouchableOpacity onPress={() => { tap(); setPlayRequested(true); }} style={styles.playBtn} accessibilityRole="button" accessibilityLabel="Lancer la visite vidéo">
          <Play size={26} color={INK} fill={INK} />
        </TouchableOpacity>
      )}

      {/* Actions à droite */}
      <View style={styles.rail}>
        <RailButton label={isFavorite ? 'Gardé' : 'Garder'} active={isFavorite} onPress={toggleFavorite}>
          <Heart size={24} color={isFavorite ? INK : '#FFFFFF'} fill={isFavorite ? INK : 'transparent'} strokeWidth={2.2} />
        </RailButton>
        <RailButton label={muted ? 'Son' : 'Couper'} onPress={onToggleMute}>
          {muted ? <VolumeX size={21} color="#FFFFFF" /> : <Volume2 size={21} color="#FFFFFF" />}
        </RailButton>
        <RailButton label="Partager" onPress={() => shareListing({ id: item.id, titre: item.titre, ville: item.ville, quartier: item.quartier, prixSejour: item.prixSejour, nbNuits: item.nbNuits, nightly })}>
          <Share2 size={20} color="#FFFFFF" />
        </RailButton>
      </View>

      {/* Infos et réservation */}
      <View style={styles.info} pointerEvents="box-none">
        <Text style={styles.position}>{position}</Text>
        {item.derniereMinuteActive && (
          <View style={styles.deal}>
            <Zap size={11} color={INK} fill={INK} />
            <Text style={styles.dealText}>−15 % DERNIÈRE MINUTE</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
        <View style={styles.metaRow}>
          <MapPin size={12} color="#DDE8E1" />
          <Text style={styles.meta} numberOfLines={1}>
            {[item.quartier, item.ville].filter(Boolean).join(', ')}
            {item.nombreChambres ? ` · ${item.nombreChambres} ch.` : ''}
            {item.capaciteMax ? ` · ${item.capaciteMax} voyageurs` : ''}
          </Text>
          {item.note ? (
            <>
              <Star size={12} color={colors.gold[400]} fill={colors.gold[400]} />
              <Text style={styles.meta}>{String(Number(item.note).toFixed(1)).replace('.', ',')}</Text>
            </>
          ) : null}
        </View>
        <View style={styles.cta}>
          <View style={{ flex: 1 }}>
            {item.prixSejour ? (
              <>
                <Text style={styles.ctaPrice}>
                  {formatAmount(item.prixSejour)} <Text style={styles.ctaUnit}>FCFA</Text>
                </Text>
                <Text style={styles.ctaSub}>{item.nbNuits} nuit{(item.nbNuits ?? 0) > 1 ? 's' : ''} · frais inclus</Text>
              </>
            ) : (
              <>
                <Text style={styles.ctaPrice}>
                  {formatAmount(nightly)} <Text style={styles.ctaUnit}>/ nuit</Text>
                </Text>
                <Text style={styles.ctaSub}>Frais de service inclus</Text>
              </>
            )}
          </View>
          <TouchableOpacity onPress={() => { tap(); router.push(`/listing/${item.id}` as never); }} style={styles.ctaBtn} accessibilityRole="button">
            <Text style={styles.ctaBtnText}>Voir l’annonce</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/** Lecteur monté uniquement pour la vidéo à l'écran : une seule vidéo téléchargée à la fois. */
function ReelVideo({ url, muted }: { url: string; muted: boolean }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

function RailButton({ label, active, onPress, children }: { label: string; active?: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={styles.railItem} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.railBtn, active && { backgroundColor: colors.lime[400] }]}>{children}</View>
      <Text style={styles.railLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: INK },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 21, color: PAPER },
  emptyText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: '#C9DBD1', textAlign: 'center' },
  emptyBtn: { marginTop: 8, height: 48, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },

  banner: { position: 'absolute', left: 14, right: 14, top: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerText: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  playBtn: { position: 'absolute', alignSelf: 'center', top: '38%', width: 66, height: 66, borderRadius: 33, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },

  rail: { position: 'absolute', right: 12, bottom: 230, gap: 16, alignItems: 'center' },
  railItem: { alignItems: 'center', gap: 4 },
  railBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(248,251,244,0.18)', alignItems: 'center', justifyContent: 'center' },
  railLabel: { fontFamily: typography.fontBodyBold, fontSize: 11, color: '#FFFFFF' },

  info: { position: 'absolute', left: 16, right: 16, bottom: 120, gap: 8 },
  position: { fontFamily: typography.fontBodySemiBold, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  deal: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.lime[400] },
  dealText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK },
  title: { marginRight: 70, fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 30, letterSpacing: -0.7, color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginRight: 70 },
  meta: { flexShrink: 1, fontFamily: typography.fontBody, fontSize: 13, color: '#DDE8E1' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, padding: 10, paddingLeft: 18, borderRadius: 999, backgroundColor: 'rgba(248,251,244,0.96)' },
  ctaPrice: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: INK },
  ctaUnit: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  ctaSub: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[600] },
  ctaBtn: { height: 46, paddingHorizontal: 20, borderRadius: 999, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },

  hint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(4,25,18,0.82)', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 30 },
  hintArrow: { fontSize: 34, color: colors.lime[400] },
  hintTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: '#FFFFFF' },
  hintText: { fontFamily: typography.fontBody, fontSize: 13, color: '#C9DBD1', marginBottom: 22 },
  hintHeart: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  hintBtn: { marginTop: 10, height: 52, paddingHorizontal: 40, borderRadius: 999, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  hintBtnText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
});
