import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AuthUser, Role } from '../../shared/types/jwt-payload.type';
import { AddPhotoDto } from './dto/add-photo.dto';
import { CreateLogementDto } from './dto/create-logement.dto';
import { CreateTarifNuitsDto } from './dto/create-tarif-nuits.dto';
import { CreateTarifPersonnesDto } from './dto/create-tarif-personnes.dto';
import { UpdateLogementDto } from './dto/update-logement.dto';
import { PricePreviewQueryDto } from './dto/price-preview-query.dto';
import { SearchLogementsDto } from './dto/search-logements.dto';
import { LogementsService } from './logements.service';
import { PricingService } from '../../shared/pricing/pricing.service';

@ApiTags('Listings')
@ApiBearerAuth()
@Controller('listings')
export class LogementsController {
  constructor(
    private readonly logements: LogementsService,
    private readonly pricing: PricingService,
  ) {}

  // Routes statiques en premier (ordre critique avec NestJS)

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Rechercher des logements disponibles (cache Redis 60s)' })
  search(@Query() dto: SearchLogementsDto) {
    return this.logements.search(dto);
  }

  @Get('equipements')
  @Public()
  @ApiOperation({ summary: 'Lister tous les équipements disponibles' })
  listEquipements() {
    return this.logements.listEquipements();
  }

  @Get('feed')
  @Public()
  @ApiOperation({ summary: 'Feed home — toutes les sections en parallèle (cache 5 min)' })
  getFeed() {
    return this.logements.getFeed();
  }

  @Post()
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Créer un nouveau logement (statut DRAFT)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLogementDto) {
    return this.logements.create(user.id, dto);
  }

  @Get('me')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Lister mes logements (non archivés)' })
  findMine(@CurrentUser() user: AuthUser) {
    return this.logements.findMine(user.id);
  }

  // Route statique (:id/price-preview) AVANT la route dynamique (:id)
  @Get(':id/price-preview')
  @Public()
  @ApiOperation({ summary: 'Aperçu du prix pour un logement (public)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  async pricePreview(
    @Param('id') id: string,
    @Query() query: PricePreviewQueryDto,
  ) {
    return this.pricing.calculateForLogement(id, {
      dateDebut: new Date(query.dateDebut),
      dateFin: new Date(query.dateFin),
      nbPersonnes: query.nbPersonnes,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Voir un logement (publié pour tous, tout statut pour le propriétaire)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined) {
    return this.logements.findOne(id, user?.id);
  }

  @Patch(':id')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Mettre à jour un logement' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateLogementDto,
  ) {
    return this.logements.update(id, user.id, dto);
  }

  @Patch(':id/submit')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Soumettre un logement pour révision (DRAFT → PENDING_REVIEW)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  submit(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.logements.submit(id, user.id);
  }

  @Patch(':id/pause')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Mettre en pause un logement publié (PUBLISHED → PAUSED)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  pause(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.logements.pause(id, user.id);
  }

  @Patch(':id/republier')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Republier un logement mis en pause (PAUSED → PUBLISHED)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  republier(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.logements.republier(id, user.id);
  }

  @Delete(':id')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Archiver (soft delete) un logement' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  archive(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.logements.archive(id, user.id);
  }

  @Post(':id/tarifs-personnes')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Remplacer les tarifs par plage de personnes' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiBody({ type: [CreateTarifPersonnesDto] })
  setTarifsPersonnes(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('tarifs') tarifs: CreateTarifPersonnesDto[],
  ) {
    return this.logements.setTarifsPersonnes(id, user.id, tarifs);
  }

  @Post(':id/tarifs-nuits')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Remplacer les tarifs par durée de séjour' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiBody({ type: [CreateTarifNuitsDto] })
  setTarifsNuits(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('tarifs') tarifs: CreateTarifNuitsDto[],
  ) {
    return this.logements.setTarifsNuits(id, user.id, tarifs);
  }

  @Get(':id/photos/upload-params')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Obtenir les paramètres signés pour upload direct vers Cloudinary' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  getPhotoUploadParams(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.logements.getPhotoUploadParams(id, user.id);
  }

  @Post(':id/photos')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(201)
  @ApiOperation({ summary: 'Enregistrer une photo après upload direct Cloudinary' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  addPhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddPhotoDto,
  ) {
    return this.logements.addPhoto(id, user.id, dto);
  }

  @Delete(':id/photos/:photoId')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: 'Supprimer une photo (DB + Cloudinary)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiParam({ name: 'photoId', description: 'UUID de la photo' })
  removePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.logements.removePhoto(id, photoId, user.id);
  }

  @Put(':id/equipements')
  @Roles(Role.PROPRIETAIRE)
  @HttpCode(200)
  @ApiOperation({ summary: "Remplacer la liste complète d'équipements d'un logement" })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiBody({ schema: { type: 'object', properties: { equipementIds: { type: 'array', items: { type: 'string', format: 'uuid' } } } } })
  setEquipements(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('equipementIds') equipementIds: string[],
  ) {
    return this.logements.setEquipements(id, user.id, equipementIds);
  }
}
