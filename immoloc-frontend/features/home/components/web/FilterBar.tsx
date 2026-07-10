'use client';

import { useRouter } from 'next/navigation';
import { LayoutGrid, Home, Building2, Palmtree, DoorOpen, Maximize, Star } from 'lucide-react';

const FILTERS = [
  { id: 'all',         label: 'Tous les biens', icon: LayoutGrid, type: null         },
  { id: 'APPARTEMENT', label: 'Appartement',    icon: Building2,  type: 'APPARTEMENT' },
  { id: 'STUDIO',      label: 'Studio',         icon: DoorOpen,   type: 'STUDIO'      },
  { id: 'VILLA',       label: 'Villa',          icon: Home,       type: 'VILLA'       },
  { id: 'CHAMBRE',     label: 'Chambre',        icon: Palmtree,   type: 'CHAMBRE'     },
  { id: 'DUPLEX',      label: 'Duplex',         icon: Maximize,   type: 'DUPLEX'      },
  { id: 'PENTHOUSE',   label: 'Penthouse',      icon: Star,       type: 'PENTHOUSE'   },
];

export function FilterBar() {
  const router = useRouter();

  function navigate(type: string | null) {
    const url = type ? `/logements?type=${type}` : '/logements';
    router.push(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-center">
      <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-2 rounded-full flex items-center justify-center gap-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.5)] w-max">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => navigate(filter.type)}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] sm:text-sm transition-all duration-300 whitespace-nowrap text-white/60 hover:text-white hover:bg-background-card/10 active:scale-95"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400" />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
