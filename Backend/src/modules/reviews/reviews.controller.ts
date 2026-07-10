import { 
  Body, 
  Controller, 
  Post, 
  UseGuards 
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { AuthUser } from '@shared/types/jwt-payload.type';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Créer un avis
   */
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, dto);
  }
}
