import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus,
  CalendarDays,
  Building2,
  Wallet,
  BarChart3,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

const ACTIONS = [
  {
    id: 'create-listing',
    title: 'Publier un bien',
    subtitle: 'Ajoutez un nouveau logement à la plateforme',
    icon: Plus,
    href: '/(owner)/add-listing',
    isPrimary: true,
  },
  {
    id: 'view-bookings',
    title: 'Voir mes réservations',
    subtitle: 'Gérez vos demandes et séjours en cours',
    icon: CalendarDays,
    href: '/(owner)/reservations',
  },
  {
    id: 'view-listings',
    title: 'Voir mes biens',
    subtitle: 'Ajustez les tarifs, photos et disponibilités',
    icon: Building2,
    href: '/(owner)/listings',
  },
  {
    id: 'view-wallet',
    title: 'Consulter mon solde',
    subtitle: 'Solde disponible, retraits et historique',
    icon: Wallet,
    href: '/(owner)/wallet',
  },
  {
    id: 'view-stats',
    title: 'Voir mes stats & activités',
    subtitle: 'Taux d’occupation, revenus et performance',
    icon: BarChart3,
    href: '/(owner)/stats',
  },
  {
    id: 'view-data',
    title: 'Mes données & sécurité',
    subtitle: 'Compte, sécurité et paramètres du profil',
    icon: ShieldCheck,
    href: '/(tenant)/profile',
  },
];

export function MobileQuickActionsMenuCard() {
  const router = useRouter();

  const handleActionPress = (href: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(href as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>ACTIONS RAPIDES</Text>

      <View style={styles.actionsList}>
        {ACTIONS.map((action) => {
          const IconComp = action.icon;
          const isPrimary = action.isPrimary;

          return (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.82}
              onPress={() => handleActionPress(action.href)}
              style={styles.actionCard}
            >
              <View style={styles.actionLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    isPrimary ? styles.iconCirclePrimary : styles.iconCircleNormal,
                  ]}
                >
                  <IconComp
                    size={18}
                    color={isPrimary ? colors.forest[950] : colors.lime[400]}
                    strokeWidth={2.4}
                  />
                </View>

                <View style={styles.textStack}>
                  <Text style={styles.actionTitle} numberOfLines={1}>
                    {action.title}
                  </Text>
                  <Text style={styles.actionSubtitle} numberOfLines={1}>
                    {action.subtitle}
                  </Text>
                </View>
              </View>

              <ChevronRight size={18} color={colors.neutral[400]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  actionsList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },

  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePrimary: {
    backgroundColor: colors.lime[400],
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  iconCircleNormal: {
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[800],
  },

  textStack: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  actionSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
