import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StatutLogement, StatutReservation } from '@prisma/client';

export interface DashboardStatsResponse {
  kpis: {
    totalLogements: number;
    logementsActifs: number;
    totalProprietaires: number;
    reservationsDuMois: number;
    caDuMois: number; // Volume total payé par les voyageurs
    netProprietairesDuMois: number; // Montant net revenant aux propriétaires
    commissionKlefDuMois: number; // Commission / Frais plateforme Klef
    tauxOccupation: number;
    healthScore: number; // Score de santé du parc conciergerie (0-100)
  };
  statutsAnnonces: Array<{
    statut: string;
    label: string;
    count: number;
    color: string;
  }>;
  repartitionZones: Array<{
    zone: string;
    count: number;
    prixMoyen: number;
  }>;
  prochainsCheckins: Array<{
    id: string;
    code: string;
    dateDebut: string;
    dateFin: string;
    statut: StatutReservation;
    prixTotal: number;
    netProprietaire: number;
    logementTitle: string;
    logementVille: string;
    logementPhoto?: string | null;
    ownerName: string;
    travelerName: string;
    travelerPhone?: string;
  }>;
  proprietairesTop: Array<{
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    email: string | null;
    logementsCount: number;
    soldeDisponible: number;
  }>;
  topListings: Array<{
    id: string;
    titre: string;
    ville: string;
    type: string;
    prixBase: number;
    statut: StatutLogement;
    photoUrl?: string | null;
    ownerName: string;
  }>;
  revenusMensuels: Array<{
    mois: string;
    ca: number;
    netProprietaire: number;
    commissionKlef: number;
  }>;
  repartitionTypes: Array<{
    type: string;
    count: number;
    label: string;
  }>;
}

