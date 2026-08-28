'use client';

import Link from 'next/link';
import {
  Wallet, TrendingUp, Shield, Users, Zap, Headphones, Check, ArrowRight, Star,
} from 'lucide-react';

const BENEFITS = [
  { icon: Wallet, title: 'Paiement sous séquestre', subtitle: 'Les fonds sont bloqués jusqu’au check-in' },
  { icon: Users, title: 'Locataires vérifiés', subtitle: 'KYC obligatoire avant toute réservation' },
  { icon: TrendingUp, title: 'Tableau de bord', subtitle: 'Réservations et revenus en temps réel' },
  { icon: Headphones, title: 'Support propriétaires', subtitle: 'Une équipe joignable 7 j/7' },
  { icon: Zap, title: 'Publication rapide', subtitle: 'En ligne après vérification sous 48 h' },
  { icon: Shield, title: 'Litiges arbitrés', subtitle: 'Médiation Klef en cas de désaccord' },
];

/* ⚠️ « +30 % de revenus », « 500+ hôtes », « 4.8★ » : aucun de ces chiffres
   n'est sourcé. Sur une page publique adressée à des propriétaires, ce sont
   des engagements opposables. Remplacés par ce qui est vérifiable dans le
   produit. Si tu as les vraies données, réintroduis-les avec leur période. */
const PROMESSES = [
  { value: '0 %', label: 'Commission à l’inscription' },
  { value: '48 h', label: 'Délai de vérification' },
  { value: '5 min', label: 'Pour publier une annonce' },
];

export function OwnerCTASection() {
  return (
    <section className="overflow-hidden py-6 sm:py-20">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        {/* `.section-inverse` porte déjà le dégradé forest-900 → 950 et bascule
            correctement en mode sombre. */}
        <div className="section-inverse relative overflow-hidden">

          {/* Un seul halo. Les trois précédents, la grille, les quatre icônes
              flottantes, le carré rotatif et le cercle pulsant animaient en
              continu — y compris hors du viewport — sans respecter
              prefers-reduced-motion, que le <style jsx> court-circuitait. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-pill bg-forest-700/40 blur-3xl"
          />

          <div className="relative grid gap-8 sm:gap-12 p-5 sm:p-8 md:p-12 lg:grid-cols-2 lg:p-16">

            {/* ── Gauche ─────────────────────────────────────────────────── */}

            <div className="flex flex-col justify-center">
              <span className="mb-8 inline-flex items-center gap-2 self-start rounded-pill border border-gold-400/30 bg-gold-400/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-300">
                <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                Espace propriétaires
              </span>

              <div className="mb-8">
                <p className="font-display text-6xl font-semibold leading-none tracking-tight text-on-inverse-display md:text-7xl">
                  0 %
                </p>
                <p className="mt-3 text-lg text-on-inverse">
                  de commission à l’inscription
                  <span className="mt-1 block text-base text-on-inverse-muted">
                    Vous ne payez que sur les séjours réellement effectués.
                  </span>
                </p>
              </div>

              <dl className="grid grid-cols-3 gap-6 border-t border-border-inverse pt-6">
                {PROMESSES.map(({ value, label }) => (
                  <div key={label}>
                    <dd className="font-display text-2xl font-semibold tabular-nums text-on-inverse md:text-3xl">
                      {value}
                    </dd>
                    <dt className="mt-1 text-xs uppercase tracking-wider text-on-inverse-muted">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* ── Droite ─────────────────────────────────────────────────── */}

            <div className="flex flex-col justify-center">
              <h2 className="mb-4 font-display text-3xl font-semibold leading-tight tracking-tight text-on-inverse-display md:text-4xl lg:text-5xl">
                Votre logement dort ?<br />Faites-le travailler.
              </h2>

              <p className="mb-8 text-lg leading-relaxed text-on-inverse-muted">
                Publiez votre bien sur Klef. Les paiements sont sécurisés, les locataires
                vérifiés, et vous gardez la main sur chaque réservation.
              </p>

              <ul className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BENEFITS.map(({ icon: Icon, title, subtitle }) => (
                  <li
                    key={title}
                    className="flex items-start gap-3 rounded-inner border border-border-inverse bg-white/5 p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5 text-on-inverse-muted">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-on-inverse">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-on-inverse-muted">
                        {subtitle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {/* ★ Seul aplat lime de la section. */}
                <Link href="/devenir-hote" className="btn-action px-8 py-4 text-lg">
                  Devenir hôte
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>

                <p className="flex items-center gap-2 text-sm text-on-inverse-muted">
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Gratuit · sans engagement · 5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}