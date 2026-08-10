import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateEquipementDto, UpdateEquipementDto } from './dto/admin-equipement.dto';

@Injectable()
export class AdminEquipementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipement.findMany({
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }],
      include: {
        _count: {
          select: { logements: true },
        },
      },
    });
  }

  async create(dto: CreateEquipementDto) {
    const existing = await this.prisma.equipement.findUnique({
      where: { nom: dto.nom },
    });

    if (existing) {
      throw new ConflictException(`L'équipement "${dto.nom}" existe déjà`);
    }

    return this.prisma.equipement.create({
      data: {
        nom: dto.nom,
        categorie: dto.categorie,
      },
    });
  }

  async update(id: string, dto: UpdateEquipementDto) {
    const existing = await this.prisma.equipement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Équipement ${id} introuvable`);
    }

    return this.prisma.equipement.update({
      where: { id },
      data: {
        ...(dto.nom && { nom: dto.nom }),
        ...(dto.categorie && { categorie: dto.categorie }),
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.equipement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Équipement ${id} introuvable`);
    }

    await this.prisma.equipement.delete({ where: { id } });
    return { success: true, message: `Équipement "${existing.nom}" supprimé` };
  }
}
