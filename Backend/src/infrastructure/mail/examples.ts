/**
 * Exemples d'utilisation du service d'emails Klef
 *
 * Ce fichier contient des exemples concrets d'utilisation
 * pour chaque type d'email disponible.
 */

import { MailService } from './mail.service';
import {
  BookingConfirmationContext,
  BookingRequestContext,
  BookingReminderContext,
  BookingCancellationContext,
  PaymentSuccessContext,
  NewMessageContext,
  ReviewRequestContext,
  DisputeCreatedContext,
} from './types';

/**
 * Exemple : Email de bienvenue
 */
export async function exampleWelcomeEmail(mailService: MailService) {
  await mailService.sendWelcomeEmail(
    'jean.dupont@example.com',
    'Jean Dupont'
  );
}

/**
 * Exemple : Email de vérification
 */
export async function exampleVerificationEmail(mailService: MailService) {
  const verificationToken = 'abc123def456'; // Généré par votre système
  const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

  await mailService.sendVerificationEmail(
    'jean.dupont@example.com',
    'Jean Dupont',
    verificationUrl
  );
}

/**
 * Exemple : Email de réinitialisation de mot de passe
 */
export async function examplePasswordResetEmail(mailService: MailService) {
  const resetToken = 'xyz789abc123'; // Généré par votre système
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

  await mailService.sendPasswordResetEmail(
    'jean.dupont@example.com',
    'Jean Dupont',
    resetUrl
  );
}

/**
 * Exemple : Email de confirmation de réservation (voyageur)
 */
export async function exampleBookingConfirmation(mailService: MailService) {
  const bookingDetails: BookingConfirmationContext = {
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    bookingReference: 'KLF-2024-001234',
    bookingId: 'booking-uuid-123',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    guestCount: 4,
    hostName: 'Marie Martin',
    hostVerified: true,
    nightCount: 5,
    rentAmount: 500000,
    cleaningFee: 25000,
    serviceFee: 52500,
    totalAmount: 577500,
    cancellationPolicy: 'Annulation flexible : Remboursement intégral jusqu\'à 24h avant l\'arrivée',
  };

  await mailService.sendBookingConfirmation(
    'jean.dupont@example.com',
    bookingDetails
  );
}

/**
 * Exemple : Email de demande de réservation (propriétaire)
 */
export async function exampleBookingRequest(mailService: MailService) {
  const bookingDetails: BookingRequestContext = {
    hostName: 'Marie Martin',
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    bookingRequestId: 'request-uuid-456',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    nightCount: 5,
    guestCount: 4,
    hostEarnings: 472500, // 90% du total après frais de service
    guestInitials: 'JD',
    guestMemberSince: 'mars 2023',
    guestVerified: true,
    guestReviewsCount: 8,
    guestRating: 4.8,
    guestBookingsCount: 12,
    guestMessage: 'Bonjour, nous sommes une famille de 4 personnes cherchant un endroit calme pour nos vacances. Nous prenons grand soin des logements que nous louons.',
    nightlyRate: 100000,
    totalRent: 500000,
    cleaningFee: 25000,
    serviceFee: 52500,
    serviceFeePercentage: 10,
    guestTotal: 577500,
  };

  await mailService.sendBookingRequest(
    'marie.martin@example.com',
    bookingDetails
  );
}

/**
 * Exemple : Email de rappel de réservation (24h avant)
 */
export async function exampleBookingReminder(mailService: MailService) {
  const bookingDetails: BookingReminderContext = {
    guestName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    checkInDate: '15 janvier 2024',
    checkInTime: '15:00',
    checkOutDate: '20 janvier 2024',
    checkOutTime: '11:00',
    propertyAddress: 'Cocody, Angré 8ème Tranche, Abidjan, Côte d\'Ivoire',
    hostName: 'Marie Martin',
    hostVerified: true,
    hostPhone: '+225 07 12 34 56 78',
    hostEmail: 'marie.martin@example.com',
    conversationId: 'conv-uuid-789',
    checkInInstructions: `Rendez-vous directement à l'adresse indiquée. Le gardien vous accueillera et vous remettra les clés.

Code portail : 1234
Parking disponible dans la cour.
WiFi : VillaModerne / mot de passe : Cocody2024`,
    bookingId: 'booking-uuid-123',
    bookingReference: 'KLF-2024-001234',
    nightCount: 5,
    guestCount: 4,
    propertyLatitude: 5.3599517,
    propertyLongitude: -4.0082563,
  };

  await mailService.sendBookingReminder(
    'jean.dupont@example.com',
    bookingDetails
  );
}

