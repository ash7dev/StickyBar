import { z } from 'zod';

// ── Enums ────────────────────────────────────────────────────────────────────

export const TYPE_LOGEMENT = [
  'APPARTEMENT',
  'VILLA',
  'CHAMBRE',
  'AUTRES',
] as const;

export type TypeLogement = (typeof TYPE_LOGEMENT)[number];

export const SOUS_TYPES_PAR_CATEGORIE: Record<TypeLogement, readonly string[]> = {
  APPARTEMENT: ['Studio', 'Appartement F2', 'Appartement F3', 'Appartement F4+', 'Penthouse', 'Loft'],
  VILLA:       ['Villa simple', 'Villa avec piscine', 'Villa bord de mer', 'Villa de luxe', 'Villa familiale', 'Villa pour événement'],
  CHAMBRE:     ['Chambre meublée', 'Suite meublée'],
  AUTRES:      ['Résidence hôtelière', 'Hôtel', 'Auberge / Gîte', 'Maison entière', 'Duplex', 'Riad / Maison traditionnelle', 'Cabane / Logement atypique', 'Résidence étudiante'],
};

export const CATEGORIE_PHOTO = [
  'SALON',
  'CHAMBRE',
  'CUISINE',
  'SALLE_DE_BAIN',
  'TERRASSE',
  'VUE',
  'ENTREE',
  'PISCINE',
  'AUTRE',
] as const;

export const ZONES_SENEGAL = {
  'Dakar': [
    'Almadies', 'Ngor', 'Mermoz', 'Mamelles', 'Point E', 'Maristes',
    'Cité Keur Gorgui', 'Nord Foire', 'Ouest Foire', 'Sacré-Cœur',
    'Plateau', 'Yoff', 'Ouakam', 'Fann Résidence', 'Liberté 6', 'Hann Maristes',
  ],
  'Petite Côte': [
    'Saly', 'Ngaparou', 'Somone', 'Mbour', 'Warang',
    'Nianing', 'Popenguine', 'Pointe Sarène',
  ],
  'Autres destinations': [
    'Saint-Louis', 'Cap Skirring', 'Toubab Dialaw', 'Lac Rose',
  ],
} as const;

export type ZoneSenegal = keyof typeof ZONES_SENEGAL;

export function getZoneFromVille(ville: string): ZoneSenegal | undefined {
  return (Object.entries(ZONES_SENEGAL) as [ZoneSenegal, readonly string[]][])
    .find(([, villes]) => villes.includes(ville as never))?.[0];
}

// ── Step 1 : Le bien ─────────────────────────────────────────────────────────

export const stepBienSchema = z.object({
  type: z.enum(TYPE_LOGEMENT, { required_error: 'Le type de logement est requis' }),
  sousType: z.string().min(1, 'Veuillez préciser le type de bien'),
  nombreChambres: z.coerce.number().min(0).max(20).default(1),
  nombreSallesBain: z.coerce.number().min(0).max(10).default(1),
  nombrePieces: z.coerce.number().min(1).max(30).default(1),
  capaciteMax: z.coerce.number().min(1, 'Au moins 1 personne').max(50),
  ville: z.string().min(1, 'La ville est requise'),
  adresse: z.string().min(5, "L'adresse est requise"),
});

export type StepBienInput = z.infer<typeof stepBienSchema>;

// ── Step 2 : Votre annonce ───────────────────────────────────────────────────

export const stepAnnonceSchema = z.object({
  titre: z
    .string()
    .min(10, 'Le titre doit contenir au moins 10 caractères')
    .max(100, 'Le titre ne doit pas dépasser 100 caractères'),
  description: z
    .string()
    .min(50, 'La description doit contenir au moins 50 caractères')
    .max(2000, 'La description ne doit pas dépasser 2000 caractères'),
  prixBase: z.coerce
    .number()
    .min(5000, 'Prix minimum : 5 000 FCFA / nuit')
    .max(10_000_000, 'Prix maximum : 10 000 000 FCFA / nuit'),
  nuitesMinimum: z.coerce.number().min(1).default(1),
});

export type StepAnnonceInput = z.infer<typeof stepAnnonceSchema>;

// ── Step 3 : Équipements ─────────────────────────────────────────────────────

