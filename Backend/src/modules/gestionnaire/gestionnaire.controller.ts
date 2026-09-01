import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../shared/types/jwt-payload.type';
import { WalletService } from '../wallet/wallet.service';
import { LogementsService } from '../logements/logements.service';
import { GestionnaireService } from './gestionnaire.service';
import { RequestWithdrawalDto } from '../wallet/dto/withdrawal.dto';

@ApiTags('Gestionnaire (Conciergerie)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gestionnaire')
export class GestionnaireController {
  constructor(
    private readonly walletService: WalletService,
    private readonly logementsService: LogementsService,
    private readonly gestionnaireService: GestionnaireService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Obtenir la vue synthétique complète du tableau de bord conciergerie (KPIs, graphiques, séjours)' })
  async getDashboardStats(@CurrentUser() user: AuthUser) {
    return this.gestionnaireService.getDashboardStats(user.id);
  }

  @Get('logements')
  @ApiOperation({ summary: 'Obtenir la liste de tous les logements gérés par le gestionnaire' })
  async getManagedListings(@CurrentUser() user: AuthUser) {
    return this.logementsService.findMine(user.id);
  }

  @Get('proprietaires')
  @ApiOperation({ summary: 'Obtenir la liste des propriétaires partenaires et le solde de leurs wallets' })
  async getManagedOwners(@CurrentUser() user: AuthUser) {
    return this.walletService.getManagedProprietairesAndWallets(user.id);
  }

  @Get('proprietaires-all')
  @ApiOperation({ summary: 'Obtenir la liste de tous les propriétaires inscrits pour sélection lors de la création d\'une annonce' })
  async getAllProprietaires() {
    return this.walletService.getAllProprietaires();
  }

  @Post('proprietaires/:ownerId/retrait')
  @ApiOperation({ summary: 'Déclencher une demande de retrait (payout) pour un propriétaire partenaire' })
  async requestOwnerWithdrawal(
    @CurrentUser() user: AuthUser,
    @Param('ownerId') ownerId: string,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.walletService.requestWithdrawalForOwner(user.id, ownerId, dto);
  }
}