/**
 * Exemple : Email d'annulation de réservation (avec remboursement)
 */
export async function exampleBookingCancellationWithRefund(mailService: MailService) {
  const cancellationDetails: BookingCancellationContext = {
    userName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    bookingReference: 'KLF-2024-001234',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    nightCount: 5,
    cancellationDate: '10 janvier 2024',
    cancelledBy: 'Le voyageur',
    cancellationReason: 'Changement de plans',
    refundAmount: 577500,
    totalAmount: 577500,
    refundDelay: '5 à 7 jours ouvrables',
    cancellationPolicyName: 'Annulation flexible',
    cancellationPolicyDescription: 'Remboursement intégral si vous annulez au moins 24 heures avant l\'arrivée.',
    cancelledByHost: false,
    bookingId: 'booking-uuid-123',
    guestCount: 4,
    cancellationReference: 'CAN-2024-001234',
  };

  await mailService.sendBookingCancellation(
    'jean.dupont@example.com',
    cancellationDetails
  );
}

/**
 * Exemple : Email d'annulation par le propriétaire
 */
export async function exampleBookingCancellationByHost(mailService: MailService) {
  const cancellationDetails: BookingCancellationContext = {
    userName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    bookingReference: 'KLF-2024-001234',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    nightCount: 5,
    cancellationDate: '10 janvier 2024',
    cancelledBy: 'Le propriétaire',
    cancellationReason: 'Problème technique imprévu',
    refundAmount: 577500, // Remboursement intégral
    totalAmount: 577500,
    refundDelay: '2 à 3 jours ouvrables',
    cancellationPolicyName: 'Annulation par l\'hôte',
    cancellationPolicyDescription: 'Remboursement intégral automatique en cas d\'annulation par le propriétaire.',
    cancelledByHost: true,
    bookingId: 'booking-uuid-123',
    guestCount: 4,
    cancellationReference: 'CAN-2024-001234',
  };

  await mailService.sendBookingCancellation(
    'jean.dupont@example.com',
    cancellationDetails
  );
}

/**
 * Exemple : Email de paiement réussi
 */
export async function examplePaymentSuccess(mailService: MailService) {
  const paymentDetails: PaymentSuccessContext = {
    userName: 'Jean Dupont',
    amount: 577500,
    transactionId: 'TXN-2024-001234',
    paymentDate: '10 janvier 2024 à 14:32',
    paymentMethod: 'Orange Money',
    description: 'Réservation - Villa moderne avec piscine',
    bookingReference: 'KLF-2024-001234',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    bookingId: 'booking-uuid-123',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    items: [
      { label: 'Loyer (5 nuits)', amount: 500000 },
      { label: 'Frais de ménage', amount: 25000 },
      { label: 'Frais de service Klef', amount: 52500 },
    ],
    taxAmount: 0, // Pas de TVA pour cet exemple
    receiptUrl: `${process.env.APP_URL}/receipts/TXN-2024-001234`,
  };

  await mailService.sendPaymentSuccess(
    'jean.dupont@example.com',
    paymentDetails
  );
}

/**
 * Exemple : Email de nouveau message
 */
export async function exampleNewMessage(mailService: MailService) {
  const messageDetails: NewMessageContext = {
    recipientName: 'Marie Martin',
    senderName: 'Jean Dupont',
    senderInitials: 'JD',
    senderVerified: true,
    senderRole: 'Voyageur',
    messageDate: 'il y a 5 minutes',
    messageContent: `Bonjour Marie,

J'ai une question concernant le stationnement. Y a-t-il de la place pour deux voitures ?

Aussi, est-il possible d'arriver un peu plus tôt, vers 13h ?

Merci d'avance !`,
    conversationId: 'conv-uuid-789',
    bookingReference: 'KLF-2024-001234',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    isInquiry: false,
  };

  await mailService.sendNewMessage(
    'marie.martin@example.com',
    messageDetails
  );
}

/**
 * Exemple : Email de demande d'avis
 */
export async function exampleReviewRequest(mailService: MailService) {
  const reviewDetails: ReviewRequestContext = {
    userName: 'Jean Dupont',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    propertyImage: 'https://images.klef.com/properties/villa-cocody.jpg',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    hostName: 'Marie Martin',
    bookingReference: 'KLF-2024-001234',
    bookingId: 'booking-uuid-123',
    reviewDeadline: '3 février 2024',
  };

  await mailService.sendReviewRequest(
    'jean.dupont@example.com',
    reviewDetails
  );
}

