import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import Handlebars from 'handlebars';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly templatesPath: string;
  private readonly baseTemplate: HandlebarsTemplateDelegate;
  private readonly compiledTemplates: Map<string, HandlebarsTemplateDelegate>;
  private readonly defaultFrom: string;
  private readonly appUrl: string;

  constructor() {
    this.templatesPath = join(__dirname, 'templates');
    this.compiledTemplates = new Map();
    this.defaultFrom = process.env.MAIL_FROM || 'Klef <noreply@klef.com>';
    this.appUrl = process.env.APP_URL || 'https://klef.com';

    // Charger et compiler la template de base
    const baseTemplatePath = join(this.templatesPath, 'base.html');
    const baseTemplateContent = readFileSync(baseTemplatePath, 'utf-8');
    this.baseTemplate = Handlebars.compile(baseTemplateContent);

    // Enregistrer les helpers Handlebars personnalisés
    this.registerHandlebarsHelpers();

    this.logger.log('Mail service initialized');
  }

  /**
   * Enregistre les helpers Handlebars personnalisés
   */
  private registerHandlebarsHelpers(): void {
    // Helper pour formater les dates
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
      }).format(d);
    });

    // Helper pour formater les montants
    Handlebars.registerHelper('formatAmount', (amount: number) => {
      if (amount === undefined || amount === null) return '0';
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    });

    // Helper conditionnel if
    Handlebars.registerHelper('if', function (this: any, conditional: any, options: any) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Helper each pour les boucles
    Handlebars.registerHelper('each', function (context: any[], options: any) {
      let ret = '';
      for (let i = 0, j = context.length; i < j; i++) {
        ret = ret + options.fn(context[i]);
      }
      return ret;
    });
  }

  /**
   * Compile une template si elle n'est pas déjà en cache
   */
  private getCompiledTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    try {
      const templatePath = join(this.templatesPath, `${templateName}.html`);
      const templateContent = readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      this.compiledTemplates.set(templateName, compiled);
      return compiled;
    } catch (error: any) {
      this.logger.error(
        `Failed to compile template ${templateName}`,
        error?.stack,
      );
      throw new Error(`Template ${templateName} not found`);
    }
  }

  /**
   * Envoie un email en utilisant une template
   */
  async sendMail(options: EmailOptions): Promise<void> {
    try {
      // Compiler la template de contenu
      const contentTemplate = this.getCompiledTemplate(options.template);

      // Ajouter les variables globales au contexte
      const context = {
        ...options.context,
        appUrl: this.appUrl,
        year: new Date().getFullYear(),
      };

      // Générer le contenu de l'email
      const content = contentTemplate(context);

      // Générer l'email final avec la template de base
      const html = this.baseTemplate({
        content,
        subject: options.subject,
        ...context,
      });

      // TODO: Intégrer avec Resend une fois configuré
      // Pour l'instant, on log juste l'email
      this.logger.log(
        `Email would be sent to: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
      this.logger.log(`Subject: ${options.subject}`);
      this.logger.debug(`HTML length: ${html.length} characters`);

      // Quand Resend sera configuré, décommenter ceci:
      /*
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html,
        reply_to: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });
      */

      this.logger.log(
        `Email sent successfully: ${options.template} to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${options.template}`, error?.stack);
      throw error;
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.sendMail({
      to,
      subject: `Bienvenue sur Klef, ${userName} !`,
      template: 'welcome',
      context: { userName },
    });
  }

  /**
   * Envoie un email de vérification
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Vérifiez votre adresse email - Klef',
      template: 'verify-email',
      context: { userName, verificationUrl },
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Réinitialisation de votre mot de passe - Klef',
      template: 'reset-password',
      context: { userName, resetUrl },
    });
  }

  /**
   * Envoie un email de confirmation de réservation
   */
  async sendBookingConfirmation(
    to: string,
    bookingDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Réservation confirmée - ${bookingDetails.propertyTitle}`,
      template: 'booking-confirmation',
      context: bookingDetails,
    });
  }

  /**
   * Envoie un email de demande de réservation (au propriétaire)
   */
  async sendBookingRequest(
    to: string,
    bookingDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Nouvelle demande de réservation - ${bookingDetails.propertyTitle}`,
      template: 'booking-request',
      context: bookingDetails,
    });
  }

  /**
   * Envoie un email de rappel de réservation
   */
  async sendBookingReminder(
    to: string,
    bookingDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Votre arrivée approche - ${bookingDetails.propertyTitle}`,
      template: 'booking-reminder',
      context: bookingDetails,
    });
  }

  /**
   * Envoie un email d'annulation de réservation
   */
  async sendBookingCancellation(
    to: string,
    cancellationDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Annulation de réservation - ${cancellationDetails.propertyTitle}`,
      template: 'booking-cancellation',
      context: cancellationDetails,
    });
  }

  /**
   * Envoie un email de paiement réussi
   */
  async sendPaymentSuccess(
    to: string,
    paymentDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Paiement confirmé - ${paymentDetails.amount} FCFA`,
      template: 'payment-success',
      context: paymentDetails,
    });
  }

  /**
   * Envoie un email de nouveau message
   */
  async sendNewMessage(
    to: string,
    messageDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Nouveau message de ${messageDetails.senderName}`,
      template: 'new-message',
      context: messageDetails,
    });
  }

  /**
   * Envoie un email de demande d'avis
   */
  async sendReviewRequest(
    to: string,
    reviewDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Partagez votre avis sur ${reviewDetails.propertyTitle}`,
      template: 'review-request',
      context: reviewDetails,
    });
  }

  /**
   * Envoie un email de création de litige
   */
  async sendDisputeCreated(
    to: string,
    disputeDetails: Record<string, any>,
  ): Promise<void> {
    await this.sendMail({
      to,
      subject: `Litige ouvert - ${disputeDetails.disputeSubject}`,
      template: 'dispute-created',
      context: disputeDetails,
    });
  }
}
