import { Injectable, Logger } from '@nestjs/common';
import { CanalNotification, StatutNotification, TypeNotification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PushService, PushPayload } from '../push/push.service';

export interface DispatchInput {
  userId: string;
  type: TypeNotification;
  payload: Record<string, unknown>;
  reservationId?: string;
}

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppService,
    private readonly push: PushService,
  ) {}

  async dispatch(input: DispatchInput): Promise<void> {
    const { userId, type, payload, reservationId } = input;

    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { telephone: true, phoneVerified: true },
    });

    if (!user) {
      this.logger.warn(`[Dispatcher] Utilisateur ${userId} introuvable`);
      return;
    }

    const { text, title } = buildMessage(type, payload);

    await Promise.allSettled([
      user.phoneVerified && user.telephone
        ? this.sendWhatsApp(userId, user.telephone, type, text, reservationId)
        : Promise.resolve(),
      this.sendPush(userId, type, { title, body: text }, reservationId),
    ]);
  }

  private async sendWhatsApp(
    userId: string,
    phone: string,
    type: TypeNotification,
    text: string,
    reservationId?: string,
  ): Promise<void> {
    const log = await this.prisma.notificationLog.create({
      data: {
        utilisateurId: userId,
        canal: CanalNotification.WHATSAPP,
        type,
        reservationId,
        contenu: text,
        statut: StatutNotification.EN_ATTENTE,
      },
    });

    const ok = await this.whatsapp.sendText(phone, text);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        statut: ok ? StatutNotification.ENVOYE : StatutNotification.ECHOUE,
        envoyeLe: ok ? new Date() : undefined,
        erreur: ok ? undefined : 'Échec envoi WhatsApp',
      },
    });
  }

  private async sendPush(
    userId: string,
    type: TypeNotification,
    pushPayload: PushPayload,
    reservationId?: string,
  ): Promise<void> {
    const log = await this.prisma.notificationLog.create({
      data: {
        utilisateurId: userId,
        canal: CanalNotification.PUSH,
        type,
        reservationId,
        contenu: pushPayload.body,
        statut: StatutNotification.EN_ATTENTE,
      },
    });

    const sent = await this.push.sendToUser(userId, pushPayload);

    await this.prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        statut: sent > 0 ? StatutNotification.ENVOYE : StatutNotification.ECHOUE,
        envoyeLe: sent > 0 ? new Date() : undefined,
        erreur: sent > 0 ? undefined : 'Aucun abonnement Push actif',
      },
    });
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildMessage(
  type: TypeNotification,
  payload: Record<string, unknown>,
): { text: string; title: string } {
  const p = (key: string, fallback = '') => String(payload[key] ?? fallback);

  const map: Partial<Record<TypeNotification, { title: string; text: string }>> = {
    RESERVATION_CREEE_LOCATAIRE: {
      title: 'Réservation créée',
      text: `Votre réservation au "${p('logementTitre')}" du ${p('dateDebut')} au ${p('dateFin')} est en attente de paiement.`,
    },
    RESERVATION_CREEE_PROPRIO: {
      title: 'Nouvelle réservation',
      text: `Nouvelle demande pour "${p('logementTitre')}" du ${p('dateDebut')} au ${p('dateFin')}. Vous avez ${p('delai', '48h')} pour confirmer.`,
    },
    RESERVATION_CONFIRMEE: {
      title: 'Réservation confirmée !',
      text: `Bonne nouvelle ! Votre réservation au "${p('logementTitre')}" est confirmée pour le ${p('dateDebut')}.`,
    },
    RESERVATION_EXPIREE: {
      title: 'Réservation expirée',
      text: `Votre réservation au "${p('logementTitre')}" a expiré faute de ${p('raison', 'confirmation')}.`,
    },
    RESERVATION_ANNULEE: {
      title: 'Réservation annulée',
      text: `Votre réservation au "${p('logementTitre')}" du ${p('dateDebut')} a été annulée.`,
    },
    RAPPEL_CONFIRMATION: {
      title: 'Rappel : réservation en attente',
      text: `Rappel : confirmez la réservation pour "${p('logementTitre')}" du ${p('dateDebut')} au ${p('dateFin')}. Délai restant : ${p('delaiRestant')}.`,
    },
    RAPPEL_JOUR_J: {
      title: 'Votre séjour commence demain !',
      text: `Rappel : séjour au "${p('logementTitre')}" demain le ${p('dateDebut')}. Adresse : ${p('adresse')}.`,
    },
    CHECKIN_PHOTOS_UPLOADEES: {
      title: 'Photos état des lieux disponibles',
      text: `Le propriétaire a uploadé les photos de l'état des lieux pour "${p('logementTitre')}". Validez-les pour confirmer le check-in.`,
    },
    CHECKIN_VALIDE: {
      title: 'Check-in validé',
      text: `Votre check-in au "${p('logementTitre')}" est confirmé. Bon séjour !`,
    },
    CHECKOUT_VALIDE: {
      title: 'Checkout confirmé',
      text: `Le checkout de votre séjour au "${p('logementTitre')}" est confirmé. Merci pour votre confiance !`,
    },
    ABSENCE_PROPRIO_ALERTE: {
      title: 'Propriétaire absent',
      text: `Le propriétaire de "${p('logementTitre')}" ne répond pas. Notre équipe suit la situation.`,
    },
    ABSENCE_PROPRIO_CONFIRMEE: {
      title: 'Absence confirmée — remboursement en cours',
      text: `L'absence du propriétaire pour "${p('logementTitre')}" est confirmée. Remboursement en cours.`,
    },
    PAIEMENT_DISPONIBLE: {
      title: 'Paiement disponible',
      text: `${p('montant')} XOF sont disponibles dans votre portefeuille pour "${p('logementTitre')}".`,
    },
    PENALITE_APPLIQUEE: {
      title: 'Pénalité appliquée',
      text: `Une pénalité de ${p('montant')} XOF a été appliquée : ${p('raison')}.`,
    },
    KYC_VALIDE: {
      title: 'Identité vérifiée',
      text: 'Votre identité a été vérifiée. Vous pouvez effectuer des réservations sur ImmoLoc.',
    },
    KYC_REJETE: {
      title: 'Vérification KYC rejetée',
      text: `Votre dossier KYC a été rejeté : ${p('raison')}. Soumettez de nouveaux documents.`,
    },
    KYC_A_RENOUVELER: {
      title: 'Documents KYC à renouveler',
      text: 'Vos documents KYC sont expirés. Soumettez-en de nouveaux pour continuer à utiliser ImmoLoc.',
    },
    ANNONCE_VALIDEE: {
      title: 'Annonce validée !',
      text: `Votre annonce "${p('logementTitre')}" est maintenant visible sur ImmoLoc.`,
    },
    ANNONCE_REJETEE: {
      title: 'Annonce rejetée',
      text: `Votre annonce "${p('logementTitre')}" a été rejetée : ${p('raison')}.`,
    },
    ANNONCE_SUSPENDUE: {
      title: 'Annonce suspendue',
      text: `Votre annonce "${p('logementTitre')}" est suspendue : ${p('raison')}.`,
    },
    LITIGE_DECLARE: {
      title: 'Litige déclaré',
      text: `Un litige a été déclaré pour votre réservation au "${p('logementTitre')}". Notre équipe examine la situation.`,
    },
    LITIGE_RESOLU: {
      title: 'Litige résolu',
      text: `Le litige pour "${p('logementTitre')}" a été résolu. ${p('resolution')}`,
    },
    RETRAIT_EFFECTUE: {
      title: 'Retrait effectué',
      text: `Votre retrait de ${p('montant')} XOF a été effectué avec succès.`,
    },
    RETRAIT_REJETE: {
      title: 'Retrait rejeté',
      text: `Votre retrait de ${p('montant')} XOF a été rejeté : ${p('raison')}.`,
    },
  };

  return map[type] ?? { title: 'ImmoLoc', text: `Notification ImmoLoc : ${type}` };
}
