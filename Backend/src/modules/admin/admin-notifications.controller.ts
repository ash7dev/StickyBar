import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { AdminNotificationsService } from './admin-notifications.service';
import { BroadcastNotificationDto, AdminNotificationsQueryDto } from './dto/admin-notifications.dto';

@ApiTags('Admin — Notifications & Broadcast')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly service: AdminNotificationsService) {}

  @Post('broadcast')
  @ApiOperation({ summary: 'Envoyer une notification groupée (Push/SMS) à un groupe d\'utilisateurs' })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.service.broadcast(dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Audit et historique des notifications envoyées (NotificationLog)' })
  listLogs(@Query() dto: AdminNotificationsQueryDto) {
    return this.service.listLogs(dto);
  }
}
