import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';

interface ExplorerSearchPillProps {
  ville?: string;
  dateArrivee?: string;
  dateDepart?: string;
  onPress: () => void;
}

export function ExplorerSearchPill({
  ville,
  dateArrivee,
  dateDepart,
  onPress,
}: ExplorerSearchPillProps) {
  const hasFilters = !!ville || !!dateArrivee;

  // Format dates nicely
  const formatDate = (d?: string) => {
    if (!d) return null;
    try {
      const date = new Date(d);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  const dateText = dateArrivee
    ? `${formatDate(dateArrivee)}${dateDepart ? ` → ${formatDate(dateDepart)}` : ''}`
    : null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress();
        }}
        style={styles.pill}
      >
        {/* Icône de recherche avec cercle coloré */}
        <View style={styles.searchIconCircle}>
          <Search size={15} color={colors.forest[950]} strokeWidth={2.5} />
        </View>

        {/* Texte condensé */}
        <View style={styles.textColumn}>
          {hasFilters ? (
            <>
              <Text style={styles.mainText} numberOfLines={1}>
                {ville || 'Sénégal'}
              </Text>
              <Text style={styles.subText} numberOfLines={1}>
                {[dateText, 'Flexible'].filter(Boolean).join(' · ')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.mainText} numberOfLines={1}>
                Où allez-vous ?
              </Text>
              <Text style={styles.subText} numberOfLines={1}>
                N'importe où · N'importe quand
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.neutral[0],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...shadows.md,
  },
  searchIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  textColumn: {
    flex: 1,
    gap: 1,
  },
  mainText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  subText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
