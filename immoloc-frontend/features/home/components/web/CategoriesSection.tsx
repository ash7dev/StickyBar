'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Navigation } from 'lucide-react';

/**
 * CategoriesSection — Style Getaround/moderne
 * Design minimaliste avec chips horizontaux
 */

// Toutes les sous-catégories mélangées
const CATEGORIES = [
  { type: '', sousType: '', label: 'Tous' },
  { type: 'APPARTEMENT', sousType: 'Studio', label: 'Studio' },
  { type: 'VILLA', sousType: 'Villa simple', label: 'Villa simple' },
  { type: 'APPARTEMENT', sousType: 'Appartement F2', label: 'Appartement F2' },
  { type: 'CHAMBRE', sousType: 'Chambre meublée', label: 'Chambre meublée' },
  { type: 'VILLA', sousType: 'Villa avec piscine', label: 'Villa avec piscine' },
  { type: 'APPARTEMENT', sousType: 'Appartement F3', label: 'Appartement F3' },
  { type: 'AUTRES', sousType: 'Résidence hôtelière', label: 'Résidence hôtelière' },
  { type: 'APPARTEMENT', sousType: 'Appartement F4+', label: 'Appartement F4+' },
  { type: 'VILLA', sousType: 'Villa bord de mer', label: 'Villa bord de mer' },
  { type: 'APPARTEMENT', sousType: 'Penthouse', label: 'Penthouse' },
  { type: 'AUTRES', sousType: 'Hôtel', label: 'Hôtel' },
  { type: 'VILLA', sousType: 'Villa de luxe', label: 'Villa de luxe' },
  { type: 'CHAMBRE', sousType: 'Suite meublée', label: 'Suite meublée' },
  { type: 'APPARTEMENT', sousType: 'Loft', label: 'Loft' },
  { type: 'AUTRES', sousType: 'Auberge / Gîte', label: 'Auberge / Gîte' },
  { type: 'VILLA', sousType: 'Villa familiale', label: 'Villa familiale' },
  { type: 'AUTRES', sousType: 'Maison entière', label: 'Maison entière' },
  { type: 'VILLA', sousType: 'Villa pour événement', label: 'Villa pour événement' },
  { type: 'AUTRES', sousType: 'Duplex', label: 'Duplex' },
  { type: 'AUTRES', sousType: 'Riad / Maison traditionnelle', label: 'Riad' },
  { type: 'AUTRES', sousType: 'Cabane / Logement atypique', label: 'Logement atypique' },
  { type: 'AUTRES', sousType: 'Résidence étudiante', label: 'Résidence étudiante' },
];

export function CategoriesSection() {
  const [selected, setSelected] = useState<{ type: string; sousType: string }>({ type: '', sousType: '' });
  const [isGpsActive, setIsGpsActive] = useState(false);

  return (
    <section className="relative py-3 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Chips de catégories - style Getaround */}
        <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide">
          {/* Pill spécial "Autour de moi (GPS)" */}
          <button
            type="button"
            onClick={() => {
              setIsGpsActive(!isGpsActive);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('klef:locate-nearby'));
              }
            }}
            className={`
              flex-shrink-0 px-5 py-2.5 rounded-[var(--radius-pill)] font-semibold text-sm
              transition-all duration-200 border flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95
              ${isGpsActive
                ? 'bg-forest-950 text-neutral-0 border-forest-950 shadow-sm'
                : 'bg-forest-50 text-forest-800 border-forest-200 hover:border-forest-400 hover:bg-forest-100'
              }
            `}
          >
            <Navigation className={`w-4 h-4 ${isGpsActive ? 'text-lime-300 animate-spin' : 'text-forest-700'}`} />
            <span>Autour de moi (GPS)</span>
          </button>
          {CATEGORIES.map((category) => {
            const isActive = selected.type === category.type && selected.sousType === category.sousType;

            // Construction de l'URL avec type et sousType
            const searchParams = new URLSearchParams();
            if (category.type) searchParams.set('type', category.type);
            if (category.sousType) searchParams.set('sousType', category.sousType);
            const href = searchParams.toString() ? `/explorer?${searchParams.toString()}` : '/explorer';

            return (
              <Link
                key={`${category.type}-${category.sousType}`}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  setSelected({ type: category.type, sousType: category.sousType });
                }}
                className={`
                  flex-shrink-0 px-6 py-2.5 rounded-[var(--radius-pill)] font-semibold text-sm
                  transition-all duration-200 border whitespace-nowrap
                  ${isActive
                    ? 'bg-forest-950 text-white border-forest-950 shadow-sm'
                    : 'bg-background-card text-foreground border-border hover:border-forest-300 hover:bg-forest-50'
                  }
                `}
              >
                {category.label}
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
