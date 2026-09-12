import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import {
  Compass,
  Sparkles,
  ShieldCheck,
  FileText,
  KeyRound,
  ArrowRight,
  RotateCcw,
  CalendarCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationTabId } from '../../../../shared/components/layout/TenantReservationHeaderBar';

interface MobileEmptyReservationCardProps {
  activeTab: ReservationTabId;
  onExplore: () => void;
  onResetTab?: () => void;
}

const TAB_EMPTY_CONFIG: Record<
  ReservationTabId,
  {
    title: string;
    subtitle: string;
    icon: typeof Compass;
  }
> = {
  ALL: {
    title: 'Prêt pour votre prochain séjour ?',
    subtitle: 'Explorez des appartements et villas d’exception avec garantie de séquestre Klef et contrat numérique certifié.',
    icon: Compass,
  },
  CONFIRMED: {
    title: 'Aucun séjour confirmé à venir',
    subtitle: 'Vos prochaines réservations validées par les hôtes apparaîtront dans cette rubrique.',
    icon: CalendarCheck,
  },
  CHECKED_IN: {
    title: 'Aucun séjour actif pour le moment',
    subtitle: 'Vous n’êtes actuellement installé dans aucun logement. Retrouvez vos séjours à venir dans l’onglet Confirmés.',
    icon: KeyRound,
  },
  COMPLETED: {
    title: 'Aucun séjour terminé',
    subtitle: 'Vos séjours passés et archivés apparaîtront ici une fois votre expérience clôturée.',
    icon: CheckCircle2,
  },
  CANCELLED: {
    title: 'Aucune réservation annulée',
    subtitle: 'Vous n’avez aucune demande ou réservation annulée sur votre compte.',
    icon: XCircle,
  },
};

export function MobileEmptyReservationCard({
  activeTab,
  onExplore,
  onResetTab,
}: MobileEmptyReservationCardProps) {
  const isFiltered = activeTab !== 'ALL';
  const cfg = TAB_EMPTY_CONFIG[activeTab] || TAB_EMPTY_CONFIG.ALL;
  const IconComponent = cfg.icon;

  const handleExplorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onExplore();
  };

  const handleResetPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onResetTab?.();
  };

  return (
    <View style={styles.container}>
      {/* Carte héro principale sombre & premium */}
      <View style={styles.card}>
        {/* Glow de fond subtil */}
        <View style={styles.glowCircle} />

        {/* Cercle d'icône avec anneau vert */}
        <View style={styles.iconRing}>
          <View style={styles.iconCircle}>
            <IconComponent size={26} color={colors.lime[300]} strokeWidth={2} />
          </View>
        </View>

        {/* Titre & Sous-titre */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.subtitle}</Text>
        </View>

        {/* 3 Garanties Klef en badges horizontaux */}
        {!isFiltered && (
          <View style={styles.featuresRow}>
            <View style={styles.featureBadge}>
              <ShieldCheck size={12} color={colors.lime[300]} />
              <Text style={styles.featureText}>Séquestre 100% garanti</Text>
            </View>

            <View style={styles.featureBadge}>
              <FileText size={12} color={colors.lime[300]} />
              <Text style={styles.featureText}>Contrat horodaté</Text>
            </View>

            <View style={styles.featureBadge}>
              <KeyRound size={12} color={colors.lime[300]} />
              <Text style={styles.featureText}>Check-in photo</Text>
            </View>
          </View>
        )}

        {/* Boutons d'action */}
        <View style={styles.actionsBlock}>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Explorer les logements"
            accessibilityHint="Redirige vers l'écran de recherche des logements"
            activeOpacity={0.85}
            onPress={handleExplorePress}
            style={styles.ctaButton}
          >
            <Sparkles size={15} color={colors.forest[950]} />
            <Text style={styles.ctaText}>Explorer les logements</Text>
            <ArrowRight size={15} color={colors.forest[950]} />
          </TouchableOpacity>

          {isFiltered && onResetTab && (
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Afficher toutes les réservations"
              accessibilityHint="Réinitialise le filtre des onglets"
              activeOpacity={0.8}
              onPress={handleResetPress}
              style={styles.resetButton}
            >
              <RotateCcw size={13} color={colors.text.inverseMuted} />
              <Text style={styles.resetText}>Voir tous mes séjours</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.md,
  },
  glowCircle: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.text.inverseDisplay,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.text.inverseMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },

  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  featureText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.text.inverseMuted,
  },

  actionsBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  ctaButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  ctaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.text.inverseMuted,
  },
});
