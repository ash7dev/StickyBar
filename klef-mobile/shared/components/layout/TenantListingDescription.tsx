import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, typography } from '../../theme/tokens';

interface TenantListingDescriptionProps {
  description?: string | null;
}

const DESC_LIMIT = 260;

export function TenantListingDescription({ description }: TenantListingDescriptionProps) {
  const [descOpen, setDescOpen] = useState(false);

  if (!description || description.trim().length === 0) return null;

  const isLongDesc = description.length > DESC_LIMIT;
  const truncatedText = isLongDesc
    ? `${description.slice(0, DESC_LIMIT).trim()}...`
    : description;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Description</Text>

      <Text style={styles.descriptionText}>
        {descOpen || !isLongDesc ? description : truncatedText}
      </Text>

      {isLongDesc && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setDescOpen(!descOpen)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {descOpen ? 'Réduire' : 'Lire la suite'}
          </Text>
          <View style={[styles.arrowBox, descOpen && styles.arrowRotated]}>
            <ChevronDown size={16} color={colors.forest[600]} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  descriptionText: {
    fontFamily: typography.fontBody,
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.neutral[700],
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  toggleText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },
  arrowBox: {
    transform: [{ rotate: '0deg' }],
  },
  arrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
});
