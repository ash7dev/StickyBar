import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Role, AuthUser } from '../../shared/types/jwt-payload.type';
import { SupportService } from './support.service';
import { AddTicketMessageDto, UpdateTicketStatusDto } from './dto/support.dto';
import { StatutTicket } from '@prisma/client';

@ApiTags('Admin Support & Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/support/tickets')
export class SupportAdminController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: '[ADMIN] Lister tous les tickets' })
  @ApiQuery({ name: 'statut', enum: StatutTicket, required: false })
  @ApiQuery({ name: 'categorie', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAllTickets(
    @Query('statut') statut?: StatutTicket,
    @Query('categorie') categorie?: string,
    @Query('search') search?: string,
  ) {
    return this.supportService.getAllTicketsAdmin({ statut, categorie, search });
  }

  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Détails d\'un ticket' })
  async getTicketDetails(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id, '', true);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '[ADMIN] Répondre à un ticket' })
  async addAdminReply(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, admin.userId || admin.id, dto, true);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[ADMIN] Modifier le statut / la priorité' })
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateTicketStatusAdmin(id, dto);
  }
}
