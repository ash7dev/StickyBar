import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { SupabaseService } from '@shared/supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        telephone: true,
        avatarUrl: true,
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
        telephone: dto.telephone,
        avatarUrl: dto.avatarUrl,
        dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : undefined,
        profileCompleted: true,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        telephone: true,
        avatarUrl: true,
        dateNaissance: true,
        profileCompleted: true,
      },
    });

    return updated;
  }

  /**
   * Suppression intégrale et irréversible du compte utilisateur
   * Supprime absolument toutes les données liées en cascade (réservations, logements,
   * paiements, wallets, litiges, avis, notifications, profil et Supabase Auth).
   */
  async deleteAccount(userId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { id: true, userId: true, email: true },
    });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    this.logger.warn(`Début de la suppression du compte : ${utilisateur.email} (ID: ${utilisateur.id})`);

    // ── Suppression en Transaction Atomique PostgreSQL ──────────────────────
    await this.prisma.$transaction(async (tx) => {
      // 1. Réservations liées (Locataire ou Propriétaire)
      const userReservations = await tx.reservation.findMany({
        where: {
          OR: [
            { locataireId: utilisateur.id },
            { proprietaireId: utilisateur.id },
          ],
        },
        select: { id: true },
      });
      const resIds = userReservations.map((r) => r.id);

      if (resIds.length > 0) {
        await tx.refund.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.paiement.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.litige.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.photoEtatLieu.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.reservationHistorique.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.idempotencyKey.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.avis.deleteMany({ where: { reservationId: { in: resIds } } });
        await tx.reservation.deleteMany({ where: { id: { in: resIds } } });
      }

      // 2. Logements du propriétaire (si hôte)
      const userLogements = await tx.logement.findMany({
        where: { proprietaireId: utilisateur.id },
        select: { id: true },
      });
      const logementIds = userLogements.map((l) => l.id);

      if (logementIds.length > 0) {
        // Réservations restantes liées aux logements
        const remainingRes = await tx.reservation.findMany({
          where: { logementId: { in: logementIds } },
          select: { id: true },
        });
        const remResIds = remainingRes.map((r) => r.id);

        if (remResIds.length > 0) {
          await tx.refund.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.paiement.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.litige.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.photoEtatLieu.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.reservationHistorique.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.idempotencyKey.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.avis.deleteMany({ where: { reservationId: { in: remResIds } } });
          await tx.reservation.deleteMany({ where: { id: { in: remResIds } } });
        }

        await tx.photoLogement.deleteMany({ where: { logementId: { in: logementIds } } });
        await tx.logementEquipement.deleteMany({ where: { logementId: { in: logementIds } } });
        await tx.tarifPersonnes.deleteMany({ where: { logementId: { in: logementIds } } });
        await tx.tarifNuits.deleteMany({ where: { logementId: { in: logementIds } } });
        await tx.indisponibiliteLogement.deleteMany({ where: { logementId: { in: logementIds } } });
        await tx.logement.deleteMany({ where: { id: { in: logementIds } } });
      }

      // 3. Avis (Auteur ou Cible)
      await tx.avis.deleteMany({
        where: {
          OR: [
            { auteurId: utilisateur.id },
            { cibleId: utilisateur.id },
          ],
        },
      });

      // 4. Wallet & Financement
      const wallet = await tx.wallet.findUnique({
        where: { utilisateurId: utilisateur.id },
        select: { id: true },
      });
      if (wallet) {
        await tx.retrait.deleteMany({ where: { walletId: wallet.id } });
        await tx.transactionWallet.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.delete({ where: { id: wallet.id } });
      }

      // 5. Audit & Logs
      await tx.compteurFaute.deleteMany({ where: { utilisateurId: utilisateur.id } });
      await tx.notificationLog.deleteMany({ where: { utilisateurId: utilisateur.id } });
      await tx.pushSubscription.deleteMany({ where: { userId: utilisateur.userId } });

      // 6. Suppression de la fiche Utilisateur et du Profile Supabase
      await tx.utilisateur.delete({ where: { id: utilisateur.id } });
      await tx.profile.deleteMany({ where: { userId: utilisateur.userId } });
    });

    // 7. Suppression dans Supabase Auth
    try {
      await this.supabase.getAdmin().auth.admin.deleteUser(utilisateur.userId);
      this.logger.log(`Compte Supabase Auth supprimé pour userId: ${utilisateur.userId}`);
    } catch (e: unknown) {
      const err = e as Error;
      this.logger.warn(`Compte Supabase Auth introuvable ou déjà nettoyé: ${err?.message}`);
    }

    return { success: true, message: 'Compte et données supprimés définitivement.' };
  }
}
