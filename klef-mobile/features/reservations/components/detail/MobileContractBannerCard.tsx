import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { FileCheck, ExternalLink, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

interface MobileContractBannerCardProps {
  contratUrl?: string | null;
  reservationId: string;
}

export function MobileContractBannerCard({ contratUrl }: MobileContractBannerCardProps) {
  const handleOpenPdf = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (contratUrl) {
      const supported = await Linking.canOpenURL(contratUrl).catch(() => false);
      if (supported) {
        await Linking.openURL(contratUrl);
      } else {
        Alert.alert('Erreur', "Impossible d'ouvrir le lien du contrat.");
      }
    } else {
      Alert.alert(
        'Contrat en cours de génération',
        'Le contrat de location PDF est en cours de signature numérique et sera disponible dans quelques instants.'
      );
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handleOpenPdf}
      style={styles.cardContainer}
    >
      <View style={styles.contentRow}>
        <View style={styles.iconBadge}>
          <FileCheck size={18} color={colors.lime[400]} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>Contrat de location</Text>
            <ShieldCheck size={13} color={colors.forest[600]} />
          </View>
          <Text style={styles.subtitleText} numberOfLines={1}>
            Signé & horodaté · Valide en droit
          </Text>
        </View>

        <View style={styles.actionChip}>
          <Text style={styles.actionChipText}>Consulter</Text>
          <ExternalLink size={11} color={colors.forest[950]} strokeWidth={2.4} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  subtitleText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: '#64748B',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[400],
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lime[400],
  },
  actionChipText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },
});
