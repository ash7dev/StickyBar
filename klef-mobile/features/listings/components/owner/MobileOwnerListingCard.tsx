import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Calendar,
  CalendarCheck,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  ImageOff,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

export interface MobileOwnerListingItem {
  id: string;
  slug?: string;
  titre: string;
  ville?: string;
  commune?: string;
  quartier?: string | null;
  statut: 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT' | 'PAUSED' | 'REJECTED' | string;
  prixBase?: number;
  prixNuit?: number;
  prixParNuit?: number;
  typeLogement?: string;
  type?: string;
  capaciteMax?: number;
  nombreChambres?: number;
  note?: number | string;
  totalAvis?: number;
  totalSejours?: number;
  rejectionReason?: string | null;
  videoUrl?: string | null;
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

const INK = colors.forest[950];

const fcfa = (n: number) =>
  String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Statut de l'annonce, formulé du point de vue de l'hôte. */
export const STATUT_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PUBLISHED: { label: 'En ligne', dot: colors.lime[400], bg: colors.forest[50], text: colors.forest[800] },
  PENDING_REVIEW: { label: 'En révision', dot: colors.warning[500], bg: colors.gold[50], text: colors.gold[700] },
  DRAFT: { label: 'Brouillon', dot: colors.neutral[400], bg: colors.neutral[100], text: colors.neutral[700] },
  PAUSED: { label: 'En pause', dot: colors.neutral[400], bg: colors.neutral[100], text: colors.neutral[700] },
  REJECTED: { label: 'À corriger', dot: colors.error[500], bg: colors.error[50], text: colors.error[700] },
};

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  MAISON: 'Maison',
  CHAMBRE: 'Chambre',
  DUPLEX: 'Duplex',
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

  const price = fcfa(listing.prixParNuit ?? listing.prixNuit ?? listing.prixBase ?? 0);
  const firstPhoto = listing.photos?.[0];
  const photoUri = typeof firstPhoto === 'string' ? firstPhoto : (firstPhoto as { url?: string } | undefined)?.url || null;

  const cfg = STATUT_CONFIG[listing.statut] ?? STATUT_CONFIG.DRAFT;
  const location = [listing.quartier ?? listing.commune, listing.ville].filter(Boolean).join(', ') || 'Sénégal';
  const rawType = listing.typeLogement || listing.type || '';
  const typeLabel = TYPE_LABELS[rawType.toUpperCase()] ?? (rawType ? rawType.charAt(0) + rawType.slice(1).toLowerCase() : null);
  const note = Number(listing.note ?? 0);
  const avis = listing.totalAvis ?? 0;
  const sejours = listing.totalSejours ?? 0;
  const needsFix = listing.statut === 'REJECTED' || listing.statut === 'DRAFT';

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

  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMenuOpen(true);
  };

  const modals = (
    <>
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
    </>
  );

  const rating =
    avis > 0 ? (
      <View style={c.fact}>
        <Star size={12} color={colors.gold[700]} fill={colors.gold[400]} />
        <Text style={c.factStrong}>{note.toFixed(1).replace('.', ',')}</Text>
        <Text style={c.factText}>({avis})</Text>
      </View>
    ) : listing.statut === 'PUBLISHED' ? (
      <View style={c.fact}>
        <Sparkles size={12} color={colors.forest[700]} />
        <Text style={c.factText}>Nouveau</Text>
      </View>
    ) : null;

  /* ── Mode liste : une ligne compacte ─────────────────────────────── */
  if (viewMode === 'list') {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={handleManage} style={c.row} accessibilityRole="button">
        <View style={c.rowThumb}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <ImageOff size={18} color={colors.neutral[400]} />
          )}
        </View>
        <View style={c.rowBody}>
          <View style={c.rowStatus}>
            <View style={[c.dot, { backgroundColor: cfg.dot }]} />
            <Text style={[c.rowStatusText, { color: cfg.text }]}>{cfg.label}</Text>
            {listing.derniereMinuteActive && <Text style={c.rowPromo}>· −15 %</Text>}
          </View>
          <Text style={c.rowTitle} numberOfLines={1}>
            {listing.titre}
          </Text>
          <Text style={c.rowPlace} numberOfLines={1}>
            {location}
          </Text>
          <View style={c.rowFoot}>
            <Text style={c.rowPrice}>
              {price} <Text style={c.rowPriceUnit}>FCFA / nuit</Text>
            </Text>
            {rating}
          </View>
        </View>
        <TouchableOpacity onPress={openMenu} hitSlop={10} style={c.rowMore} accessibilityLabel="Options de l’annonce">
          <MoreHorizontal size={18} color={colors.neutral[600]} />
        </TouchableOpacity>
        {modals}
      </TouchableOpacity>
    );
  }

  /* ── Mode grille : la photo en héros ─────────────────────────────── */
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={handleManage} style={c.card} accessibilityRole="button">
      <View style={c.hero}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={c.heroEmpty}>
            <ImageOff size={26} color={colors.forest[300]} />
            <Text style={c.heroEmptyText}>Ajoutez vos photos</Text>
          </View>
        )}
        <LinearGradient
          colors={['rgba(4,25,18,0.45)', 'rgba(4,25,18,0)', 'rgba(4,25,18,0.88)']}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={c.heroTop}>
          <View style={c.glassChip}>
            <View style={[c.dot, { backgroundColor: cfg.dot }]} />
            <Text style={c.glassChipText}>{cfg.label}</Text>
          </View>
          {listing.derniereMinuteActive && (
            <View style={c.promoChip}>
              <Zap size={11} color={INK} fill={INK} />
              <Text style={c.promoChipText}>−15 % dernière minute</Text>
            </View>
          )}
          <View style={c.flex} />
          <TouchableOpacity onPress={openMenu} hitSlop={8} style={c.glassBtn} accessibilityLabel="Options de l’annonce">
            <MoreHorizontal size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={c.heroBottom}>
          <Text style={c.heroKicker} numberOfLines={1}>
            {[typeLabel, location].filter(Boolean).join(' · ').toUpperCase()}
          </Text>
          <Text style={c.heroTitle} numberOfLines={2}>
            {listing.titre}
          </Text>
        </View>
      </View>

      {listing.statut === 'REJECTED' && (
        <View style={c.notice}>
          <AlertTriangle size={14} color={colors.error[700]} />
          <Text style={c.noticeText} numberOfLines={3}>
            {listing.rejectionReason ? `Motif : ${listing.rejectionReason}` : 'L’équipe Paixi demande quelques corrections avant publication.'}
          </Text>
        </View>
      )}
      {listing.statut === 'PENDING_REVIEW' && (
        <View style={[c.notice, c.noticeGold]}>
          <Clock size={14} color={colors.gold[700]} />
          <Text style={[c.noticeText, c.noticeTextGold]}>Vérification par l’équipe Paixi, en général sous 24 h.</Text>
        </View>
      )}

      <View style={c.body}>
        <View style={c.facts}>
          {!!listing.nombreChambres && (
            <View style={c.fact}>
              <BedDouble size={13} color={colors.neutral[600]} />
              <Text style={c.factText}>{plural(listing.nombreChambres, 'chambre')}</Text>
            </View>
          )}
          {!!listing.capaciteMax && (
            <View style={c.fact}>
              <Users size={13} color={colors.neutral[600]} />
              <Text style={c.factText}>{listing.capaciteMax} pers.</Text>
            </View>
          )}
          {rating}
          {sejours > 0 && (
            <View style={c.fact}>
              <CalendarCheck size={13} color={colors.neutral[600]} />
              <Text style={c.factText}>{plural(sejours, 'séjour')}</Text>
            </View>
          )}
        </View>

        <View style={c.divider} />

        <View style={c.foot}>
          <View style={c.flex}>
            <Text style={c.price}>
              {price} <Text style={c.priceUnit}>FCFA</Text>
            </Text>
            <Text style={c.priceNote}>par nuit · votre tarif</Text>
          </View>
          {needsFix ? (
            <TouchableOpacity onPress={handleEdit} style={[c.pill, c.pillLime]} accessibilityRole="button">
              <Edit3 size={14} color={INK} />
              <Text style={c.pillLimeText}>{listing.statut === 'DRAFT' ? 'Terminer' : 'Corriger'}</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={handleEdit} style={c.iconBtn} accessibilityLabel="Modifier l’annonce">
                <Edit3 size={16} color={INK} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleManage} style={[c.pill, c.pillInk]} accessibilityRole="button">
                <Text style={c.pillInkText}>Gérer</Text>
                <ArrowRight size={14} color={colors.lime[400]} strokeWidth={2.6} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      {modals}
    </TouchableOpacity>
  );
}

