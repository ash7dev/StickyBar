import { 
  Body, 
  Controller, 
  Post, 
  UseGuards 
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/disputes.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /**
   * Ouvrir un litige sur une réservation
   */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.create(user.id, dto);
  }
}
