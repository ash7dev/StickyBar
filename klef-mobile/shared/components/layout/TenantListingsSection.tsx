import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, radius, typography } from '../../theme/tokens';
import { TenantListingCard, ListingItem } from '../ui/TenantListingCard';

interface TenantListingsSectionProps {
  title: string;
  subtitle?: string;
  listings: ListingItem[];
  onViewAll?: () => void;
  onSelectListing?: (listing: ListingItem) => void;
}

export function TenantListingsSection({
  title,
  subtitle,
  listings,
  onViewAll,
  onSelectListing,
}: TenantListingsSectionProps) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Header de la section */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>

        {onViewAll && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onViewAll}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>Voir tout</Text>
            <ChevronRight size={14} color={colors.forest[700]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Conteneur défilement horizontal des cartes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {listings.map((listing) => (
          <TenantListingCard
            key={listing.id}
            listing={listing}
            width={280}
            onPress={onSelectListing ? () => onSelectListing(listing) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleText: {
    fontFamily: typography.fontDisplay,
    fontSize: typography.sizes.lg,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[200],
  },
  viewAllText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
