import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Trophy, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

const COUNTED = new Set(['COMPLETED', 'CHECKED_IN', 'CONFIRMED', 'PAID']);

const formatFCFA = (val: number) => {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val) + ' FCFA';
};

interface BookingItem {
  statut?: string;
  status?: string;
  netProprietaire?: number | string;
  totalLocataire?: number | string;
  logement?: { id?: string; titre?: string; ville?: string };
  title?: string;
}

interface PerformanceCardProps {
  bookings?: BookingItem[] | null;
  topListings?: Array<{
    id?: string;
    titre: string;
    ville?: string;
    revenue: number;
    nights: number;
  }> | null;
  activeListings: number;
  limit?: number;
}

interface RankedProperty {
  key: string;
  titre: string;
  ville?: string;
  revenue: number;
  nights: number;
}

export function MobileStatsPerformanceCard({
  bookings,
  topListings,
  activeListings,
  limit = 3,
}: PerformanceCardProps) {
  const router = useRouter();
  let ranked: RankedProperty[] = [];

  if (topListings && topListings.length > 0) {
    ranked = topListings.map((t, idx) => ({
      key: t.id || `top-${idx}`,
      titre: t.titre,
      ville: t.ville,
      revenue: Number(t.revenue || 0),
      nights: Number(t.nights || 0),
    }));
  } else {
    const list = bookings ?? [];
    const map = new Map<string, RankedProperty>();

    for (const b of list) {
      const st = String(b.statut || b.status || '').toUpperCase();
      if (!COUNTED.has(st)) continue;

      const titre = b.logement?.titre || b.title || 'Logement';
      const key = b.logement?.id || titre;
      const ville = b.logement?.ville;
      const rev = Number(b.netProprietaire ?? b.totalLocataire ?? 0);

      const cur = map.get(key) ?? {
        key,
        titre,
        ville,
        revenue: 0,
        nights: 0,
      };
      cur.revenue += rev;
      cur.nights += 1;
      map.set(key, cur);
    }
    ranked = [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }
  const top = ranked.slice(0, limit);
  const maxRevenue = top[0]?.revenue ?? 0;

  const earningCount = ranked.length;

  const handleSeeAllListings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/listings' as any);
  };

  const handleCreateListing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/listings' as any);
  };

  return (
    <View style={styles.cardShell}>
      {/* ── En-tête Premium ───────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconSquircle}>
            <Trophy size={18} color={colors.forest[700]} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Vos biens les plus rentables</Text>
            <Text style={styles.headerSubtitle}>Classement de vos performances</Text>
          </View>
        </View>

        {activeListings > 0 && earningCount > 0 && (
          <View style={styles.earningBadge}>
            <Text style={styles.earningBadgeText}>
              <Text style={styles.earningBold}>{earningCount}</Text>/{activeListings} ont rapporté
            </Text>
          </View>
        )}
      </View>

      {/* ── Liste du Classement ────────────────────────────────────────── */}
      {top.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Sparkles size={24} color={colors.forest[600]} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeListings === 0 ? 'Aucun bien publié' : 'Pas encore de revenu enregistré'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeListings === 0
              ? 'Publiez votre premier logement pour commencer à générer des revenus locatifs.'
              : 'Le classement de vos biens apparaîtra dès la première réservation validée.'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleCreateListing}
            style={styles.emptyActionBtn}
          >
            <Text style={styles.emptyActionBtnText}>
              {activeListings === 0 ? 'Publier un bien' : 'Gérer mes annonces'}
            </Text>
            <ArrowRight size={14} color={colors.forest[800]} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rankList}>
          {top.map((item, index) => {
            const isFirst = index === 0;
            const pct = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;

            return (
              <View
                key={item.key}
                style={[styles.rankItemCard, isFirst && styles.rankItemCardFirst]}
              >
                <View style={styles.rankItemMainRow}>
                  {/* Badge de Rang (1, 2, 3) */}
                  <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
                    <Text style={[styles.rankBadgeText, isFirst && styles.rankBadgeTextFirst]}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* Titre & Ville */}
                  <View style={styles.rankItemInfo}>
                    <Text style={styles.rankItemTitle} numberOfLines={1}>
                      {item.titre}
                    </Text>
                    {item.ville ? (
                      <Text style={styles.rankItemSubtitle} numberOfLines={1}>
                        {item.ville}
                      </Text>
                    ) : null}
                  </View>

                  {/* Chiffre d'affaires & Séjours */}
                  <View style={styles.rankItemRight}>
                    <Text style={styles.rankItemRevenue}>{formatFCFA(item.revenue)}</Text>
                    <Text style={styles.rankItemNights}>
                      {item.nights} séjour{item.nights > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>

                {/* Barre de progression proportionnelle */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: isFirst ? colors.lime[500] : colors.forest[600],
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}

          {ranked.length > limit && (
            <Text style={styles.otherPropertiesText}>
              +{ranked.length - limit} autre{ranked.length - limit > 1 ? 's' : ''} bien
              {ranked.length - limit > 1 ? 's' : ''} avec des revenus
            </Text>
          )}
        </View>
      )}

      {/* ── Bouton d'Action Inférieur ─────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleSeeAllListings}
        style={styles.seeAllBtn}
      >
        <Text style={styles.seeAllBtnText}>Voir toutes mes annonces</Text>
        <ArrowRight size={15} color={colors.forest[900]} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: '#FFFFFF', // Fond blanc pur
    borderRadius: radius.card,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconSquircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  headerTextGroup: {
    gap: 2,
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  earningBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  earningBadgeText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[900],
  },
  earningBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  // Ranking List
  rankList: {
    gap: 12,
  },
  rankItemCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  rankItemCardFirst: {
    backgroundColor: colors.lime[50] + '80',
    borderColor: colors.lime[300],
  },
  rankItemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeFirst: {
    backgroundColor: colors.forest[950],
  },
  rankBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[700],
  },
  rankBadgeTextFirst: {
    color: colors.lime[400],
  },
  rankItemInfo: {
    flex: 1,
    gap: 2,
  },
  rankItemTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  rankItemSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  rankItemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rankItemRevenue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  rankItemNights: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },
  progressTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  otherPropertiesText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 2,
  },

  // Actions
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  seeAllBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[900],
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  emptyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  emptyActionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[900],
  },
});
