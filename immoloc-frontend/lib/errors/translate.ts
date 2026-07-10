/**
 * Traduction des erreurs API en messages français compréhensibles
 */

interface ErrorTranslation {
  title: string;
  message: string;
}

const ERROR_TRANSLATIONS: Record<string, ErrorTranslation> = {
  // Erreurs d'authentification
  'Invalid credentials': {
    title: 'Identifiants invalides',
    message: 'L\'adresse e-mail ou le mot de passe est incorrect.',
  },
  'Email already exists': {
    title: 'E-mail déjà utilisé',
    message: 'Un compte existe déjà avec cette adresse e-mail.',
  },
  'Phone already exists': {
    title: 'Téléphone déjà utilisé',
    message: 'Ce numéro de téléphone est déjà associé à un compte.',
  },
  'Invalid OTP': {
    title: 'Code invalide',
    message: 'Le code de vérification est incorrect ou a expiré.',
  },
  'OTP expired': {
    title: 'Code expiré',
    message: 'Le code de vérification a expiré. Veuillez en demander un nouveau.',
  },
  'Unauthorized': {
    title: 'Non autorisé',
    message: 'Vous devez être connecté pour accéder à cette ressource.',
  },
  'Forbidden': {
    title: 'Accès interdit',
    message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
  },

  // Erreurs de validation
  'Validation failed': {
    title: 'Données invalides',
    message: 'Veuillez vérifier les informations saisies.',
  },
  'Required field': {
    title: 'Champ requis',
    message: 'Ce champ est obligatoire.',
  },

  // Erreurs de réservation
  'Property not available': {
    title: 'Logement indisponible',
    message: 'Ce logement n\'est plus disponible pour ces dates.',
  },
  'Reservation already exists': {
    title: 'Réservation existante',
    message: 'Vous avez déjà une réservation pour ces dates.',
  },
  'Insufficient funds': {
    title: 'Solde insuffisant',
    message: 'Votre solde est insuffisant pour effectuer cette opération.',
  },

  // Erreurs de KYC
  'KYC not verified': {
    title: 'Vérification requise',
    message: 'Vous devez vérifier votre identité pour continuer.',
  },
  'Invalid document': {
    title: 'Document invalide',
    message: 'Le document fourni n\'est pas valide ou est illisible.',
  },
  'KYC rejeté ou suspendu': {
    title: 'Compte non vérifié',
    message: 'Votre vérification d\'identité a été rejetée ou votre compte est suspendu. Contactez le support.',
  },
  'Votre KYC doit être vérifié': {
    title: 'Vérification en attente',
    message: 'Votre identité doit être vérifiée avant de pouvoir effectuer cette action.',
  },

  // Erreurs de réservation - Double booking
  'logement est déjà réservé': {
    title: 'Logement indisponible',
    message: 'Ce logement vient d\'être réservé sur ces dates. Veuillez choisir d\'autres dates.',
  },

  // Erreurs de suspension
  'compte est suspendu jusqu': {
    title: 'Compte suspendu',
    message: 'Votre compte est temporairement suspendu. Veuillez consulter vos emails pour plus d\'informations.',
  },
  'suspendu suite à des problèmes': {
    title: 'Compte suspendu',
    message: 'Votre compte est suspendu suite à des problèmes de vérification d\'identité. Contactez le support.',
  },

  // Erreurs de dette
  'Vous avez une dette de pénalités': {
    title: 'Dette en cours',
    message: 'Vous avez des pénalités impayées. Les retraits sont bloqués jusqu\'au remboursement automatique via vos prochains revenus.',
  },

  // Erreurs de rate limiting
  'Trop de tentatives': {
    title: 'Trop de tentatives',
    message: 'Vous avez effectué trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
  },
  'Too many requests': {
    title: 'Limite atteinte',
    message: 'Vous avez atteint la limite de requêtes autorisées. Veuillez patienter avant de réessayer.',
  },

  // Erreurs serveur
  'Internal server error': {
    title: 'Erreur serveur',
    message: 'Une erreur s\'est produite sur le serveur. Veuillez réessayer plus tard.',
  },
  'Service unavailable': {
    title: 'Service indisponible',
    message: 'Le service est temporairement indisponible. Veuillez réessayer dans quelques instants.',
  },
  'Network error': {
    title: 'Erreur réseau',
    message: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
  },
};

/**
 * Traduit un message d'erreur API en français
 */
export function translateError(error: string | Error | unknown): ErrorTranslation {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = 'Unknown error';
  }

  // Chercher une traduction exacte
  if (ERROR_TRANSLATIONS[errorMessage]) {
    return ERROR_TRANSLATIONS[errorMessage];
  }

  // Chercher une traduction partielle
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return translation;
    }
  }

  // Fallback par défaut
  return {
    title: 'Erreur',
    message: errorMessage || 'Une erreur inattendue s\'est produite.',
  };
}

/**
 * Traduit un code de statut HTTP en message français
 */
export function translateHttpStatus(status: number): ErrorTranslation {
  switch (status) {
    case 400:
      return {
        title: 'Requête invalide',
        message: 'Les données envoyées sont incorrectes.',
      };
    case 401:
      return ERROR_TRANSLATIONS['Unauthorized'];
    case 403:
      return ERROR_TRANSLATIONS['Forbidden'];
    case 404:
      return {
        title: 'Non trouvé',
        message: 'La ressource demandée n\'existe pas.',
      };
    case 409:
      return {
        title: 'Conflit',
        message: 'Cette opération entre en conflit avec l\'état actuel.',
      };
    case 422:
      return ERROR_TRANSLATIONS['Validation failed'];
    case 429:
      return {
        title: 'Trop de requêtes',
        message: 'Vous avez effectué trop de requêtes. Veuillez patienter quelques instants.',
      };
    case 500:
      return ERROR_TRANSLATIONS['Internal server error'];
    case 502:
    case 503:
      return ERROR_TRANSLATIONS['Service unavailable'];
    case 504:
      return {
        title: 'Délai d\'attente dépassé',
        message: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
      };
    default:
      return {
        title: 'Erreur',
        message: `Une erreur s'est produite (code ${status}).`,
      };
  }
}

/**
 * Extrait et traduit une erreur depuis une réponse API
 */
export function translateApiError(error: unknown, fallbackStatus?: number): ErrorTranslation {
  // Si c'est une ApiError avec un status
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;

    // Essayer de traduire le message d'abord
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      const translated = translateError((error as { message: string }).message);
      if (translated.title !== 'Erreur') {
        return translated;
      }
    }

    // Sinon traduire par le status
    return translateHttpStatus(status);
  }

  // Si on a un fallback status
  if (fallbackStatus) {
    return translateHttpStatus(fallbackStatus);
  }

  // Sinon traduire le message brut
  return translateError(error);
}
