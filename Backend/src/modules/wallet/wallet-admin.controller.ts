import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { AuthUser, Role } from '../../shared/types/jwt-payload.type';
import { WalletService } from './wallet.service';
import { RejectWithdrawalDto } from './dto/process-withdrawal.dto';

@ApiTags('Admin — Wallet')
@ApiBearerAuth()
@Controller('admin/wallet')
@Roles(Role.ADMIN)
export class WalletAdminController {
  constructor(private readonly walletService: WalletService) {}

  @Get('withdrawals')
  @ApiOperation({ summary: 'Lister les retraits en attente' })
  listWithdrawals() {
    return this.walletService.getPendingWithdrawals();
  }

  @Patch('withdrawals/:id/validate')
  @ApiOperation({ summary: 'Valider un retrait (EN_ATTENTE → VALIDE)' })
  @ApiParam({ name: 'id', description: 'UUID du retrait' })
  validate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.walletService.processWithdrawal(id, user.id, { action: 'validate' });
  }

  @Patch('withdrawals/:id/reject')
  @ApiOperation({ summary: 'Rejeter un retrait (EN_ATTENTE → REJETE) — rembourse le solde' })
  @ApiParam({ name: 'id', description: 'UUID du retrait' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.walletService.processWithdrawal(id, user.id, {
      action: 'reject',
      raisonRejet: dto.raisonRejet,
    });
  }
}
