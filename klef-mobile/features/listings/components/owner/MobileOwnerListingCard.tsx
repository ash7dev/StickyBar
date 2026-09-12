import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Eye,
  Edit3,
  MoreVertical,
  Zap,
  Calendar,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Trash2,
  ImageOff,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

export interface MobileOwnerListingItem {
  id: string;
  slug?: string;
  titre: string;
  ville?: string;
  commune?: string;
  statut: 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT' | 'PAUSED' | 'REJECTED' | string;
  prixBase?: number;
  prixNuit?: number;
  prixParNuit?: number;
  typeLogement?: string;
  type?: string;
  capaciteMax?: number;
  derniereMinuteActive?: boolean;
  photos?: Array<{ url: string } | string> | string[];
}

interface Props {
  listing: MobileOwnerListingItem;
  viewMode?: 'grid' | 'list';
  onToggleStatus?: (id: string, currentStatus: string) => void;
  onToggleDerniereMinute?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
}

const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Math.round(Number(n) || 0)
  );

const STATUT_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PUBLISHED: {
    label: 'Publiée',
    bg: '#EAF8F0',
    text: '#1E6B3D',
    dot: colors.success[500],
  },
  PENDING_REVIEW: {
    label: 'En révision',
    bg: '#FFF8E6',
    text: '#996000',
    dot: colors.warning[500],
  },
  DRAFT: {
    label: 'Brouillon',
    bg: colors.neutral[100],
    text: colors.neutral[700],
    dot: colors.neutral[400],
  },
  PAUSED: {
    label: 'En pause',
    bg: colors.neutral[100],
    text: colors.neutral[700],
    dot: colors.neutral[400],
  },
  REJECTED: {
    label: 'Rejetée',
    bg: '#FDF2F2',
    text: '#C81E1E',
    dot: colors.error[500],
  },
};

