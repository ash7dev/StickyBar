import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Coins, Zap, ShieldCheck, Tag } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

const PERKS = [
  {
    icon: Coins,
    title: 'Cashback Automatique',
    desc: 'Recevez 1.5% à 3.0% de votre réservation crédités instantanément en Teranga Coins.',
    badge: '1.5% à 3%',
  },
  {
    icon: Zap,
    title: 'Réservations Prioritaires',
    desc: 'Accès prioritaire sur les logements très demandés à Dakar, Saly et en régions.',
    badge: 'Fast Track',
  },
  {
    icon: ShieldCheck,
    title: 'Garantie Séquestre 100%',
    desc: 'Vos paiements et vos coins sont conservés en lieu sûr jusqu’à la remise des clés.',
    badge: 'Sécurisé',
  },
  {
    icon: Tag,
    title: 'Offres & Privilèges',
    desc: 'Réductions partenaires exclusives et promos réservées aux membres Teranga Club.',
    badge: 'Exclusif',
  },
];

export function MobileTerangaPerksGrid() {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Coins size={16} color={colors.forest[700]} />
        </View>
        <Text style={styles.headerTitle}>Pourquoi rejoindre le Teranga Club ?</Text>
      </View>

      <View style={styles.gridContainer}>
        {PERKS.map((perk, index) => {
          const PerkIcon = perk.icon;
          return (
            <View key={index} style={styles.perkItem}>
              <View style={styles.perkHeader}>
                <View style={styles.perkIconCircle}>
                  <PerkIcon size={16} color={colors.forest[800]} />
                </View>
                <View style={styles.perkBadge}>
                  <Text style={styles.perkBadgeText}>{perk.badge}</Text>
                </View>
              </View>

              <Text style={styles.perkTitle}>{perk.title}</Text>
              <Text style={styles.perkDesc}>{perk.desc}</Text>
            </View>
          );
        })}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  gridContainer: {
    gap: 10,
  },
  perkItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  perkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perkIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lime[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkBadge: {
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  perkBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9.5,
    color: colors.forest[800],
  },
  perkTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  perkDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
    lineHeight: 16,
  },
});
