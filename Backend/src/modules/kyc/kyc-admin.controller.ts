import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Patch, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { RejectKycDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { Role } from '@shared/types/jwt-payload.type';
import { StatutKyc } from '@prisma/client';

@Controller('admin/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class KycAdminController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Lister les KYC (par défaut ceux en attente)
   */
  @Get()
  async list(@Query('statut') statut?: StatutKyc) {
    return this.kycService.listForAdmin(statut);
  }

  /**
   * Valider le KYC d'un utilisateur
   */
  @Patch(':id/verify')
  async verify(@Param('id') id: string) {
    return this.kycService.verify(id);
  }

  /**
   * Rejeter le KYC d'un utilisateur
   */
  @Patch(':id/reject')
  async reject(@Param('id') id: string, @Body() dto: RejectKycDto) {
    return this.kycService.reject(id, dto);
  }

  /**
   * Marquer un KYC pour renouvellement (document expiré)
   */
  @Patch(':id/flag-renewal')
  async flagRenewal(@Param('id') id: string) {
    return this.kycService.flagRenewal(id);
  }
}