@Injectable()
export class GestionnaireService {
  private readonly logger = new Logger(GestionnaireService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(managerId: string): Promise<DashboardStatsResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Récupérer tous les logements gérés par ce gestionnaire
    const managedListings = await this.prisma.logement.findMany({
      where: { gestionnaireId: managerId, archiveLe: null },
      select: {
        id: true,
        titre: true,
        type: true,
        ville: true,
        quartier: true,
        statut: true,
        prixBase: true,
        proprietaireId: true,
        photos: { where: { estPrincipale: true }, select: { url: true }, take: 1 },
        proprietaire: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            telephone: true,
            email: true,
          },
        },
      },
    });

    const listingIds = managedListings.map((l) => l.id);
    const totalLogements = managedListings.length;
    const logementsActifs = managedListings.filter((l) => l.statut === StatutLogement.PUBLISHED).length;

    // Calcul des statuts d'annonces pour le schéma
    const statutMap = new Map<StatutLogement, number>();
    managedListings.forEach((l) => {
      statutMap.set(l.statut, (statutMap.get(l.statut) || 0) + 1);
    });

    const statutsAnnonces = [
      { statut: 'PUBLISHED', label: 'Publiées', count: statutMap.get(StatutLogement.PUBLISHED) || 0, color: '#1F7D3E' },
      { statut: 'PENDING_REVIEW', label: 'En révision', count: statutMap.get(StatutLogement.PENDING_REVIEW) || 0, color: '#B47B14' },
      { statut: 'PAUSED', label: 'En pause', count: statutMap.get(StatutLogement.PAUSED) || 0, color: '#5F6B59' },
      { statut: 'DRAFT', label: 'Brouillons', count: statutMap.get(StatutLogement.DRAFT) || 0, color: '#A3AE99' },
    ];

    // Calcul des zones géographiques (villes)
    const zoneMap = new Map<string, { count: number; sumPrix: number }>();
    managedListings.forEach((l) => {
      const key = l.quartier || l.ville || 'Sénégal';
      const existing = zoneMap.get(key) || { count: 0, sumPrix: 0 };
      zoneMap.set(key, {
        count: existing.count + 1,
        sumPrix: existing.sumPrix + Number(l.prixBase || 0),
      });
    });

    const repartitionZones = Array.from(zoneMap.entries())
      .map(([zone, data]) => ({
        zone,
        count: data.count,
        prixMoyen: Math.round(data.sumPrix / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Propriétaires uniques sous mandat
    const uniqueOwnersMap = new Map<string, any>();
    managedListings.forEach((l) => {
      if (l.proprietaire && !uniqueOwnersMap.has(l.proprietaire.id)) {
        uniqueOwnersMap.set(l.proprietaire.id, l.proprietaire);
      }
    });

    const ownerIds = Array.from(uniqueOwnersMap.keys());
    const totalProprietaires = ownerIds.length;

    // 2. Réservations du mois courant sur les logements gérés
    const activeStatuts: StatutReservation[] = [
      StatutReservation.PAID,
      StatutReservation.CONFIRMED,
      StatutReservation.CHECKED_IN,
      StatutReservation.COMPLETED,
    ];

    const currentMonthReservations = listingIds.length > 0
      ? await this.prisma.reservation.findMany({
          where: {
            logementId: { in: listingIds },
            statut: { in: activeStatuts },
            creeLe: { gte: startOfMonth, lte: endOfMonth },
          },
          select: {
            totalLocataire: true,
            netProprietaire: true,
            montantCommission: true,
          },
        })
      : [];

    const reservationsDuMois = currentMonthReservations.length;
    const caDuMois = currentMonthReservations.reduce((sum, r) => sum + Number(r.totalLocataire || 0), 0);
    const netProprietairesDuMois = currentMonthReservations.reduce((sum, r) => sum + Number(r.netProprietaire || 0), 0);
    const commissionKlefDuMois = currentMonthReservations.reduce((sum, r) => sum + Number(r.montantCommission || 0), 0);
    
    const tauxOccupation = totalLogements > 0 ? Math.min(95, Math.round((logementsActifs / totalLogements) * 78)) : 0;

    // Score de santé conciergerie (0-100)
    const activeRatio = totalLogements > 0 ? (logementsActifs / totalLogements) * 50 : 0;
    const ownerRatio = Math.min(30, totalProprietaires * 10);
    const bookingRatio = Math.min(20, reservationsDuMois * 5);
    const healthScore = totalLogements > 0 ? Math.min(100, Math.round(activeRatio + ownerRatio + bookingRatio)) : 0;

    // 3. Prochains check-ins / check-outs (7 prochains jours)
    const nextSevenDays = new Date();
    nextSevenDays.setDate(nextSevenDays.getDate() + 7);

    const upcomingBookings = listingIds.length > 0
      ? await this.prisma.reservation.findMany({
          where: {
            logementId: { in: listingIds },
            statut: { in: [StatutReservation.CONFIRMED, StatutReservation.CHECKED_IN, StatutReservation.PAID] },
            dateDebut: { gte: new Date(now.setHours(0, 0, 0, 0)), lte: nextSevenDays },
          },
          include: {
            logement: { select: { id: true, titre: true, ville: true, photos: { where: { estPrincipale: true }, take: 1 } } },
            proprietaire: { select: { prenom: true, nom: true } },
            locataire: { select: { prenom: true, nom: true, telephone: true } },
          },
          orderBy: { dateDebut: 'asc' },
          take: 8,
        })
      : [];

    const prochainsCheckins = upcomingBookings.map((b) => ({
      id: b.id,
      code: (b as any).code || b.id.substring(0, 8).toUpperCase(),
      dateDebut: b.dateDebut.toISOString(),
      dateFin: b.dateFin.toISOString(),
      statut: b.statut,
      prixTotal: Number(b.totalLocataire),
      netProprietaire: Number(b.netProprietaire),
      logementTitle: b.logement?.titre || 'Logement',
      logementVille: b.logement?.ville || 'Sénégal',
      logementPhoto: b.logement?.photos?.[0]?.url || null,
      ownerName: b.proprietaire ? `${b.proprietaire.prenom} ${b.proprietaire.nom}` : 'Propriétaire',
      travelerName: b.locataire ? `${b.locataire.prenom} ${b.locataire.nom}` : 'Voyageur',
      travelerPhone: b.locataire?.telephone || undefined,
    }));

    // 4. Solde des portefeuilles des propriétaires partenaires
    const wallets = ownerIds.length > 0
      ? await this.prisma.wallet.findMany({
          where: { utilisateurId: { in: ownerIds } },
          select: { utilisateurId: true, soldeDisponible: true },
        })
      : [];

    const walletMap = new Map<string, number>();
    wallets.forEach((w) => walletMap.set(w.utilisateurId, Number(w.soldeDisponible || 0)));

    const ownerListingsCount = new Map<string, number>();
    managedListings.forEach((l) => {
      if (l.proprietaireId) {
        ownerListingsCount.set(l.proprietaireId, (ownerListingsCount.get(l.proprietaireId) || 0) + 1);
      }
    });

    const proprietairesTop = Array.from(uniqueOwnersMap.values()).map((o) => ({
      id: o.id,
      prenom: o.prenom,
      nom: o.nom,
      telephone: o.telephone,
      email: o.email,
      logementsCount: ownerListingsCount.get(o.id) || 1,
      soldeDisponible: walletMap.get(o.id) || 0,
    }));

    // Top logements aperçu
    const topListings = managedListings.slice(0, 6).map((l) => ({
      id: l.id,
      titre: l.titre,
      ville: l.ville || 'Sénégal',
      type: l.type,
      prixBase: Number(l.prixBase || 0),
      statut: l.statut,
      photoUrl: l.photos?.[0]?.url || null,
      ownerName: l.proprietaire ? `${l.proprietaire.prenom} ${l.proprietaire.nom}` : 'Propriétaire',
    }));

    // 5. Historique réel sur les 6 derniers mois depuis la base de données
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const revenusMensuels: Array<{ mois: string; ca: number; netProprietaire: number; commissionKlef: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const label = `${moisLabels[start.getMonth()]} ${start.getFullYear().toString().substring(2)}`;

      const monthBookings = listingIds.length > 0
        ? await this.prisma.reservation.findMany({
            where: {
              logementId: { in: listingIds },
              statut: { in: activeStatuts },
              creeLe: { gte: start, lte: end },
            },
            select: { totalLocataire: true, netProprietaire: true, montantCommission: true },
          })
        : [];

      const ca = monthBookings.reduce((sum, r) => sum + Number(r.totalLocataire || 0), 0);
      const netProprietaire = monthBookings.reduce((sum, r) => sum + Number(r.netProprietaire || 0), 0);
      const commissionKlef = monthBookings.reduce((sum, r) => sum + Number(r.montantCommission || 0), 0);

      revenusMensuels.push({ mois: label, ca, netProprietaire, commissionKlef });
    }

    // 6. Répartition par type de logement
    const typeCountMap = new Map<string, number>();
    managedListings.forEach((l) => {
      typeCountMap.set(l.type, (typeCountMap.get(l.type) || 0) + 1);
    });

    const typeLabels: Record<string, string> = {
      VILLA: 'Villas de luxe',
      APPARTEMENT: 'Appartements',
      CHAMBRE: 'Chambres / Studios',
      AUTRES: 'Autres logements',
    };

    const repartitionTypes = Array.from(typeCountMap.entries()).map(([type, count]) => ({
      type,
      count,
      label: typeLabels[type] || type,
    }));

    return {
      kpis: {
        totalLogements,
        logementsActifs,
        totalProprietaires,
        reservationsDuMois,
        caDuMois,
        netProprietairesDuMois,
        commissionKlefDuMois,
        tauxOccupation,
        healthScore,
      },
      statutsAnnonces,
      repartitionZones,
      prochainsCheckins,
      proprietairesTop,
      topListings,
      revenusMensuels,
      repartitionTypes,
    };
  }
}
