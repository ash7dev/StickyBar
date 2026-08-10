import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TerangaClubService } from './teranga-club.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('teranga-club')
export class TerangaClubController {
  constructor(private readonly terangaClubService: TerangaClubService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyAccount(@Req() req: any) {
    const userId = req.user.id;
    return this.terangaClubService.getAccountForUser(userId);
  }

  @Get('quests')
  async getQuests(@Req() req: any) {
    const userId = req.user?.id;
    return this.terangaClubService.getQuestsStatus(userId);
  }
}
