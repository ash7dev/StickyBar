import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ConciergeLeadsService, CreateLeadDto, UpdateLeadDto } from './concierge-leads.service';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/jwt-payload.type';
import { StatutDemandeManaged } from '@prisma/client';

@Controller()
export class ConciergeLeadsController {
  constructor(private readonly conciergeLeadsService: ConciergeLeadsService) {}

  /**
   * Endpoint public : Soumettre une demande Klef Managed depuis le site client
   */
  @Public()
  @Post('concierge-leads')
  async createLead(@Body() dto: CreateLeadDto) {
    return this.conciergeLeadsService.createLead(dto);
  }

  /**
   * Endpoint gestionnaire : Consulter la liste des demandes prospects
   */
  @Roles(Role.GESTIONNAIRE, Role.ADMIN)
  @Get('gestionnaire/demandes-managed')
  async findAllLeads(
    @Query('statut') statut?: StatutDemandeManaged,
    @Query('query') query?: string,
  ) {
    return this.conciergeLeadsService.findAllLeads(statut, query);
  }

  /**
   * Endpoint gestionnaire : Mettre à jour une demande (statut / notes)
   */
  @Roles(Role.GESTIONNAIRE, Role.ADMIN)
  @Patch('gestionnaire/demandes-managed/:id')
  async updateLead(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.conciergeLeadsService.updateLead(id, dto);
  }

  /**
   * Endpoint gestionnaire : Convertir une demande en bailleur en 1 clic
   */
  @Roles(Role.GESTIONNAIRE, Role.ADMIN)
  @Post('gestionnaire/demandes-managed/:id/convertir')
  async convertLeadToOwner(@Param('id') id: string) {
    return this.conciergeLeadsService.convertLeadToOwner(id);
  }
}
