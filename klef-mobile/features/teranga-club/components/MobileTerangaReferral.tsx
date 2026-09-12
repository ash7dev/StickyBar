import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share } from 'react-native';
import { Users, Copy, Share2, Check, Coins } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

interface MobileTerangaReferralProps {
  codeParrainage?: string;
  parrainagesReussis?: number;
  totalCoinsGagnes?: number;
}

export function MobileTerangaReferral({
  codeParrainage = 'TERANGA2026',
  parrainagesReussis = 0,
  totalCoinsGagnes = 0,
}: MobileTerangaReferralProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Clipboard.setStringAsync(codeParrainage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await Share.share({
        message: `Inscris-toi sur Klef avec mon code parrainage ${codeParrainage} et gagne des Teranga Coins sur tes réservations de vacances au Sénégal ! https://sticky-bar-zeta.vercel.app/register?code=${codeParrainage}`,
      });
    } catch (err) {
      console.warn('[MobileTerangaReferral] Erreur partage:', err);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Users size={16} color={colors.forest[700]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Super Parrain Teranga</Text>
          <Text style={styles.headerSubtitle}>Invitez vos proches et gagnez 1000 coins par filleul</Text>
        </View>
      </View>

      {/* Code parrainage Box */}
      <View style={styles.codeContainer}>
        <View style={styles.codeLabelBlock}>
          <Text style={styles.codeLabel}>VOTRE CODE UNIQUE</Text>
          <Text style={styles.codeText}>{codeParrainage}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCopy}
          style={styles.copyBtn}
        >
          {copied ? (
            <>
              <Check size={14} color={colors.forest[950]} strokeWidth={3} />
              <Text style={styles.copyBtnText}>Copié !</Text>
            </>
          ) : (
            <>
              <Copy size={14} color={colors.forest[950]} />
              <Text style={styles.copyBtnText}>Copier</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bouton Partager */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleShare}
        style={styles.shareBtn}
      >
        <Share2 size={15} color={colors.neutral[0]} />
        <Text style={styles.shareBtnText}>Partager à mes proches</Text>
      </TouchableOpacity>

      {/* Stats Parrainage */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statNumber}>{parrainagesReussis}</Text>
          <Text style={styles.statText}>Filleuls inscrits</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statCol}>
          <Text style={styles.statNumber}>+ {totalCoinsGagnes.toLocaleString('fr-FR')}</Text>
          <Text style={styles.statText}>Coins gagnés</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },

  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
  },
  codeLabelBlock: {
    gap: 2,
  },
  codeLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },
  codeText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  copyBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.forest[900],
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  shareBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  statText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[600],
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.neutral[200],
  },
});
