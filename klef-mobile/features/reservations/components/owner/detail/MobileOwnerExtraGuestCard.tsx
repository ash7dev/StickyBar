import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Users, ChevronDown, ChevronUp, Gavel } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { radius, shadows, typography } from '../../../../../shared/theme/tokens';

interface MobileOwnerExtraGuestCardProps {
  nbPersonnes: number;
  onOpenDispute: () => void;
}

export function MobileOwnerExtraGuestCard({
  nbPersonnes,
  onOpenDispute,
}: MobileOwnerExtraGuestCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => !prev);
  };

  const handleSignal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onOpenDispute();
  };

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.82}
        style={styles.headerRow}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Users size={18} color="#D97706" />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.titleText}>Plus de voyageurs que prévu ?</Text>
            <Text style={styles.subText}>
              {nbPersonnes} {nbPersonnes > 1 ? 'voyageurs déclarés' : 'voyageur déclaré'} sur la réservation
            </Text>
          </View>
        </View>

        {expanded ? (
          <ChevronUp size={18} color="#D97706" />
        ) : (
          <ChevronDown size={18} color="#D97706" />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <Text style={styles.infoParagraph}>
            {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} {nbPersonnes > 1 ? 'sont' : 'est'} déclaré
            {nbPersonnes > 1 ? 's' : ''} sur cette réservation. Si le groupe présent sur les lieux est plus nombreux, signalez-le maintenant pour régulariser la situation.
          </Text>

          <TouchableOpacity
            onPress={handleSignal}
            style={styles.signalButton}
            activeOpacity={0.85}
          >
            <Gavel size={15} color="#DC2626" />
            <Text style={styles.signalButtonText}>Signaler le dépassement</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  subText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#B45309',
  },
  divider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginBottom: 10,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 12,
  },
  infoParagraph: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#B45309',
    lineHeight: 17,
  },
  signalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 2,
  },
  signalButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#B91C1C',
  },
});
