import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Dictionnaire de traduction des contraintes class-validator courantes
const VALIDATION_MESSAGES: Record<string, string> = {
  isEmail: 'Veuillez saisir une adresse e-mail valide (ex: nom@domaine.com).',
  isNotEmpty: 'Ce champ ne peut pas être vide.',
  isString: 'La valeur saisie doit être du texte.',
  isNumber: 'La valeur saisie doit être un nombre valide.',
  isPositive: 'Le montant doit être un nombre positif.',
  isBoolean: 'Veuillez sélectionner une option valide.',
  isPhoneNumber: 'Veuillez indiquer un numéro de téléphone valide.',
  minLength: 'Le mot de passe ou texte est trop court.',
  maxLength: 'Le texte dépasse la longueur maximale autorisée.',
  min: 'La valeur minimale requise n\'est pas atteinte.',
  max: 'La valeur maximale autorisée est dépassée.',
  isEnum: 'L\'option sélectionnée est invalide.',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur technique temporaire est survenue. Veuillez réessayer.';
    let errorTitle = 'Erreur serveur';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const respObj = exceptionResponse as Record<string, any>;
        const rawMessage = respObj.message;

        // Erreurs de validation DTO (ValidationPipe)
        if (Array.isArray(rawMessage)) {
          message = 'Certaines informations saisies sont incorrectes ou incomplètes.';
          errorTitle = 'Données invalides';

          // Traduire chaque message DTO si possible
          details = rawMessage.map((msg: string) => {
            if (typeof msg === 'string') {
              for (const [key, translated] of Object.entries(VALIDATION_MESSAGES)) {
                if (msg.includes(key) || msg.toLowerCase().includes(key.toLowerCase())) {
                  return translated;
                }
              }
            }
            return msg;
          });
        } else if (typeof rawMessage === 'string') {
          message = this.translateMessage(rawMessage, status);
        }
      } else if (typeof exceptionResponse === 'string') {
        message = this.translateMessage(exceptionResponse, status);
      }
    } else if (exception instanceof Error) {
      this.logger.error(`[Unhandled Exception] ${exception.message}`, exception.stack);

      // Prisma & DB errors fallback
      if (exception.message.includes('Unique constraint')) {
        status = HttpStatus.CONFLICT;
        errorTitle = 'Donnée déjà enregistrée';
        message = 'Cette information existe déjà dans notre système (ex: e-mail ou téléphone).';
      } else if (exception.message.includes('Foreign key constraint')) {
        status = HttpStatus.BAD_REQUEST;
        errorTitle = 'Référence invalide';
        message = 'La ressource associée n\'existe pas ou a été modifiée.';
      }
    }

    // Réponse standardisée et conviviale pour le client
    response.status(status).json({
      statusCode: status,
      title: errorTitle,
      message: message,
      details: details,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private translateMessage(msg: string, status: number): string {
    const lower = msg.toLowerCase();

    if (lower.includes('unauthorized') || status === 401) {
      return 'Votre session a expiré ou vos identifiants sont incorrects. Veuillez vous reconnecter.';
    }
    if (lower.includes('forbidden') || status === 403) {
      return 'Vous n\'avez pas les autorisations nécessaires pour effectuer cette action.';
    }
    if (lower.includes('not found') || status === 404) {
      return 'La ressource demandée n\'existe pas ou a été déplacée.';
    }
    if (lower.includes('already exists') || lower.includes('conflict') || status === 409) {
      return 'Cette donnée existe déjà sur la plateforme (ex: e-mail ou téléphone déjà inscrit).';
    }
    if (lower.includes('invalid credentials')) {
      return 'L\'adresse e-mail ou le mot de passe est incorrect.';
    }
    if (lower.includes('too many requests') || status === 429) {
      return 'Nombreux essais détectés. Veuillez patienter quelques instants avant de réessayer.';
    }

    return msg;
  }
}
