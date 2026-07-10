'use client';

import { useState, useEffect } from 'react';
import { DesktopHeader } from './desktop-header';
import { MobileHeader } from './mobile-header';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint = 640px
    };

    // Initial check
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Render mobile or desktop header based on screen size
  return isMobile ? (
    <MobileHeader onMenuToggle={onMenuToggle} />
  ) : (
    <DesktopHeader onMenuToggle={onMenuToggle} />
  );
}
