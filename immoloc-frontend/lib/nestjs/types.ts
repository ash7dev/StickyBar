// ── Klef — Types API centralisés ──────────────────────────────────────────
// Une seule source de vérité pour toutes les interfaces request/response NestJS.

// ── Primitives partagées ──────────────────────────────────────────────────────

export type UserRole = 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN';

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

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export type StatutKyc =
  | 'NON_VERIFIE'
  | 'EN_ATTENTE'
  | 'VERIFIE'
  | 'REJETE'
  | 'A_RENOUVELER'
  | 'SUSPENDU';

export interface AuthUser {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  dateNaissance: string | null;
  activeRole: UserRole;
  estProprietaire: boolean;
  hasAnnonce: boolean;
  profileCompleted: boolean;
  phoneVerified: boolean;
  statutKyc: StatutKyc;
  selfieFaceDetected?: boolean;
  selfieMatchScore?: number | null;
}

/** Réponse commune à login email, login OTP et refresh */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  supabaseAccessToken?: string;
  supabaseRefreshToken?: string;
  user: AuthUser;
}

/** Réponse de /auth/refresh */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Réponse de /auth/me */
export type MeResponse = Pick<
  AuthUser,
  'id' | 'activeRole' | 'estProprietaire' | 'hasAnnonce'
>;

// Payloads Auth ───────────────────────────────────────────────────────────────

export interface LoginEmailPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  password: string;
}

export type OtpChannelType = 'SMS' | 'EMAIL';

export interface VerifyRegisterOtpPayload {
  email?: string;
  phone?: string;
  token: string;
  type: OtpChannelType;
}

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  token: string;
}

export interface VerifyCurrentPhoneSendPayload {
  phone: string;
}

export interface VerifyCurrentPhoneConfirmPayload {
  phone: string;
  token: string;
}

export interface VerifyCurrentPhoneResponse {
  telephone: string;
  phoneVerified: boolean;
}

export interface CompleteOnboardingPayload {
  prenom: string;
  nom: string;
  dateNaissance: string;
  phone: string;
  token: string;
}

export type MeSupabaseResponse =
  | AuthTokensResponse
  | {
      onboardingRequired: true;
      profile: {
        email: string | null;
        phone: string | null;
      };
    };

