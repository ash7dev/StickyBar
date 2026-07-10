import { Injectable } from '@nestjs/common';
import { TypeFaute } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export interface EnregistrerFauteInput {
  utilisateurId: string;
  type: TypeFaute;
  reservationId?: string;
  description?: string;
  penalite?: number;
}

@Injectable()
export class EnregistrerFauteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: EnregistrerFauteInput): Promise<void> {
    await this.prisma.compteurFaute.create({
      data: {
        utilisateurId: input.utilisateurId,
        type: input.type,
        reservationId: input.reservationId,
        description: input.description,
        penalite: input.penalite,
      },
    });
  }
}
