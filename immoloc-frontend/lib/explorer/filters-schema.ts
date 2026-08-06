import { z } from 'zod';

/**
 * Types de logement valides
 */
export const TYPE_LOGEMENT_VALUES = ['villa', 'appartement', 'chambre', 'autre'] as const;

/**
 * Options de tri disponibles
 */
export const TRI_VALUES = ['pertinence', 'prix_asc', 'prix_desc', 'note_desc', 'recent'] as const;

/**
 * Schéma de validation pour les filtres de recherche
 * Parse et valide les searchParams côté serveur
 * Un paramètre invalide est ignoré, jamais une erreur 500
 */
export const filtersSchema = z.object({
  // Lieu & GPS
  ville: z.string().min(1).optional(),
  quartier: z.string().min(1).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  rayon: z.coerce.number().min(1).max(500).optional(),

  // Offre Spéciale
  derniereMinute: z.literal('1').optional(),

  // Dates (format YYYY-MM-DD)
  arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Capacité
  voyageurs: z.coerce.number().int().min(1).max(16).optional(),

  // Type (peut être multiple, séparé par virgule, insensible à la casse)
  type: z.string()
    .transform(str => str.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))
    .pipe(z.array(z.enum(TYPE_LOGEMENT_VALUES)))
    .optional(),

  // Sous-type (ex: "Villa avec piscine")
  sousType: z.string().min(1).optional(),

  // Prix (FCFA / nuit)
  min: z.coerce.number().int().min(0).optional(),
  max: z.coerce.number().int().min(0).optional(),

  // Vérification agent
  verifie: z.literal('1').optional(),

  // Tri
  tri: z.enum(TRI_VALUES).default('pertinence'),

  // Bounding box pour la carte (minLng,minLat,maxLng,maxLat)
  bbox: z.string()
    .transform(str => str.split(',').map(Number))
    .pipe(z.tuple([z.number(), z.number(), z.number(), z.number()]))
    .optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * Type inféré du schéma
 */
export type SearchFilters = z.infer<typeof filtersSchema>;

/**
 * Type pour les filtres bruts venant de l'URL
 */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Parse les searchParams avec gestion d'erreur gracieuse
 * Les paramètres invalides sont ignorés silencieusement
 */
export function parseSearchParams(raw: RawSearchParams): SearchFilters {
  // Convertir les tableaux en strings (cas des paramètres dupliqués)
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }

  // Alias sort -> tri
  if (normalized.sort && !normalized.tri) {
    if (normalized.sort === 'popular') normalized.tri = 'pertinence';
    else if (normalized.sort === 'newest') normalized.tri = 'recent';
    else if (normalized.sort === 'rated') normalized.tri = 'note_desc';
  }

  // Parser avec safeParse pour éviter les erreurs
  const result = filtersSchema.safeParse(normalized);

  if (result.success) {
    return result.data;
  }

  // En cas d'erreur, logguer et retourner les valeurs par défaut
  console.warn('[filters-schema] Invalid search params:', result.error.issues);
  return filtersSchema.parse({});
}

/**
 * Compte le nombre de filtres actifs (hors tri et page)
 */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;

  if (filters.ville) count++;
  if (filters.quartier) count++;
  if (filters.lat !== undefined && filters.lng !== undefined) count++;
  if (filters.derniereMinute) count++;
  if (filters.arrivee && filters.depart) count++;
  if (filters.voyageurs) count++;
  if (filters.type && filters.type.length > 0) count++;
  if (filters.sousType) count++;
  if (filters.min !== undefined || filters.max !== undefined) count++;
  if (filters.verifie) count++;
  if (filters.bbox) count++;

  return count;
}

/**
 * Formatte les filtres pour l'affichage dans les pastilles
 */
export function formatFilterValue(key: keyof SearchFilters, value: unknown): string {
  switch (key) {
    case 'ville':
      return String(value);

    case 'arrivee':
    case 'depart':
      // Format court : "12 août"
      if (typeof value === 'string') {
        const date = new Date(value);
        return new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric',
          month: 'short'
        }).format(date);
      }
      return '';

    case 'voyageurs':
      return `${value} voyageur${Number(value) > 1 ? 's' : ''}`;

    case 'type':
      if (Array.isArray(value) && value.length > 0) {
        const labels: Record<string, string> = {
          villa: 'Villa',
          appartement: 'Appart',
          chambre: 'Chambre',
          autre: 'Autre',
        };
        const formatted = value.map(t => labels[t] || t);

        // Tronquer si trop long
        if (formatted.length > 2) {
          return `${formatted.slice(0, 2).join(', ')} +${formatted.length - 2}`;
        }
        return formatted.join(', ');
      }
      return '';

    case 'min':
    case 'max':
      if (typeof value === 'number') {
        // Format court : "50k" si >= 1000, sinon nombre complet
        if (value >= 1000) {
          return `${Math.round(value / 1000)}k`;
        }
        return value.toLocaleString('fr-FR');
      }
      return '';

    case 'tri':
      const triLabels: Record<string, string> = {
        pertinence: 'Pertinence',
        prix_asc: 'Prix croissant',
        prix_desc: 'Prix décroissant',
        note_desc: 'Mieux notés',
        recent: 'Plus récents',
      };
      return triLabels[String(value)] || String(value);

    default:
      return String(value);
  }
}

/**
 * Construit le libellé complet d'une pastille de filtre
 */
export function buildFilterPillLabel(filters: SearchFilters): {
  ville?: string;
  dates?: string;
  voyageurs?: string;
  type?: string;
  prix?: string;
  verifie?: string;
} {
  const labels: Record<string, string> = {};

  if (filters.ville) {
    labels.ville = filters.ville;
  }

  if (filters.arrivee && filters.depart) {
    const start = formatFilterValue('arrivee', filters.arrivee);
    const end = formatFilterValue('depart', filters.depart);
    labels.dates = `${start} – ${end}`;
  }

  if (filters.voyageurs) {
    labels.voyageurs = formatFilterValue('voyageurs', filters.voyageurs);
  }

  if (filters.type && filters.type.length > 0) {
    labels.type = formatFilterValue('type', filters.type);
  }

  if (filters.min !== undefined && filters.max !== undefined) {
    labels.prix = `${formatFilterValue('min', filters.min)} – ${formatFilterValue('max', filters.max)} F`;
  } else if (filters.min !== undefined) {
    labels.prix = `≥ ${formatFilterValue('min', filters.min)} F`;
  } else if (filters.max !== undefined) {
    labels.prix = `≤ ${formatFilterValue('max', filters.max)} F`;
  }

  if (filters.verifie) {
    labels.verifie = 'Vérifiés';
  }

  return labels;
}
