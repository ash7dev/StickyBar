import { Controller, Delete, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Mes logements gardés (du plus récent au plus ancien)' })
  list(@CurrentUser() user: AuthUser) {
    return this.favorites.list(user.id);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Identifiants des logements gardés' })
  ids(@CurrentUser() user: AuthUser) {
    return this.favorites.ids(user.id);
  }

  @Put(':logementId')
  @ApiOperation({ summary: 'Garder un logement (idempotent)' })
  @ApiParam({ name: 'logementId', description: 'UUID du logement' })
  add(@CurrentUser() user: AuthUser, @Param('logementId', ParseUUIDPipe) logementId: string) {
    return this.favorites.add(user.id, logementId);
  }

  @Delete(':logementId')
  @ApiOperation({ summary: 'Ne plus garder un logement' })
  @ApiParam({ name: 'logementId', description: 'UUID du logement' })
  remove(@CurrentUser() user: AuthUser, @Param('logementId', ParseUUIDPipe) logementId: string) {
    return this.favorites.remove(user.id, logementId);
  }
}