export function MobileOwnerListingCard({
  listing,
  viewMode = 'grid',
  onToggleStatus,
  onToggleDerniereMinute,
  onDelete,
}: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmLastMinOpen, setConfirmLastMinOpen] = useState(false);
  const [confirmPauseOpen, setConfirmPauseOpen] = useState(false);

  const rawPrice =
    listing.prixParNuit ?? listing.prixNuit ?? listing.prixBase ?? 0;
  const price = fcfa(rawPrice);

  const firstPhoto = listing.photos?.[0];
  const photoUri =
    typeof firstPhoto === 'string'
      ? firstPhoto
      : (firstPhoto as any)?.url || null;

  const cfg = STATUT_CONFIG[listing.statut] ?? STATUT_CONFIG.DRAFT;
  const location =
    [listing.commune, listing.ville].filter(Boolean).join(', ') ||
    listing.ville ||
    'Sénégal';

  const typeLabel = listing.typeLogement || listing.type || null;

  const handleEdit = () => {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/(owner)/add-listing?id=${listing.id}` as any);
  };

  const handleManage = () => {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/logements/${listing.id}` as any);
  };

  const StatusBadge = (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );

  /* ── Mode Liste ─────────────────────────────────────────────────── */
  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleManage}
        style={styles.listCard}
      >
        <View style={styles.listTopRow}>
          <View style={styles.listThumbContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.listThumb} />
            ) : (
              <View style={styles.emptyThumb}>
                <ImageOff size={20} color={colors.neutral[400]} />
              </View>
            )}
          </View>

          <View style={styles.listInfoStack}>
            <View style={styles.badgesRow}>
              {StatusBadge}
              {typeLabel ? (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {typeLabel.toUpperCase()}
                  </Text>
                </View>
              ) : null}
              {listing.derniereMinuteActive && (
                <View style={styles.lastMinBadge}>
                  <Zap size={10} color="#7D5200" fill="#FBBF24" />
                  <Text style={styles.lastMinText}>-15%</Text>
                </View>
              )}
            </View>

            <Text style={styles.listTitle} numberOfLines={2}>
              {listing.titre}
            </Text>

            <View style={styles.locationRow}>
              <MapPin size={11} color={colors.neutral[500]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.listBottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue} numberOfLines={1}>
              {price} <Text style={styles.priceUnit}>FCFA / nuit</Text>
            </Text>
          </View>

          <View style={styles.actionsCluster}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleManage}
              style={styles.manageBtn}
            >
              <Eye size={13} color={colors.forest[800]} />
              <Text style={styles.manageBtnText}>Gérer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleEdit}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={colors.forest[950]} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMenuOpen(true);
              }}
              style={styles.moreBtn}
            >
              <MoreVertical size={16} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>
        </View>

        <ActionsMenuModal
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          listing={listing}
          onEdit={handleEdit}
          onManage={handleManage}
          hasToggleStatus={!!onToggleStatus}
          hasToggleDerniereMinute={!!onToggleDerniereMinute}
          onLastMinClick={() => setConfirmLastMinOpen(true)}
          onPauseClick={() => setConfirmPauseOpen(true)}
          onDeleteClick={() => setConfirmDeleteOpen(true)}
        />

        <ConfirmDerniereMinuteModal
          visible={confirmLastMinOpen}
          onClose={() => setConfirmLastMinOpen(false)}
          listingTitle={listing.titre}
          currentlyActive={!!listing.derniereMinuteActive}
          onConfirm={() => {
            setConfirmLastMinOpen(false);
            onToggleDerniereMinute?.(listing.id, !listing.derniereMinuteActive);
          }}
        />

        <ConfirmPauseModal
          visible={confirmPauseOpen}
          onClose={() => setConfirmPauseOpen(false)}
          listingTitle={listing.titre}
          currentStatus={listing.statut}
          onConfirm={() => {
            setConfirmPauseOpen(false);
            onToggleStatus?.(listing.id, listing.statut);
          }}
        />

        <ConfirmDeleteModal
          visible={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          listingTitle={listing.titre}
          onConfirm={() => {
            setConfirmDeleteOpen(false);
            onDelete?.(listing.id);
          }}
        />
      </TouchableOpacity>
    );
  }

  /* ── Mode Grille ─────────────────────────────────────────────────── */
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handleManage}
      style={styles.gridCard}
    >
      <View style={styles.gridHero}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.gridImage} />
        ) : (
          <View style={styles.emptyGridHero}>
            <ImageOff size={28} color={colors.neutral[400]} />
          </View>
        )}
        <View style={styles.gridHeroOverlay} />

        <View style={styles.gridTopBadges}>
          {StatusBadge}
          {listing.derniereMinuteActive && (
            <View style={styles.lastMinBadgeFull}>
              <Zap size={11} color={colors.forest[950]} fill={colors.forest[950]} />
              <Text style={styles.lastMinTextFull}>-15% Dernière Min.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setMenuOpen(true);
          }}
          style={styles.gridMoreBtn}
        >
          <MoreVertical size={16} color={colors.forest[950]} />
        </TouchableOpacity>
      </View>

      <View style={styles.gridContent}>
        <View style={styles.locationRow}>
          {typeLabel ? (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{typeLabel.toUpperCase()}</Text>
            </View>
          ) : null}
          <MapPin size={11} color={colors.neutral[500]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {listing.titre}
        </Text>

        <View style={styles.gridBottomRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue} numberOfLines={1}>
              {price} <Text style={styles.priceUnit}>FCFA / nuit</Text>
            </Text>
          </View>

          <View style={styles.actionsCluster}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleManage}
              style={styles.manageBtn}
            >
              <Eye size={13} color={colors.forest[800]} />
              <Text style={styles.manageBtnText}>Gérer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleEdit}
              style={styles.editBtn}
            >
              <Edit3 size={13} color={colors.forest[950]} />
              <Text style={styles.editBtnText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ActionsMenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        listing={listing}
        onEdit={handleEdit}
        onManage={handleManage}
        hasToggleStatus={!!onToggleStatus}
        hasToggleDerniereMinute={!!onToggleDerniereMinute}
        onLastMinClick={() => setConfirmLastMinOpen(true)}
        onPauseClick={() => setConfirmPauseOpen(true)}
        onDeleteClick={() => setConfirmDeleteOpen(true)}
      />

      <ConfirmDerniereMinuteModal
        visible={confirmLastMinOpen}
        onClose={() => setConfirmLastMinOpen(false)}
        listingTitle={listing.titre}
        currentlyActive={!!listing.derniereMinuteActive}
        onConfirm={() => {
          setConfirmLastMinOpen(false);
          onToggleDerniereMinute?.(listing.id, !listing.derniereMinuteActive);
        }}
      />

      <ConfirmPauseModal
        visible={confirmPauseOpen}
        onClose={() => setConfirmPauseOpen(false)}
        listingTitle={listing.titre}
        currentStatus={listing.statut}
        onConfirm={() => {
          setConfirmPauseOpen(false);
          onToggleStatus?.(listing.id, listing.statut);
        }}
      />

      <ConfirmDeleteModal
        visible={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        listingTitle={listing.titre}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete?.(listing.id);
        }}
      />
    </TouchableOpacity>
  );
}

/* ── Actions Menu Modal (Centered Bottom Sheet / Modal) ─────────────────── */

