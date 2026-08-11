import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { TerangaClubService } from './teranga-club.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CodeBadgeTeranga } from '@prisma/client';

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

  @Post('quests/:code/claim')
  @UseGuards(JwtAuthGuard)
  async claimQuest(@Req() req: any, @Param('code') code: string) {
    const userId = req.user.id;
    return this.terangaClubService.claimQuest(userId, code as CodeBadgeTeranga);
  }

  @Get('referral')
  @UseGuards(JwtAuthGuard)
  async getReferralInfo(@Req() req: any) {
    const userId = req.user.id;
    return this.terangaClubService.getReferralInfo(userId);
  }
}
