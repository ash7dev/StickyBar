import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Map, List } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

interface TenantViewToggleFabProps {
  currentMode: 'list' | 'map';
  onToggle: () => void;
}

export function TenantViewToggleFab({ currentMode, onToggle }: TenantViewToggleFabProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggle();
  };

  const isMap = currentMode === 'map';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.pill}
      >
        {isMap ? (
          <>
            <List size={16} color={colors.lime[400]} />
            <Text style={styles.label}>Afficher la liste</Text>
          </>
        ) : (
          <>
            <Map size={16} color={colors.lime[400]} />
            <Text style={styles.label}>Afficher la carte</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[950],
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
    letterSpacing: 0.2,
  },
});
