// =============================================================================
// Klef — Contrats de Données Partagés (Web & Mobile API Contracts)
// Source de vérité unique pour NestJS, Next.js Web App et Expo Mobile App
// =============================================================================

// ── Rôles & Statuts Généraux ──────────────────────────────────────────────────

export type UserRole = 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN' | 'GESTIONNAIRE';

export type StatutKyc =
  | 'NON_VERIFIE'
  | 'EN_ATTENTE'
  | 'VERIFIE'
  | 'REJETE'
  | 'A_RENOUVELER'
  | 'SUSPENDU';

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ARCHIVED';

export type ListingType =
  | 'APPARTEMENT'
  | 'VILLA'
  | 'CHAMBRE'
  | 'AUTRES';

export type PhotoCategorie =
  | 'SALON'
  | 'CHAMBRE'
  | 'CUISINE'
  | 'SALLE_DE_BAIN'
  | 'TERRASSE'
  | 'VUE'
  | 'ENTREE'
  | 'PISCINE'
  | 'AUTRE';

// ── Authentification ─────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  userId: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  dateNaissance?: string | null;
  activeRole: UserRole;
  estProprietaire: boolean;
  estGestionnaire?: boolean;
  profileCompleted: boolean;
  phoneVerified: boolean;
  statutKyc: StatutKyc;
  avatarUrl?: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Logements (Listings) ─────────────────────────────────────────────────────

export interface ListingPhoto {
  id: string;
  url: string;
  publicId?: string | null;
  categorie: PhotoCategorie;
  estPrincipale: boolean;
  position: number;
}

export interface Equipement {
  id: string;
  nom: string;
  categorie: string;
}

export interface TarifPersonne {
  personnesMin: number;
  personnesMax: number;
  supplement: number;
}

export interface TarifNuit {
  nuitsMin: number;
  nuitsMax: number | null;
  prix: number;
}

export interface CardListing {
  id: string;
  titre: string;
  type: ListingType;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  prixBase: number;
  capaciteMax: number;
  note?: number | null;
  totalSejours?: number | null;
  createdAt?: string | null;
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
  photos: { url: string; estPrincipale?: boolean; categorie?: string }[];
}

export interface ListingDetail {
  id: string;
  titre: string;
  description: string;
  type: ListingType;
  sousType: string | null;
  statut: ListingStatus;

  surface: number | null;
  nombreChambres: number;
  nombreSallesBain: number;
  nombrePieces: number;
  capaciteMax: number;
  personnesBase: number;

  ville: string;
  quartier: string | null;
  adresse: string;
  latitude?: number | null;
  longitude?: number | null;

  prixBase: number;
  nuitesMinimum: number;
  acomptePourcentage?: number;
  tarifsPersonnes: TarifPersonne[];
  tarifsNuits: TarifNuit[];

  ageMin: number | null;
  reglesMaison: string | null;
  instructionsAcces: string | null;
  nomReseauWifi?: string | null;
  codeWifi?: string | null;

  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
  photos: ListingPhoto[];
  equipements: Equipement[];

  note: number;
  totalAvis: number;
  totalSejours: number;

  createdAt: string;
  updatedAt: string;
}

// ── Réservations ─────────────────────────────────────────────────────────────

export type StatutReservation =
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'EXPIRED';

export type FournisseurPaiement = 'PAYDUNYA' | 'WAVE' | 'ORANGE_MONEY' | 'STRIPE';
export type StatutPaiement = 'EN_ATTENTE' | 'CONFIRME' | 'ECHOUE' | 'REMBOURSE' | 'GELE';
export type TypeEtatLieu = 'CHECKIN' | 'CHECKOUT';
export type RoleUpload = 'PROPRIO' | 'LOCATAIRE';

export interface PricePreviewResponse {
  nbNuits: number;
  nbPersonnes: number;
  prixBase: number;
  supplementPersonnes: number;
  prixNuitEffectif: number;
  reductionNuits: number;
  totalBase: number;
  tauxCommission: number;
  montantCommission: number;
  totalLocataire: number;
  netProprietaire: number;
}

export interface CreateReservationPayload {
  logementId: string;
  dateDebut: string;
  dateFin: string;
  nbPersonnes: number;
  fournisseur?: FournisseurPaiement;
  typePaiement?: 'FULL' | 'DEPOSIT';
  returnUrl?: string; // Support DeepLink Natif Mobile (klef://...)
}

export interface ReservationDetail {
  id: string;
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;

  prixBase: number;
  supplementPersonnes: number;
  prixNuitEffectif: number;
  reductionNuits: number;
  totalBase: number;
  tauxCommission: number;
  montantCommission: number;
  totalLocataire: number;
  netProprietaire: number;
  typePaiement?: 'DEPOSIT' | 'FULL' | string | null;
  montantAcompte?: number | null;
  montantSoldeRestant?: number | null;

  statut: StatutReservation;
  delaiConfirmation: string;
  confirmeeLe?: string | null;
  checkinProprioLe?: string | null;
  checkinLocataireLe?: string | null;
  checkoutProprioLe?: string | null;
  checkoutLocataireLe?: string | null;
  creeLe: string;

  contratUrl?: string | null;

  locataire: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string | null;
    avatarUrl?: string | null;
    statutKyc: StatutKyc;
    noteLocataire: number;
  };
  proprietaire: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string | null;
    avatarUrl?: string | null;
  };
  logement: {
    id: string;
    titre: string;
    type: ListingType;
    ville: string;
    quartier?: string | null;
    adresse: string;
    photos: Array<{ url: string; estPrincipale: boolean }>;
  };
  paiement?: {
    montant: number;
    fournisseur: FournisseurPaiement;
    statut: StatutPaiement;
  } | null;
}

// ── Portefeuille & Finance ────────────────────────────────────────────────────

export type TransactionType =
  | 'CREDIT_LOCATION'
  | 'DEBIT_PENALITE'
  | 'DEBIT_RETRAIT'
  | 'DEBIT_DETTE';

export type MethodeRetrait = 'WAVE' | 'ORANGE_MONEY' | 'VIREMENT';
export type StatutRetrait = 'EN_ATTENTE' | 'VALIDE' | 'EFFECTUE' | 'REJETE';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  montant: number;
  sens: 'CREDIT' | 'DEBIT';
  soldeApres: number;
  description: string | null;
  reservationId: string | null;
  creeLe: string;
}

export interface WalletData {
  id?: string;
  soldeDisponible: number;
  dettePenalites: number;
  transactions: WalletTransaction[];
}

export interface WithdrawalPayload {
  montant: number;
  methode: MethodeRetrait;
  destinataire: string;
}

// ── Utilities Partagés ────────────────────────────────────────────────────────

/** Formate un montant numérique en FCFA de façon constante */
export function formatFCFA(n: number | string | null | undefined): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (num === null || num === undefined || isNaN(num)) return '0 FCFA';
  return `${Math.round(num).toLocaleString('fr-FR')} FCFA`;
}

/** Calcule la commission Klef (7% par défaut) et le net propriétaire */
export function calculCommissionKlef(prixBase: number, tauxPct: number = 7) {
  const montantCommission = Math.round(prixBase * (tauxPct / 100));
  const netProprietaire = Math.max(0, Math.round(prixBase - montantCommission));
  return {
    prixBase,
    tauxCommission: tauxPct / 100,
    montantCommission,
    netProprietaire,
  };
}
