'use client';

import {
  Building2,
  DoorOpen,
  TreePalm,
  Bed,
  Maximize,
  Star,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const CATEGORIES = [
  { id: 'all',        name: 'Tous',        icon: LayoutGrid },
  { id: 'APPARTEMENT', name: 'Appartement', icon: Building2 },
  { id: 'STUDIO',     name: 'Studio',      icon: DoorOpen },
  { id: 'VILLA',      name: 'Villa',       icon: TreePalm },
  { id: 'CHAMBRE',    name: 'Chambre',     icon: Bed },
  { id: 'DUPLEX',     name: 'Duplex',      icon: Maximize },
  { id: 'PENTHOUSE',  name: 'Penthouse',   icon: Star },
];

interface MobileCategoriesProps {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export function MobileCategories({ activeCategory, onCategoryChange }: MobileCategoriesProps) {
  return (
    <section className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl saturate-150 py-3 border-b border-border shadow-sm">
      <div
        className="flex items-center gap-2 overflow-x-auto px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-[12px] whitespace-nowrap transition-all duration-300 active:scale-95 shrink-0",
                isActive
                  ? "bg-emerald-600 text-white shadow-[0_4px_16px_rgba(20,101,76,0.35)]"
                  : "bg-background-alt text-foreground-muted hover:bg-background-hover"
              )}
            >
              <Icon
                className={cn(
                  "w-3.5 h-3.5 transition-colors shrink-0",
                  isActive ? "text-white" : "text-foreground-muted"
                )}
                strokeWidth={1.75}
              />
              {cat.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
