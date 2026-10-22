import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronRight, Plus, Search, X, Zap } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { PaixiLogo } from '../../../shared/components/brand/PaixiLogo';
import { TenantSearchBarPill } from '../../../shared/components/layout/TenantSearchBarPill';
import { TenantListingCard, type ListingItem } from '../../../shared/components/ui/TenantListingCard';
import { HostInvite } from './HostInvite';
import type { FavoriteItem } from '../../favorites/useFavorites';
import { INK, PAPER, tap } from '../../reservations/tenant/components/ui';
import { WHO_OPTIONS, answersExpired, greeting, type Answers, type Escale } from '../lib/home';
import { countdown, pad2, type MyReservation } from '../lib/stays';

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** La question suit la semaine : on prépare le week-end, on en profite, puis on regarde plus loin. */
function weekQuestion(now = new Date()): { lead: string; accent: string } {
  const d = now.getDay();
  if (d >= 1 && d <= 3) return { lead: 'Où partez-vous', accent: 'ce week-end' };
  if (d === 4 || d === 5) return { lead: 'Où passez-vous', accent: 'ce week-end' };
  return { lead: 'Une escapade', accent: 'la semaine prochaine' };
}

const fromFavorite = (f: FavoriteItem): ListingItem => ({
  id: f.logement.id,
  titre: f.logement.titre,
  type: f.logement.type,
  ville: f.logement.ville,
  quartier: f.logement.quartier,
  prixBase: Number(f.logement.prixBase),
  capaciteMax: f.logement.capaciteMax,
  nombreChambres: f.logement.nombreChambres,
  derniereMinuteActive: f.logement.derniereMinuteActive,
  note: f.logement.note ? Number(f.logement.note) : null,
  videoUrl: f.logement.videoUrl,
  photos: f.logement.photos,
});

/**
 * Accueil normal (voyageur qui revient, ou séjour encore lointain) : l'accueil familier,
 * sans la rangée de catégories, avec ses nouvelles, les escales et des sections sans doublons.
 */
