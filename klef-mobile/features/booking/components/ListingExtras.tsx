import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowRight, X } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';
import { TenantListingCard, type ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { INK, tap } from '../../reservations/tenant/components/ui';

// ── Galerie par pièce (catégories PhotoLogement de l'API) ───────────────────

const ROOMS: Record<string, string> = {
  SALON: 'Salon',
  CHAMBRE: 'Chambres',
  CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle d’eau',
  TERRASSE: 'Terrasse',
  VUE: 'Vue',
  ENTREE: 'Entrée',
  PISCINE: 'Piscine',
  AUTRE: 'Autres',
};

type Photo = { url: string; categorie?: string | null };
export type LightboxItem = { url: string; label?: string };

/** Photos de l'annonce dans leur ordre, avec le nom de la pièce pour la visionneuse. */
export function lightboxItems(photos: Array<Photo | string> | undefined): LightboxItem[] {
  return (photos ?? [])
    .map((p) => (typeof p === 'string' ? { url: p } : { url: p?.url, label: p?.categorie ? ROOMS[p.categorie] : undefined }))
    .filter((p): p is LightboxItem => !!p.url);
}

// ── Visionneuse plein écran : glisser d'une photo à l'autre, pincer pour zoomer ──

export function PhotoLightbox({ visible, items, index, onClose }: { visible: boolean; items: LightboxItem[]; index: number; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(index);
  const listRef = useRef<FlatList<LightboxItem>>(null);

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} onShow={() => setCurrent(index)} transparent statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <View style={styles.lb}>
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(index, Math.max(0, items.length - 1))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          keyExtractor={(it, i) => `${it.url}-${i}`}
          onMomentumScrollEnd={(e) => setCurrent(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            // ScrollView zoomable (pincer) sur iOS ; affichage plein cadre partout
            <ScrollView
              style={{ width, height }}
              contentContainerStyle={{ width, height, alignItems: 'center', justifyContent: 'center' }}
              maximumZoomScale={3}
              minimumZoomScale={1}
              centerContent
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image source={{ uri: item.url }} style={{ width, height: height * 0.8 }} contentFit="contain" transition={150} />
            </ScrollView>
          )}
        />
        <View style={[styles.lbTop, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <TouchableOpacity onPress={onClose} style={styles.lbClose} accessibilityRole="button" accessibilityLabel="Fermer la photo" hitSlop={8}>
            <X size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.lbCounter}>
            {current + 1} / {items.length}
          </Text>
          <View style={{ width: 42 }} />
        </View>
        {items[current]?.label ? (
          <View style={[styles.lbBottom, { paddingBottom: insets.bottom + 20 }]} pointerEvents="none">
            <Text style={styles.lbLabel}>{items[current].label}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function ListingPhotosModal({ visible, photos, onClose }: { visible: boolean; photos: Array<Photo | string>; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [room, setRoom] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of photos ?? []) {
      const url = typeof p === 'string' ? p : p?.url;
      if (!url) continue;
      const cat = (typeof p === 'string' ? null : p.categorie) || 'AUTRE';
      map.set(cat, [...(map.get(cat) ?? []), url]);
    }
    // Ordre de visite d'un logement, « Autres » en dernier
    return Object.keys(ROOMS)
      .filter((k) => map.has(k))
      .map((k) => ({ key: k, label: ROOMS[k], urls: map.get(k)! }));
  }, [photos]);

  const shown = room ? groups.filter((g) => g.key === room) : groups;
  // Visionneuse : les photos affichées, dans l'ordre des pièces
  const flat = shown.flatMap((g) => g.urls.map((url) => ({ url, label: g.label })));
  const openAt = (url: string) => setOpen(Math.max(0, flat.findIndex((f) => f.url === url)));
  const Thumb = ({ url, style }: { url: string; style: object }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => openAt(url)} accessibilityRole="imagebutton" accessibilityLabel="Agrandir la photo">
      <Image source={{ uri: url }} style={style} contentFit="cover" />
    </TouchableOpacity>
  );
  const total = groups.reduce((s, g) => s + g.urls.length, 0);
  const half = (width - 32 - 6) / 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <View style={[styles.photos, { paddingTop: insets.top + 6 }]}>
        <View style={styles.photosTop}>
          <TouchableOpacity onPress={onClose} style={styles.round} accessibilityRole="button" accessibilityLabel="Fermer">
            <X size={18} color={INK} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.photosTitle}>{total} photo{total > 1 ? 's' : ''}</Text>
        </View>
        {groups.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {[{ key: null as string | null, label: 'Toutes', n: total }, ...groups.map((g) => ({ key: g.key as string | null, label: g.label, n: g.urls.length }))].map((c) => {
              const on = room === c.key;
              return (
                <TouchableOpacity key={c.label} onPress={() => { tap(); setRoom(c.key); }} style={[styles.chip, on && styles.chipOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                  <Text style={[styles.chipText, on && { color: colors.lime[400] }]}>
                    {c.label} · {c.n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 30, gap: 6 }}>
          {shown.map((g) => (
            <View key={g.key} style={{ gap: 6, marginBottom: 12 }}>
              <Text style={styles.roomLabel}>{g.label.toUpperCase()}</Text>
              {/* Une grande photo, puis des paires */}
              <Thumb url={g.urls[0]} style={{ width: width - 32, height: 230, borderRadius: 22 }} />
              <View style={styles.pairs}>
                {g.urls.slice(1).map((u) => (
                  <Thumb key={u} url={u} style={{ width: half, height: 160, borderRadius: 18 }} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <PhotoLightbox visible={open !== null} items={flat} index={open ?? 0} onClose={() => setOpen(null)} />
    </Modal>
  );
}

// ── Logements dans la même ville ─────────────────────────────────────────────

const SIMILAR_WIDTH = 236;

/**
 * « Aussi à … » : d'autres logements de la même ville, en cartes « affiche »
 * (les mêmes que sur l'accueil), le même type d'abord.
 */
export function SimilarListings({ currentId, ville, type }: { currentId: string; ville?: string | null; type?: string | null }) {
  const { data } = useQuery<ListingItem[]>({
    queryKey: ['similar-listings', ville],
    queryFn: async () => {
      const res = await apiClient.get('/listings/search', { params: { ville, limit: 12 } });
      const d = res.data?.data ?? res.data?.items ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: !!ville,
    staleTime: 5 * 60_000,
  });
  const items = (data ?? [])
    .filter((l) => l.id !== currentId)
    .sort((a, b) => Number(b.type === type) - Number(a.type === type))
    .slice(0, 8);
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.flex}>
          <Text style={styles.kicker}>À DÉCOUVRIR AUSSI</Text>
          <Text style={styles.h2} numberOfLines={1}>
            {ville ? `Aussi à ${ville}` : 'Dans le même quartier'}
          </Text>
        </View>
        {ville ? (
          <TouchableOpacity
            onPress={() => {
              tap();
              router.navigate({ pathname: '/(tenant)/explorer', params: { ville } } as never);
            }}
            hitSlop={8}
            style={styles.allPill}
            accessibilityRole="button"
            accessibilityLabel={`Voir tous les logements à ${ville}`}
          >
            <Text style={styles.allText}>Tout voir</Text>
            <View style={styles.allArrow}>
              <ArrowRight size={13} color={colors.lime[400]} strokeWidth={2.6} />
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SIMILAR_WIDTH + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.rail}
      >
        {items.map((l) => (
          <TenantListingCard key={l.id} listing={l} width={SIMILAR_WIDTH} onPress={() => router.push(`/listing/${l.id}` as never)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  photos: { flex: 1, backgroundColor: colors.neutral[0] },
  photosTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  photosTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  chips: { gap: 6, paddingHorizontal: 16, paddingBottom: 4 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.forest[50], justifyContent: 'center' },
  chipOn: { backgroundColor: INK },
  chipText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  roomLabel: { marginTop: 4, marginBottom: 2, fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1, color: colors.neutral[600] },
  pairs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  lb: { flex: 1, backgroundColor: '#000' },
  lbTop: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  lbClose: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  lbCounter: { fontFamily: typography.fontBodyBold, fontSize: 14, color: '#FFFFFF' },
  lbBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  lbLabel: { overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.14)', fontFamily: typography.fontBodySemiBold, fontSize: 13, color: '#FFFFFF' },

  flex: { flex: 1, minWidth: 0 },
  section: { gap: 14, marginTop: 22, marginBottom: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.forest[600] },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.4, color: INK, marginTop: 2 },
  allPill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, paddingLeft: 14, paddingRight: 4, borderRadius: radius.pill, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  allText: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: INK },
  allArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  rail: { gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
});

