import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '@infrastructure/prisma/prisma.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PricingInput {
  prixBase: Decimal | number;
  tarifsPersonnes: {
    personnesMin: number;
    personnesMax: number;
    supplement: Decimal | number;
  }[];
  tarifsNuits: {
    nuitsMin: number;
    nuitsMax: number | null;
    prix: Decimal | number;
  }[];
  nbPersonnes: number;
  nbNuits: number;
  tauxCommission?: number;
}

export interface PriceBreakdown {
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

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Calcul pur (sans DB) — utilisé pour le snapshot de réservation ─────────
  // CRITIQUE : ce calcul est LA source de vérité. Ne jamais le dupliquer.

  calculate(input: PricingInput & { personnesBase?: number; nuitesMinimum?: number }): PriceBreakdown {
    const {
      prixBase: rawBase,
      tarifsPersonnes,
      tarifsNuits,
      nbPersonnes,
      nbNuits,
      personnesBase = 1,
      nuitesMinimum = 1,
      tauxCommission = 0.07,
    } = input;

    const prixBase = Number(rawBase);

    // 1. Supplément personnes
    // On ne cherche un supplément QUE si on dépasse personnesBase
    let supplementPersonnes = 0;
    if (nbPersonnes > personnesBase) {
      const tarifPersonnes = tarifsPersonnes.find(
        (t) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax,
      );
      supplementPersonnes = tarifPersonnes ? Number(tarifPersonnes.supplement) : 0;
    }

    // 2. Prix effectif par nuit (avant réduction durée)
    const prixNuitEffectif = prixBase + supplementPersonnes;

    // 3. Réduction durée de séjour
    // On ne cherche une réduction QUE si on dépasse nuitesMinimum
    let prixNuitBase = prixBase;
    if (nbNuits > nuitesMinimum) {
      const tarifNuits = tarifsNuits.find(
        (t) => nbNuits >= t.nuitsMin && (t.nuitsMax === null || nbNuits <= t.nuitsMax),
      );
      if (tarifNuits) {
        prixNuitBase = Number(tarifNuits.prix);
      }
    }
    
    // La réduction est la différence entre le prix de base et le prix dégressif sur la durée totale
    const reductionNuits = Math.max(0, (prixBase - prixNuitBase) * nbNuits);

    // 4. Totaux
    // Le totalBase est (Prix de base après réduction durée + Supplément personnes) x nbNuits
    const totalBase = Math.round((prixNuitBase + supplementPersonnes) * nbNuits);
    const montantCommission = Math.round(totalBase * tauxCommission);
    const totalLocataire = totalBase + montantCommission;
    const netProprietaire = totalBase;

    if (totalBase < 0) {
      throw new UnprocessableEntityException(
        'La configuration tarifaire produit un prix négatif — vérifiez les TarifNuits',
      );
    }

    this.logger.debug(
      `Calcul prix : ${nbNuits}n×${nbPersonnes}p (base=${personnesBase}p, min=${nuitesMinimum}n) → prixBase=${prixBase} + supp=${supplementPersonnes} | prixReduit=${prixNuitBase} → total=${totalLocataire} FCFA`,
    );

    return {
      nbNuits,
      nbPersonnes,
      prixBase,
      supplementPersonnes,
      prixNuitEffectif,
      reductionNuits,
      totalBase,
      tauxCommission,
      montantCommission,
      totalLocataire,
      netProprietaire,
    };
  }

  // ── Calcul avec chargement DB ─────────────────────────────────────────────

  async calculateForLogement(
    logementId: string,
    { dateDebut, dateFin, nbPersonnes }: { dateDebut: Date; dateFin: Date; nbPersonnes: number },
  ): Promise<PriceBreakdown> {
    const nbNuits = this.computeNights(dateDebut, dateFin);

    if (nbNuits < 1) {
      throw new UnprocessableEntityException('dateFin doit être postérieure à dateDebut d\'au moins 1 nuit');
    }

    const logement = await this.prisma.logement.findUnique({
      where: { id: logementId },
      select: {
        prixBase: true,
        nuitesMinimum: true,
        capaciteMax: true,
        personnesBase: true,
        tarifsPersonnes: { orderBy: { position: 'asc' } },
        tarifsNuits: { orderBy: { position: 'asc' } },
      },
    });

    if (!logement) throw new NotFoundException('Logement introuvable');

    // La capacité réelle est le MAX entre capaciteMax et la plus haute borne des tarifs
    const maxTarifPers = logement.tarifsPersonnes.reduce((max, t) => Math.max(max, t.personnesMax), 0);
    const realCapaciteMax = Math.max(logement.capaciteMax, maxTarifPers);

    if (nbPersonnes < 1 || nbPersonnes > realCapaciteMax) {
      throw new UnprocessableEntityException(
        `Nombre de personnes invalide (max ${realCapaciteMax})`,
      );
    }

    if (logement.nuitesMinimum && nbNuits < logement.nuitesMinimum) {
      throw new UnprocessableEntityException(
        `Durée minimum : ${logement.nuitesMinimum} nuit(s)`,
      );
    }

    return this.calculate({
      prixBase: logement.prixBase,
      tarifsPersonnes: logement.tarifsPersonnes,
      tarifsNuits: logement.tarifsNuits,
      nbPersonnes,
      nbNuits,
      personnesBase: logement.personnesBase,
      nuitesMinimum: logement.nuitesMinimum,
    });
  }

  // ── Utilitaire ────────────────────────────────────────────────────────────

  computeNights(dateDebut: Date, dateFin: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((dateFin.getTime() - dateDebut.getTime()) / msPerDay);
  }
}
