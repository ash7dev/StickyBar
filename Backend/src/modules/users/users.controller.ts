import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { Public } from '@shared/decorators/public.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-user.dto';
import { UpdateSecurityDto } from './dto/update-security.dto';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get('owner-profile/:id')
  @ApiOperation({ summary: 'Profil public complet du propriétaire (annonces, statistiques, avis)' })
  getOwnerProfile(@Param('id') id: string) {
    return this.usersService.getPublicOwnerProfile(id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Profil complet de l\'utilisateur connecté' })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Mettre à jour le profil (prénom, nom) et marquer profileCompleted' })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/security')
  @ApiOperation({ summary: 'Définir ou mettre à jour l\'email et le mot de passe du compte' })
  updateSecurity(@CurrentUser() user: AuthUser, @Body() dto: UpdateSecurityDto) {
    return this.usersService.updateSecurity(user.id, dto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Supprimer définitivement mon compte et toutes mes données' })
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
