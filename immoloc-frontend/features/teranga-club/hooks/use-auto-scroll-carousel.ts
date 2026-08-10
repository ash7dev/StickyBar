'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  intervalMs?: number;
  itemCount: number;
}

export function useAutoScrollCarousel<T extends HTMLElement>({ intervalMs = 4000, itemCount }: Options) {
  const containerRef = useRef<T | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (itemCount <= 1 || isPaused) return;

    const interval = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;

      const nextIndex = (currentIndexRef.current + 1) % itemCount;
      currentIndexRef.current = nextIndex;

      // Calcul de la largeur d'une carte + gap
      const itemWidth = container.scrollWidth / itemCount;
      container.scrollTo({
        left: itemWidth * nextIndex,
        behavior: 'smooth',
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, itemCount, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => {
    // Reprendre après 2 secondes d'inactivité tactile
    setTimeout(() => setIsPaused(false), 2000);
  };

  return {
    containerRef,
    bindAutoScroll: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}
