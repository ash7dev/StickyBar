import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Star,
  ShieldCheck,
  Home,
  MessageSquare,
  MapPin,
  Sparkles,
  Zap,
  Clock,
  Award,
  BedDouble,
  Bath,
  Users,
  CheckCircle2,
  RotateCcw,
  Building2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';
import { apiClient } from '../../shared/api/api-client';
import { TenantPriceDisplay } from '../../shared/components/ui/TenantPriceDisplay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HostProfileResponse {
  owner: {
    id: string;
    userId: string;
    prenom: string;
    nom: string;
    avatarUrl: string | null;
    creeLe: string;
    statutKyc: string;
    estProprietaire: boolean;
    noteProprietaire: string;
    totalAvis: number;
    isSuperhost: boolean;
    isKycVerified: boolean;
  };
  stats: {
    totalLogements: number;
    noteMoyenne: string;
    totalAvisCount: number;
    tauxReponse: string;
    delaiReponse: string;
  };
  logements: Array<{
    id: string;
    titre: string;
    description: string;
    prixBase: number;
    ville: string;
    quartier: string;
    capaciteMax: number;
    nombreChambres: number;
    nombreSallesBain: number;
    note: number;
    totalAvis: number;
    photos: Array<{ url: string; estPrincipale: boolean; position: number }>;
  }>;
  avis: Array<{
    id: string;
    note: number;
    commentaire: string;
    typeAvis: string;
    creeLe: string;
    auteur: {
      id: string;
      prenom: string;
      nom: string;
      avatarUrl: string | null;
    };
    reservation?: {
      id: string;
      logement?: {
        id: string;
        titre: string;
      };
    };
  }>;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatYear(iso?: string) {
  if (!iso) return '2024';
  try {
    return new Date(iso).getFullYear().toString();
  } catch {
    return '2024';
  }
}

