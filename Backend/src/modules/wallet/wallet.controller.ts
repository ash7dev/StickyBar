import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../shared/types/jwt-payload.type';
import { WalletService } from './wallet.service';
import { RequestWithdrawalDto } from './dto/withdrawal.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Solde + 20 dernières transactions (jamais en cache)' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.walletService.getMyWallet(user.id);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Demander un retrait (min 10 000 FCFA)' })
  withdraw(
    @CurrentUser() user: AuthUser,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.walletService.requestWithdrawal(user.id, dto);
  }
}
