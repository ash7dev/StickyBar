import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Patch, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { ResolveDisputeDto } from './dto/disputes.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role, AuthUser } from '@shared/types/jwt-payload.type';
import { StatutLitige } from '@prisma/client';
import { CurrentUser } from '@shared/decorators/current-user.decorator';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DisputesAdminController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * Lister les litiges pour l'admin
   */
  @Get()
  async list(@Query('statut') statut?: StatutLitige) {
    return this.disputesService.listForAdmin(statut);
  }

  /**
   * Résoudre un litige (FONDE / NON_FONDE)
   */
  @Patch(':id/resolve')
  async resolve(
    @Param('id') id: string,
    @CurrentUser() admin: AuthUser,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, admin.id, dto);
  }
}
