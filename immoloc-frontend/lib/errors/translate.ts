/**
 * Traduction et formatage des erreurs API en messages français compréhensibles par l'utilisateur final.
 */

export interface ErrorTranslation {
  title: string;
  message: string;
}

const ERROR_TRANSLATIONS: Record<string, ErrorTranslation> = {
  // --- AUTHENTIFICATION & COMPTE ---
  'Invalid credentials': {
    title: 'Identifiants incorrects',
    message: 'L\'adresse e-mail ou le mot de passe que vous avez saisi est incorrect.',
  },
  'Email already exists': {
    title: 'Adresse e-mail déjà utilisée',
    message: 'Un compte Klef est déjà enregistré avec cette adresse e-mail. Essayez de vous connecter.',
  },
  'Phone already exists': {
    title: 'Numéro déjà enregistré',
    message: 'Ce numéro de téléphone est déjà associé à un autre compte Klef.',
  },
  'Invalid OTP': {
    title: 'Code de vérification invalide',
    message: 'Le code saisi est incorrect. Veuillez vérifier votre SMS ou en demander un nouveau.',
  },
  'OTP expired': {
    title: 'Code expiré',
    message: 'Le code de vérification a expiré. Veuillez cliquer sur "Renvoyer le code".',
  },
  'Unauthorized': {
    title: 'Session expirée',
    message: 'Votre session a expiré ou nécessite une reconnexion. Veuillez vous connecter.',
  },
  'Forbidden': {
    title: 'Accès non autorisé',
    message: 'Vous ne disposez pas des privilèges nécessaires pour effectuer cette action.',
  },
  'User not found': {
    title: 'Utilisateur introuvable',
    message: 'Aucun compte ne correspond à ces informations.',
  },

  // --- VALEURS ET FORMULAIRES (DTO & Class-Validator) ---
  'Validation failed': {
    title: 'Formulaire incomplet',
    message: 'Veuillez vérifier et corriger les champs surlignés.',
  },
  'email must be an email': {
    title: 'Adresse e-mail invalide',
    message: 'Veuillez renseigner une adresse e-mail au format valide (ex: nom@domaine.com).',
  },
  'password must be longer than or equal to 8 characters': {
    title: 'Mot de passe trop court',
    message: 'Votre mot de passe doit comporter au moins 8 caractères.',
  },
  'prixBase must be a positive number': {
    title: 'Prix invalide',
    message: 'Le prix de la nuitée doit être un nombre supérieur à zéro.',
  },
  'phone must be a valid phone number': {
    title: 'Numéro de téléphone invalide',
    message: 'Veuillez saisir un numéro de téléphone valide (Wave ou Orange Money).',
  },

  // --- LOGEMENTS & DISPONIBILITÉS ---
  'Property not available': {
    title: 'Dates indisponibles',
    message: 'Ce logement a déjà été réservé ou verrouillé pour les dates sélectionnées.',
  },
  'logement est déjà réservé': {
    title: 'Réservation indisponible',
    message: 'Un autre voyageur vient de réserver ce logement pour ces dates. Veuillez choisir d\'autres dates.',
  },
  'Listing not found': {
    title: 'Logement introuvable',
    message: 'Le logement recherché n\'existe pas ou a été retiré de la publication.',
  },

  // --- PAIEMENTS, PORTFEUILLE & RETRAITS ---
  'Insufficient funds': {
    title: 'Solde insuffisant',
    message: 'Votre solde disponible est insuffisant pour effectuer ce retrait ou ce paiement.',
  },
  'Vous avez une dette de pénalités': {
    title: 'Pénalités en cours',
    message: 'Vous avez des frais d\'annulation impayés. Vos retraits seront débloqués après régularisation automatique sur vos prochaines réservations.',
  },
  'Payment failed': {
    title: 'Échec du paiement',
    message: 'Le paiement n\'a pas pu être finalisé via votre compte Wave ou Orange Money. Veuillez réessayer.',
  },
  'Withdrawal failed': {
    title: 'Échec du retrait',
    message: 'La demande de virement vers votre mobile money a échoué. Vérifiez votre numéro de téléphone.',
  },

  // --- VÉRIFICATION & KYC ---
  'KYC not verified': {
    title: 'Identité non vérifiée',
    message: 'Veuillez soumettre votre pièce d\'identité pour débloquer cette fonctionnalité.',
  },
  'Invalid document': {
    title: 'Document illisible',
    message: 'Le document d\'identité téléchargé est flou ou expiré. Veuillez fournir une photo claire.',
  },
  'KYC rejeté ou suspendu': {
    title: 'Vérification refusée',
    message: 'Votre vérification d\'identité n\'a pas été validée. Contactez le support Klef.',
  },
  'Votre KYC doit être vérifié': {
    title: 'Vérification requise',
    message: 'Votre identité doit être validée avant de publier ou réserver.',
  },

  // --- SÉCURITÉ & LIMITES ---
  'compte est suspendu jusqu': {
    title: 'Compte temporairement suspendu',
    message: 'Votre compte est restreint. Veuillez consulter votre boîte e-mail ou contacter le support.',
  },
  'Too many requests': {
    title: 'Limite de sécurité atteinte',
    message: 'Vous avez effectué trop de tentatives. Veuillez patienter une minute avant de réessayer.',
  },
  'Trop de tentatives': {
    title: 'Trop d\'essais',
    message: 'Par mesure de sécurité, merci de patienter quelques minutes avant de réémettre une demande.',
  },

  // --- INFRASTRUCTURE ET RÉSEAU ---
  'Internal server error': {
    title: 'Incident technique',
    message: 'Nos services rencontrent une petite difficulté temporaire. Nos équipes s\'en occupent déjà.',
  },
  'Service unavailable': {
    title: 'Maintenance en cours',
    message: 'Le service est temporairement indisponible pour maintenance. Veuillez ré-essayer dans 5 minutes.',
  },
  'Network Error': {
    title: 'Connexion interrompue',
    message: 'Impossible de joindre les serveurs Klef. Vérifiez votre connexion Internet.',
  },
  'Failed to fetch': {
    title: 'Connexion réseau instable',
    message: 'La connexion au réseau a échoué. Merci de vérifier votre accès Internet.',
  },
};

