import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Role, AuthUser } from '../../shared/types/jwt-payload.type';
import { AdminReservationsService } from './admin-reservations.service';
import { AdminReservationsQueryDto, ForceCancelReservationDto } from './dto/admin-reservations-query.dto';

@ApiTags('Admin — Reservations Oversight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reservations')
export class AdminReservationsController {
  constructor(private readonly service: AdminReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister et rechercher toutes les réservations de la plateforme' })
  listReservations(@Query() dto: AdminReservationsQueryDto) {
    return this.service.listReservations(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails complets d\'une réservation (Tarifs, Paiement, État des lieux, Timeline)' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  getReservationDetails(@Param('id') id: string) {
    return this.service.getReservationDetails(id);
  }

  @Post(':id/force-cancel')
  @ApiOperation({ summary: 'Annulation administrative forcée d\'une réservation avec remboursement paramétrable' })
  @ApiParam({ name: 'id', description: 'UUID de la réservation' })
  forceCancel(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() dto: ForceCancelReservationDto,
  ) {
    return this.service.forceCancel(id, admin.id, dto);
  }
}
