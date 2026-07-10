import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
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
import { Roles } from '../../shared/decorators/roles.decorator';
import { AuthUser, Role } from '../../shared/types/jwt-payload.type';
import { AdminListingsQueryDto } from './dto/admin-listings-query.dto';
import { ReviewListingDto } from './dto/review-listing.dto';
import { AdminListingsService } from './admin-listings.service';

@ApiTags('Admin — Listings')
@ApiBearerAuth()
@Controller('admin/listings')
@Roles(Role.ADMIN)
export class AdminListingsController {
  constructor(private readonly service: AdminListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les annonces par statut (défaut : PENDING_REVIEW)' })
  list(@Query() dto: AdminListingsQueryDto) {
    return this.service.listForReview(dto);
  }

  @Patch(':id/publish')
  @HttpCode(200)
  @ApiOperation({ summary: 'Publier une annonce (PENDING_REVIEW → PUBLISHED)' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.publish(id, user.id);
  }

  @Patch(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rejeter une annonce (PENDING_REVIEW → REJECTED) — raison obligatoire' })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiBody({ type: ReviewListingDto })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewListingDto,
  ) {
    return this.service.reject(id, user.id, dto.raison);
  }

  @Patch(':id/suspend')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Suspendre une annonce (PUBLISHED → SUSPENDED) — annule les réservations CONFIRMED futures avec remboursement 100%',
  })
  @ApiParam({ name: 'id', description: 'UUID du logement' })
  @ApiBody({ type: ReviewListingDto })
  suspend(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewListingDto,
  ) {
    return this.service.suspend(id, user.id, dto.raison);
  }
}
