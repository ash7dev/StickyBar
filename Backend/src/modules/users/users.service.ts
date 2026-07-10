import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        dateNaissance: true,
        profileCompleted: true,
        phoneVerified: true,
        statutKyc: true,
        estProprietaire: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!utilisateur) throw new NotFoundException('Utilisateur introuvable');

    const updated = await this.prisma.utilisateur.update({
      where: { id: userId },
      data: {
        prenom: dto.prenom,
        nom: dto.nom,
        dateNaissance: new Date(dto.dateNaissance),
        profileCompleted: true,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        dateNaissance: true,
        profileCompleted: true,
      },
    });

    return updated;
  }
}
