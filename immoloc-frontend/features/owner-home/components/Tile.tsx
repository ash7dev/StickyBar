import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

const TONES = {
  light: 'bg-background-card text-foreground border border-border/70',
  // Bordure discrète : la tuile reste visible quand le fond de page est lui-même sombre
  dark: 'bg-forest-950 text-neutral-50 border border-white/10',
  deep: 'bg-forest-900 text-neutral-50 border border-white/10',
  lime: 'bg-lime-400 text-forest-800',
  gold: 'bg-gold-50 text-foreground border border-gold-200',
} as const;

/** Largeur de base dans la mosaïque (flex-wrap) : 1 = tuile simple, 2 = tuile double. */
const SPANS = {
  1: 'flex-[1_1_260px]',
  2: 'flex-[2_1_520px]',
} as const;

interface TileProps {
  tone?: keyof typeof TONES;
  span?: keyof typeof SPANS;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}

/** Tuile de la mosaïque d'accueil (direction « Bento »). */
export function Tile({ tone = 'light', span = 1, labelledBy, className, children }: TileProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn('@container flex min-w-0 flex-col gap-4 rounded-[28px] p-6', TONES[tone], SPANS[span], className)}
    >
      {children}
    </section>
  );
}

export function TileTitle({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn('text-[13px] font-semibold opacity-80', className)}>
      {children}
    </h2>
  );
}

export function TileSkeleton({ span = 1, className }: { span?: keyof typeof SPANS; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('min-h-[220px] animate-pulse rounded-[28px] bg-background-card/70', SPANS[span], className)}
    />
  );
}
