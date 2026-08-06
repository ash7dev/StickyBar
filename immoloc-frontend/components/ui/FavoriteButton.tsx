'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { cn } from '@/lib/utils/cn';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FavoriteButton({ listingId, className, size = 'md' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(listingId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleFavorite(listingId);

    if (!active) {
      toast.success('Logement ajouté à vos coups de cœur ! ❤️', {
        description: 'Retrouvez facilement ce bien lors de vos recherches.',
      });
    } else {
      toast.info('Logement retiré de vos coups de cœur');
    }
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const buttonSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-md backdrop-blur-md z-20',
        active
          ? 'bg-white/95 text-rose-500 dark:bg-forest-950/90 dark:text-rose-500 ring-2 ring-rose-500/30'
          : 'bg-white/80 text-neutral-600 hover:text-rose-500 hover:bg-white dark:bg-forest-950/70 dark:text-neutral-300 dark:hover:text-rose-400',
        buttonSizes,
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes,
          'transition-transform duration-200',
          active && 'fill-rose-500 text-rose-500 scale-110 animate-in zoom-in-75 duration-200'
        )}
      />
    </button>
  );
}

export default FavoriteButton;
