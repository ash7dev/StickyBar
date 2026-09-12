import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Calendar, Users, Edit3, MapPin, Star, Moon, Minus, Plus, ChevronUp, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { AppDateRangeCalendar, DateRange } from '../../../shared/components/ui/AppDateRangeCalendar';

interface MobileCheckoutStayCardProps {
  listing?: {
    titre?: string;
    type?: string;
    ville?: string;
    quartier?: string | null;
    prixBase?: number;
    nuitesMinimum?: number | null;
    capaciteMax?: number;
    photos?: Array<{ url: string; estPrincipale?: boolean }>;
    note?: number | null;
  } | null;
  startDate: string;
  endDate: string;
  nights: number;
  nbPersonnes: number;
  onEditDates?: () => void;
  onDateChange?: (range: DateRange) => void;
  onPersonnesChange?: (count: number) => void;
}

/** Formate une date AAAA-MM-JJ en date lisible (ex: Ven. 15 Sep. 2026) */
function formatDateCourt(isoDate?: string | null) {
  if (!isoDate) return 'À choisir';
  const clean = isoDate.slice(0, 10);
  const [y, m, d] = clean.split('-').map(Number);
  if (!y || !m || !d) return clean;
  try {
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return clean;
  }
}

export function MobileCheckoutStayCard({
  listing,
  startDate,
  endDate,
  nights,
  nbPersonnes,
  onEditDates,
  onDateChange,
  onPersonnesChange,
}: MobileCheckoutStayCardProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const capaciteMax = listing?.capaciteMax || 10;
  const minNuits = listing?.nuitesMinimum ?? 1;

  const photoUrl =
    listing?.photos?.find((p) => p.estPrincipale)?.url ||
    listing?.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800';

  const toggleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setShowCalendar((prev) => !prev);
    onEditDates?.();
  };

  const handleMinusPersonne = () => {
    if (nbPersonnes > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPersonnesChange?.(nbPersonnes - 1);
    }
  };

  const handlePlusPersonne = () => {
    if (nbPersonnes < capaciteMax) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPersonnesChange?.(nbPersonnes + 1);
    }
  };

  const calendarValue: DateRange = {
    from: startDate ? new Date(startDate) : null,
    to: endDate ? new Date(endDate) : null,
  };

  return (
    <View style={styles.card}>
      {/* ── 1. Logement Info Header ──────────────────────────────────── */}
      <View style={styles.propertyRow}>
        <View style={styles.imageWrapper}>
          <ExpoImage
            source={{ uri: photoUrl }}
            style={styles.image}
            contentFit="cover"
          />
          {listing?.type && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{listing.type}</Text>
            </View>
          )}
        </View>

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={2}>
            {listing?.titre || 'Chargement du logement…'}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.forest[600]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {[listing?.quartier, listing?.ville].filter(Boolean).join(', ') || 'Dakar'}
            </Text>
          </View>

          {listing?.note && listing.note > 0 ? (
            <View style={styles.ratingBadge}>
              <Star size={11} color="#B45309" fill="#FBBF24" />
              <Text style={styles.ratingText}>{listing.note.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      {/* ── 2. Récapitulation en 2 Lignes Élégantes ─────────────────── */}
      <View style={styles.twoLinesContainer}>
        {/* ── LIGNE 1 : DATES DE SÉJOUR ─────────────────────────────── */}
        <View style={styles.lineRow}>
          <View style={styles.iconCircle}>
            <Calendar size={16} color={colors.forest[700]} />
          </View>

          <View style={styles.lineTextContent}>
            <Text style={styles.lineLabel}>DATES DU SÉJOUR</Text>
            <View style={styles.lineValueRow}>
              <Text style={styles.lineValue}>
                {formatDateCourt(startDate)} — {formatDateCourt(endDate)}
              </Text>
              {nights > 0 && (
                <View style={styles.nightsChip}>
                  <Moon size={10} color={colors.forest[800]} />
                  <Text style={styles.nightsChipText}>{nights} nuit{nights > 1 ? 's' : ''}</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleCalendar}
            style={[styles.editBtn, showCalendar && styles.editBtnActive]}
          >
            {showCalendar ? (
              <>
                <ChevronUp size={13} color={colors.forest[950]} />
                <Text style={styles.editBtnTextActive}>Fermer</Text>
              </>
            ) : (
              <>
                <Edit3 size={13} color={colors.forest[800]} />
                <Text style={styles.editBtnText}>Modifier</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Calendrier Dépliable sous la Ligne 1 */}
        {showCalendar && (
          <View style={styles.calendarWrapper}>
            <View style={styles.calendarHeaderRow}>
              <Text style={styles.calendarTitle}>Modifier les dates</Text>
              {minNuits > 1 && (
                <Text style={styles.calendarSubtitle}>Séjour min : {minNuits} nuits</Text>
              )}
            </View>

            <AppDateRangeCalendar
              value={calendarValue}
              minNights={minNuits}
              onChange={(range) => {
                onDateChange?.(range);
                if (range.from && range.to) {
                  setTimeout(() => setShowCalendar(false), 300);
                }
              }}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCalendar(false)}
              style={styles.closeCalendarBtn}
            >
              <Check size={14} color={colors.neutral[0]} />
              <Text style={styles.closeCalendarBtnText}>Confirmer les dates</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dividerSub} />

        {/* ── LIGNE 2 : VOYAGEURS ────────────────────────────────────── */}
        <View style={styles.lineRow}>
          <View style={styles.iconCircle}>
            <Users size={16} color={colors.forest[700]} />
          </View>

          <View style={styles.lineTextContent}>
            <Text style={styles.lineLabel}>VOYAGEURS</Text>
            <Text style={styles.lineValue}>
              {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Compteur +/- */}
          {onPersonnesChange && (
            <View style={styles.counterBox}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleMinusPersonne}
                disabled={nbPersonnes <= 1}
                style={[styles.counterBtn, nbPersonnes <= 1 && styles.counterBtnDisabled]}
              >
                <Minus size={13} color={nbPersonnes <= 1 ? colors.neutral[400] : colors.forest[950]} />
              </TouchableOpacity>

              <Text style={styles.counterValueText}>{nbPersonnes}</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handlePlusPersonne}
                disabled={nbPersonnes >= capaciteMax}
                style={[styles.counterBtn, nbPersonnes >= capaciteMax && styles.counterBtnDisabled]}
              >
                <Plus size={13} color={nbPersonnes >= capaciteMax ? colors.neutral[400] : colors.forest[950]} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // ── Header Property ───────────────────────────────────────────────────
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: radius.inner,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(4, 25, 18, 0.80)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 8.5,
    color: colors.lime[300],
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  propertyInfo: {
    flex: 1,
    gap: 4,
  },
  propertyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14.5,
    color: colors.forest[950],
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  ratingText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: '#B45309',
  },

  // ── Dividers ──────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerSub: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 2,
  },

  // ── Container 2 Lignes ────────────────────────────────────────────────
  twoLinesContainer: {
    gap: 12,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTextContent: {
    flex: 1,
    gap: 2,
  },
  lineLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.5,
  },
  lineValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  lineValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  // Chip Nuits inline
  nightsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  nightsChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.forest[800],
  },

  // Bouton Modifier
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  editBtnActive: {
    backgroundColor: colors.lime[300],
    borderColor: colors.lime[400],
  },
  editBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[800],
  },
  editBtnTextActive: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },

  // ── Calendrier Wrappers ───────────────────────────────────────────────
  calendarWrapper: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 10,
    gap: 10,
    marginTop: 4,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  calendarTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  calendarSubtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
  closeCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.forest[900],
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  closeCalendarBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[0],
  },

  // ── Counter Widget ────────────────────────────────────────────────────
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    padding: 3,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  counterBtnDisabled: {
    backgroundColor: colors.neutral[200],
    opacity: 0.5,
  },
  counterValueText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.forest[950],
    minWidth: 16,
    textAlign: 'center',
  },
});