export interface CompleteProfilePayload {
  prenom: string;
  nom: string;
  telephone: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface SwitchRolePayload {
  targetRole: 'LOCATAIRE' | 'PROPRIETAIRE';
}

// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

export interface Equipement {
  id: string;
  nom: string;
  categorie: string;
}

export interface ListingPhoto {
  id: string;
  url: string;
  publicId: string;
  categorie: PhotoCategorie;
  estPrincipale: boolean;
  position: number;
}

export interface Listing {
  id: string;
  titre: string;
  description: string;
  type: ListingType;
  sousType: string | null;
  statut: ListingStatus;
  prixBase: number;
  nuitesMinimum: number;
  acomptePourcentage?: number;
  ageMin: number | null;
  surface: number | null;
  nombreChambres: number | null;
  nombreSallesBain: number | null;
  nombrePieces: number | null;
  capaciteMax: number;
  personnesBase?: number;
  ville: string;
  quartier: string | null;
  adresse: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
  reglesMaison: string | null;
  photos: ListingPhoto[];
  equipements: Equipement[];
  tarifsNuits?: TarifNuit[];
  tarifsPersonnes?: TarifPersonne[];
  note?: number | null;
  totalAvis?: number;
  totalSejours?: number;
  createdAt: string;
  updatedAt: string;
  avis?: Array<{
    id: string;
    note: number;
    commentaire?: string | null;
    creeLe: string;
    auteur: {
      id: string;
      prenom: string;
      nom: string;
      avatarUrl?: string | null;
    };
  }>;
  proprietaire?: {
    id: string;
    prenom: string;
    nom: string;
    avatarUrl?: string | null;
    statutKyc?: StatutKyc;
    noteProprietaire?: number;
    totalAvis?: number;
    totalSejours?: number;
    creeLe?: string;
  };
}

/** Shape minimale retournée par /listings/feed — compatible avec MobileListingGridCard */
export interface CardListing {
  id:            string;
  titre:         string;
  type:          ListingType;
  sousType?:     string | null;
  ville:         string;
  quartier?:     string | null;
  prixBase:      number;
  capaciteMax:   number;
  note?:         number | null;
  totalSejours?: number | null;
  createdAt?:    string | null;
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?:     string | null;
  photos:        { url: string; estPrincipale?: boolean; categorie?: string }[];
}

export interface FeedSectionData {
  id:       string;
  listings: CardListing[];
}

export interface FeedResponse {
  sections: FeedSectionData[];
}

// Payloads Listings ───────────────────────────────────────────────────────────

export interface CreateListingPayload {
  titre: string;
  description: string;
  type: ListingType;
  sousType?: string;
  surface?: number;
  nombreChambres?: number;
  nombreSallesBain?: number;
  nombrePieces?: number;
  capaciteMax: number;
  ville: string;
  quartier?: string;
  adresse?: string;
  prixBase: number;
  nuitesMinimum: number;
  reglesMaison?: string;
}

export type UpdateListingPayload = Partial<CreateListingPayload>;

export interface SearchListingsParams {
  ville?: string;
  quartier?: string;
  type?: ListingType;
  sousType?: string;
  prixMin?: number;
  prixMax?: number;
  capaciteMin?: number;
  derniereMinuteOnly?: boolean;
  dateDebut?: string;
  dateFin?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export interface SearchListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PhotoUploadParams {
  cloudName: string;
  apiKey: string;
  folder: string;
  signature: string;
  timestamp: number;
  uploadPreset?: string;
}

export interface AddPhotoPayload {
  url: string;
  publicId: string;
  categorie: PhotoCategorie;
  estPrincipale: boolean;
  position: number;
}

export interface SetEquipementsPayload {
  equipementIds: string[];
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

export interface SetTarifsPersonnesPayload {
  tarifs: TarifPersonne[];
}

export interface SetTarifsNuitsPayload {
  tarifs: TarifNuit[];
}

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

// ─────────────────────────────────────────────────────────────────────────────
// LISTING DETAIL (owner view — champs enrichis vs Listing)
// ─────────────────────────────────────────────────────────────────────────────

export type ListingStatut =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface ListingDetail {
  id: string;
  titre: string;
  description: string;
  type: ListingType;
  sousType: string | null;
  statut: ListingStatut;

  // Composition
  surface: number | null;
  nombreChambres: number;
  nombreSallesBain: number;
  nombrePieces: number;
  capaciteMax: number;
  personnesBase: number;

  // Localisation
  ville: string;
  quartier: string | null;
  adresse: string;
  latitude?: number | null;
  longitude?: number | null;

  // Tarification
  prixBase: number;
  nuitesMinimum: number;
  acomptePourcentage?: number;
  tarifsPersonnes: TarifPersonne[];
  tarifsNuits: TarifNuit[];

  // Conditions & Livret d'accueil digital
  ageMin: number | null;
  reglesMaison: string | null;
  instructionsAcces: string | null;
  nomReseauWifi?: string | null;
  codeWifi?: string | null;
  instructionsDigicode?: string | null;

  // Statut & modération
  rejectionReason: string | null;
  isFeatured: boolean;

  // Stats
  note: number;
  totalAvis: number;
  totalSejours: number;

  // Médias & équipements
  isInstantBooking?: boolean;
  derniereMinuteActive?: boolean;
  videoUrl?: string | null;
  videoPublicId?: string | null;
  photos: ListingPhoto[];
  equipements: Equipement[];

  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESERVATIONS
// ─────────────────────────────────────────────────────────────────────────────

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
export type StatutLitige = 'EN_ATTENTE' | 'FONDE' | 'NON_FONDE';

export interface ReservationDetail {
  id: string;

  // Dates
  dateDebut: string;
  dateFin: string;
  nbNuits: number;
  nbPersonnes: number;

  // Snapshot tarifaire (figé à la réservation)
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

  // Statut & workflow
  statut: StatutReservation;
  politiqueAppliquee?: string | null;
  delaiConfirmation: string;
  confirmeeLe?: string | null;
  checkinProprioLe?: string | null;
  checkinLocataireLe?: string | null;
  checkoutProprioLe?: string | null;
  checkoutLocataireLe?: string | null;
  absenceSignaleeLe?: string | null;
  absenceConfirmeeLe?: string | null;
  closeLe?: string | null;
  annuleLe?: string | null;
  raisonAnnulation?: string | null;
  creeLe: string;

  // Contrat PDF
  contratUrl?: string | null;

  // Parties
  locataire: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string | null;
    avatarUrl?: string | null;
    statutKyc: StatutKyc;
    noteLocataire: number;
    terangaTier?: string | null;
  };
  proprietaire: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string | null;
    avatarUrl?: string | null;
  };