function ActionsMenuModal({
  visible,
  onClose,
  listing,
  onEdit,
  onManage,
  hasToggleStatus,
  hasToggleDerniereMinute,
  onLastMinClick,
  onPauseClick,
  onDeleteClick,
}: {
  visible: boolean;
  onClose: () => void;
  listing: MobileOwnerListingItem;
  onEdit: () => void;
  onManage: () => void;
  hasToggleStatus?: boolean;
  hasToggleDerniereMinute?: boolean;
  onLastMinClick: () => void;
  onPauseClick: () => void;
  onDeleteClick: () => void;
}) {
  const router = useRouter();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}
      >
        <TouchableOpacity activeOpacity={1} style={styles.actionsSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderTitleStack}>
              <Text style={styles.sheetHeaderTitle} numberOfLines={1}>
                {listing.titre}
              </Text>
              <Text style={styles.sheetHeaderSub}>Options de l'annonce</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.neutral[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuItems}>
            <TouchableOpacity onPress={onEdit} style={styles.menuItem}>
              <Edit3 size={18} color={colors.forest[700]} />
              <Text style={styles.menuItemText}>Modifier l'annonce</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onManage} style={styles.menuItem}>
              <Eye size={18} color={colors.forest[700]} />
              <Text style={styles.menuItemText}>Gérer le bien & calendrier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push(`/logements/${listing.id}` as any);
              }}
              style={styles.menuItem}
            >
              <ExternalLink size={18} color={colors.forest[700]} />
              <Text style={styles.menuItemText}>Fiche publique voyageur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push('/(owner)/reservations' as any);
              }}
              style={styles.menuItem}
            >
              <Calendar size={18} color={colors.forest[700]} />
              <Text style={styles.menuItemText}>Réservations du bien</Text>
            </TouchableOpacity>

            {hasToggleDerniereMinute && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onLastMinClick();
                }}
                style={styles.menuItem}
              >
                <Zap
                  size={18}
                  color={listing.derniereMinuteActive ? '#D97706' : colors.neutral[600]}
                  fill={listing.derniereMinuteActive ? '#FBBF24' : 'none'}
                />
                <Text style={styles.menuItemText}>
                  {listing.derniereMinuteActive
                    ? 'Désactiver -15% Dernière Min.'
                    : 'Activer -15% Dernière Min.'}
                </Text>
              </TouchableOpacity>
            )}

            {hasToggleStatus && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onPauseClick();
                }}
                style={styles.menuItem}
              >
                {listing.statut === 'PUBLISHED' ? (
                  <>
                    <PauseCircle size={18} color={colors.warning[600]} />
                    <Text style={styles.menuItemText}>Mettre en pause</Text>
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} color={colors.success[600]} />
                    <Text style={styles.menuItemText}>Activer l'annonce</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {onDeleteClick && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onDeleteClick();
                }}
                style={[styles.menuItem, styles.deleteMenuItem]}
              >
                <Trash2 size={18} color={colors.error[600]} />
                <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>
                  Supprimer l'annonce
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/* ── Confirm Dernière Minute Modal ─────────────────────────────────────────── */

