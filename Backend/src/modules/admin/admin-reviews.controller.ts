import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewsQueryDto } from './dto/admin-reviews-query.dto';

@ApiTags('Admin — Reviews & Ratings Moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly service: AdminReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister et rechercher les avis voyageurs et hôtes' })
  listReviews(@Query() dto: AdminReviewsQueryDto) {
    return this.service.listReviews(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un avis (ex: diffamatoire ou haineux) et recalculer les notes moyennes' })
  @ApiParam({ name: 'id', description: 'UUID de l\'avis' })
  deleteReview(@Param('id') id: string) {
    return this.service.deleteReview(id);
  }
}
