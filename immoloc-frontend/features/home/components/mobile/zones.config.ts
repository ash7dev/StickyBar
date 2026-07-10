export type ZoneIconType = 'waves' | 'building' | 'landmark' | 'tree' | 'sun' | 'anchor';

export interface ZoneConfig {
  ville:    string;
  label:    string;
  zone:     string;
  icon:     ZoneIconType;
  iconColor: string;
  gradient: string;
  glow:     string;
}

export const HOT_ZONES: ZoneConfig[] = [
  {
    ville:     'Almadies',
    label:     'Almadies',
    zone:      'Dakar',
    icon:      'waves',
    iconColor: '#93c5fd',
    gradient:  'linear-gradient(145deg, #020F4A 0%, #0C49C0 55%, #2076F5 100%)',
    glow:      'rgba(77,150,255,0.35)',
  },
  {
    ville:     'Saly',
    label:     'Saly',
    zone:      'Petite Côte',
    icon:      'sun',
    iconColor: '#6ee7b7',
    gradient:  'linear-gradient(145deg, #052e16 0%, #065f46 55%, #10b981 100%)',
    glow:      'rgba(16,185,129,0.35)',
  },
  {
    ville:     'Ngor',
    label:     'Ngor',
    zone:      'Dakar',
    icon:      'anchor',
    iconColor: '#bfdbfe',
    gradient:  'linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #2563eb 100%)',
    glow:      'rgba(37,99,235,0.35)',
  },
  {
    ville:     'Mermoz',
    label:     'Mermoz',
    zone:      'Dakar',
    icon:      'building',
    iconColor: '#c4b5fd',
    gradient:  'linear-gradient(145deg, #1a0533 0%, #5b21b6 55%, #7c3aed 100%)',
    glow:      'rgba(124,58,237,0.35)',
  },
  {
    ville:     'Ngaparou',
    label:     'Ngaparou',
    zone:      'Petite Côte',
    icon:      'tree',
    iconColor: '#d8b4fe',
    gradient:  'linear-gradient(145deg, #2e1065 0%, #6d28d9 55%, #8b5cf6 100%)',
    glow:      'rgba(139,92,246,0.35)',
  },
  {
    ville:     'Saint-Louis',
    label:     'Saint-Louis',
    zone:      'Nord',
    icon:      'landmark',
    iconColor: '#fdba74',
    gradient:  'linear-gradient(145deg, #431407 0%, #9a3412 55%, #ea580c 100%)',
    glow:      'rgba(234,88,12,0.35)',
  },
  {
    ville:     'Plateau',
    label:     'Plateau',
    zone:      'Dakar',
    icon:      'building',
    iconColor: '#99f6e4',
    gradient:  'linear-gradient(145deg, #0c1a1a 0%, #134e4a 55%, #0d9488 100%)',
    glow:      'rgba(13,148,136,0.35)',
  },
  {
    ville:     'Cap Skirring',
    label:     'Cap Skirring',
    zone:      'Casamance',
    icon:      'waves',
    iconColor: '#fcd34d',
    gradient:  'linear-gradient(145deg, #451a03 0%, #92400e 55%, #d97706 100%)',
    glow:      'rgba(217,119,6,0.35)',
  },
  {
    ville:     'Yoff',
    label:     'Yoff',
    zone:      'Dakar',
    icon:      'tree',
    iconColor: '#bbf7d0',
    gradient:  'linear-gradient(145deg, #052e16 0%, #166534 55%, #16a34a 100%)',
    glow:      'rgba(22,163,74,0.35)',
  },
  {
    ville:     'Somone',
    label:     'Somone',
    zone:      'Petite Côte',
    icon:      'sun',
    iconColor: '#f5d0fe',
    gradient:  'linear-gradient(145deg, #4a044e 0%, #86198f 55%, #c026d3 100%)',
    glow:      'rgba(192,38,211,0.35)',
  },
];
