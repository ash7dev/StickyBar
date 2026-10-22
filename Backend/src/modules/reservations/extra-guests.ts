import { BadRequestException, ConflictException } from '@nestjs/common';
import { supplementPersonnesParNuit } from '../../shared/pricing/supplement-personnes';

/** Les voyageurs en plus se déclarent dès l'ouverture de l'état des lieux d'entrée (4 h avant). */
export const EXTRA_GUESTS_OPENS_BEFORE_MS = 4 * 3_600_000;

export interface ExtraGuestsInput {
  statut: string;
  nbPersonnes: number;
  nbNuits: number;
  dateDebut: Date;
  dateFin: Date;
  logement: {
    capaciteMax: number;
    personnesBase: number;
    tarifsPersonnes: Array<{ personnesMin: number; personnesMax: number; supplement: unknown }>;
  };
  demandesFrais: Array<{ statut: string }>;
}

/**
 * Supplément « voyageurs en plus » : (supplément par nuit pour le nombre réel −
 * celui déjà payé à la réservation) × nuits restantes, selon la grille du logement.
 */
export function computeExtraGuests(reservation: ExtraGuestsInput, nbVoyageurs: number, now: Date = new Date()) {
  if (!['CONFIRMED', 'CHECKED_IN'].includes(reservation.statut)) {
    throw new BadRequestException('Un supplément ne peut être demandé que sur un séjour confirmé ou en cours');
  }
  const start = reservation.dateDebut.getTime();
  const end = reservation.dateFin.getTime();
  if (now.getTime() < start - EXTRA_GUESTS_OPENS_BEFORE_MS || now.getTime() > end) {
    throw new BadRequestException('Les voyageurs en plus se déclarent le jour de l’arrivée ou pendant le séjour');
  }
  if (reservation.demandesFrais.some((f) => f.statut === 'EN_ATTENTE' || f.statut === 'PAYE')) {
    throw new ConflictException('Un supplément voyageurs a déjà été demandé pour ce séjour');
  }

  const prevus = reservation.nbPersonnes;
  const capacite = reservation.logement.capaciteMax;
  if (!Number.isInteger(nbVoyageurs) || nbVoyageurs <= prevus) {
    throw new BadRequestException(`Indiquez un nombre de voyageurs supérieur aux ${prevus} prévus`);
  }
  if (nbVoyageurs > capacite) {
    throw new BadRequestException(
      `Le logement accueille ${capacite} voyageurs au maximum : au-delà, signalez un problème plutôt qu’un supplément`,
    );
  }

  const base = reservation.logement.personnesBase;
  const tarifs = reservation.logement.tarifsPersonnes;
  const parNuit = supplementPersonnesParNuit(nbVoyageurs, base, tarifs) - supplementPersonnesParNuit(prevus, base, tarifs);
  if (parNuit <= 0) {
    throw new BadRequestException(
      `Votre grille ne prévoit pas de supplément pour ${nbVoyageurs} voyageurs. Ajoutez un tarif par voyageur dans votre annonce.`,
    );
  }

  // Nuits restantes à partir d'aujourd'hui (Dakar = UTC), au moins une
  const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const from = Math.max(day(now), day(reservation.dateDebut));
  const nuits = Math.min(reservation.nbNuits, Math.max(1, Math.round((day(reservation.dateFin) - from) / 86_400_000)));

  return { prevus, nbVoyageurs, capacite, parNuit, nuits, montant: Math.round(parNuit * nuits) };
}
