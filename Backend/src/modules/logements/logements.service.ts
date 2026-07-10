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
import { Logement, PhotoLogement, Prisma, StatutLogement, StatutReservation, TarifNuits, TarifPersonnes, TypeHote, TypeLogement } from '@prisma/client';
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
  ) {}

  // ── Recherche publique avec cache Redis ────────────────────────────────────

  async search(dto: SearchLogementsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;
    const nbPersonnes = dto.nbPersonnes ?? 1;

    const version = await this.redis.get('listings:search:version') ?? '0';
    const cacheKey = this.buildSearchCacheKey({ ...dto, nbPersonnes, page, _v: version });
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : undefined;
    const dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;

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
      ...(dto.type && { type: dto.type }),
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
      prixBase: true,
      personnesBase: true,
      capaciteMax: true,
      note: true,
      totalSejours: true,
      photos: {
        where: { estPrincipale: true },
        select: { url: true, categorie: true },
        take: 1,
      },
      tarifsPersonnes: {
        select: { personnesMin: true, personnesMax: true, supplement: true },
      },
    } satisfies Prisma.LogementSelect;

    const [total, logements] = await Promise.all([
      this.prisma.logement.count({ where }),
      this.prisma.logement.findMany({ where, select, orderBy: { note: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);

    const results = logements.map((l) => {
      let supplementPersonnes = 0;
      if (nbPersonnes > l.personnesBase) {
        const tarif = l.tarifsPersonnes.find(
          (t) => nbPersonnes >= t.personnesMin && nbPersonnes <= t.personnesMax,
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
        prixBase: Number(l.prixBase),
        personnesBase: l.personnesBase,
        capaciteMax: l.capaciteMax,
        note: Number(l.note),
        totalSejours: l.totalSejours,
        photos: l.photos,
        prixNuitEffectif,
      };
    });

    const payload = {
      data: results,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await this.redis.set(cacheKey, JSON.stringify(payload), 60);
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
    const stable = Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b)),
    );
    const hash = createHash('md5').update(JSON.stringify(stable)).digest('hex').slice(0, 16);
    return `listings:search:${hash}`;
  }

  // ── Feed public — toutes les sections en un seul appel ─────────────────────

  async getFeed() {
    const base: Prisma.LogementWhereInput = {
      statut: StatutLogement.PUBLISHED,
      archiveLe: null,
    };

    const POOL  = 40; // pool large fetchée en DB…
    const LIMIT = 12; // …dont on retourne 12 aléatoires

    const cardSelect = {
      id:           true,
      titre:        true,
      type:         true,
      sousType:     true,
      ville:        true,
      quartier:     true,
      prixBase:     true,
      capaciteMax:  true,
      note:         true,
      totalSejours: true,
      creeLe:       true,
      photos: {
        where:  { estPrincipale: true },
        select: { url: true, estPrincipale: true },
        take:   1,
      },
    } satisfies Prisma.LogementSelect;

    type SectionDef = {
      id:      string;
      where:   Prisma.LogementWhereInput;
      orderBy: Prisma.LogementOrderByWithRelationInput;
    };

    const sections: SectionDef[] = [
      // Règle stricte : au moins 1 réservation confirmée
      { id: 'popular',      where: { ...base, totalSejours: { gt: 0 } },                                         orderBy: { totalSejours: 'desc' } },
      // 12 derniers ajoutés — toujours distinct de la grille principale
      { id: 'newest',       where: base,                                                                          orderBy: { creeLe:        'desc' } },
      // Règle stricte : note >= 4
      { id: 'rated',        where: { ...base, note: { gte: 4 } },                                                orderBy: { note:          'desc' } },
      // En vedette par type — au moins 1 réservation, sinon fallback sans filtre
      { id: 'villas',       where: { ...base, type: TypeLogement.VILLA,       totalSejours: { gt: 0 } },         orderBy: { totalSejours: 'desc' } },
      { id: 'appartements', where: { ...base, type: TypeLogement.APPARTEMENT, totalSejours: { gt: 0 } },         orderBy: { totalSejours: 'desc' } },
      { id: 'chambres',     where: { ...base, type: TypeLogement.CHAMBRE,     note:         { gt: 0 } },         orderBy: { note:         'desc' } },
      { id: 'penthouse',    where: { ...base, type: TypeLogement.APPARTEMENT, sousType: 'Penthouse' },           orderBy: { note:         'desc' } },
      { id: 'loft',         where: { ...base, type: TypeLogement.APPARTEMENT, sousType: 'Loft' },                orderBy: { note:         'desc' } },
      { id: 'villa-pool',   where: { ...base, type: TypeLogement.VILLA,       sousType: 'Villa avec piscine' },  orderBy: { note:         'desc' } },
      { id: 'villa-sea',    where: { ...base, type: TypeLogement.VILLA,       sousType: 'Villa bord de mer' },   orderBy: { note:         'desc' } },
      { id: 'villa-luxe',   where: { ...base, type: TypeLogement.VILLA,       sousType: 'Villa de luxe' },       orderBy: { note:         'desc' } },
      { id: 'villa-fam',    where: { ...base, type: TypeLogement.VILLA,       sousType: 'Villa familiale' },     orderBy: { note:         'desc' } },
      { id: 'villa-event',  where: { ...base, type: TypeLogement.VILLA,       sousType: 'Villa pour événement' },orderBy: { note:         'desc' } },
      { id: 'suite',             where: { ...base, type: TypeLogement.CHAMBRE, sousType: 'Suite meublée' },                              orderBy: { note: 'desc' } },
      { id: 'maison',            where: { ...base, type: TypeLogement.AUTRES, sousType: 'Maison entière' },                             orderBy: { note: 'desc' } },
      // Sections par zone géographique
      { id: 'zone-almadies',     where: { ...base, ville: { contains: 'Almadies',    mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-saly',         where: { ...base, ville: { contains: 'Saly',        mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-ngor',         where: { ...base, ville: { contains: 'Ngor',        mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-mermoz',       where: { ...base, ville: { contains: 'Mermoz',      mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-ngaparou',     where: { ...base, ville: { contains: 'Ngaparou',    mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-saint-louis',  where: { ...base, ville: { contains: 'Saint-Louis', mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-plateau',      where: { ...base, ville: { contains: 'Plateau',     mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-cap-skirring', where: { ...base, ville: { contains: 'Cap Skirring',mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-yoff',         where: { ...base, ville: { contains: 'Yoff',        mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
      { id: 'zone-somone',       where: { ...base, ville: { contains: 'Somone',      mode: 'insensitive' } },                           orderBy: { note: 'desc' } },
    ];

    const results = await Promise.all(
      sections.map(async (s) => {
        const logements = await this.prisma.logement.findMany({
          where:   s.where,
          select:  cardSelect,
          orderBy: s.orderBy,
          take:    POOL,
        });
        // Shuffle Fisher-Yates puis on prend les LIMIT premiers
        for (let i = logements.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [logements[i], logements[j]] = [logements[j], logements[i]];
        }
        return {
          id: s.id,
          listings: logements.slice(0, LIMIT).map((l) => ({
            id:           l.id,
            titre:        l.titre,
            type:         l.type,
            sousType:     l.sousType,
            ville:        l.ville,
            quartier:     l.quartier,
            prixBase:     Number(l.prixBase),
            capaciteMax:  l.capaciteMax,
            note:         l.note ? Number(l.note) : null,
            totalSejours: l.totalSejours,
            createdAt:    l.creeLe.toISOString(),
            photos:       l.photos,
          })),
        };
      }),
    );

    return { sections: results };
  }

  async create(userId: string, dto: CreateLogementDto): Promise<Logement> {
    const { equipementIds, ...fields } = dto;

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
        ...(fields.latitude !== undefined && { latitude: fields.latitude }),
        ...(fields.longitude !== undefined && { longitude: fields.longitude }),
        ...(fields.nuitesMinimum !== undefined && { nuitesMinimum: fields.nuitesMinimum }),
        ...(fields.ageMin !== undefined && { ageMin: fields.ageMin }),
        ...(fields.reglesMaison !== undefined && { reglesMaison: fields.reglesMaison }),
        ...(fields.instructionsAcces !== undefined && { instructionsAcces: fields.instructionsAcces }),
        statut: StatutLogement.DRAFT,
        ...(equipementIds?.length && {
          equipements: {
            create: equipementIds.map((equipementId) => ({ equipementId })),
          },
        }),
      },
    });

    this.logger.log(`Logement créé [${logement.id}] par utilisateur [${userId}]`);
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
      },
    });

    if (!logement || logement.archiveLe) {
      throw new NotFoundException('Logement introuvable');
    }

    const isOwner = requesterId && logement.proprietaireId === requesterId;

    if (!isOwner && logement.statut !== StatutLogement.PUBLISHED) {
      throw new NotFoundException('Logement introuvable');
    }

    return {
      ...logement,
      equipements: logement.equipements
        .map(e => e.equipement)
        .filter((e): e is NonNullable<typeof e> => e != null),
    } as LogementWithRelations;
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

    this.logger.log(`Logement [${id}] republié par utilisateur [${userId}]`);
    return { message: 'Logement republié' };
  }

  async archive(id: string, userId: string): Promise<{ message: string }> {
    const logement = await this.assertOwner(id, userId);
    await this.assertNoActiveReservations(id);

    const updateData: { archiveLe: Date; statut?: StatutLogement } = {
      archiveLe: new Date(),
    };

    if (logement.statut !== StatutLogement.PAUSED) {
      updateData.statut = StatutLogement.PAUSED;
    }

    await this.prisma.logement.update({ where: { id }, data: updateData });

    this.logger.log(`Logement [${id}] archivé par utilisateur [${userId}]`);
    return { message: 'Logement archivé' };
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
