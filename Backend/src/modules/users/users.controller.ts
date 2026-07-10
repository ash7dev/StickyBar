import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-user.dto';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