/**
 * Exemple : Email de création de litige (créateur)
 */
export async function exampleDisputeCreatedByUser(mailService: MailService) {
  const disputeDetails: DisputeCreatedContext = {
    userName: 'Jean Dupont',
    isCreator: true,
    disputeId: 'DSP-2024-001',
    disputeSubject: 'Problème de propreté',
    disputeCategory: 'Propreté et hygiène',
    disputeDescription: `À notre arrivée, nous avons constaté que le logement n'était pas dans l'état de propreté annoncé. La cuisine n'avait pas été nettoyée et la salle de bain présentait des traces de moisissure.

Nous avons pris des photos à notre arrivée pour documenter la situation.

Nous demandons un remboursement partiel de 100 000 FCFA compte tenu de ces désagréments.`,
    disputeCreatedDate: '16 janvier 2024',
    disputeAmount: 100000,
    evidenceCount: 5,
    creatorName: 'Jean Dupont',
    bookingReference: 'KLF-2024-001234',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    guestName: 'Jean Dupont',
    hostName: 'Marie Martin',
    bookingAmount: 577500,
    responseDeadline: '18 janvier 2024',
  };

  await mailService.sendDisputeCreated(
    'jean.dupont@example.com',
    disputeDetails
  );
}

/**
 * Exemple : Email de création de litige (partie adverse)
 */
export async function exampleDisputeNotification(mailService: MailService) {
  const disputeDetails: DisputeCreatedContext = {
    userName: 'Marie Martin',
    isCreator: false,
    disputeId: 'DSP-2024-001',
    disputeSubject: 'Problème de propreté',
    disputeCategory: 'Propreté et hygiène',
    disputeDescription: `À notre arrivée, nous avons constaté que le logement n'était pas dans l'état de propreté annoncé. La cuisine n'avait pas été nettoyée et la salle de bain présentait des traces de moisissure.

Nous avons pris des photos à notre arrivée pour documenter la situation.

Nous demandons un remboursement partiel de 100 000 FCFA compte tenu de ces désagréments.`,
    disputeCreatedDate: '16 janvier 2024',
    disputeAmount: 100000,
    evidenceCount: 5,
    creatorName: 'Jean Dupont',
    bookingReference: 'KLF-2024-001234',
    propertyTitle: 'Villa moderne avec piscine à Cocody',
    checkInDate: '15 janvier 2024',
    checkOutDate: '20 janvier 2024',
    guestName: 'Jean Dupont',
    hostName: 'Marie Martin',
    bookingAmount: 577500,
    responseDeadline: '18 janvier 2024',
  };

  await mailService.sendDisputeCreated(
    'marie.martin@example.com',
    disputeDetails
  );
}

/**
 * Exemple d'utilisation dans un contrôleur ou service
 */
export class BookingService {
  constructor(private readonly mailService: MailService) {}

  async confirmBooking(bookingId: string) {
    // 1. Récupérer les données de la réservation depuis la DB
    const booking = await this.getBookingById(bookingId);

    // 2. Envoyer l'email au voyageur
    await this.mailService.sendBookingConfirmation(
      booking.guest.email,
      {
        guestName: booking.guest.fullName,
        propertyTitle: booking.property.title,
        bookingReference: booking.reference,
        bookingId: booking.id,
        checkInDate: this.formatDate(booking.checkInDate),
        checkOutDate: this.formatDate(booking.checkOutDate),
        guestCount: booking.guestCount,
        hostName: booking.property.host.fullName,
        hostVerified: booking.property.host.isVerified,
        nightCount: this.calculateNights(booking.checkInDate, booking.checkOutDate),
        rentAmount: booking.pricing.rentAmount,
        cleaningFee: booking.pricing.cleaningFee,
        serviceFee: booking.pricing.serviceFee,
        totalAmount: booking.pricing.totalAmount,
        cancellationPolicy: booking.property.cancellationPolicy.description,
      }
    );

    // 3. Envoyer une notification au propriétaire
    await this.mailService.sendBookingRequest(
      booking.property.host.email,
      {
        // ... données de la demande
      }
    );
  }

  private async getBookingById(id: string): Promise<any> {
    // Votre logique de récupération
    return {};
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
  }

  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
