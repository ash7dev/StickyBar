import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Star, ShieldCheck, MessageSquare } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export interface ReviewAuthor {
  id?: string;
  prenom?: string;
  nom?: string;
  avatarUrl?: string | null;
}

export interface ReviewItem {
  id: string;
  note: number;
  commentaire?: string | null;
  creeLe: string;
  auteur: ReviewAuthor;
}

interface TenantListingReviewsSectionProps {
  note?: number | null;
  totalAvis?: number | null;
  avis?: ReviewItem[];
}

const fmtDate = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

export function TenantListingReviewsSection({
  note,
  totalAvis,
  avis = [],
}: TenantListingReviewsSectionProps) {
  const avisList = avis || [];
  const noteNum = typeof note === 'number' ? note : 0;
  const count = typeof totalAvis === 'number' ? totalAvis : avisList.length;
  const noteFormatted = count > 0 && noteNum > 0 ? noteNum.toFixed(1) : null;

  return (
    <View style={styles.container}>
      {/* ── En-tête de la section Avis ───────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.sectionTitle}>Avis des voyageurs</Text>
            <View style={styles.verifiedTag}>
              <ShieldCheck size={11} color={colors.gold[700]} />
              <Text style={styles.verifiedTagText}>Séjours vérifiés</Text>
            </View>
          </View>
          <Text style={styles.sectionSub}>
            Commentaires laissés par les voyageurs après leur séjour.
          </Text>
        </View>

        {noteFormatted && count > 0 && (
          <View style={styles.ratingBox}>
            <Star size={13} color={colors.gold[500]} fill={colors.gold[400]} />
            <Text style={styles.ratingScore}>{noteFormatted}</Text>
            <Text style={styles.ratingSlash}>/ 5</Text>
            <View style={styles.ratingDivider} />
            <Text style={styles.ratingCount}>
              {count} avis
            </Text>
          </View>
        )}
      </View>

      {/* ── Liste des Avis ou Empty State ───────────────────────── */}
      {avisList.length > 0 ? (
        <View style={styles.reviewsList}>
          {avisList.map((item) => {
            const prenom = item.auteur?.prenom || '';
            const nom = item.auteur?.nom ? `${item.auteur.nom[0]}.` : '';
            const authorName = `${prenom} ${nom}`.trim() || 'Voyageur';
            const initials = `${prenom[0] || ''}${item.auteur?.nom?.[0] || ''}`.toUpperCase() || 'V';
            const dateStr = fmtDate(item.creeLe);

            return (
              <View key={item.id} style={styles.reviewCard}>
                {/* En-tête de la carte avis (Avatar + Nom + Date + Note) */}
                <View style={styles.reviewHeader}>
                  <View style={styles.authorRow}>
                    {item.auteur?.avatarUrl ? (
                      <Image
                        source={{ uri: item.auteur.avatarUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initialsText}>{initials}</Text>
                      </View>
                    )}

                    <View style={styles.authorDetails}>
                      <Text style={styles.authorName}>{authorName}</Text>
                      {dateStr ? <Text style={styles.reviewDate}>{dateStr}</Text> : null}
                    </View>
                  </View>

                  {/* Badge de note individuel */}
                  <View style={styles.reviewStarBadge}>
                    <Star size={12} color={colors.gold[500]} fill={colors.gold[400]} />
                    <Text style={styles.reviewStarText}>{item.note}</Text>
                  </View>
                </View>

                {/* Commentaire de l'avis */}
                {item.commentaire ? (
                  <View style={styles.commentBlock}>
                    <Text style={styles.commentText}>{item.commentaire}</Text>
                  </View>
                ) : (
                  <Text style={styles.noCommentText}>
                    Note attribuée sans commentaire.
                  </Text>
                )}

                {/* Footer Séjour Vérifié Klef */}
                <View style={styles.reviewFooter}>
                  <ShieldCheck size={12} color={colors.forest[600]} />
                  <Text style={styles.reviewFooterText}>
                    Séjour vérifié par Klef
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MessageSquare size={22} color={colors.neutral[500]} />
          </View>
          <Text style={styles.emptyTitle}>Aucun avis pour le moment</Text>
          <Text style={styles.emptySub}>
            Ce logement n'a pas encore reçu d'avis. Les commentaires apparaissent ici
            après le séjour des voyageurs.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 14,
  },
  headerRow: {
    gap: 8,
  },
  titleContainer: {
    gap: 4,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  sectionSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  verifiedTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[700],
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  ratingScore: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  ratingSlash: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  ratingDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.neutral[200],
  },
  ratingCount: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },

  // Liste des cartes d'avis
  reviewsList: {
    gap: 12,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 10,
    ...shadows.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[800],
  },
  authorDetails: {
    flex: 1,
    gap: 1,
  },
  authorName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  reviewDate: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  reviewStarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  reviewStarText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 11,
    color: colors.gold[700],
  },

  commentBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.forest[500],
    paddingLeft: 10,
    marginVertical: 2,
  },
  commentText: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[800],
    lineHeight: 18,
  },
  noCommentText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 8,
  },
  reviewFooterText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[500],
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  emptySub: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 16,
  },
});