export function HomeRegular({
  firstName,
  avatarUrl,
  upcoming,
  escales,
  catalog,
  weekend,
  favorites,
  lastVisit,
  answers,
  refreshing,
  onRefresh,
  onOpenEscale,
  onOpenStay,
}: {
  firstName?: string;
  avatarUrl?: string | null;
  upcoming?: MyReservation;
  escales: Escale[];
  catalog: ListingItem[];
  weekend: ListingItem[];
  favorites: FavoriteItem[];
  lastVisit: string | null;
  answers: Answers | null;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenEscale: (key?: string) => void;
  onOpenStay: () => void;
}) {
  const insets = useSafeAreaInsets();
  const since = lastVisit ? new Date(lastVisit) : null;
  const question = weekQuestion();
  const openSearch = () => router.navigate({ pathname: '/(tenant)/explorer', params: { openSearch: 'true' } } as never);

  // Nouvelles réelles depuis la dernière visite : gardés en dernière minute, gardés retirés, nouveaux logements
  const fresh = useMemo(() => (since ? catalog.filter((l) => l.creeLe && new Date(l.creeLe) > since) : []), [catalog, lastVisit]); // eslint-disable-line react-hooks/exhaustive-deps
  const news = useMemo(() => {
    const out: Array<{ key: string; id?: string; photo?: string; title: string; sub: string; tone: 'lime' | 'gold' | 'white' }> = [];
    for (const f of favorites) {
      if (f.logement.statut !== 'PUBLISHED') out.push({ key: `off-${f.logementId}`, title: `${f.logement.titre} n’est plus disponible`, sub: 'retiré par l’hôte', tone: 'gold', photo: f.logement.photos?.[0]?.url });
      else if (f.logement.derniereMinuteActive) out.push({ key: `dm-${f.logementId}`, id: f.logementId, title: `${f.logement.titre} · −15 %`, sub: 'gardé · dernière minute', tone: 'lime', photo: f.logement.photos?.[0]?.url });
    }
    if (fresh.length) out.push({ key: 'fresh', id: fresh[0].id, title: `${fresh.length} nouveau${fresh.length > 1 ? 'x' : ''} logement${fresh.length > 1 ? 's' : ''}`, sub: fresh[0].titre, tone: 'white', photo: coverOf(fresh[0]) });
    return out;
  }, [favorites, fresh]);

  // Sections, chaque logement une seule fois sur la page
  const sections = useMemo(() => {
    const used = new Set<string>();
    const take = (ls: ListingItem[], max = 8) => ls.filter((l) => !used.has(l.id)).slice(0, max).map((l) => (used.add(l.id), l));
    const kept = take(favorites.filter((f) => f.logement.statut === 'PUBLISHED').map(fromFavorite));
    const newest = take(fresh.length ? fresh : [...catalog].sort((a, b) => (b.creeLe ?? '').localeCompare(a.creeLe ?? '')), 6);
    const libres = take(weekend);
    const videos = take(catalog.filter((l) => !!l.videoUrl));
    return [
      { key: 'kept', title: 'Vos gardés', sub: 'Comparez-les en un tap', items: kept, all: () => router.push('/favoris' as never) },
      { key: 'new', title: 'Nouveautés', sub: fresh.length ? 'Arrivés depuis votre dernière visite' : 'Les derniers logements arrivés sur Paixi', items: newest, all: () => router.navigate({ pathname: '/(tenant)/explorer', params: {} } as never) },
      { key: 'weekend', title: 'Libres ce week-end', sub: 'Prix total du week-end, frais inclus', items: libres, all: () => router.navigate({ pathname: '/(tenant)/explorer', params: { category: 'weekend', filterWeekend: 'true' } } as never) },
      { key: 'videos', title: 'Visites vidéo', sub: 'Entrez avant de réserver', items: videos, all: () => router.navigate('/(tenant)/explorer' as never) },
    ].filter((s) => s.items.length > 0);
  }, [favorites, fresh, catalog, weekend]);

  const expired = answersExpired(answers);
  // Photo d'une villa du catalogue (sinon le premier logement) pour l'invitation propriétaire
  const hostCover = coverOf(catalog.find((l) => l.type === 'VILLA') ?? catalog[0] ?? ({} as ListingItem));
  const answersEscale = answers ? escales.find((e) => e.key === answers.escale) : undefined;

  return (
    <View style={styles.screen}>
      {/* Barre fixe : le logo, la recherche et le profil toujours à un tap */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <PaixiLogo size={22} />
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { tap(); openSearch(); }} style={styles.round} accessibilityRole="button" accessibilityLabel="Rechercher">
            <Search size={17} color={INK} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { tap(); router.navigate('/(tenant)/profile' as never); }} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Mon profil">
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" /> : <Text style={styles.avatarText}>{(firstName ?? 'P').charAt(0).toUpperCase()}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest[600]} />}
    >
      <View style={{ gap: 22, paddingTop: 18 }}>
        {/* La salutation et la question ne font qu'une, et la question suit la semaine */}
        <View style={[styles.pad, { gap: 14 }]}>
          <Text style={styles.headline}>
            {greeting()}
            {firstName ? `, ${firstName}` : ''}.{'\n'}
            <Text style={styles.headlineSoft}>{question.lead} </Text>
            <Text style={styles.headlineAccent}>{question.accent}</Text>
            <Text style={styles.headlineSoft}> ?</Text>
          </Text>
          <TenantSearchBarPill
            destination="Une escale, un quartier…"
            subtitle="Dates · Voyageurs · Tout le Sénégal"
            onPress={openSearch}
            onFilterPress={openSearch}
          />
        </View>

        {/* Séjour réservé, encore loin : la carte compte à rebours */}
        {upcoming && <UpcomingCard res={upcoming} onPress={onOpenStay} />}

        {/* Ce qui a changé depuis la dernière visite */}
        {(news.length > 0 || answers) && (
          <View style={{ gap: 10 }}>
            <View style={styles.pad}>
              <Text style={styles.muted}>Bon retour{firstName ? `, ${firstName}` : ''}</Text>
              {news.length > 0 && <Text style={styles.h2}>Depuis {since ? DAYS[since.getDay()] : 'votre visite'}</Text>}
            </View>
            {news.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                {news.map((n) => (
                  <TouchableOpacity
                    key={n.key}
                    disabled={!n.id}
                    onPress={() => { tap(); router.push(`/listing/${n.id}` as never); }}
                    style={[styles.news, n.tone === 'lime' && { backgroundColor: '#F3FAD9' }, n.tone === 'gold' && { backgroundColor: colors.gold[50] }]}
                    accessibilityRole="button"
                  >
                    {n.photo ? <Image source={{ uri: n.photo }} style={styles.newsPhoto} contentFit="cover" /> : <View style={[styles.newsPhoto, { backgroundColor: colors.forest[100] }]} />}
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {n.tone === 'lime' ? <Zap size={12} color={INK} fill={INK} /> : n.tone === 'gold' ? <X size={12} color={colors.gold[700]} strokeWidth={3} /> : <Plus size={12} color={INK} strokeWidth={3} />}
                        <Text style={styles.newsTitle} numberOfLines={1}>{n.title}</Text>
                      </View>
                      <Text style={styles.newsSub} numberOfLines={1}>{n.sub}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {answers && answersEscale && (
              <TouchableOpacity onPress={() => { tap(); onOpenEscale(answers.escale); }} style={[styles.resume, styles.mx]} accessibilityRole="button">
                <Search size={16} color={colors.forest[600]} strokeWidth={2.4} />
                <Text style={styles.resumeText} numberOfLines={2}>
                  {expired ? (
                    <>
                      <Text style={styles.bold}>Le moment est passé.</Text> On regarde à nouveau à {answersEscale.label} ?
                    </>
                  ) : (
                    <>
                      <Text style={styles.bold}>Reprendre :</Text> {answersEscale.label}
                      {answers.who ? ` · ${WHO_OPTIONS.find((o) => o.key === answers.who)?.label.toLowerCase()}` : ''}
                    </>
                  )}
                </Text>
                <ChevronRight size={16} color={colors.forest[600]} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Les escales */}
        {escales.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[styles.h2, styles.pad]}>Les escales</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
              {escales.map((e) => (
                <TouchableOpacity key={e.key} onPress={() => { tap(); onOpenEscale(e.key); }} style={styles.story} accessibilityRole="button" accessibilityLabel={`Escale ${e.label}`}>
                  <View style={[styles.storyRing, e.videos > 0 && styles.storyRingLive]}>
                    {e.cover ? <Image source={{ uri: e.cover }} style={styles.storyImg} contentFit="cover" /> : <View style={[styles.storyImg, { backgroundColor: colors.forest[100] }]} />}
                    {e.videos > 0 && (
                      <View style={styles.storyBadge}>
                        <Text style={styles.storyBadgeText}>{e.videos} vidéo{e.videos > 1 ? 's' : ''}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.storyLabel} numberOfLines={1}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {sections.map((s) => (
          <View key={s.key} style={{ gap: 10 }}>
            <View style={[styles.secHead, styles.pad]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.h2}>
                  {s.title} <Text style={styles.count}>{s.items.length}</Text>
                </Text>
                <Text style={styles.muted}>{s.sub}</Text>
              </View>
              <TouchableOpacity onPress={() => { tap(); s.all(); }} hitSlop={8} style={styles.allPill} accessibilityRole="button" accessibilityLabel={`Tout voir : ${s.title}`}>
                <Text style={styles.allText}>Tout voir</Text>
                <View style={styles.allArrow}>
                  <ArrowRight size={13} color={colors.lime[400]} strokeWidth={2.6} />
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
              {s.items.map((l) => (
                <TenantListingCard key={l.id} listing={l} width={270} />
              ))}
            </ScrollView>
          </View>
        ))}

        {/* Invitation propriétaire, sur la photo d'un vrai logement */}
        <HostInvite cover={hostCover} />
      </View>
    </ScrollView>
    </View>
  );
}

function UpcomingCard({ res, onPress }: { res: MyReservation; onPress: () => void }) {
  const c = countdown(res.dateDebut);
  const balance = Number(res.montantSoldeRestant ?? 0);
  const photo = res.logement?.photos?.[0]?.url;
  return (
    <TouchableOpacity onPress={() => { tap(); onPress(); }} style={[styles.upcoming, styles.mx]} accessibilityRole="button" accessibilityLabel="Ouvrir mon séjour">
      {photo ? <Image source={{ uri: photo }} style={styles.upPhoto} contentFit="cover" /> : <View style={[styles.upPhoto, { backgroundColor: colors.forest[800] }]} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.upEyebrow} numberOfLines={1}>
          {res.logement?.titre?.toUpperCase()}
          {res.logement?.quartier || res.logement?.ville ? ` · ${(res.logement?.quartier || res.logement?.ville)!.toUpperCase()}` : ''}
        </Text>
        <View style={styles.upClock}>
          <Text style={styles.upN}>{pad2(c.d)}</Text>
          <Text style={styles.upU}>j</Text>
          <Text style={styles.upN}>{pad2(c.h)}</Text>
          <Text style={styles.upU}>h</Text>
          <Text style={styles.upN}>{pad2(c.m)}</Text>
          <Text style={styles.upU}>min</Text>
        </View>
        <Text style={styles.upSub} numberOfLines={1}>{balance ? `Prévoir ${new Intl.NumberFormat('fr-FR').format(balance)} FCFA pour ${res.proprietaire?.prenom ?? 'l’hôte'}` : 'Tout est prêt pour votre arrivée'}</Text>
      </View>
      <ChevronRight size={18} color={colors.lime[400]} strokeWidth={2.4} />
    </TouchableOpacity>
  );
}

const coverOf = (l: ListingItem) => {
  const p = l.photos?.[0] as unknown;
  return typeof p === 'string' ? p : (p as { url?: string } | undefined)?.url;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, backgroundColor: PAPER },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40 },
  avatarText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  headline: { fontFamily: typography.fontDisplaySemiBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.8, color: INK },
  headlineSoft: { color: INK },
  headlineAccent: { color: colors.forest[600], fontStyle: 'italic' },
  brand: { fontFamily: typography.fontDisplaySemiBold, fontSize: 24, letterSpacing: -0.6, color: INK },
  pad: { paddingHorizontal: 16 },
  mx: { marginHorizontal: 16 },
  h2: { fontFamily: typography.fontDisplaySemiBold, fontSize: 20, color: INK },
  count: { fontFamily: typography.fontBodyBold, fontSize: 12, color: colors.forest[600] },
  muted: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  bold: { fontFamily: typography.fontBodyBold, color: INK },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  allPill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 34, paddingLeft: 14, paddingRight: 4, borderRadius: 999, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  allText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  allArrow: { width: 26, height: 26, borderRadius: 13, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },

  news: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 280, paddingVertical: 8, paddingLeft: 8, paddingRight: 12, borderRadius: 18, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  newsPhoto: { width: 40, height: 40, borderRadius: 12 },
  newsTitle: { maxWidth: 200, fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },
  newsSub: { maxWidth: 210, fontFamily: typography.fontBody, fontSize: 11, color: colors.forest[600] },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  resumeText: { flex: 1, fontFamily: typography.fontBody, fontSize: 13, color: INK },

  story: { width: 76, alignItems: 'center', gap: 6 },
  storyRing: { width: 70, height: 70, borderRadius: 35, padding: 3, backgroundColor: colors.neutral[200] },
  storyRingLive: { backgroundColor: colors.lime[400] },
  storyImg: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: PAPER },
  storyBadge: { position: 'absolute', bottom: -6, alignSelf: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, backgroundColor: INK },
  storyBadgeText: { fontFamily: typography.fontBodyBold, fontSize: 9, color: colors.lime[400] },
  storyLabel: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK },

  upcoming: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 24, backgroundColor: INK },
  upPhoto: { width: 72, height: 88, borderRadius: 16 },
  upEyebrow: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  upClock: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 },
  upN: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, color: '#FFFFFF' },
  upU: { fontFamily: typography.fontBody, fontSize: 11, color: '#8FB3A3', marginRight: 6 },
  upSub: { marginTop: 2, fontFamily: typography.fontBody, fontSize: 12, color: '#C9DBD1' },
});
