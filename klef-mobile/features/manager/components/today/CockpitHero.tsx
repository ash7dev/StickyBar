import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SlidersHorizontal, TrendingDown, TrendingUp } from 'lucide-react-native';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { fmt } from '../../lib/today';
import { INK, LIME, LINE, MUTED } from './ui';

interface Props {
  topInset: number;
  dateLabel: string;
  firstName?: string | null;
  listings: number;
  owners: number;
  revenue: number;
  ownersShare: number;
  commission: number;
  stays: number;
  /** Encaissé par mois, du plus ancien au mois en cours */
  bars: number[];
  changePct: number | null;
  occupancy: number | null;
  online: number;
  toReview: number;
  filterLabel: string | null;
  onFilter: () => void;
}

function Ring({ pct, size, stroke, color, track, label }: { pct: number; size: number; stroke: number; color: string; track: string; label: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, pct)))}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringLabel]}>
        <Text style={styles.ringText}>{label}</Text>
      </View>
    </View>
  );
}

/** Le cockpit : le mois du parc en un coup d'œil (maquette B). */
export function CockpitHero(p: Props) {
  const max = Math.max(1, ...p.bars);
  const up = (p.changePct ?? 0) >= 0;
  return (
    <>
      <View style={[styles.hero, { paddingTop: p.topInset + 14 }]}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringInner]} />

        <View style={styles.head}>
          <View style={styles.flex}>
            <Text style={styles.kicker} numberOfLines={1}>
              {p.dateLabel.toUpperCase()}
              {p.firstName ? ` · ${p.firstName.toUpperCase()}` : ''}
            </Text>
            <Text style={styles.park} numberOfLines={1}>
              {p.filterLabel ?? `${p.listings} bien${p.listings > 1 ? 's' : ''} · ${p.owners} propriétaire${p.owners > 1 ? 's' : ''}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={p.onFilter}
            style={[styles.filter, p.filterLabel && styles.filterOn]}
            accessibilityRole="button"
            accessibilityLabel="Filtrer par propriétaire"
          >
            <SlidersHorizontal size={18} color={p.filterLabel ? INK : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.revenueLabel}>Réservé ce mois · payé par les voyageurs</Text>
        <View style={styles.revenueRow}>
          <Text style={styles.revenue} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(p.revenue)}
          </Text>
          <Text style={styles.currency}>FCFA</Text>
        </View>
        {p.changePct !== null ? (
          <View style={styles.change}>
            {up ? <TrendingUp size={13} color={LIME} /> : <TrendingDown size={13} color={colors.gold[300]} />}
            <Text style={[styles.changeText, !up && { color: colors.gold[300] }]}>
              {up ? '+' : ''}
              {p.changePct} % vs mois dernier
            </Text>
          </View>
        ) : p.revenue === 0 ? (
          <Text style={styles.firstMonth}>Aucune réservation ce mois-ci pour l’instant.</Text>
        ) : null}

        {p.bars.length > 1 && (
          <View style={styles.bars}>
            {p.bars.map((b, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: `${Math.max(6, (b / max) * 100)}%` },
                  i === p.bars.length - 1 && { backgroundColor: LIME },
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.tiles}>
          {[
            ['Propriétaires', fmt(p.ownersShare)],
            ['Commission', fmt(p.commission)],
            ['Séjours', String(p.stays)],
          ].map(([l, v]) => (
            <View key={l} style={styles.tile}>
              <Text style={styles.tileLabel}>{l}</Text>
              <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
                {v}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.rings}>
        <View style={[styles.ringCard, styles.ringCardWhite]}>
          <Ring
            pct={p.occupancy ?? 0}
            size={52}
            stroke={7}
            color={colors.forest[600]}
            track="#E9F0E1"
            label={p.occupancy === null ? '—' : `${Math.round(p.occupancy * 100)}%`}
          />
          <View style={styles.flex}>
            <Text style={styles.ringTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Occupation
            </Text>
            <Text style={styles.ringSub} numberOfLines={1}>
              sur 30 jours
            </Text>
          </View>
        </View>
        <View style={[styles.ringCard, styles.ringCardLime]}>
          <Ring
            pct={p.listings ? p.online / p.listings : 0}
            size={52}
            stroke={7}
            color={INK}
            track="rgba(4,25,18,0.12)"
            label={`${p.online}/${p.listings}`}
          />
          <View style={styles.flex}>
            <Text style={styles.ringTitle} numberOfLines={1}>
              En ligne
            </Text>
            <Text style={[styles.ringSub, { color: colors.forest[800] }]} numberOfLines={1}>
              {p.toReview > 0 ? `${p.toReview} à revoir` : 'Tout le parc'}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  hero: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: INK, overflow: 'hidden' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 300, height: 300, borderRadius: 150, top: -120, right: -90 },
  ringInner: { width: 180, height: 180, borderRadius: 90, top: -60, right: -30, borderColor: 'rgba(211,242,110,0.2)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: LIME },
  park: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: '#FFFFFF', marginTop: 2 },
  filter: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248,251,244,0.12)', alignItems: 'center', justifyContent: 'center' },
  filterOn: { backgroundColor: LIME },
  revenueLabel: { fontFamily: typography.fontBody, fontSize: 12.5, color: colors.forest[200], marginTop: 22 },
  revenueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  revenue: { flexShrink: 1, fontFamily: typography.fontDisplaySemiBold, fontSize: 50, letterSpacing: -2, color: '#FFFFFF' },
  currency: { fontFamily: typography.fontBodySemiBold, fontSize: 14, color: colors.forest[200] },
  change: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(211,242,110,0.14)',
    marginTop: 8,
  },
  changeText: { fontFamily: typography.fontBodyBold, fontSize: 11.5, color: LIME },
  firstMonth: { fontFamily: typography.fontBody, fontSize: 12.5, color: colors.forest[200], marginTop: 6 },
  bars: { height: 64, flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 18 },
  bar: { flex: 1, borderRadius: 6, backgroundColor: 'rgba(248,251,244,0.16)' },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 18 },
  tile: { flex: 1, padding: 12, borderRadius: 18, backgroundColor: 'rgba(248,251,244,0.07)' },
  tileLabel: { fontFamily: typography.fontBody, fontSize: 11, color: colors.forest[200] },
  tileValue: { fontFamily: typography.fontDisplaySemiBold, fontSize: 18, color: '#FFFFFF', marginTop: 3 },
  rings: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  ringCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 22 },
  ringCardWhite: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: LINE },
  ringCardLime: { backgroundColor: LIME },
  ringLabel: { alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: typography.fontDisplaySemiBold, fontSize: 13, color: INK },
  ringTitle: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  ringSub: { fontFamily: typography.fontBody, fontSize: 11.5, color: MUTED, marginTop: 1 },
});
