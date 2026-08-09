import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminEquipementsService } from './admin-equipements.service';
import { CreateEquipementDto, UpdateEquipementDto } from './dto/admin-equipement.dto';

@ApiTags('Admin — Equipments Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/equipements')
export class AdminEquipementsController {
  constructor(private readonly service: AdminEquipementsService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter un nouvel équipement au référentiel' })
  create(@Body() dto: CreateEquipementDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un équipement du référentiel' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipement' })
  update(@Param('id') id: string, @Body() dto: UpdateEquipementDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un équipement du référentiel' })
  @ApiParam({ name: 'id', description: 'UUID de l\'équipement' })
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
