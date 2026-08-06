import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { AuthUser } from '../../shared/types/jwt-payload.type';
import { SupportService } from './support.service';
import { CreateTicketDto, AddTicketMessageDto } from './dto/support.dto';

@ApiTags('Support & Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un ticket de support' })
  async createTicket(@CurrentUser() user: AuthUser, @Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(user.userId || user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister mes tickets de support' })
  async getMyTickets(@CurrentUser() user: AuthUser) {
    return this.supportService.getTicketsForUser(user.userId || user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un ticket' })
  async getTicketDetails(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.supportService.getTicketDetails(id, user.userId || user.id, false);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ajouter un message au ticket' })
  async addMessage(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
  ) {
    return this.supportService.addMessage(id, user.userId || user.id, dto, false);
  }
}
