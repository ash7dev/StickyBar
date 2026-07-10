import {
  TrendingUp, Star, Sparkles,
  Crown, Layers, Building2, Waves, Gem, Users, PartyPopper,
  BedDouble, Landmark, Home, TreePine, Sun, Anchor,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export type FeedIcon = ComponentType<LucideProps>;

export interface FeedSection {
  id:        string;
  feedId:    string;           // id de la section dans la réponse /listings/feed
  label:     string;
  Icon:      FeedIcon;
  iconColor: string;
  iconBg:    string;
  // Tri client-side sur les données reçues du feed (optionnel)
  sortBy?:   'popular' | 'rated' | 'newest';
  minNote?:  number;
}

/** feedId de la section "type populaire" selon la catégorie active */
export const FEED_ID_BY_TYPE: Record<string, string> = {
  VILLA:       'villas',
  APPARTEMENT: 'appartements',
  CHAMBRE:     'chambres',
  AUTRES:      'maison',
};

/** Sections ranked pour la vue par catégorie */
export const RANKED_SECTIONS: Omit<FeedSection, 'feedId'>[] = [
  { id: 'popular', label: 'Les plus réservés',  Icon: TrendingUp, iconColor: '#ea580c', iconBg: '#fff7ed', sortBy: 'popular' },
  { id: 'rated',   label: 'Les mieux notés',    Icon: Star,       iconColor: '#d97706', iconBg: '#fef3c7', sortBy: 'rated', minNote: 4 },
  { id: 'newest',  label: 'Nouveaux logements', Icon: Sparkles,   iconColor: '#7c3aed', iconBg: '#f3e8ff', sortBy: 'newest' },
];

/** Sections sous-types — feedId = id backend exact */
export const SUBTYPE_SECTIONS: FeedSection[] = [
  { id: 'penthouse',   feedId: 'penthouse',  label: 'Penthouses',            Icon: Crown,       iconColor: '#0284c7', iconBg: '#e0f2fe' },
  { id: 'loft',        feedId: 'loft',       label: 'Lofts',                 Icon: Layers,      iconColor: '#0891b2', iconBg: '#cffafe' },
  { id: 'villa-pool',  feedId: 'villa-pool', label: 'Villas avec piscine',   Icon: Waves,       iconColor: '#0891b2', iconBg: '#cffafe' },
  { id: 'villa-sea',   feedId: 'villa-sea',  label: 'Bord de mer',           Icon: Waves,       iconColor: '#0369a1', iconBg: '#e0f2fe' },
  { id: 'villa-luxe',  feedId: 'villa-luxe', label: 'Villas de luxe',        Icon: Gem,         iconColor: '#7c3aed', iconBg: '#f3e8ff' },
  { id: 'villa-fam',   feedId: 'villa-fam',  label: 'En famille',            Icon: Users,       iconColor: '#16a34a', iconBg: '#dcfce7' },
  { id: 'villa-event', feedId: 'villa-event',label: 'Pour événements',       Icon: PartyPopper, iconColor: '#be185d', iconBg: '#fce7f3' },
  { id: 'suite',       feedId: 'suite',      label: 'Suites',                Icon: BedDouble,   iconColor: '#d97706', iconBg: '#fef3c7' },
  { id: 'maison',      feedId: 'maison',     label: 'Maisons entières',      Icon: Home,        iconColor: '#15803d', iconBg: '#dcfce7' },
  { id: 'riad',        feedId: 'maison',     label: 'Riads & Traditionnels', Icon: Landmark,    iconColor: '#b45309', iconBg: '#fef3c7' },
  { id: 'atypique',    feedId: 'maison',     label: 'Logements atypiques',   Icon: TreePine,    iconColor: '#0f766e', iconBg: '#ccfbf1' },
];

/**
 * Feed curé pour la vue "Toutes catégories".
 * Ordre pensé pour alterner types, thèmes et niveaux de gamme — sans répétition.
 */
export const ALL_FEED_SECTIONS: FeedSection[] = [
  { id: 'all-popular',    feedId: 'popular',      sortBy: 'popular', label: 'Les plus réservés',       Icon: TrendingUp,  iconColor: '#ea580c', iconBg: '#fff7ed' },
  { id: 'all-villas',     feedId: 'villas',       sortBy: 'popular', label: 'Villas en vedette',       Icon: TreePine,    iconColor: '#16a34a', iconBg: '#dcfce7' },
  { id: 'all-apparts',    feedId: 'appartements', sortBy: 'popular', label: 'Appartements en vedette', Icon: Building2,   iconColor: '#0284c7', iconBg: '#e0f2fe' },
  { id: 'all-rated',      feedId: 'rated',        sortBy: 'rated',   label: 'Les mieux notés',         Icon: Star,        iconColor: '#d97706', iconBg: '#fef3c7', minNote: 4 },
  { id: 'all-penthouse',  feedId: 'penthouse',                       label: 'Penthouses',              Icon: Crown,       iconColor: '#0284c7', iconBg: '#e0f2fe' },
  { id: 'all-pool',       feedId: 'villa-pool',                      label: 'Villas avec piscine',     Icon: Waves,       iconColor: '#0891b2', iconBg: '#cffafe' },
  { id: 'all-newest',     feedId: 'newest',       sortBy: 'newest',  label: 'Nouveaux logements',      Icon: Sparkles,    iconColor: '#7c3aed', iconBg: '#f3e8ff' },
  { id: 'all-luxe',       feedId: 'villa-luxe',                      label: 'Villas de luxe',          Icon: Gem,         iconColor: '#7c3aed', iconBg: '#f3e8ff' },
  { id: 'all-loft',       feedId: 'loft',                            label: 'Lofts',                   Icon: Layers,      iconColor: '#0891b2', iconBg: '#cffafe' },
  { id: 'all-chambres',   feedId: 'chambres',     sortBy: 'rated',   label: 'Chambres & Suites',       Icon: BedDouble,   iconColor: '#d97706', iconBg: '#fef3c7' },
  { id: 'all-sea',        feedId: 'villa-sea',                       label: 'Bord de mer',             Icon: Waves,       iconColor: '#0369a1', iconBg: '#e0f2fe' },
  { id: 'all-saly',       feedId: 'zone-saly',                       label: 'À Saly',                  Icon: Sun,         iconColor: '#10b981', iconBg: '#f0fdf4' },
  { id: 'all-famille',    feedId: 'villa-fam',                       label: 'En famille',              Icon: Users,       iconColor: '#16a34a', iconBg: '#dcfce7' },
  { id: 'all-almadies',   feedId: 'zone-almadies',                   label: 'À Almadies',              Icon: Waves,       iconColor: '#3b82f6', iconBg: '#eff6ff' },
  { id: 'all-events',     feedId: 'villa-event',                     label: 'Pour événements',         Icon: PartyPopper, iconColor: '#be185d', iconBg: '#fce7f3' },
  { id: 'all-cap',        feedId: 'zone-cap-skirring',               label: 'À Cap Skirring',          Icon: Waves,       iconColor: '#d97706', iconBg: '#fffbeb' },
  { id: 'all-maison',     feedId: 'maison',                          label: 'Maisons entières',        Icon: Home,        iconColor: '#15803d', iconBg: '#dcfce7' },
  { id: 'all-saint-louis',feedId: 'zone-saint-louis',                label: 'À Saint-Louis',           Icon: Landmark,    iconColor: '#ea580c', iconBg: '#fff7ed' },
  { id: 'all-ngor',       feedId: 'zone-ngor',                       label: 'À Ngor',                  Icon: Anchor,      iconColor: '#2563eb', iconBg: '#eff6ff' },
  { id: 'all-somone',     feedId: 'zone-somone',                     label: 'À Somone',                Icon: Sun,         iconColor: '#c026d3', iconBg: '#fdf4ff' },
];

/** Sections par zone géographique */
export const ZONE_SECTIONS: FeedSection[] = [
  { id: 'zone-almadies',     feedId: 'zone-almadies',     label: 'À Almadies',     Icon: Waves,    iconColor: '#3b82f6', iconBg: '#eff6ff' },
  { id: 'zone-saly',         feedId: 'zone-saly',         label: 'À Saly',         Icon: Sun,      iconColor: '#10b981', iconBg: '#f0fdf4' },
  { id: 'zone-ngor',         feedId: 'zone-ngor',         label: 'À Ngor',         Icon: Anchor,   iconColor: '#2563eb', iconBg: '#eff6ff' },
  { id: 'zone-mermoz',       feedId: 'zone-mermoz',       label: 'À Mermoz',       Icon: Building2,iconColor: '#7c3aed', iconBg: '#faf5ff' },
  { id: 'zone-ngaparou',     feedId: 'zone-ngaparou',     label: 'À Ngaparou',     Icon: TreePine, iconColor: '#8b5cf6', iconBg: '#faf5ff' },
  { id: 'zone-saint-louis',  feedId: 'zone-saint-louis',  label: 'À Saint-Louis',  Icon: Landmark, iconColor: '#ea580c', iconBg: '#fff7ed' },
  { id: 'zone-plateau',      feedId: 'zone-plateau',      label: 'Au Plateau',     Icon: Building2,iconColor: '#0d9488', iconBg: '#f0fdfa' },
  { id: 'zone-cap-skirring', feedId: 'zone-cap-skirring', label: 'À Cap Skirring', Icon: Waves,    iconColor: '#d97706', iconBg: '#fffbeb' },
  { id: 'zone-yoff',         feedId: 'zone-yoff',         label: 'À Yoff',         Icon: TreePine, iconColor: '#16a34a', iconBg: '#f0fdf4' },
  { id: 'zone-somone',       feedId: 'zone-somone',       label: 'À Somone',       Icon: Sun,      iconColor: '#c026d3', iconBg: '#fdf4ff' },
];

export const GRID_TITLE: Record<string, string> = {
  all:         'Tous les logements',
  APPARTEMENT: 'Appartements',
  VILLA:       'Villas',
  CHAMBRE:     'Chambres',
  AUTRES:      'Autres logements',
};