/**
 * Traduit un message d'erreur ou un objet d'erreur générique en texte utilisateur clair
 */
export function translateError(error: unknown): ErrorTranslation {
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    const errObj = error as Record<string, any>;
    if (typeof errObj.message === 'string') {
      errorMessage = errObj.message;
    } else if (Array.isArray(errObj.message) && errObj.message.length > 0) {
      // Si c'est un tableau de validations NestJS DTO
      const translatedArray = errObj.message.map((m: string) => translateError(m).message);
      return {
        title: 'Vérification du formulaire',
        message: translatedArray.join(' • '),
      };
    } else if (typeof errObj.error === 'string') {
      errorMessage = errObj.error;
    }
  }

  if (!errorMessage) {
    return {
      title: 'Information',
      message: 'Une difficulté inattendue est survenue. Veuillez réessayer.',
    };
  }

  // 1. Recherche d'une correspondance exacte
  if (ERROR_TRANSLATIONS[errorMessage]) {
    return ERROR_TRANSLATIONS[errorMessage];
  }

  // 2. Recherche partielle dans la table
  const lowerMsg = errorMessage.toLowerCase();
  for (const [key, translation] of Object.entries(ERROR_TRANSLATIONS)) {
    if (lowerMsg.includes(key.toLowerCase())) {
      return translation;
    }
  }

  // 3. Traitement des erreurs SQL / Prisma / System pour masquer les détails techniques au client
  if (
    lowerMsg.includes('prisma') ||
    lowerMsg.includes('typeerror') ||
    lowerMsg.includes('syntaxerror') ||
    lowerMsg.includes('unexpected token') ||
    lowerMsg.includes('cannot read property') ||
    lowerMsg.includes('500')
  ) {
    return {
      title: 'Incident technique',
      message: 'Une erreur interne temporaire s\'est produite. L\'équipe technique a été notifiée.',
    };
  }

  // 4. Fallback si le message est déjà en français explicite
  return {
    title: 'Attention',
    message: errorMessage,
  };
}

/**
 * Traduit un code HTTP
 */
export function translateHttpStatus(status: number): ErrorTranslation {
  switch (status) {
    case 400:
      return {
        title: 'Données incorrectes',
        message: 'Les informations fournies sont incomplètes ou invalides.',
      };
    case 401:
      return ERROR_TRANSLATIONS['Unauthorized'];
    case 403:
      return ERROR_TRANSLATIONS['Forbidden'];
    case 404:
      return {
        title: 'Page ou ressource introuvable',
        message: 'L\'élément que vous cherchez n\'existe pas ou a été déplacé.',
      };
    case 409:
      return {
        title: 'Information déjà existante',
        message: 'Cette action entre en conflit avec des informations enregistrées.',
      };
    case 422:
      return ERROR_TRANSLATIONS['Validation failed'];
    case 429:
      return ERROR_TRANSLATIONS['Too many requests'];
    case 500:
    case 502:
    case 503:
      return ERROR_TRANSLATIONS['Internal server error'];
    case 504:
      return {
        title: 'Délai d\'attente dépassé',
        message: 'Le serveur met trop de temps à répondre. Merci de réessayer.',
      };
    default:
      return {
        title: 'Erreur',
        message: `Une erreur est survenue (code ${status}).`,
      };
  }
}

/**
 * Extrait et traduit proprement toute réponse d'erreur API Axios / Fetch / React Query
 */
export function translateApiError(error: unknown, fallbackStatus?: number): ErrorTranslation {
  if (!error) {
    return {
      title: 'Erreur',
      message: 'Une erreur inattendue s\'est produite.',
    };
  }

  // Traitement d'un objet AxiosError ou response personnalisée
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, any>;

    // Réponse serveur disponible
    if (errObj.response?.data) {
      const data = errObj.response.data;

      // Titre + Message direct du backend s'il existe
      if (typeof data.message === 'string' && data.title) {
        return { title: data.title, message: data.message };
      }

      if (typeof data.message === 'string') {
        const translated = translateError(data.message);
        if (translated.title !== 'Attention' && translated.title !== 'Erreur') {
          return translated;
        }
        return {
          title: data.title || translateHttpStatus(errObj.response.status).title,
          message: translated.message,
        };
      }

      if (Array.isArray(data.message) && data.message.length > 0) {
        return translateError(data);
      }
    }

    if (errObj.status || errObj.response?.status) {
      const status = errObj.status || errObj.response?.status;
      return translateHttpStatus(status);
    }
  }

  if (fallbackStatus) {
    return translateHttpStatus(fallbackStatus);
  }

  return translateError(error);
}