const c = StyleSheet.create({
  flex: { flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  // Grille
  card: {
    borderRadius: 28,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.xs,
  },
  hero: { height: 220, backgroundColor: INK, justifyContent: 'space-between' },
  heroEmpty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.forest[900] },
  heroEmptyText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[300] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  glassChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(4,25,18,0.6)',
  },
  glassChipText: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: '#FFFFFF' },
  promoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
  },
  promoChipText: { fontFamily: typography.fontBodyBold, fontSize: 11, color: INK },
  glassBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(4,25,18,0.6)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { padding: 16, gap: 4 },
  heroKicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.1, color: colors.lime[400] },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, lineHeight: 26, letterSpacing: -0.4, color: '#FFFFFF' },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.error[50],
  },
  noticeGold: { backgroundColor: colors.gold[50] },
  noticeText: { flex: 1, fontFamily: typography.fontBodySemiBold, fontSize: 12, lineHeight: 17, color: colors.error[700] },
  noticeTextGold: { color: colors.gold[700] },
  body: { padding: 16, gap: 14 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  factText: { fontFamily: typography.fontBodyMedium, fontSize: 12.5, color: colors.neutral[600] },
  factStrong: { fontFamily: typography.fontBodyBold, fontSize: 12.5, color: colors.neutral[900] },
  divider: { height: 1, backgroundColor: colors.neutral[100] },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, letterSpacing: -0.4, color: colors.neutral[900] },
  priceUnit: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[500] },
  priceNote: { fontFamily: typography.fontBody, fontSize: 11.5, color: colors.neutral[500], marginTop: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 44, paddingHorizontal: 18, borderRadius: radius.pill },
  pillInk: { backgroundColor: INK },
  pillInkText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: colors.lime[400] },
  pillLime: { backgroundColor: colors.lime[400] },
  pillLimeText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },

  // Liste
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 22,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  rowThumb: {
    width: 84,
    height: 84,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowStatusText: { fontFamily: typography.fontBodyBold, fontSize: 11 },
  rowPromo: { fontFamily: typography.fontBodyBold, fontSize: 11, color: colors.forest[700] },
  rowTitle: { fontFamily: typography.fontBodyBold, fontSize: 15, color: colors.neutral[900], marginTop: 2 },
  rowPlace: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[500] },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  rowPrice: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: colors.neutral[900] },
  rowPriceUnit: { fontFamily: typography.fontBody, fontSize: 11, color: colors.neutral[500] },
  rowMore: { alignSelf: 'flex-start', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

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
                router.navigate('/(owner)/reservations' as any);
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
