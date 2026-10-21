import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { Roles } from '@shared/decorators/roles.decorator';
import { AuthUser, Role } from '@shared/types/jwt-payload.type';
import { CreateOwnerBlockDto, OwnerCalendarQueryDto } from './dto/owner-calendar.dto';
import { OwnerCalendarService } from './owner-calendar.service';

@ApiTags('Dashboard propriétaire — Calendrier')
@ApiBearerAuth()
@Controller('dashboard/owner/calendar')
@Roles(Role.PROPRIETAIRE, Role.GESTIONNAIRE)
export class OwnerCalendarController {
  constructor(private readonly calendar: OwnerCalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Réservations et blocages de tous mes logements sur une période' })
  getCalendar(@CurrentUser() user: AuthUser, @Query() query: OwnerCalendarQueryDto) {
    return this.calendar.getCalendar(user.id, query);
  }

  @Post('blocks')
  @HttpCode(201)
  @ApiOperation({ summary: 'Bloquer une période sur un ou plusieurs logements (tout ou rien)' })
  createBlocks(@CurrentUser() user: AuthUser, @Body() dto: CreateOwnerBlockDto) {
    return this.calendar.createBlocks(user.id, dto);
  }

  @Delete('blocks/:blockId')
  @ApiOperation({ summary: 'Supprimer un blocage' })
  deleteBlock(
    @CurrentUser() user: AuthUser,
    @Param('blockId', new ParseUUIDPipe()) blockId: string,
  ) {
    return this.calendar.deleteBlock(user.id, blockId);
  }
}
