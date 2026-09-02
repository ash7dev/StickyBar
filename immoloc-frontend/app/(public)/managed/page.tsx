'use client';

import { KlefManagedHero } from '@/features/managed/components/KlefManagedHero';
import { KlefManagedPillars } from '@/features/managed/components/KlefManagedPillars';
import { KlefManagedLeadForm } from '@/features/managed/components/KlefManagedLeadForm';

export default function KlefManagedLandingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8 px-4 sm:px-6">
      <KlefManagedHero />
      <KlefManagedPillars />
      <KlefManagedLeadForm />
    </div>
  );
}
