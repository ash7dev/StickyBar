/**
 * Types pour le système d'emails Klef
 */

export interface BookingConfirmationContext {
  guestName: string;
  propertyTitle: string;
  bookingReference: string;
  bookingId: string;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  hostName: string;
  hostVerified?: boolean;
  nightCount: number;
  rentAmount: number;
  cleaningFee?: number;
  serviceFee?: number;
  totalAmount: number;
  cancellationPolicy: string;
}

export interface BookingRequestContext {
  hostName: string;
  guestName: string;
  propertyTitle: string;
  bookingRequestId: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  guestCount: number;
  hostEarnings: number;
  guestAvatar?: string;
  guestInitials: string;
  guestMemberSince: string;
  guestVerified?: boolean;
  guestReviewsCount?: number;
  guestRating?: number;
  guestBookingsCount?: number;
  guestMessage?: string;
  nightlyRate: number;
  totalRent: number;
  cleaningFee?: number;
  serviceFee: number;
  serviceFeePercentage: number;
  guestTotal: number;
}

export interface BookingReminderContext {
  guestName: string;
  propertyTitle: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  propertyAddress: string;
  hostName: string;
  hostVerified?: boolean;
  hostPhone: string;
  hostEmail?: string;
  conversationId: string;
  checkInInstructions?: string;
  bookingId: string;
  bookingReference: string;
  nightCount: number;
  guestCount: number;
  propertyLatitude?: number;
  propertyLongitude?: number;
}

export interface BookingCancellationContext {
  userName: string;
  propertyTitle: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  nightCount: number;
  cancellationDate: string;
  cancelledBy: string;
  cancellationReason?: string;
  refundAmount?: number;
  totalAmount: number;
  cancellationFee?: number;
  refundDelay?: string;
  cancellationPolicyName: string;
  cancellationPolicyDescription: string;
  cancelledByHost?: boolean;
  bookingId: string;
  guestCount: number;
  cancellationReference: string;
}

export interface PaymentSuccessContext {
  userName: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
  paymentMethod: string;
  description: string;
  bookingReference?: string;
  propertyTitle?: string;
  bookingId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  items?: Array<{ label: string; amount: number }>;
  taxAmount?: number;
  receiptUrl: string;
}

export interface NewMessageContext {
  recipientName: string;
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  senderVerified?: boolean;
  senderRole?: string;
  messageDate: string;
  messageContent: string;
  conversationId: string;
  bookingReference?: string;
  propertyTitle?: string;
  checkInDate?: string;
  checkOutDate?: string;
  isInquiry?: boolean;
}

export interface ReviewRequestContext {
  userName: string;
  propertyTitle: string;
  propertyImage?: string;
  checkInDate: string;
  checkOutDate: string;
  hostName: string;
  bookingReference: string;
  bookingId: string;
  reviewDeadline: string;
}

export interface DisputeCreatedContext {
  userName: string;
  isCreator: boolean;
  disputeId: string;
  disputeSubject: string;
  disputeCategory: string;
  disputeDescription: string;
  disputeCreatedDate: string;
  disputeAmount?: number;
  evidenceCount?: number;
  creatorName: string;
  bookingReference: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  hostName: string;
  bookingAmount: number;
  responseDeadline: string;
}

export interface WelcomeEmailContext {
  userName: string;
}

export interface VerificationEmailContext {
  userName: string;
  verificationUrl: string;
}

export interface PasswordResetContext {
  userName: string;
  resetUrl: string;
}

/**
 * Type union de tous les contextes possibles
 */
export type EmailContext =
  | BookingConfirmationContext
  | BookingRequestContext
  | BookingReminderContext
  | BookingCancellationContext
  | PaymentSuccessContext
  | NewMessageContext
  | ReviewRequestContext
  | DisputeCreatedContext
  | WelcomeEmailContext
  | VerificationEmailContext
  | PasswordResetContext;

/**
 * Liste des templates disponibles
 */
export enum EmailTemplate {
  WELCOME = 'welcome',
  VERIFY_EMAIL = 'verify-email',
  RESET_PASSWORD = 'reset-password',
  BOOKING_CONFIRMATION = 'booking-confirmation',
  BOOKING_REQUEST = 'booking-request',
  BOOKING_REMINDER = 'booking-reminder',
  BOOKING_CANCELLATION = 'booking-cancellation',
  PAYMENT_SUCCESS = 'payment-success',
  NEW_MESSAGE = 'new-message',
  REVIEW_REQUEST = 'review-request',
  DISPUTE_CREATED = 'dispute-created',
}

/**
 * Configuration de l'email
 */
export interface EmailConfig {
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
}

/**
 * Pièce jointe d'email
 */
export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}
