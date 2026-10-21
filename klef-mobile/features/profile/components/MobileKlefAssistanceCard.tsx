import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LifeBuoy,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

const SUPPORT_PHONE = '+221 33 800 00 00';
const WHATSAPP_NUMBER = '221770000000';

export function MobileKlefAssistanceCard() {
  const router = useRouter();

  // Animations pour le CTA principal
  const ctaScale = useRef(new Animated.Value(1)).current;
  const handleCtaPressIn = () => {
    Animated.spring(ctaScale, { toValue: 0.97, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  };
  const handleCtaPressOut = () => {
    Animated.spring(ctaScale, { toValue: 1, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  };

  const handleOpenAssistance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/assistance');
  };

  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Paixi Assistance', `Appelez le ${SUPPORT_PHONE}`);
    });
  };

  const handleOpenWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const text = encodeURIComponent(
      `Bonjour l'équipe Paixi Assistance,\nJ'ai une demande concernant ma réservation / mon compte.`
    );
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`).catch(() => {
      Alert.alert('WhatsApp indisponible', 'Impossible d’ouvrir WhatsApp sur votre appareil.');
    });
  };

  return (
    <View style={styles.card}>
      {/* En-tête avec Badge 24/7 & Pulse */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <LifeBuoy size={20} color={colors.forest[800]} />
        </View>

        <View style={styles.headerTitleBox}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.cardTitle}>Paixi Assistance</Text>
            <View style={styles.liveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.liveBadgeText}>24/7 EN LIGNE</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            Une équipe dédiée disponible 7j/7 pour vous accompagner à tout moment de votre séjour.
          </Text>
        </View>
      </View>

      {/* Grille des Engagements Support */}
      <View style={styles.highlightsContainer}>
        <View style={styles.highlightItem}>
          <Clock size={14} color={colors.forest[700]} />
          <Text style={styles.highlightText}>Réponse en &lt; 15 min</Text>
        </View>
        <View style={styles.highlightDivider} />
        <View style={styles.highlightItem}>
          <ShieldCheck size={14} color={colors.forest[700]} />
          <Text style={styles.highlightText}>Protection Séquestre</Text>
        </View>
      </View>

      {/* Zone des Boutons d'Action Rapide */}
      <View style={styles.actionsStack}>
        {/* Bouton CTA Principal d'Assistance */}
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <Pressable
            accessibilityLabel="Demander de l'assistance à l'équipe Paixi"
            accessibilityRole="button"
            onPress={handleOpenAssistance}
            onPressIn={handleCtaPressIn}
            onPressOut={handleCtaPressOut}
            style={styles.mainCtaBtn}
          >
            <View style={styles.mainCtaLeft}>
              <View style={styles.ctaIconBadge}>
                <MessageSquare size={16} color={colors.forest[950]} />
              </View>
              <Text style={styles.mainCtaText}>Demander de l’assistance</Text>
            </View>
            <ChevronRight size={18} color={colors.forest[950]} />
          </Pressable>
        </Animated.View>

        {/* Boutons Secondaires : WhatsApp & Téléphone */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenWhatsApp}
            style={styles.whatsappBtn}
            accessibilityLabel="Contacter par WhatsApp"
            accessibilityRole="button"
          >
            <MessageSquare size={14} color="#166534" />
            <Text style={styles.whatsappBtnText}>WhatsApp Direct</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCallSupport}
            style={styles.phoneBtn}
            accessibilityLabel="Appeler le support téléphonique"
            accessibilityRole="button"
          >
            <PhoneCall size={14} color={colors.neutral[700]} />
            <Text style={styles.phoneBtnText}>Appel 24/7</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Carte Blanche Profile ──────────────────────────────────────────
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
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitleBox: {
    flex: 1,
    gap: 3,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: '#15803D',
    letterSpacing: 0.4,
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 17,
  },

  // Engagements / Highlights
  highlightsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  highlightItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  highlightDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.neutral[300],
  },
  highlightText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[900],
  },

  // Actions
  actionsStack: {
    gap: 10,
  },
  mainCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  mainCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(4, 25, 18, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCtaText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },

  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  whatsappBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#166534',
  },
  phoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  phoneBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
});
