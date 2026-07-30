'use client';

import { useState, useEffect } from 'react';
import { HeroSection } from './HeroSection';
import { CategoriesSection } from './CategoriesSection';
import { FeedSections } from './FeedSections';
import { HowItWorksSection } from './HowItWorksSection';
import { OwnerCTASection } from './OwnerCTASection';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing } from '@/lib/nestjs/types';

export function WebHome() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data } = await listingsApi.search({ limit: 2, page: 1 });
        setListings(data);
      } catch (error) {
        console.error('[WebHome] Failed to fetch listings:', error);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="bg-canvas">
      {/* Hero Section */}
      <HeroSection listings={listings} />

      {/* Categories Section */}
      <CategoriesSection />

      {/* Feed Sections - Multiple horizontal sections */}
      <FeedSections />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Owner CTA Section */}
      <OwnerCTASection />
    </div>
  );
}
