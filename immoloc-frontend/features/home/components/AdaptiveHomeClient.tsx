import { ReactNode } from 'react';

interface Props {
  web: ReactNode;
  mobile: ReactNode;
}

/**
 * AdaptiveHomeClient — Affiche web ou mobile via CSS media queries.
 * Zéro JS côté client = pas de flash, pas de hydration mismatch.
 * Le breakpoint xl (1280 px) est identique à l'ancien useIsMobile(1280).
 */
export function AdaptiveHomeClient({ web, mobile }: Props) {
  return (
    <>
      <div className="hidden xl:block w-full">{web}</div>
      <div className="block xl:hidden w-full">{mobile}</div>
    </>
  );
}
