// ── Paixi — Types API centralisés ──────────────────────────────────────────
// Une seule source de vérité pour toutes les interfaces request/response NestJS.

// ── Primitives partagées ──────────────────────────────────────────────────────

export type UserRole = 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN' | 'GESTIONNAIRE';

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
  regimeElectricite?: string | null;
  detailsElectricite?: string | null;
  photos: ListingPhoto[];
  equipements: Equipement[];
  tarifsNuits: TarifNuit[];
  tarifsPersonnes: TarifPersonne[];
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
    telephone?: string | null;
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
  dureeMinNuits?: number;
  pourcentageReduction?: number;
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
  regimeElectricite?: string | null;
  detailsElectricite?: string | null;

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
    gestionnaireId?: string | null;
    gestionnaire?: {
      id: string;
      prenom: string;
      nom: string;
      telephone?: string | null;
      email?: string | null;
      avatarUrl?: string | null;
    } | null;
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

/** Statut d'un logement tel que l'API le renvoie (enum Prisma StatutLogement). */
export type StatutLogement = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'PAUSED' | 'REJECTED' | 'SUSPENDED';

// ── Calendrier propriétaire (multi-logements) ────────────────────────────────
// Jours au format `YYYY-MM-DD`. Les plages sont semi-ouvertes : `end` est exclu
// (pour une réservation, c'est le jour du départ).

export interface OwnerCalendarLogement {
  id: string;
  titre: string;
  ville: string;
  statut: StatutLogement;
  prixBase: number;
  photoUrl: string | null;
}

export interface OwnerCalendarReservationEvent {
  kind: 'RESERVATION';
  id: string;
  logementId: string;
  start: string;
  end: string;
  statut: StatutReservation;
  nbNuits: number;
  nbPersonnes: number;
  netProprietaire: number;
  locataire: { prenom: string; nomInitiale: string; avatarUrl: string | null };
}

export interface OwnerCalendarBlockEvent {
  kind: 'BLOCK';
  id: string;
  logementId: string;
  start: string;
  end: string;
  motif: string | null;
}

export type OwnerCalendarEvent = OwnerCalendarReservationEvent | OwnerCalendarBlockEvent;

export interface OwnerCalendarResponse {
  range: { start: string; end: string };
  logements: OwnerCalendarLogement[];
  events: OwnerCalendarEvent[];
}

export interface CreateOwnerBlockPayload {
  logementIds: string[];
  dateDebut: string;
  /** Jour de fin exclu */
  dateFin: string;
  motif?: string;
}

// ── Accueil propriétaire (GET /dashboard/owner/overview) ─────────────────────

export interface OwnerOccupancy {
  bookedNights: number;
  availableNights: number;
  /** 0 à 1 */
  rate: number;
}

export interface OwnerOverviewLogement {
  id: string;
  titre: string;
  ville: string;
  statut: StatutLogement;
  photoUrl: string | null;
  /** Mois en cours */
  occupancy: OwnerOccupancy;
  revenueNet: number;
  netPerNight: number | null;
}

export interface OwnerUpcomingPayout {
  reservationId: string;
  /** Jour du check-in, quand le séquestre est libéré */
  date: string;
  amount: number;
  locatairePrenom: string;
  logementTitre: string;
}

export interface OwnerOverviewResponse {
  today: string;
  revenue: {
    currentMonth: number;
    previousMonth: number;
    changePct: number | null;
    /** `month` au format `YYYY-MM`, du plus ancien au mois en cours */
    monthly: Array<{ month: string; revenue: number; stays: number }>;
  };
  occupancy: OwnerOccupancy & { windowDays: number };
  logements: OwnerOverviewLogement[];
  wallet: { available: number; upcomingTotal: number; upcomingPayouts: OwnerUpcomingPayout[] };
  reputation: {
    averageRating: number | null;
    totalReviews: number;
    lastReview: {
      note: number;
      commentaire: string | null;
      auteurPrenom: string;
      logementTitre: string | null;
      creeLe: string;
    } | null;
  };
  tips: Array<{
    kind: 'LOW_OCCUPANCY';
    logementId: string;
    logementTitre: string;
    freeNights: number;
    horizonDays: number;
  }>;
}

// ── Revenus propriétaire (GET /dashboard/owner/revenue…) ─────────────────────

export type RevenuePeriod = 'month' | 'quarter' | 'year';

export interface RevenueMetrics {
  revenueNet: number;
  nightsSold: number;
  occupancy: OwnerOccupancy;
  netPerNight: number | null;
  stays: number;
}

export type RevenueTimelineEvent =
  | { kind: 'UPCOMING'; date: string; amount: number; reservationId: string; locatairePrenom: string; logementTitre: string }
  | { kind: 'CREDITED'; date: string; amount: number; reservationId: string | null; locatairePrenom: string | null; logementTitre: string | null }
  | { kind: 'WITHDRAWAL'; date: string; amount: number; methode: string; statut: string };

export interface OwnerRevenueResponse {
  period: RevenuePeriod;
  /** `end` exclu */
  range: { start: string; end: string };
  current: RevenueMetrics;
  previous: RevenueMetrics;
  /** 12 derniers mois, du plus ancien au mois en cours ; `month` = `YYYY-MM` */
  history: Array<RevenueMetrics & { month: string }>;
  historyPreviousYear: Array<{ month: string; revenueNet: number }>;
  logements: Array<{ id: string; titre: string; ville: string; metrics: RevenueMetrics }>;
  wallet: { available: number; escrow: number; withdrawnThisMonth: number };
  timeline: RevenueTimelineEvent[];
}

export interface OwnerStatementResponse {
  month: string;
  range: { start: string; end: string };
  owner: { prenom: string; nom: string };
  stays: Array<{
    reservationId: string;
    arrivee: string;
    nbNuits: number;
    locataire: string;
    logementTitre: string;
    paye: number;
    commission: number;
    net: number;
  }>;
  totals: { paye: number; commission: number; net: number };
  wallet: { opening: number; credits: number; deductions: number; withdrawals: number; refunds: number; closing: number };
}

export interface OwnerTransactionsResponse {
  items: Array<{
    id: string;
    type: TransactionType;
    sens: 'CREDIT' | 'DEBIT';
    montant: number;
    soldeApres: number;
    description: string | null;
    reservationId: string | null;
    creeLe: string;
    /** Trace de validation d'un retrait : aucun mouvement de solde */
    isTrace: boolean;
  }>;
  nextCursor: string | null;
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'CREDIT_LOCATION'
  | 'REMBOURSEMENT'
  | 'DEBIT_PENALITE'
  | 'DEBIT_RETRAIT'
  | 'DEBIT_DETTE';

export type TransactionSens = 'CREDIT' | 'DEBIT';

export type MethodeRetrait = 'WAVE' | 'ORANGE_MONEY' | 'VIREMENT';

export type StatutRetrait = 'EN_ATTENTE' | 'SUSPENDU_POUR_LITIGE' | 'VALIDE' | 'EFFECTUE' | 'REJETE';

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
  soldeGeleLitige?: number;
  soldeRetirable?: number;
  soldeProprietaire?: number;
  soldeLocataire?: number;
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
