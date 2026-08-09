import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersQueryDto, BlockUserDto, UpdateUserRoleDto } from './dto/admin-users-query.dto';

@ApiTags('Admin — Users & Faults')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lister et rechercher les utilisateurs avec filtres' })
  listUsers(@Query() dto: AdminUsersQueryDto) {
    return this.service.listUsers(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails complets d\'un utilisateur (Profil, Logements, Fautes, Wallet)' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  getUserDetails(@Param('id') id: string) {
    return this.service.getUserDetails(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Bloquer ou débloquer un compte utilisateur' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  updateUserStatus(@Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.service.updateUserStatus(id, dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Mettre à jour le rôle ou statut hôte d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.service.updateUserRole(id, dto.estProprietaire);
  }

  @Post(':id/reset-faults')
  @ApiOperation({ summary: 'Réinitialiser le compteur de fautes/annulations d\'un hôte et réactiver ses logements suspendus' })
  @ApiParam({ name: 'id', description: 'UUID de l\'utilisateur' })
  resetUserFaults(@Param('id') id: string) {
    return this.service.resetUserFaults(id);
  }
}