export const EQUIPEMENTS_PAR_CATEGORIE = {
  CONFORT: [
    'Climatisation',
    'Ventilateur',
    'Chauffage',
    'Lit double',
    'Canapé-lit',
    'Draps fournis',
    'Serviettes fournies',
    'Fer à repasser',
    'Espace de travail',
    'Penderie / Placard',
  ],
  CUISINE: [
    'Cuisine équipée',
    'Réfrigérateur',
    'Micro-ondes',
    'Plaque de cuisson',
    'Four',
    'Lave-vaisselle',
    'Cafetière / Bouilloire',
    'Ustensiles de cuisine',
    'Vaisselle',
    'Machine à laver',
  ],
  CONNECTIVITE: [
    'WiFi haut débit',
    'Télévision',
    'Netflix / Streaming',
    'Enceinte Bluetooth',
    'Prises USB',
    'Chargeur universel',
  ],
  SECURITE: [
    'Détecteur de fumée',
    'Extincteur',
    'Trousse de secours',
    'Coffre-fort',
    'Serrure connectée',
    'Gardien / Concierge',
    'Caméras extérieures',
    'Interphone',
  ],
  EXTERIEUR: [
    'Parking privé',
    'Piscine',
    'Jardin',
    'Terrasse / Balcon',
    'Barbecue',
    'Salon de jardin',
    'Vue mer',
    'Accès plage',
    'Rooftop',
  ],
  ACCESSIBILITE: [
    'Ascenseur',
    'Accès PMR',
    'Douche italienne',
    'Plain-pied',
    'Rampe d\'accès',
  ],
} as const;

export const CATEGORIE_EQUIPEMENT_LABELS: Record<string, string> = {
  CONFORT: 'Confort',
  CUISINE: 'Cuisine & Électroménager',
  CONNECTIVITE: 'Connectivité',
  SECURITE: 'Sécurité',
  EXTERIEUR: 'Extérieur & Loisirs',
  ACCESSIBILITE: 'Accessibilité',
};

export const stepEquipementsSchema = z.object({
  equipements: z.array(z.string()).min(1, 'Sélectionnez au moins 1 équipement'),
});

export type StepEquipementsInput = z.infer<typeof stepEquipementsSchema>;

// ── Step 4 : Conditions & Règles ─────────────────────────────────────────────

export const stepConditionsSchema = z.object({
  reglesMaison: z.string().max(1000).optional(),
});

export type StepConditionsInput = z.infer<typeof stepConditionsSchema>;

// ── Step 5 : Photos ──────────────────────────────────────────────────────────

export const photoItemSchema = z.object({
  file: z.instanceof(File).optional(),
  previewUrl: z.string(),   // blob URL for instant local preview
  url: z.string().optional(),       // Cloudinary URL after upload
  publicId: z.string().optional(),  // Cloudinary public_id after upload
  categorie: z.enum(CATEGORIE_PHOTO),
  estPrincipale: z.boolean().default(false),
  position: z.number(),
});

export const stepPhotosSchema = z.object({
  photos: z
    .array(photoItemSchema)
    .min(5, 'Minimum 5 photos requises')
    .max(10, 'Maximum 10 photos'),
});

export type PhotoItem = z.infer<typeof photoItemSchema>;
export type StepPhotosInput = z.infer<typeof stepPhotosSchema>;

// ── Schema complet ───────────────────────────────────────────────────────────

export const listingFormSchema = stepBienSchema
  .merge(stepAnnonceSchema)
  .merge(stepEquipementsSchema)
  .merge(stepConditionsSchema)
  .merge(stepPhotosSchema);

export type ListingFormInput = z.infer<typeof listingFormSchema>;

// ── Legacy types (kept for dashboard tarification avancée) ───────────────────

export const tarifPersonnesSchema = z.object({
  personnesMin: z.coerce.number().int().min(1),
  personnesMax: z.coerce.number().int().min(1),
  supplement: z.coerce.number().min(0),
});
export type TarifPersonnes = z.infer<typeof tarifPersonnesSchema>;

export const tarifNuitsSchema = z.object({
  nuitsMin: z.coerce.number().int().min(1),
  nuitsMax: z.coerce.number().int().nullable(),
  prix: z.coerce.number().min(0),
});
export type TarifNuits = z.infer<typeof tarifNuitsSchema>;
