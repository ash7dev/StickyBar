/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { createHash } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Logement, PhotoLogement, Prisma, StatutLogement, StatutReservation, TarifNuits, TarifPersonnes, TypeAvis, TypeHote, TypeLogement } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CreateLogementDto } from './dto/create-logement.dto';
import { CreateTarifNuitsDto } from './dto/create-tarif-nuits.dto';
import { CreateTarifPersonnesDto } from './dto/create-tarif-personnes.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';
import { SearchLogementsDto } from './dto/search-logements.dto';

type LogementWithRelations = Omit<Logement, 'equipements'> & {
  photos: PhotoLogement[];
  tarifsPersonnes: TarifPersonnes[];
  tarifsNuits: TarifNuits[];
  equipements: { id: string; nom: string; categorie: string }[];
};

@Injectable()
export class LogementsService {
  private readonly logger = new Logger(LogementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly redis: RedisService,
  ) { }

  // ── Recherche publique avec cache Redis ────────────────────────────────────

  private calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  async search(dto: SearchLogementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;
    const nbPersonnes = dto.nbPersonnes ?? 1;
    const hasGeo = dto.lat !== undefined && dto.lng !== undefined;
    const radiusKm = dto.radiusKm ?? 10;

    const version = await this.redis.get('listings:search:version') ?? '0';
    const cacheKey = this.buildSearchCacheKey({ ...dto, nbPersonnes, page, _v: version });
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : undefined;
    let dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;

    // Ajuster l'heure pour les requêtes de disponibilité :
    // Arrivée à 12:01 pour ne pas chevaucher un départ à 12:00 le même jour
    if (dateDebut) {
      dateDebut = new Date(dateDebut);
      dateDebut.setUTCHours(12, 1, 0, 0);
    }
    if (dateFin) {
      dateFin = new Date(dateFin);
      dateFin.setUTCHours(11, 59, 0, 0);
    }

    const withDates = dateDebut && dateFin;

    const activeStatuts: StatutReservation[] = [
      StatutReservation.PENDING,
      StatutReservation.PAID,
      StatutReservation.CONFIRMED,
      StatutReservation.CHECKED_IN,
    ];

    const where: Prisma.LogementWhereInput = {
      statut: StatutLogement.PUBLISHED,
      archiveLe: null,
      capaciteMax: { gte: nbPersonnes },
      ...(dto.ville && { ville: { contains: dto.ville, mode: 'insensitive' } }),
      ...((dto as any).quartier && { quartier: { contains: (dto as any).quartier, mode: 'insensitive' } }),
      ...(((dto as any).derniereMinuteOnly || (dto as any).derniereMinute) && { derniereMinuteActive: true }),
      ...(dto.type && { type: dto.type }),
      ...(dto.sousType && { sousType: { contains: dto.sousType, mode: 'insensitive' } }),
      ...(dto.prixMax !== undefined && { prixBase: { lte: dto.prixMax } }),
      ...(withDates && {
        reservations: {
          none: {
            statut: { in: activeStatuts },
            dateDebut: { lt: dateFin },
            dateFin: { gt: dateDebut },
          },
        },
        indisponibilites: {
          none: {
            dateDebut: { lt: dateFin },
            dateFin: { gt: dateDebut },
          },
        },
      }),
    };

    const select = {
      id: true,
      titre: true,
      type: true,
      ville: true,
      quartier: true,
      latitude: true,
      longitude: true,
      prixBase: true,
      personnesBase: true,
      capaciteMax: true,
      note: true,
      totalSejours: true,
      derniereMinuteActive: true,
      photos: {
        where: { estPrincipale: true },
        select: { url: true, categorie: true },
        take: 1,
      },
      tarifsPersonnes: {
        select: { personnesMin: true, personnesMax: true, supplement: true },
      },
      proprietaire: {
        select: { id: true, prenom: true, nom: true, avatarUrl: true },
      },
      equipements: {
        select: {
          equipement: { select: { id: true, nom: true, categorie: true } },
        },
        take: 6,
      },
    } satisfies Prisma.LogementSelect;

    let total: number;
    let paginatedLogements: any[];

    if (hasGeo && dto.lat !== undefined && dto.lng !== undefined) {
      const allLogements = await this.prisma.logement.findMany({
        where,
        select,
      });

      const withDistance = allLogements
        .map((l) => {
          let distanceKm: number | null = null;
          if (l.latitude !== null && l.longitude !== null) {
            distanceKm = this.calculateHaversineDistanceKm(
              dto.lat!,
              dto.lng!,
              Number(l.latitude),
              Number(l.longitude),
            );
          }
          return { ...l, distanceKm };
        })
        .filter((l) => l.distanceKm !== null && l.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number));

      total = withDistance.length;
      paginatedLogements = withDistance.slice((page - 1) * limit, page * limit);
    } else {
      total = await this.prisma.logement.count({ where });
      paginatedLogements = await this.prisma.logement.findMany({
        where,
        select,
        orderBy: { note: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const results = paginatedLogements.map((l) => {
      let supplementPersonnes = 0;
      if (nbPersonnes > l.personnesBase) {
        const tarif = l.tarifsPersonnes.find(
          (t: any) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax,
        );
        supplementPersonnes = tarif ? Number(tarif.supplement) : 0;
      }
      const prixNuitEffectif = Number(l.prixBase) + supplementPersonnes;
      return {
        id: l.id,
        titre: l.titre,
        type: l.type,
        ville: l.ville,
        quartier: l.quartier,
        latitude: l.latitude ? Number(l.latitude) : null,
        longitude: l.longitude ? Number(l.longitude) : null,
        distanceKm: l.distanceKm ?? null,
        prixBase: Number(l.prixBase),
        personnesBase: l.personnesBase,
        capaciteMax: l.capaciteMax,
        note: Number(l.note),
        totalSejours: l.totalSejours,
        photos: l.photos,
        prixNuitEffectif,
        proprietaire: l.proprietaire,
        equipements: l.equipements
          .map((e: any) => e.equipement)
          .filter((e: any): e is NonNullable<typeof e> => e != null),
      };
    });

    const payload = {
      data: results,
      total,
      page,
      limit,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    // Cache 5 minutes (300s) — le cache est invalidé automatiquement lors des modifications
    await this.redis.set(cacheKey, JSON.stringify(payload), 300);
    return payload;
  }

  async invalidateSearchCache(): Promise<void> {
    try {
      await this.redis.getClient().incr('listings:search:version');
      this.logger.debug('Cache recherche invalidé (version incrémentée)');
    } catch (err) {
      this.logger.warn(`Échec invalidation cache recherche : ${(err as Error).message}`);
    }
  }

  private buildSearchCacheKey(params: Record<string, unknown>): string {
    const geoNormalized = { ...params };
    if (typeof geoNormalized.lat === 'number') {
      geoNormalized.lat = Math.round(geoNormalized.lat * 100) / 100;
    }
    if (typeof geoNormalized.lng === 'number') {
      geoNormalized.lng = Math.round(geoNormalized.lng * 100) / 100;
    }
    const stable = Object.fromEntries(
      Object.entries(geoNormalized)
        .filter(([, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    const hash = createHash('md5').update(JSON.stringify(stable)).digest('hex').slice(0, 16);
    return `listings:search:v5:${hash}`;
  }

  // ── Feed public — toutes les sections en un seul appel ─────────────────────

  async getFeed() {
    const base: Prisma.LogementWhereInput = {
      statut: StatutLogement.PUBLISHED,
      archiveLe: null,
    };

    const POOL = 40; // pool large fetchée en DB…
    const LIMIT = 12; // …dont on retourne 12 aléatoires

    const cardSelect = {
      id: true,
      titre: true,
      type: true,
      sousType: true,
      ville: true,
      quartier: true,
      prixBase: true,
      capaciteMax: true,
      nombreChambres: true,
      nombreSallesBain: true,
      note: true,
      totalSejours: true,
      creeLe: true,
      isInstantBooking: true,
      derniereMinuteActive: true,
      videoUrl: true,
      photos: {
        where: { estPrincipale: true },
        select: { url: true, estPrincipale: true },
        take: 1,
      },
      equipements: {
        select: {
          equipement: { select: { id: true, nom: true, categorie: true } },
        },
        take: 6,
      },
    } satisfies Prisma.LogementSelect;

    type SectionDef = {
      id: string;
      where: Prisma.LogementWhereInput;
      orderBy: Prisma.LogementOrderByWithRelationInput;
    };

    const sections: SectionDef[] = [
      // Règle stricte : au moins 1 réservation confirmée
      { id: 'popular', where: { ...base, totalSejours: { gt: 0 } }, orderBy: { totalSejours: 'desc' } },
      // 12 derniers ajoutés — toujours distinct de la grille principale
      { id: 'newest', where: base, orderBy: { creeLe: 'desc' } },
      // Règle stricte : note >= 4
      { id: 'rated', where: { ...base, note: { gte: 4 } }, orderBy: { note: 'desc' } },
      // En vedette par type — au moins 1 réservation, sinon fallback sans filtre
      { id: 'villas', where: { ...base, type: TypeLogement.VILLA, totalSejours: { gt: 0 } }, orderBy: { totalSejours: 'desc' } },
      { id: 'appartements', where: { ...base, type: TypeLogement.APPARTEMENT, totalSejours: { gt: 0 } }, orderBy: { totalSejours: 'desc' } },
      { id: 'chambres', where: { ...base, type: TypeLogement.CHAMBRE, note: { gt: 0 } }, orderBy: { note: 'desc' } },
      { id: 'penthouse', where: { ...base, type: TypeLogement.APPARTEMENT, sousType: 'Penthouse' }, orderBy: { note: 'desc' } },
      { id: 'loft', where: { ...base, type: TypeLogement.APPARTEMENT, sousType: 'Loft' }, orderBy: { note: 'desc' } },
      { id: 'villa-pool', where: { ...base, type: TypeLogement.VILLA, sousType: 'Villa avec piscine' }, orderBy: { note: 'desc' } },
      { id: 'villa-sea', where: { ...base, type: TypeLogement.VILLA, sousType: 'Villa bord de mer' }, orderBy: { note: 'desc' } },
      { id: 'villa-luxe', where: { ...base, type: TypeLogement.VILLA, sousType: 'Villa de luxe' }, orderBy: { note: 'desc' } },
      { id: 'villa-fam', where: { ...base, type: TypeLogement.VILLA, sousType: 'Villa familiale' }, orderBy: { note: 'desc' } },
      { id: 'villa-event', where: { ...base, type: TypeLogement.VILLA, sousType: 'Villa pour événement' }, orderBy: { note: 'desc' } },
      { id: 'suite', where: { ...base, type: TypeLogement.CHAMBRE, sousType: 'Suite meublée' }, orderBy: { note: 'desc' } },
      { id: 'maison', where: { ...base, type: TypeLogement.AUTRES, sousType: 'Maison entière' }, orderBy: { note: 'desc' } },
      // Sections par zone géographique
      { id: 'zone-almadies', where: { ...base, ville: { contains: 'Almadies', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-saly', where: { ...base, ville: { contains: 'Saly', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-ngor', where: { ...base, ville: { contains: 'Ngor', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-mermoz', where: { ...base, ville: { contains: 'Mermoz', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-ngaparou', where: { ...base, ville: { contains: 'Ngaparou', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-saint-louis', where: { ...base, ville: { contains: 'Saint-Louis', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-plateau', where: { ...base, ville: { contains: 'Plateau', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-cap-skirring', where: { ...base, ville: { contains: 'Cap Skirring', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-yoff', where: { ...base, ville: { contains: 'Yoff', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
      { id: 'zone-somone', where: { ...base, ville: { contains: 'Somone', mode: 'insensitive' } }, orderBy: { note: 'desc' } },
    ];

    const BATCH_SIZE = 2;
    const results = [];

    for (let i = 0; i < sections.length; i += BATCH_SIZE) {
      const batch = sections.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (s) => {
          const logements = await this.prisma.logement.findMany({
            where: s.where,
            select: cardSelect,
            orderBy: s.orderBy,
            take: POOL,
          });
          // Shuffle Fisher-Yates puis on prend les LIMIT premiers
          for (let k = logements.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [logements[k], logements[j]] = [logements[j], logements[k]];
          }
          return {
            id: s.id,
            listings: logements.slice(0, LIMIT).map((l) => ({
              id: l.id,
              titre: l.titre,
              type: l.type,
              sousType: l.sousType,
              ville: l.ville,
              quartier: l.quartier,
              prixBase: Number(l.prixBase),
              capaciteMax: l.capaciteMax,
              nombreChambres: l.nombreChambres ?? null,
              nombreSallesBain: l.nombreSallesBain ?? null,
              note: l.note ? Number(l.note) : null,
              totalSejours: l.totalSejours,
              createdAt: l.creeLe.toISOString(),
              isInstantBooking: l.isInstantBooking,
              derniereMinuteActive: l.derniereMinuteActive,
              videoUrl: l.videoUrl ?? null,
              photos: l.photos,
              equipements: l.equipements
                .map((e) => e.equipement)
                .filter((e): e is NonNullable<typeof e> => e != null),
            })),
          };
        }),
      );
      results.push(...batchResults);
    }

    return { sections: results };
  }

  private async geocodeAddress(adresse: string, ville: string, quartier?: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const query = [adresse, quartier, ville, 'Sénégal'].filter(Boolean).join(', ');
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ImmoLoc-Backend/1.0 (contact@immoloc.sn)',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      }

      if (quartier || ville) {
        const fallbackQuery = [quartier, ville, 'Sénégal'].filter(Boolean).join(', ');
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'ImmoLoc-Backend/1.0 (contact@immoloc.sn)',
          },
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const lat = parseFloat(fallbackData[0].lat);
            const lng = parseFloat(fallbackData[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Échec géocodage Nominatim : ${(err as Error).message}`);
    }
    return null;
  }

  async create(userId: string, dto: CreateLogementDto): Promise<Logement> {
    const { equipementIds, ...fields } = dto;

    let latitude = fields.latitude;
    let longitude = fields.longitude;

    if (latitude === undefined || longitude === undefined) {
      const geo = await this.geocodeAddress(fields.adresse, fields.ville, fields.quartier);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lng;
      }
    }

    const logement = await this.prisma.logement.create({
      data: {
        proprietaireId: userId,
        titre: fields.titre,
        description: fields.description,
        type: fields.type,
        ...(fields.sousType !== undefined && { sousType: fields.sousType }),
        capaciteMax: fields.capaciteMax,
        ville: fields.ville,
        adresse: fields.adresse,
        prixBase: fields.prixBase,
        personnesBase: fields.personnesBase,
        ...(fields.surface !== undefined && { surface: fields.surface }),
        ...(fields.nombreChambres !== undefined && { nombreChambres: fields.nombreChambres }),
        ...(fields.nombreSallesBain !== undefined && { nombreSallesBain: fields.nombreSallesBain }),
        ...(fields.nombrePieces !== undefined && { nombrePieces: fields.nombrePieces }),
        ...(fields.quartier !== undefined && { quartier: fields.quartier }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(fields.nuitesMinimum !== undefined && { nuitesMinimum: fields.nuitesMinimum }),
        ...(fields.ageMin !== undefined && { ageMin: fields.ageMin }),
        ...(fields.reglesMaison !== undefined && { reglesMaison: fields.reglesMaison }),
        ...(fields.instructionsAcces !== undefined && { instructionsAcces: fields.instructionsAcces }),
        ...(fields.nomReseauWifi !== undefined && { nomReseauWifi: fields.nomReseauWifi }),
        ...(fields.codeWifi !== undefined && { codeWifi: fields.codeWifi }),
        ...(fields.instructionsDigicode !== undefined && { instructionsDigicode: fields.instructionsDigicode }),
        ...(fields.regimeElectricite !== undefined && { regimeElectricite: fields.regimeElectricite }),
        ...(fields.detailsElectricite !== undefined && { detailsElectricite: fields.detailsElectricite }),
        ...(fields.isInstantBooking !== undefined && { isInstantBooking: fields.isInstantBooking }),
        ...(fields.videoUrl !== undefined && { videoUrl: fields.videoUrl }),
        statut: StatutLogement.DRAFT,
        ...(equipementIds?.length && {
          equipements: {
            create: equipementIds.map((equipementId) => ({ equipementId })),
          },
        }),
      },
    });

    this.logger.log(`Logement créé [${logement.id}] par utilisateur [${userId}] (GPS: ${latitude ?? 'NULL'}, ${longitude ?? 'NULL'})`);
    return logement;
  }

  async findMine(userId: string): Promise<Logement[]> {
    return this.prisma.logement.findMany({
      where: {
        proprietaireId: userId,
        archiveLe: null,
      },
      include: {
        photos: { where: { estPrincipale: true }, take: 1 },
        _count: { select: { reservations: true } },
      },
      orderBy: { creeLe: 'desc' },
    });
  }

  async findOne(id: string, requesterId?: string): Promise<LogementWithRelations> {
    const logement = await this.prisma.logement.findUnique({
      where: { id },
      include: {
        photos: { orderBy: [{ estPrincipale: 'desc' }, { position: 'asc' }] },
        tarifsPersonnes: { orderBy: { position: 'asc' } },
        tarifsNuits: { orderBy: { position: 'asc' } },
        equipements: {
          include: {
            equipement: { select: { id: true, nom: true, categorie: true } },
          },
        },
        // Récupérer les réservations actives pour bloquer le calendrier
        reservations: {
          where: {
            statut: {
              in: [
                StatutReservation.PENDING,
                StatutReservation.PAID,
                StatutReservation.CONFIRMED,
                StatutReservation.CHECKED_IN,
              ],
            },
          },
          select: {
            dateDebut: true,
            dateFin: true,
          },
        },
        // Récupérer les indisponibilités manuelles
        indisponibilites: {
          select: {
            dateDebut: true,
            dateFin: true,
          },
        },
        // Avis des voyageurs sur ce logement
        avis: {
          where: { typeAvis: TypeAvis.LOCATAIRE_NOTE_LOGEMENT_ET_PROPRIO },
          orderBy: { creeLe: 'desc' },
          take: 12,
          include: {
            auteur: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                avatarUrl: true,
              },
            },
          },
        },
        // Informations propriétaire enrichies
        proprietaire: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            avatarUrl: true,
            statutKyc: true,
            noteProprietaire: true,
            totalAvis: true,
            creeLe: true,
            _count: {
              select: {
                reservationsProprietaire: {
                  where: {
                    statut: {
                      in: [
                        StatutReservation.CONFIRMED,
                        StatutReservation.CHECKED_IN,
                        StatutReservation.COMPLETED,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!logement || logement.archiveLe) {
      throw new NotFoundException('Logement introuvable');
    }

    const isOwner = requesterId && logement.proprietaireId === requesterId;

    if (!isOwner && logement.statut !== StatutLogement.PUBLISHED) {
      throw new NotFoundException('Logement introuvable');
    }

    const { proprietaire, ...rest } = logement;

    const proprietaireData = proprietaire
      ? {
        id: proprietaire.id,
        prenom: proprietaire.prenom,
        nom: proprietaire.nom,
        avatarUrl: proprietaire.avatarUrl,
        statutKyc: proprietaire.statutKyc,
        noteProprietaire: Number(proprietaire.noteProprietaire || 0),
        totalAvis: proprietaire.totalAvis || 0,
        totalSejours: proprietaire._count?.reservationsProprietaire || 0,
        creeLe: proprietaire.creeLe,
      }
      : undefined;

    return {
      ...rest,
      proprietaire: proprietaireData,
      equipements: logement.equipements
        .map(e => e.equipement)
        .filter((e): e is NonNullable<typeof e> => e != null),
    } as unknown as LogementWithRelations;
  }

  async update(id: string, userId: string, dto: UpdateLogementDto): Promise<Logement> {
    await this.assertOwner(id, userId);
    await this.assertNoActiveReservations(id);

    const { equipementIds, ...fields } = dto;

    const logement = await this.prisma.logement.update({
      where: { id },
      data: {
        ...fields,
        ...(equipementIds !== undefined && {
          equipements: {
            deleteMany: {},
            create: equipementIds.map((equipementId) => ({ equipementId })),
          },
        }),
      },
    });

    // Invalider le cache si le logement est publié (visible dans les recherches)
    if (logement.statut === StatutLogement.PUBLISHED) {
      await this.invalidateSearchCache();
    }

    this.logger.log(`Logement [${id}] mis à jour par utilisateur [${userId}]`);
    return logement;
  }

  async submit(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);

    if (logement.statut !== StatutLogement.DRAFT && logement.statut !== StatutLogement.REJECTED) {
      throw new ConflictException(`Statut actuel incompatible avec une soumission : ${logement.statut}`);
    }

    const photoCount = await this.prisma.photoLogement.count({ where: { logementId: id } });
    if (photoCount === 0) {
      throw new UnprocessableEntityException('Au moins une photo est requise avant soumission');
    }

    await this.prisma.logement.update({
      where: { id },
      data: { statut: StatutLogement.PENDING_REVIEW },
    });

    const proprietaire = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        profile: {
          select: { typeHote: true },
        },
      },
    });

    if (proprietaire?.profile?.typeHote === TypeHote.PARTICULIER) {
      const publishedCount = await this.prisma.logement.count({
        where: {
          proprietaireId: userId,
          statut: StatutLogement.PUBLISHED,
          archiveLe: null,
        },
      });
      if (publishedCount >= 3) {
        this.logger.warn(
          `[ADMIN_FLAG] Propriétaire particulier [${userId}] a soumis le logement [${id}] et possède déjà ${publishedCount} annonces publiées`,
        );
      }
    }

    this.logger.log(`Logement [${id}] soumis en révision par utilisateur [${userId}]`);
    return { message: 'Logement soumis pour révision' };
  }

  async pause(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);

    if (logement.statut !== StatutLogement.PUBLISHED) {
      throw new ConflictException(`Seul un logement publié peut être mis en pause (statut actuel : ${logement.statut})`);
    }

    await this.prisma.logement.update({
      where: { id },
      data: { statut: StatutLogement.PAUSED },
    });

    await this.invalidateSearchCache();
    this.logger.log(`Logement [${id}] mis en pause par utilisateur [${userId}]`);
    return { message: 'Logement mis en pause' };
  }

  async republier(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);

    if (logement.statut !== StatutLogement.PAUSED) {
      throw new ConflictException(`Seul un logement en pause peut être republié (statut actuel : ${logement.statut})`);
    }

    await this.prisma.logement.update({
      where: { id },
      data: { statut: StatutLogement.PUBLISHED },
    });

    await this.invalidateSearchCache();
    this.logger.log(`Logement [${id}] republié par utilisateur [${userId}]`);
    return { message: 'Logement republié' };
  }

  async archive(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);
    await this.assertNoActiveReservations(id);

    const reservationCount = await this.prisma.reservation.count({
      where: { logementId: id },
    });

    if (reservationCount === 0) {
      // 1. Nettoyage des photos sur Cloudinary
      const photos = await this.prisma.photoLogement.findMany({
        where: { logementId: id },
        select: { publicId: true },
      });
      for (const p of photos) {
        if (p.publicId) {
          try {
            await cloudinary.uploader.destroy(p.publicId);
          } catch (err) {
            this.logger.warn(`Échec suppression photo Cloudinary [${p.publicId}]: ${(err as Error).message}`);
          }
        }
      }

      // 2. Nettoyage de la vidéo de présentation sur Cloudinary
      if (logement.videoPublicId) {
        try {
          await this.cloudinaryService.deleteFile(logement.videoPublicId);
        } catch (err) {
          this.logger.warn(`Échec suppression vidéo Cloudinary [${logement.videoPublicId}]: ${(err as Error).message}`);
        }
      }

      // 3. Suppression définitive en BDD (Prisma CASCADE supprime photos, équipements, tarifs, indisponibilités, avis)
      await this.prisma.logement.delete({ where: { id } });
      await this.invalidateSearchCache();

      this.logger.log(`Logement [${id}] supprimé définitivement par utilisateur [${userId}]`);
      return { message: 'Logement supprimé définitivement' };
    } else {
      // Si le logement possède un historique comptable de réservations passées/annulées
      const updateData: { archiveLe: Date; statut?: StatutLogement } = {
        archiveLe: new Date(),
      };

      if (logement.statut !== StatutLogement.PAUSED) {
        updateData.statut = StatutLogement.PAUSED;
      }

      await this.prisma.logement.update({ where: { id }, data: updateData });
      await this.invalidateSearchCache();

      this.logger.log(`Logement [${id}] archivé (historique conservé) par utilisateur [${userId}]`);
      return { message: 'Logement archivé' };
    }
  }

  async setTarifsPersonnes(
    id: string,
    userId: string,
    tarifs: CreateTarifPersonnesDto[],
  ): Promise<TarifPersonnes[]> {
    await this.assertOwner(id, userId);

    if (!Array.isArray(tarifs) || tarifs.length === 0) return [];

    for (const tarif of tarifs) {
      if (tarif.personnesMax < tarif.personnesMin) {
        throw new UnprocessableEntityException(
          `personnesMax (${tarif.personnesMax}) doit être >= personnesMin (${tarif.personnesMin})`,
        );
      }
    }

    this.assertNoOverlappingRanges(
      tarifs.map((t) => ({ min: t.personnesMin, max: t.personnesMax })),
      'personnes',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.tarifPersonnes.deleteMany({ where: { logementId: id } });

      const created = await tx.tarifPersonnes.createMany({
        data: tarifs.map((t, index) => ({
          logementId: id,
          personnesMin: t.personnesMin,
          personnesMax: t.personnesMax,
          supplement: t.supplement,
          position: t.position ?? index,
        })),
      });

      // Mettre à jour la capaciteMax du logement si un palier va plus loin
      const maxPers = tarifs.reduce((max, t) => Math.max(max, t.personnesMax), 0);
      const logement = await tx.logement.findUnique({ where: { id }, select: { capaciteMax: true } });
      if (logement && maxPers > logement.capaciteMax) {
        await tx.logement.update({
          where: { id },
          data: { capaciteMax: maxPers },
        });
      }

      return created;
    });

    this.logger.log(`Tarifs personnes du logement [${id}] remplacés (${tarifs.length} entrées)`);
    return this.prisma.tarifPersonnes.findMany({
      where: { logementId: id },
      orderBy: { position: 'asc' },
    });
  }

  async setTarifsNuits(
    id: string,
    userId: string,
    tarifs: CreateTarifNuitsDto[],
  ): Promise<TarifNuits[]> {
    await this.assertOwner(id, userId);

    if (!Array.isArray(tarifs) || tarifs.length === 0) return [];

    for (const t of tarifs) {
      if (t.nuitsMax !== null && t.nuitsMax !== undefined && t.nuitsMax < t.nuitsMin) {
        throw new UnprocessableEntityException(
          `nuitsMax (${t.nuitsMax}) doit être >= nuitsMin (${t.nuitsMin})`,
        );
      }
    }

    const closedRanges = tarifs
      .filter((t) => t.nuitsMax !== undefined && t.nuitsMax !== null)
      .map((t) => ({ min: t.nuitsMin, max: t.nuitsMax as number }));

    if (closedRanges.length > 0) {
      this.assertNoOverlappingRanges(closedRanges, 'nuits');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tarifNuits.deleteMany({ where: { logementId: id } });
      await tx.tarifNuits.createMany({
        data: tarifs.map((t, index) => ({
          logementId: id,
          nuitsMin: t.nuitsMin,
          nuitsMax: t.nuitsMax ?? null,
          prix: t.prix,
          position: t.position ?? index,
        })),
      });
    });

    this.logger.log(`Tarifs nuits du logement [${id}] remplacés (${tarifs.length} entrées)`);
    return this.prisma.tarifNuits.findMany({
      where: { logementId: id },
      orderBy: { position: 'asc' },
    });
  }

  async getPhotoUploadParams(
    id: string,
    userId: string,
  ): Promise<ReturnType<CloudinaryService['generateUploadSignature']>> {
    await this.assertOwner(id, userId);
    return this.cloudinaryService.generateUploadSignature(`immoloc/listings/${id}`);
  }

  async getVideoUploadParams(
    id: string,
    userId: string,
  ): Promise<ReturnType<CloudinaryService['generateVideoUploadSignature']>> {
    await this.assertOwner(id, userId);
    return this.cloudinaryService.generateVideoUploadSignature(`immoloc/listings/${id}/videos`);
  }

  async deleteVideo(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);
    if (logement.videoPublicId) {
      try {
        await this.cloudinaryService.deleteFile(logement.videoPublicId);
      } catch (err) {
        this.logger.warn(`Erreur suppression vidéo Cloudinary ${logement.videoPublicId}:`, err);
      }
    }

    await this.prisma.logement.update({
      where: { id },
      data: { videoUrl: null, videoPublicId: null },
    });

    if (logement.statut === StatutLogement.PUBLISHED) {
      await this.invalidateSearchCache();
    }

    this.logger.log(`Vidéo du logement [${id}] supprimée par utilisateur [${userId}]`);
    return { message: 'Vidéo supprimée avec succès' };
  }

  async addPhoto(id: string, userId: string, dto: AddPhotoDto): Promise<PhotoLogement> {
    await this.assertOwner(id, userId);

    const photoCount = await this.prisma.photoLogement.count({ where: { logementId: id } });
    if (photoCount >= 10) {
      throw new UnprocessableEntityException('Maximum 10 photos par logement');
    }

    if (dto.estPrincipale) {
      await this.prisma.photoLogement.updateMany({
        where: { logementId: id, estPrincipale: true },
        data: { estPrincipale: false },
      });
    }

    const photo = await this.prisma.photoLogement.create({
      data: {
        logementId: id,
        url: dto.url,
        publicId: dto.publicId,
        categorie: dto.categorie,
        position: dto.position ?? 0,
        estPrincipale: dto.estPrincipale ?? false,
      },
    });

    this.logger.log(`Photo [${photo.id}] ajoutée au logement [${id}]`);
    return photo;
  }

  async removePhoto(id: string, photoId: string, userId: string): Promise<void> {
    await this.assertOwner(id, userId);

    const photo = await this.prisma.photoLogement.findFirst({
      where: { id: photoId, logementId: id },
    });

    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    await this.prisma.photoLogement.delete({ where: { id: photoId } });

    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
      } catch (err) {
        this.logger.warn(`Échec suppression Cloudinary [${photo.publicId}] : ${(err as Error).message}`);
      }
    }

    this.logger.log(`Photo [${photoId}] supprimée du logement [${id}]`);
  }

  async setMainPhoto(id: string, photoId: string, userId: string): Promise<PhotoLogement> {
    await this.assertOwner(id, userId);

    const photo = await this.prisma.photoLogement.findFirst({
      where: { id: photoId, logementId: id },
    });

    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    await this.prisma.$transaction([
      this.prisma.photoLogement.updateMany({
        where: { logementId: id, estPrincipale: true },
        data: { estPrincipale: false },
      }),
      this.prisma.photoLogement.update({
        where: { id: photoId },
        data: { estPrincipale: true },
      }),
    ]);

    this.logger.log(`Photo [${photoId}] définie comme principale pour logement [${id}]`);
    return this.prisma.photoLogement.findUniqueOrThrow({ where: { id: photoId } });
  }

  async listEquipements() {
    return this.prisma.equipement.findMany({
      select: { id: true, nom: true, categorie: true },
      orderBy: { nom: 'asc' },
    });
  }

  async setEquipements(id: string, userId: string, equipementIds: string[]): Promise<void> {
    await this.assertOwner(id, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.logementEquipement.deleteMany({ where: { logementId: id } });
      if (equipementIds.length > 0) {
        await tx.logementEquipement.createMany({
          data: equipementIds.map((equipementId) => ({ logementId: id, equipementId })),
        });
      }
    });

    this.logger.log(`Équipements du logement [${id}] mis à jour (${equipementIds.length} entrées)`);
  }

  private async assertOwner(id: string, userId: string): Promise<Logement> {
    const logement = await this.prisma.logement.findUnique({ where: { id } });
    if (!logement) throw new NotFoundException('Logement introuvable');
    if (logement.proprietaireId !== userId) throw new ForbiddenException('Accès interdit');
    return logement;
  }

  private async assertNoActiveReservations(logementId: string): Promise<void> {
    const count = await this.prisma.reservation.count({
      where: { logementId, statut: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    });
    if (count > 0) throw new ConflictException('Impossible : réservations actives en cours');
  }

  private assertNoOverlappingRanges(ranges: { min: number; max: number }[], label: string): void {
    const sorted = [...ranges].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].max >= sorted[i + 1].min) {
        throw new UnprocessableEntityException(
          `Chevauchement de plages de ${label} : [${sorted[i].min}-${sorted[i].max}] et [${sorted[i + 1].min}-${sorted[i + 1].max}]`,
        );
      }
    }
  }
}
