'use client';

import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';

const HIGHLIGHTS = [
  '0 heure de gestion requise',
  'États des lieux photos certifiés',
  'Reversements Mobile Money garantis',
];

/**
 * Un seul mot marqué dans le titre, pas la phrase entière (règle 2). Le CTA
 * ici est `.btn-primary` (forest), pas `.btn-action` (lime) : sur une page
 * qui scrolle vers un formulaire, le lime doit rester réservé au vrai bouton
 * d'envoi plus bas — sinon deux CTA lime se disputent l'attention sur le
 * même parcours.
 */
export function KlefManagedHero() {
  return (
    <section className="section-inverse relative overflow-hidden px-6 py-16 shadow-xl sm:px-12 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-forest-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl space-y-6 text-center">
        <span className="badge-brand">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Klef Managed · Offre Sérénité
        </span>

        {/* Pas de text-* : le clamp() du h1 vient de la couche base, et
            .section-inverse lui donne déjà --on-inverse-display.           */}
        <h1>
          Confiez votre bien à notre conciergerie.{' '}
          Recevez vos <em className="marker">revenus sans effort</em>.
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg">
          Photos professionnelles, gestion intégrale des voyageurs, états des lieux certifiés et
          reversements automatiques sur Wave &amp; Orange Money.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-2 text-sm font-semibold">
          {HIGHLIGHTS.map((h) => (
            <span key={h} className="flex items-center gap-2 text-on-inverse-muted">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden="true" />
              {h}
            </span>
          ))}
        </div>

        <div className="pt-2">
          <Link href="#formulaire-managed" className="btn-action">
            Demander une prise en charge
          </Link>
        </div>
      </div>
    </section>
  );
}