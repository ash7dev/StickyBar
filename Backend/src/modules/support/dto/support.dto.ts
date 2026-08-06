import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CategorieTicket, PrioriteTicket, StatutTicket } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ description: 'Sujet du ticket de support' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  sujet!: string;

  @ApiProperty({ description: 'Message initial ou description détaillée' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ enum: CategorieTicket, default: CategorieTicket.AUTRE })
  @IsEnum(CategorieTicket)
  @IsOptional()
  categorie?: CategorieTicket;

  @ApiPropertyOptional({ enum: PrioriteTicket, default: PrioriteTicket.MOYENNE })
  @IsEnum(PrioriteTicket)
  @IsOptional()
  priorite?: PrioriteTicket;

  @ApiPropertyOptional({ description: 'ID de la réservation concernée' })
  @IsUUID()
  @IsOptional()
  reservationId?: string;

  @ApiPropertyOptional({ description: 'ID du logement concerné' })
  @IsUUID()
  @IsOptional()
  logementId?: string;
}

export class AddTicketMessageDto {
  @ApiProperty({ description: 'Nouveau message pour le ticket' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: StatutTicket })
  @IsEnum(StatutTicket)
  statut!: StatutTicket;

  @ApiPropertyOptional({ enum: PrioriteTicket })
  @IsEnum(PrioriteTicket)
  @IsOptional()
  priorite?: PrioriteTicket;
}
