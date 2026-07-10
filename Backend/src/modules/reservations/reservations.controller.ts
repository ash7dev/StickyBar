import { Body, Controller, Get, Post, Patch, Param, Headers, ParseArrayPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AuthUser, Role } from '../../shared/types/jwt-payload.type';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ConfirmReservationDto } from './dto/confirm-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CheckinRefuseDto } from './dto/checkin-refuse.dto';
import { AddEtatLieuxPhotoDto } from './dto/add-etat-lieux-photo.dto';
import { SignalTenantNoshowDto } from './dto/signal-tenant-noshow.dto';
import { RateTenantDto } from './dto/rate-tenant.dto';
import { RateOwnerDto } from './dto/rate-owner.dto';
import { ReservationsService } from './reservations.service';
import { StatutReservation } from '@prisma/client';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lister mes réservations (proprio ou locataire selon rôle actif)' })
  findMine(
    @CurrentUser() user: AuthUser,
    @Query('statut') statut?: StatutReservation,
  ) {
    return this.reservationsService.findMine(user.id, user.activeRole, statut);
  }

  @Get(':id/etat-lieux/upload-params')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Obtenir les paramètres de signature pour upload direct Cloudinary (état des lieux)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  getEtatLieuxUploadParams(@Param('id') id: string) {
    return this.reservationsService.getEtatLieuxUploadParams(id);
  }

  @Post(':id/etat-lieux')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Sauvegarder une photo état des lieux après upload Cloudinary direct' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  addEtatLieuxPhoto(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: AddEtatLieuxPhotoDto,
  ) {
    return this.reservationsService.addEtatLieuxPhoto(id, user.id, dto);
  }

  @Post(':id/checkin-proprio')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Propriétaire finalise le check-in (photos uploadées via Cloudinary direct)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  checkinProprio(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.checkinProprio(id, user.id);
  }

  @Post(':id/checkout-proprio')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Propriétaire finalise le check-out (photos uploadées via Cloudinary direct)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  checkoutProprio(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.checkoutProprio(id, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une réservation' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Initier une réservation avec paiement' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReservationDto,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.reservationsService.create(user, dto, idempotencyKey);
  }

  @Patch(':id/confirm')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Confirmer une réservation (propriétaire uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ConfirmReservationDto) {
    return this.reservationsService.confirm(id, user.id, dto.heureDebut);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annuler une réservation (locataire ou propriétaire)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CancelReservationDto,
  ) {
    return this.reservationsService.cancel(id, user.id, dto.raison);
  }

  @Post(':id/checkin/upload')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Propriétaire uploade les photos de l\'état des lieux (check-in)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  @ApiBody({ schema: { type: 'object', properties: { photos: { type: 'array', items: { type: 'string' } } } } })
  uploadCheckInPhotos(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('photos', new ParseArrayPipe({ items: String })) photos: string[],
  ) {
    return this.reservationsService.uploadCheckInPhotos(id, user.id, photos);
  }

  @Post(':id/checkin/confirm')
  @ApiOperation({ summary: 'Locataire confirme le check-in (irréversible — débloque les fonds)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  confirmCheckIn(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.confirmCheckIn(id, user.id);
  }

  @Post(':id/checkin/refuse')
  @ApiOperation({ summary: 'Locataire refuse le check-in pour non-conformité' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  refuseCheckIn(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CheckinRefuseDto,
  ) {
    return this.reservationsService.refuseCheckIn(id, user.id, dto.motif, dto.commentaire);
  }

  @Post(':id/absent')
  @ApiOperation({ summary: 'Locataire signale le propriétaire injoignable le jour J' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  reportProprioAbsent(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.reportProprioAbsent(id, user.id);
  }

  @Post(':id/checkout/upload')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Propriétaire uploade les photos de check-out' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  @ApiBody({ schema: { type: 'object', properties: { photos: { type: 'array', items: { type: 'string' } } } } })
  uploadCheckOutPhotos(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body('photos', new ParseArrayPipe({ items: String })) photos: string[],
  ) {
    return this.reservationsService.uploadCheckOutPhotos(id, user.id, photos);
  }

  @Patch(':id/checkout/complete')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Propriétaire finalise le check-out' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  completeCheckout(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.completeCheckout(id, user.id);
  }

  @Post(':id/signal-noshow')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Signaler l\'absence du locataire (T+2h après début)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  signalTenantNoshow(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SignalTenantNoshowDto,
  ) {
    return this.reservationsService.signalTenantNoshow(user.id, id, dto.commentaire);
  }

  @Post(':id/rate-tenant')
  @Roles(Role.PROPRIETAIRE)
  @ApiOperation({ summary: 'Noter le locataire (réservation terminée uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  rateTenant(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RateTenantDto,
  ) {
    return this.reservationsService.rateTenant(user.id, id, dto.note, dto.commentaire);
  }

  @Post(':id/rate-owner')
  @Roles(Role.LOCATAIRE)
  @ApiOperation({ summary: 'Noter le propriétaire (réservation terminée uniquement)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  rateOwner(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RateOwnerDto,
  ) {
    return this.reservationsService.rateOwner(user.id, id, dto.note, dto.commentaire);
  }
}