function ConfirmDerniereMinuteModal({
  visible,
  onClose,
  listingTitle,
  currentlyActive,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  listingTitle: string;
  currentlyActive: boolean;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlayCenter}>
        <View style={styles.confirmCard}>
          <View style={styles.zapIconCircle}>
            <Zap size={24} color="#D97706" fill="#FBBF24" />
          </View>

          <View style={styles.confirmTextStack}>
            <Text style={styles.confirmTitle}>
              {currentlyActive
                ? "Désactiver l'offre -15% ?"
                : "Activer l'offre -15% Dernière Min ?"}
            </Text>
            <Text style={styles.confirmSubtitle} numberOfLines={1}>
              {listingTitle}
            </Text>
            <Text style={styles.confirmDesc}>
              {currentlyActive
                ? "En désactivant cette offre, le tarif de base habituel s'appliquera sur toutes les réservations, y compris celles effectuées à la dernière minute."
                : "L'offre Dernière Minute applique automatiquement 15% de réduction pour les séjours réservés moins de 48h avant l'arrivée. Elle ajoute un badge exclusif et augmente le taux d'occupation."}
            </Text>
          </View>

          <View style={styles.confirmBtnsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.actionConfirmBtn,
                currentlyActive ? styles.actionWarnBtn : styles.actionLimeBtn,
              ]}
            >
              <Text
                style={[
                  styles.actionConfirmBtnText,
                  currentlyActive ? styles.actionWarnBtnText : styles.actionLimeBtnText,
                ]}
              >
                {currentlyActive ? 'Désactiver' : 'Activer -15%'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Confirm Pause Modal ─────────────────────────────────────────────────── */

function ConfirmPauseModal({
  visible,
  onClose,
  listingTitle,
  currentStatus,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  listingTitle: string;
  currentStatus: string;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  const isPublished = currentStatus === 'PUBLISHED';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlayCenter}>
        <View style={styles.confirmCard}>
          <View style={isPublished ? styles.pauseIconCircle : styles.playIconCircle}>
            {isPublished ? (
              <PauseCircle size={24} color={colors.warning[600]} />
            ) : (
              <PlayCircle size={24} color={colors.success[600]} />
            )}
          </View>

          <View style={styles.confirmTextStack}>
            <Text style={styles.confirmTitle}>
              {isPublished ? "Mettre l'annonce en pause ?" : "Réactiver l'annonce ?"}
            </Text>
            <Text style={styles.confirmSubtitle} numberOfLines={1}>
              {listingTitle}
            </Text>
            <Text style={styles.confirmDesc}>
              {isPublished
                ? "Votre logement ne sera plus visible dans les recherches de voyageurs. Vos réservations déjà confirmées restent valides."
                : "Votre logement sera immédiatement remis en ligne et disponible à la réservation instantanée selon vos tarifs et disponibilités."}
            </Text>
          </View>

          <View style={styles.confirmBtnsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.actionConfirmBtn,
                isPublished ? styles.actionPauseBtn : styles.actionPlayBtn,
              ]}
            >
              <Text style={styles.actionConfirmBtnText}>
                {isPublished ? 'Mettre en pause' : 'Réactiver'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ── Confirm Delete Modal ─────────────────────────────────────────────────── */

function ConfirmDeleteModal({
  visible,
  onClose,
  listingTitle,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  listingTitle: string;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlayCenter}>
        <View style={styles.confirmCard}>
          <View style={styles.dangerIconCircle}>
            <AlertTriangle size={24} color={colors.error[600]} />
          </View>

          <View style={styles.confirmTextStack}>
            <Text style={styles.confirmTitle}>Supprimer l'annonce ?</Text>
            <Text style={styles.confirmSubtitle} numberOfLines={1}>
              {listingTitle}
            </Text>
            <Text style={styles.confirmDesc}>
              Cette action est définitive. L'annonce et tous ses éléments associés (photos, tarifs, indisponibilités) seront retirés de la plateforme.
            </Text>
          </View>

          <View style={styles.confirmBtnsRow}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onConfirm} style={styles.deleteConfirmBtn}>
              <Text style={styles.deleteConfirmBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
  },

  typeBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  typeBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.neutral[600],
    letterSpacing: 0.4,
  },

  lastMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lastMinText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: '#7D5200',
  },

  lastMinBadgeFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  lastMinTextFull: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[950],
  },

  // Mode Liste
  listCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 12,
    ...shadows.xs,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listThumbContainer: {
    width: 84,
    height: 74,
    borderRadius: radius.inner,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  emptyThumb: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfoStack: {
    flex: 1,
    gap: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  listTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14.5,
    color: colors.forest[950],
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    flex: 1,
  },
  listBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 10,
  },
  priceContainer: {
    flex: 1,
    paddingRight: 6,
    justifyContent: 'center',
  },
  priceValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  priceUnit: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  manageBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[900],
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  editBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  moreBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mode Grille
  gridCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.xs,
  },
  gridHero: {
    height: 165,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.neutral[900],
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  emptyGridHero: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 25, 18, 0.25)',
  },
  gridTopBadges: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    zIndex: 2,
  },
  gridMoreBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  gridContent: {
    padding: 14,
    gap: 8,
  },
  gridTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
    lineHeight: 19,
  },
  gridBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 10,
    marginTop: 4,
  },

  // Modal / Sheet Menu Options
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionsSheet: {
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: 20,
    gap: 16,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    paddingBottom: 12,
  },
  sheetHeaderTitleStack: {
    flex: 1,
    paddingRight: 10,
  },
  sheetHeaderTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  sheetHeaderSub: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuItems: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
  },
  menuItemText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  deleteMenuItem: {
    backgroundColor: colors.error[50],
    marginTop: 6,
  },
  deleteMenuItemText: {
    color: colors.error[700],
    fontFamily: typography.fontBodyBold,
  },

  // Confirm Delete Card
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.float,
  },
  dangerIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  zapIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTextStack: {
    alignItems: 'center',
    gap: 4,
  },
  confirmTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[500],
  },
  confirmDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  cancelBtnText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.error[600],
  },
  deleteConfirmBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  actionConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  actionConfirmBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  actionLimeBtn: {
    backgroundColor: colors.lime[400],
  },
  actionLimeBtnText: {
    color: colors.forest[950],
  },
  actionWarnBtn: {
    backgroundColor: colors.warning[600],
  },
  actionWarnBtnText: {
    color: colors.neutral[0],
  },
  actionPauseBtn: {
    backgroundColor: colors.warning[600],
  },
  actionPlayBtn: {
    backgroundColor: colors.forest[800],
  },
});
