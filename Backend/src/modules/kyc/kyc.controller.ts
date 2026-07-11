import { 
  Body, 
  Controller, 
  Get, 
  Post
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { SubmitKycDto, SubmitSelfieDto } from './dto/kyc.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Soumettre ses documents KYC
   */
  @Post('submit')
  async submit(
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    return this.kycService.submit(userId, dto);
  }

  /**
   * Soumettre son selfie KYC
   */
  @Post('submit-selfie')
  async submitSelfie(
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitSelfieDto,
  ) {
    return this.kycService.submitSelfie(userId, dto);
  }

  /**
   * Consulter son statut KYC actuel
   */
  @Get('status')
  async getStatus(@CurrentUser('userId') userId: string) {
    return this.kycService.getStatus(userId);
  }
}
