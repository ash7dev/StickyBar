import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  CalendarCheck,
  Wallet,
  Star,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ActivityItem } from '../../../hooks/useOwnerStats';

interface MobileStatsRecentActivityCardProps {
  activities: ActivityItem[];
}

export function MobileStatsRecentActivityCard({
  activities,
}: MobileStatsRecentActivityCardProps) {
  const router = useRouter();

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/reservations' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Activity size={16} color={colors.forest[600]} strokeWidth={2.4} />
          <Text style={styles.cardTitle}>ACTIVITÉS & OPÉRATIONS RÉCENTES</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleSeeAll}
          style={styles.seeAllBtn}
        >
          <Text style={styles.seeAllText}>Voir tout</Text>
          <ChevronRight size={14} color={colors.forest[700]} />
        </TouchableOpacity>
      </View>

      <View style={styles.activityList}>
        {activities.map((item) => {
          let IconComp = CalendarCheck;
          let iconBg = colors.forest[50];
          let iconColor = colors.forest[700];

          if (item.type === 'PAYOUT') {
            IconComp = Wallet;
            iconBg = colors.lime[100];
            iconColor = colors.forest[950];
          } else if (item.type === 'REVIEW') {
            IconComp = Star;
            iconBg = colors.gold[50];
            iconColor = colors.gold[600];
          } else if (item.type === 'DISPUTE') {
            IconComp = ShieldAlert;
            iconBg = colors.error[50];
            iconColor = colors.error[600];
          }

          return (
            <View key={item.id} style={styles.activityCard}>
              <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                <IconComp size={16} color={iconColor} strokeWidth={2.2} />
              </View>

              <View style={styles.textStack}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.amount !== undefined && (
                    <Text style={styles.itemAmount}>
                      +{item.amount.toLocaleString('fr-FR')} FCFA
                    </Text>
                  )}
                </View>

                <View style={styles.subRow}>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[700],
  },

  activityList: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
    flex: 1,
  },
  itemAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 12,
    color: colors.forest[600],
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    flex: 1,
  },
  itemDate: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[400],
  },
});
