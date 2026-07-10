import { toast } from 'sonner';
import { translateApiError, translateError } from '@/lib/errors/translate';

/**
 * Hook pour afficher des toasts d'erreur avec traduction automatique
 */
export function useToastError() {
  const showError = (error: unknown) => {
    const translated = translateApiError(error);
    toast.error(translated.title, {
      description: translated.message,
      duration: 5000,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000,
    });
  };

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000,
    });
  };

  return {
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
}
