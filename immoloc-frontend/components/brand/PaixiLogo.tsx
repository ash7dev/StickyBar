// ─────────────────────────────────────────────────────────────────────────────
// Paixi — logo (symbole tige + feuille, wordmark Fraunces 600)
//
// Le symbole est dessiné en SVG ; le wordmark reste du texte : Fraunces est
// déjà chargée par next/font, le rendu est net à toutes les tailles et le nom
// reste lisible par les lecteurs d'écran. La taille suit le font-size du
// parent (classes text-*) : symbole = 1.16em de haut, comme sur la planche.
// Fichiers vectorisés pour les usages hors app : /public/brand/*.svg
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '@/lib/utils';

type Tone = 'default' | 'inverse';

const TONES: Record<Tone, { stem: string; leaf: string; text: string }> = {
  default: { stem: 'fill-forest-600', leaf: 'fill-lime-600', text: 'text-forest-950' },
  inverse: { stem: 'fill-neutral-50', leaf: 'fill-lime-400', text: 'text-neutral-50' },
};

export function PaixiSymbol({ tone = 'default', className }: { tone?: Tone; className?: string }) {
  const t = TONES[tone];
  return (
    <svg viewBox="0 0 80 104" aria-hidden="true" className={cn('h-[1.16em] w-auto shrink-0', className)}>
      <rect x="10" y="30" width="15" height="72" rx="7.5" className={t.stem} />
      <path d="M25 76 A46 46 0 0 1 72 28 A46 46 0 0 1 25 76 Z" className={t.leaf} />
    </svg>
  );
}

export function PaixiLogo({
  tone = 'default',
  symbolOnly = false,
  className,
}: {
  tone?: Tone;
  symbolOnly?: boolean;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <span className={cn('inline-flex items-center gap-[0.13em] leading-none', className)}>
      <PaixiSymbol tone={tone} />
      {symbolOnly ? (
        <span className="sr-only">Paixi</span>
      ) : (
        <span className={cn('font-display font-semibold tracking-[-0.033em]', t.text)}>paixi</span>
      )}
    </span>
  );
}
