'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  web: ReactNode;
  mobile: ReactNode;
}

/**
 * AdaptiveHomeClient - Wrapper client pour le switch d'interface.
 * Le rendu initial reste stable jusqu'à ce que le client soit monté,
 * ce qui évite les hydration mismatches causés par matchMedia.
 */
export function AdaptiveHomeClient({ web, mobile }: Props) {
  const isMobile = useIsMobile(1280);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="w-full">{web}</div>;
  }

  return (
    <div className="w-full">
      {isMobile ? <>{mobile}</> : <>{web}</>}
    </div>
  );
}
