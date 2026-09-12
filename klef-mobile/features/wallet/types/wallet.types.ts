export interface WalletTransaction {
  id: string;
  type: 'CREDIT_LOCATION' | 'DEBIT_RETRAIT' | 'DEBIT_PENALITE' | 'DEBIT_DETTE' | 'REMBOURSEMENT' | string;
  montant: number;
  sens: 'CREDIT' | 'DEBIT';
  soldeApres: number;
  description?: string;
  reservationId?: string;
  creeLe: string;
  reservation?: {
    typePaiement: string;
    montantAcompte: number;
    netProprietaire: number;
    montantSoldeRestant: number;
  } | null;
}

export interface WalletData {
  id?: string;
  soldeDisponible: number;
  soldeProprietaire?: number;
  soldeLocataire?: number;
  dettePenalites: number;
  misAJourLe?: string;
  transactions: WalletTransaction[];
}

export interface WithdrawalRequest {
  montant: number;
  moyenPaiement: 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY' | 'VIREMENT_BANCAIRE';
  numeroTelephone?: string;
  nomCompte?: string;
}
