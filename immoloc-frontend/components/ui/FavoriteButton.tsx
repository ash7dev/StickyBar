'use client';

import { useCallback } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { cn } from '@/lib/utils/cn';

const SIZES = {
  sm: { button: 'h-7 w-7', icon: 'h-3.5 w-3.5' },
  md: { button: 'h-9 w-9', icon: 'h-4 w-4' },
  lg: { button: 'h-11 w-11', icon: 'h-5 w-5' },
} as const;

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  size?: keyof typeof SIZES;
  /** Sur fond clair, désactive le traitement glass prévu pour les photos. */
  variant?: 'onImage' | 'plain';
}

export function FavoriteButton({
  listingId,
  className,
  size = 'md',
  variant = 'onImage',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(listingId);
  const s = SIZES[size];

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    /* L'état est lu AVANT l'appel : `active` provenait du rendu précédent et
       la condition était évaluée après `toggleFavorite`, donc le message
       pouvait annoncer l'inverse de ce qui venait de se passer. */
    const willBeFavorite = !active;

    try {
      await toggleFavorite(listingId);

      if (willBeFavorite) {
        toast.success('Ajouté à vos favoris', {
          description: 'Retrouvez ce logement dans votre onglet Favoris.',
        });
      } else {
        toast.info('Retiré de vos favoris');
      }
    } catch {
      /* Le toast de succès s'affichait même quand l'enregistrement
         échouait côté serveur. */
      toast.error('Action impossible pour le moment', {
        description: 'Vérifiez votre connexion et réessayez.',
      });
    }
  }, [active, listingId, toggleFavorite]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        'z-20 flex items-center justify-center rounded-pill transition-[background-color,color,transform] duration-200 active:scale-90',
        variant === 'onImage'
          ? 'glass shadow-float'
          : 'border border-border bg-background-card shadow-sm hover:bg-background-alt',
        active ? 'text-error-600' : 'text-foreground-muted hover:text-error-600',
        s.button,
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          s.icon,
          'transition-transform duration-200',
          active && 'scale-110 fill-current',
        )}
      />
    </button>
  );
}

export default FavoriteButton;