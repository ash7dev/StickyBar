export interface ReservationLogement {
  id: string;
  titre: string;
  type: string;
  ville: string;
  quartier?: string | null;
  adresse?: string | null;
  photos: Array<{ url: string; estPrincipale?: boolean }>;
}

export interface ReservationProprietaire {
  id: string;
  prenom: string;
  nom: string;
  telephone?: string | null;
  avatarUrl?: string | null;
}

export interface ReservationPaiement {
  montant: number;
  fournisseur: string;
  statut: string;
  confirmeLeWebhook?: string | null;
}

export interface PhotoEtatLieu {
  id: string;
  type: string;
  uploadePar: string;
  url: string;
  categorie: string;
  creeLe: string;
}

export interface HistoriqueReservation {
  id: string;
  ancienStatut?: string | null;
  nouveauStatut: string;
  modifiePar?: string | null;
  raison?: string | null;
  modifieLe: string;
}

export interface LitigeReservation {
  id: string;
  statut: string;
  declarePar?: string;
  motif: string;
  description: string;
  creeLe: string;
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
  typePaiement?: string | null;
  montantAcompte?: number | null;
  montantSoldeRestant?: number | null;
  statut: 'PENDING' | 'PAID' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'EXPIRED' | string;
  politiqueAppliquee?: string | null;
  delaiConfirmation?: string;
  heureDebut?: string | null;
  heureFin?: string | null;
  confirmeeLe?: string | null;
  checkinProprioLe?: string | null;
  checkinLocataireLe?: string | null;
  checkoutProprioLe?: string | null;
  checkoutLocataireLe?: string | null;
  closeLe?: string | null;
  annuleLe?: string | null;
  raisonAnnulation?: string | null;
  absenceSignaleeLe?: string | null;
  creeLe: string;
  contratUrl?: string | null;
  checkinHeure?: string | null;
  checkoutHeureInput?: string | null;
  canCheckinProprio?: boolean;
  canCheckoutProprio?: boolean;
  canSignalNoshow?: boolean;
  avisDonneProprio?: boolean;
  mandatType?: 'DIRECT' | 'DELEGUE' | string | null;
  locataire?: {
    id: string;
    prenom: string;
    nom: string;
    telephone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    estVerifie?: boolean;
    terangaBadge?: 'OR' | 'ARGENT' | 'BRONZE' | string | null;
    noteMoyenne?: number | null;
    nbAvis?: number | null;
  } | null;
  proprietaire?: ReservationProprietaire | null;
  logement?: ReservationLogement | null;
  paiement?: ReservationPaiement | null;
  photosEtatLieu?: PhotoEtatLieu[];
  historique?: HistoriqueReservation[];
  litige?: LitigeReservation | null;
}

