/**
 * Loading Spinner - Composant de chargement propre et réutilisable
 *
 * Features:
 * - ✅ Design cohérent avec la charte graphique
 * - ✅ Accessible (aria-label)
 * - ✅ Tailles configurables
 * - ✅ Zero dependencies externes
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /**
   * Taille du spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Label accessible pour les lecteurs d'écran
   * @default 'Chargement...'
   */
  label?: string;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  /**
   * Afficher le spinner en mode fullscreen centré
   * @default false
   */
  fullscreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export function LoadingSpinner({
  size = 'md',
  label = 'Chargement...',
  className,
  fullscreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-green-600 border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * Loading Screen - Page de chargement fullscreen avec message
 */
export function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
      <LoadingSpinner size="xl" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