export default function HostPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HostProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'logements' | 'avis'>('logements');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchHostProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<HostProfileResponse>(`/users/owner-profile/${id}`);
      setData(res.data);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err) {
      console.error('[HostPublicProfileScreen] Erreur lors du chargement du profil hôte:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHostProfile();
  }, [fetchHostProfile]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!data?.owner) return;
    try {
      const name = `${data.owner.prenom} ${data.owner.nom}`.trim();
      await Share.share({
        message: `Découvrez le profil hôte de ${name} sur Klef !`,
      });
    } catch {
      // Ignorer
    }
  };

  const handleTabChange = (tab: 'logements' | 'avis') => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Chargement du profil hôte...</Text>
      </View>
    );
  }

  if (!data || !data.owner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Building2 size={48} color={colors.neutral[400]} />
          <Text style={styles.errorTitle}>Profil hôte introuvable</Text>
          <Text style={styles.errorSub}>
            Ce profil hôte est indisponible ou l'identifiant renseigné n'existe pas.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <RotateCcw size={16} color={colors.neutral[0]} />
            <Text style={styles.retryBtnText}>Retourner</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { owner, stats, logements, avis } = data;
  const fullName = `${owner.prenom} ${owner.nom}`.trim();
  const initials = `${owner.prenom?.[0] || ''}${owner.nom?.[0] || ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Fixed Top Navigation Header ───────────────────────────────────── */}
      <View style={styles.topHeaderNav}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.navBackBtn}
        >
          <ChevronLeft size={22} color={colors.forest[950]} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          Profil d'hôte
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleShare}
          style={styles.navShareBtn}
        >
          <Share2 size={18} color={colors.forest[900]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* ── 1. Hero Spotlight Hôte Card ───────────────────────────────── */}
          <View style={styles.heroCard}>
            {/* Top decorative glow */}
            <View style={styles.heroTopGradient} />

            <View style={styles.heroContent}>
              {/* Avatar Frame avec Badge Superhost */}
              <View style={styles.avatarWrapper}>
                {owner.avatarUrl ? (
                  <ExpoImage
                    source={{ uri: owner.avatarUrl }}
                    style={styles.heroAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.heroAvatarPlaceholder}>
                    <Text style={styles.heroAvatarInitials}>{initials}</Text>
                  </View>
                )}

                {owner.isSuperhost && (
                  <View style={styles.superhostBadgeMini}>
                    <Sparkles size={12} color={colors.forest[950]} />
                  </View>
                )}
              </View>

              {/* Identity Details */}
              <View style={styles.identityBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.hostFullName}>{fullName}</Text>
                  {owner.isKycVerified && (
                    <View style={styles.verifiedCheckBadge}>
                      <ShieldCheck size={14} color={colors.gold[600]} />
                    </View>
                  )}
                </View>

                <Text style={styles.hostSubText}>
                  Hôte sur Klef depuis {formatYear(owner.creeLe)}
                </Text>

                {/* Status Badges Stack */}
                <View style={styles.badgesRow}>
                  {owner.isSuperhost && (
                    <View style={styles.superhostPill}>
                      <Award size={13} color={colors.forest[950]} />
                      <Text style={styles.superhostPillText}>Superhôte Klef</Text>
                    </View>
                  )}

                  {owner.isKycVerified ? (
                    <View style={styles.kycPill}>
                      <CheckCircle2 size={13} color={colors.forest[800]} />
                      <Text style={styles.kycPillText}>Identité vérifiée</Text>
                    </View>
                  ) : (
                    <View style={styles.kycPendingPill}>
                      <ShieldCheck size={13} color={colors.neutral[600]} />
                      <Text style={styles.kycPendingPillText}>Hôte vérifié</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ── Key Metrics Grid (Stats Bar) ────────────────────────── */}
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <View style={styles.statIconCircle}>
                  <Star size={16} color={colors.gold[600]} fill={colors.gold[500]} />
                </View>
                <Text style={styles.statValue}>{stats.noteMoyenne}</Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statTile}>
                <View style={styles.statIconCircle}>
                  <MessageSquare size={16} color={colors.forest[700]} />
                </View>
                <Text style={styles.statValue}>{stats.totalAvisCount}</Text>
                <Text style={styles.statLabel}>Avis reçus</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statTile}>
                <View style={styles.statIconCircle}>
                  <Home size={16} color={colors.forest[700]} />
                </View>
                <Text style={styles.statValue}>{stats.totalLogements}</Text>
                <Text style={styles.statLabel}>Logement{stats.totalLogements > 1 ? 's' : ''}</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Information Réactivité Hôte ────────────────────────────── */}
          <View style={styles.reponseBanner}>
            <View style={styles.reponseItem}>
              <Zap size={15} color={colors.forest[800]} />
              <Text style={styles.reponseText}>
                Taux de réponse : <Text style={styles.reponseBold}>{stats.tauxReponse}</Text>
              </Text>
            </View>

            <View style={styles.reponseDot} />

            <View style={styles.reponseItem}>
              <Clock size={15} color={colors.forest[800]} />
              <Text style={styles.reponseText}>
                Délai : <Text style={styles.reponseBold}>{stats.delaiReponse}</Text>
              </Text>
            </View>
          </View>

          {/* ── 3. Segmented Control Switcher (Logements / Avis) ─────────── */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabChange('logements')}
              style={[
                styles.segmentBtn,
                activeTab === 'logements' && styles.segmentBtnActive,
              ]}
            >
              <Home
                size={16}
                color={activeTab === 'logements' ? colors.forest[950] : colors.neutral[500]}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'logements' && styles.segmentTextActive,
                ]}
              >
                Logements ({logements.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabChange('avis')}
              style={[
                styles.segmentBtn,
                activeTab === 'avis' && styles.segmentBtnActive,
              ]}
            >
              <Star
                size={16}
                color={activeTab === 'avis' ? colors.forest[950] : colors.neutral[500]}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'avis' && styles.segmentTextActive,
                ]}
              >
                Avis voyageurs ({avis.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 4. Contenu Onglet LOGEMENTS (PREMIUM) ───────────────────── */}
          {activeTab === 'logements' && (
            <View style={styles.tabContentBlock}>
              <View style={styles.sectionHeaderCard}>
                <View style={styles.sectionHeaderTitleRow}>
                  <View style={styles.sectionIconBadge}>
                    <Home size={15} color={colors.forest[950]} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>
                    Hébergements de {owner.prenom}
                  </Text>
                  <View style={styles.countBadgePill}>
                    <Text style={styles.countBadgeText}>{logements.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionHeaderSub}>
                  Découvrez les logements d'exception vérifiés et gérés par {owner.prenom} au Sénégal.
                </Text>
              </View>

              {logements.length === 0 ? (
                <View style={styles.emptyTabContainer}>
                  <Home size={32} color={colors.neutral[400]} />
                  <Text style={styles.emptyTabTitle}>Aucun logement disponible</Text>
                  <Text style={styles.emptyTabSub}>
                    Cet hôte n'a pas d'annonce active publiée pour le moment.
                  </Text>
                </View>
              ) : (
                <View style={styles.logementsListStack}>
                  {logements.map((item) => {
                    const mainPhoto = item.photos?.[0]?.url || item.photos?.[0] || null;
                    const locationText = [item.quartier, item.ville].filter(Boolean).join(', ');

                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.92}
                        onPress={() => router.push(`/listing/${item.id}` as any)}
                        style={styles.premiumListingCard}
                      >
                        {/* Image de couverture */}
                        <View style={styles.cardImageWrapper}>
                          {mainPhoto ? (
                            <ExpoImage
                              source={{ uri: typeof mainPhoto === 'string' ? mainPhoto : (mainPhoto as any)?.url }}
                              style={styles.cardImage}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <View style={styles.cardImagePlaceholder}>
                              <Building2 size={32} color={colors.neutral[400]} />
                            </View>
                          )}

                          {/* Location Tag Top Left */}
                          {locationText ? (
                            <View style={styles.cardLocationBadgeTop}>
                              <MapPin size={11} color={colors.lime[400]} />
                              <Text style={styles.cardLocationBadgeTopText} numberOfLines={1}>
                                {locationText}
                              </Text>
                            </View>
                          ) : null}

                          {/* Rating Tag Top Right */}
                          {item.note > 0 ? (
                            <View style={styles.cardRatingBadge}>
                              <Star size={11} color={colors.gold[500]} fill={colors.gold[500]} />
                              <Text style={styles.cardRatingText}>
                                {Number(item.note).toFixed(1)} {item.totalAvis ? `(${item.totalAvis})` : ''}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Informations logement */}
                        <View style={styles.cardBody}>
                          <Text numberOfLines={1} style={styles.cardTitle}>
                            {item.titre}
                          </Text>

                          {/* Specs icons row */}
                          <View style={styles.specsRow}>
                            {item.capaciteMax ? (
                              <View style={styles.specChip}>
                                <Users size={12} color={colors.forest[800]} />
                                <Text style={styles.specChipText}>{item.capaciteMax} voy.</Text>
                              </View>
                            ) : null}

                            {item.nombreChambres ? (
                              <View style={styles.specChip}>
                                <BedDouble size={12} color={colors.forest[800]} />
                                <Text style={styles.specChipText}>{item.nombreChambres} ch.</Text>
                              </View>
                            ) : null}

                            {item.nombreSallesBain ? (
                              <View style={styles.specChip}>
                                <Bath size={12} color={colors.forest[800]} />
                                <Text style={styles.specChipText}>{item.nombreSallesBain} sdb</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Prix par nuit avec CTA arrow */}
                          <View style={styles.cardPriceRow}>
                            <TenantPriceDisplay
                              prixBase={item.prixBase}
                              size="md"
                            />
                            <View style={styles.cardCtaCircle}>
                              <ChevronRight size={14} color={colors.forest[950]} strokeWidth={2.5} />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── 5. Contenu Onglet AVIS ────────────────────────────────────── */}
          {activeTab === 'avis' && (
            <View style={styles.tabContentBlock}>
              <View style={styles.sectionHeaderCard}>
                <View style={styles.sectionHeaderTitleRow}>
                  <View style={styles.sectionIconBadgeGold}>
                    <Star size={15} color={colors.gold[700]} fill={colors.gold[600]} />
                  </View>
                  <Text style={styles.sectionHeaderTitle}>
                    Avis & Témoignages
                  </Text>
                  <View style={styles.countBadgePillGold}>
                    <Text style={styles.countBadgeTextGold}>{avis.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionHeaderSub}>
                  Retours authentiques laissés par les voyageurs ayant séjourné chez {owner.prenom}.
                </Text>
              </View>

              {avis.length === 0 ? (
                <View style={styles.emptyTabContainer}>
                  <MessageSquare size={32} color={colors.neutral[400]} />
                  <Text style={styles.emptyTabTitle}>Aucun avis pour le moment</Text>
                  <Text style={styles.emptyTabSub}>
                    Cet hôte n'a pas encore reçu de commentaire de la part de voyageurs.
                  </Text>
                </View>
              ) : (
                <View style={styles.avisListStack}>
                  {avis.map((rev) => {
                    const reviewerName = rev.auteur
                      ? `${rev.auteur.prenom} ${rev.auteur.nom}`.trim()
                      : 'Voyageur Klef';
                    const reviewerInitials = rev.auteur?.prenom
                      ? `${rev.auteur.prenom[0]}${rev.auteur.nom ? rev.auteur.nom[0] : ''}`.toUpperCase()
                      : 'V';

                    return (
                      <View key={rev.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          {rev.auteur?.avatarUrl ? (
                            <ExpoImage
                              source={{ uri: rev.auteur.avatarUrl }}
                              style={styles.reviewerAvatar}
                              contentFit="cover"
                            />
                          ) : (
                            <View style={styles.reviewerAvatarPlaceholder}>
                              <Text style={styles.reviewerInitials}>{reviewerInitials}</Text>
                            </View>
                          )}

                          <View style={styles.reviewerInfo}>
                            <Text style={styles.reviewerName}>{reviewerName}</Text>
                            <Text style={styles.reviewDate}>{formatDate(rev.creeLe)}</Text>
                          </View>

                          {/* Étoiles badge */}
                          <View style={styles.reviewRatingBadge}>
                            <Star size={11} color={colors.gold[600]} fill={colors.gold[500]} />
                            <Text style={styles.reviewRatingBadgeText}>{Number(rev.note).toFixed(1)}</Text>
                          </View>
                        </View>

                        {/* Titre logement associé */}
                        {rev.reservation?.logement?.titre && (
                          <View style={styles.logementTagRow}>
                            <Home size={12} color={colors.forest[700]} />
                            <Text numberOfLines={1} style={styles.logementTagText}>
                              Séjour à {rev.reservation.logement.titre}
                            </Text>
                          </View>
                        )}

                        {/* Commentaire box */}
                        <View style={styles.reviewCommentBox}>
                          <Text style={styles.reviewComment}>
                            {rev.commentaire || "L'évaluation a été déposée sans commentaire rédigé."}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    color: colors.forest[800],
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  errorSub: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[950],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 8,
    ...shadows.sm,
  },
  retryBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  // ── Top Header Bar ────────────────────────────────────────────────
  topHeaderNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    zIndex: 10,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  navShareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
    gap: 16,
  },

  // ── Hero Spotlight Hôte Card ────────────────────────────────────────
  heroCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.md,
  },
  heroTopGradient: {
    height: 8,
    backgroundColor: colors.lime[400],
  },
  heroContent: {
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  heroAvatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.lime[400],
  },
  heroAvatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.lime[400],
  },
  heroAvatarInitials: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 28,
    color: colors.lime[400],
  },
  superhostBadgeMini: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lime[400],
    borderWidth: 2,
    borderColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },

  identityBlock: {
    alignItems: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hostFullName: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[950],
  },
  verifiedCheckBadge: {
    backgroundColor: colors.gold[50],
    borderRadius: 10,
    padding: 2,
  },
  hostSubText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },

  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  superhostPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[300],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  superhostPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  kycPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[200],
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  kycPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[900],
  },
  kycPendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  kycPendingPillText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[700],
  },

  // ── Stats Grid ────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingVertical: 14,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...shadows.xs,
  },
  statValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  statLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.neutral[200],
  },

  // ── Banner Réactivité ──────────────────────────────────────────────
  reponseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  reponseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reponseText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[700],
  },
  reponseBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  reponseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
  },

  // ── Segmented Control Switcher ────────────────────────────────────
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    padding: 3,
    gap: 4,
    marginVertical: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: colors.lime[400],
    ...shadows.xs,
  },
  segmentText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.neutral[600],
  },
  segmentTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  tabContentBlock: {
    gap: 12,
    marginTop: 4,
  },
  sectionHeaderCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 6,
    ...shadows.xs,
  },
  sectionHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconBadgeGold: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
  },
  countBadgePill: {
    backgroundColor: colors.lime[100],
    borderWidth: 1,
    borderColor: colors.lime[300],
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  countBadgePillGold: {
    backgroundColor: colors.gold[100],
    borderWidth: 1,
    borderColor: colors.gold[200],
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  countBadgeTextGold: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.gold[800],
  },
  sectionHeaderSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 17,
  },

  emptyTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 8,
    paddingHorizontal: 20,
  },
  emptyTabTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  emptyTabSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },

  // ── Logements List Stack (Premium) ──────────────────────────────────
  logementsListStack: {
    gap: 16,
  },
  premiumListingCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImageWrapper: {
    height: 210,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[200],
  },
  cardLocationBadgeTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.76)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  cardLocationBadgeTopText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[0],
  },
  cardRatingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  cardRatingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  specChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[900],
  },
  cardPriceRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCtaCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },

  // ── Avis List Stack ─────────────────────────────────────────────────
  avisListStack: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
    gap: 12,
    ...shadows.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  reviewerAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.lime[400],
  },
  reviewerInfo: {
    flex: 1,
    gap: 2,
  },
  reviewerName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  reviewDate: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold[50],
    borderColor: colors.gold[200],
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  reviewRatingBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.gold[800],
  },
  logementTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[100],
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  logementTagText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[800],
  },
  reviewCommentBox: {
    backgroundColor: colors.neutral[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.lime[400],
    padding: 12,
    borderRadius: radius.inner,
  },
  reviewComment: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[800],
    lineHeight: 18,
  },
});
