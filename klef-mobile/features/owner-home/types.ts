/** Contrat de GET /dashboard/owner/overview (identique au web : lib/nestjs/types.ts). */

export interface OwnerOccupancy {
  bookedNights: number;
  availableNights: number;
  /** 0 à 1 */
  rate: number;
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
    monthly: Array<{ month: string; revenue: number; stays: number }>;
  };
  occupancy: OwnerOccupancy & { windowDays: number };
  logements: Array<{
    id: string;
    titre: string;
    ville: string;
    statut: string;
    photoUrl: string | null;
    occupancy: OwnerOccupancy;
    revenueNet: number;
    netPerNight: number | null;
  }>;
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