  // Logement
  logement: {
    id: string;
    titre: string;
    type: ListingType;
    ville: string;
    quartier?: string | null;
    adresse: string;
    photos: Array<{ url: string; estPrincipale: boolean }>;
  };

  // Paiement
  paiement?: {
    montant: number;
    fournisseur: FournisseurPaiement;
    statut: StatutPaiement;
    confirmeLeWebhook?: string | null;
  } | null;

  // Photos état des lieux
  photosEtatLieu: Array<{
    id: string;
    type: TypeEtatLieu;
    uploadePar: RoleUpload;
    url: string;
    categorie: string;
    creeLe: string;
  }>;

  // Historique
  historique: Array<{
    id: string;
    ancienStatut?: string | null;
    nouveauStatut: string;
    modifiePar?: string | null;
    raison?: string | null;
    modifieLe: string;
  }>;

  // Litige
  litige?: {
    id: string;
    statut: StatutLitige;
    declarePar?: string;
    motif: string;
    description: string;
    creeLe: string;
  } | null;
}

// Reservation payloads ────────────────────────────────────────────────────────

export interface CreateReservationPayload {
  logementId: string;
  dateDebut: string;
  dateFin: string;
  nbPersonnes: number;
}

export interface ReservationCreatedResponse {
  reservationId: string;
  paymentUrl?: string | null;
  alreadyProcessed?: boolean;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'CREDIT_LOCATION'
  | 'DEBIT_PENALITE'
  | 'DEBIT_RETRAIT'
  | 'DEBIT_DETTE';

export type TransactionSens = 'CREDIT' | 'DEBIT';

export type MethodeRetrait = 'WAVE' | 'ORANGE_MONEY' | 'VIREMENT';

export type StatutRetrait = 'EN_ATTENTE' | 'VALIDE' | 'EFFECTUE' | 'REJETE';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  montant: number;
  sens: TransactionSens;
  soldeApres: number;
  description: string | null;
  reservationId: string | null;
  creeLe: string;
  reservation?: {
    typePaiement?: string | null;
    montantAcompte?: number | null;
    netProprietaire?: number | null;
    montantSoldeRestant?: number | null;
  } | null;
}

export interface WalletData {
  id?: string;
  soldeDisponible: number;
  dettePenalites: number;
  misAJourLe?: string;
  transactions: WalletTransaction[];
}

export interface WithdrawalPayload {
  montant: number;
  methode: MethodeRetrait;
  destinataire: string;
}

export interface RetraitResponse {
  id: string;
  montant: number;
  methode: MethodeRetrait;
  destinataire: string;
  statut: StatutRetrait;
  demandeeLe: string;
}

// ── Teranga Club ──────────────────────────────────────────────────────────────

export type TerangaTier = 'BRONZE' | 'SILVER' | 'GOLD';

export interface TerangaBadge {
  id: string;
  codeBadge: string;
  libelle: string;
  description: string;
  icone: string;
  debloqueLe: string;
}

export interface TerangaTransaction {
  id: string;
  montantCoins: number;
  type: string;
  description: string;
  reservationId?: string | null;
  soldeApres: number;
  creeLe: string;
}

export interface TerangaAccountData {
  id?: string;
  utilisateurId?: string;
  soldeCoins: number;
  tier: TerangaTier;
  cashbackPct: number;
  gmv12Mois: number;
  nbSejours: number;
  nextTier: TerangaTier | null;
  gmvRemainingForNextTier: number;
  badges: TerangaBadge[];
  transactions: TerangaTransaction[];
  codeParrainage?: string | null;
}

export interface TerangaQuest {
  code: string;
  libelle: string;
  description: string;
  bonusCoins: number;
  icone: string;
  unlocked: boolean;
}

export interface TerangaReferralFilleul {
  id: string;
  prenom: string;
  initiale: string;
  inscritLe: string;
  aReserve: boolean;
}

export interface TerangaReferralInfo {
  codeParrainage: string | null;
  nbFilleuls: number;
  nbFilleulsActifs: number;
  filleuls: TerangaReferralFilleul[];
}
