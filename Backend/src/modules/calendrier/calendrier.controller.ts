import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Public } from '@shared/decorators/public.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';
import { CalendrierService } from './calendrier.service';
import { CreateIndisponibiliteDto } from './dto/indisponibilite.dto';

@ApiTags('Calendrier')
@Controller('calendrier')
export class CalendrierController {
  constructor(private readonly calendrier: CalendrierService) {}

  @Public()
  @Get(':logementId')
  @ApiOperation({ summary: 'Dates bloquées et réservations actives pour un logement' })
  @ApiParam({ name: 'logementId' })
  getCalendrier(@Param('logementId') logementId: string) {
    return this.calendrier.getCalendrier(logementId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':logementId')
  @HttpCode(201)
  @ApiOperation({ summary: 'Bloquer une plage de dates (owner uniquement)' })
  @ApiParam({ name: 'logementId' })
  createIndisponibilite(
    @Param('logementId') logementId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateIndisponibiliteDto,
  ) {
    return this.calendrier.createIndisponibilite(logementId, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':logementId/:indispoId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Débloquer une plage de dates (owner uniquement)' })
  @ApiParam({ name: 'logementId' })
  @ApiParam({ name: 'indispoId' })
  deleteIndisponibilite(
    @Param('logementId') logementId: string,
    @Param('indispoId') indispoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.calendrier.deleteIndisponibilite(logementId, indispoId, user.id);
  }
}
