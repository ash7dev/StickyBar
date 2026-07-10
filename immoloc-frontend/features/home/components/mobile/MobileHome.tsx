'use client';

import { useState } from 'react';
import { MobileSearch } from './MobileSearch';
import { MobileSpotlight } from './MobileSpotlight';
import { MobileCategories } from './MobileCategories';
import { MobileDynamicFeed } from './MobileDynamicFeed';

export function MobileHome() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-background">

      {/* ── Top shell — ne scrolle jamais ── */}
      <MobileSearch />

      {/* ── Zone scrollable ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <MobileSpotlight />

        <MobileCategories
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <main className="pt-4 pb-36">
          <MobileDynamicFeed activeCategory={activeCategory} />
        </main>
      </div>

    </div>
  );
}
