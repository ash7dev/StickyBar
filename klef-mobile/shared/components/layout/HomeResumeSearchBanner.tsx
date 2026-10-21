import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { RotateCcw, MapPin, ArrowRight, SlidersHorizontal, X, Sparkles } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { useSearchHistoryStore } from '../../stores/search-history.store';
import { SearchParams } from './TenantSearchModal';

interface HomeResumeSearchBannerProps {
  onResumeSearch: (params: SearchParams) => void;
  onEditSearch: (params: SearchParams) => void;
}

export function HomeResumeSearchBanner({
  onResumeSearch,
  onEditSearch,
}: HomeResumeSearchBannerProps) {
  const { latestSearch, recentListings, clearHistory } = useSearchHistoryStore();

  if (!latestSearch) return null;

  const hasAnyFilter =
    latestSearch.ville ||
    latestSearch.arrivee ||
    latestSearch.nbPersonnes ||
    latestSearch.nombreChambres;

  if (!hasAnyFilter) return null;

  const formatDateLabel = (d?: string) => {
    if (!d) return null;
    try {
      const date = new Date(d);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  const datesText = latestSearch.arrivee
    ? `${formatDateLabel(latestSearch.arrivee)}${latestSearch.depart ? ` → ${formatDateLabel(latestSearch.depart)}` : ''}${latestSearch.nbNuits ? ` (${latestSearch.nbNuits}n)` : ''}`
    : null;

  const guestsText = latestSearch.nbPersonnes
    ? `${latestSearch.nbPersonnes} voy.`
    : null;

  const bedroomsText = latestSearch.nombreChambres
    ? `${latestSearch.nombreChambres}+ ch.`
    : null;

  const detailsList = [datesText, guestsText, bedroomsText].filter(Boolean).join(' • ');

  const handleResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onResumeSearch(latestSearch);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onEditSearch(latestSearch);
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    clearHistory();
  };

  // Récupération des 3 derniers logements consultés avec photos
  const stackedListings = recentListings.slice(0, 3);

  return (
    <View style={styles.paddingHorizontal}>
      <View style={styles.cardContainer}>
        {/* En-tête de la carte avec icône de reprise */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.historyBadge}>
              <Sparkles size={11} color={colors.lime[400]} />
              <Text style={styles.historyBadgeText}>REPRENDRE VOTRE RECHERCHE</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDismiss}
            style={styles.closeBtn}
          >
            <X size={14} color={colors.forest[300]} />
          </TouchableOpacity>
        </View>

        {/* Corps de la carte avec Stack d'images superposées ou Icône */}
        <View style={styles.contentBody}>
          {stackedListings.length > 0 ? (
            <View style={styles.stackedImagesWrapper}>
              {stackedListings.map((item, idx) => {
                const rawPhoto = item.photos?.[0];
                const photoUrl = typeof rawPhoto === 'string'
                  ? rawPhoto
                  : (rawPhoto as any)?.url || (item as any).coverUrl || (item as any).imageUrl;

                return (
                  <View
                    key={item.id || idx}
                    style={[
                      styles.stackedImageFrame,
                      {
                        zIndex: 10 - idx,
                        marginLeft: idx > 0 ? -18 : 0,
                      },
                    ]}
                  >
                    {photoUrl ? (
                      <Image
                        source={{ uri: photoUrl }}
                        style={styles.stackedImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.stackedFallback}>
                        <MapPin size={14} color={colors.lime[400]} />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.iconCircleFallback}>
              <RotateCcw size={18} color={colors.lime[400]} />
            </View>
          )}

          {/* Informations Texte */}
          <View style={styles.textInfoContainer}>
            <View style={styles.locationBox}>
              <MapPin size={15} color={colors.lime[400]} />
              <Text numberOfLines={1} style={styles.destinationTitle}>
                {latestSearch.ville || 'Tout le Sénégal'}
              </Text>
            </View>

            {detailsList ? (
              <Text numberOfLines={1} style={styles.detailsSubtitle}>
                {detailsList}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Boutons d'Action */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleResume}
            style={styles.primaryActionBtn}
          >
            <Text style={styles.primaryActionText}>Reprendre la recherche</Text>
            <ArrowRight size={14} color={colors.forest[950]} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEdit}
            style={styles.secondaryActionBtn}
          >
            <SlidersHorizontal size={13} color={colors.neutral[0]} />
            <Text style={styles.secondaryActionText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paddingHorizontal: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  cardContainer: {
    backgroundColor: colors.forest[900],
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.28)',
    gap: 10,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
  },
  historyBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.lime[300],
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 4,
  },

  // Corps avec Stack d'images superposées
  contentBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  stackedImagesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  stackedImageFrame: {
    width: 44,
    height: 44,
    borderRadius: radius.inner,
    borderWidth: 2,
    borderColor: colors.forest[900],
    overflow: 'hidden',
    backgroundColor: colors.forest[800],
    ...shadows.sm,
  },
  stackedImage: {
    width: '100%',
    height: '100%',
  },
  stackedFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest[800],
  },
  iconCircleFallback: {
    width: 44,
    height: 44,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textInfoContainer: {
    flex: 1,
    gap: 2,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destinationTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.md,
    color: colors.neutral[0],
    flex: 1,
  },
  detailsSubtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.forest[200],
  },

  // Boutons d'Action
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  primaryActionText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: typography.sizes.xs,
    color: colors.forest[950],
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  secondaryActionText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.xs,
    color: colors.neutral[0],
  },
});
