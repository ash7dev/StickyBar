'use client';

import { Wallet, TrendingUp, Shield, Users, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';

const BENEFITS = [
  {
    icon: Wallet,
    title: 'Paiements sécurisés par séquestre',
    subtitle: 'Zéro risque',
  },
  {
    icon: Users,
    title: 'Locataires vérifiés avec KYC obligatoire',
    subtitle: null,
  },
  {
    icon: TrendingUp,
    title: 'Dashboard premium pour piloter vos revenus',
    subtitle: null,
  },
  {
    icon: Headphones,
    title: 'Support dédié propriétaires 7j/7',
    subtitle: null,
  },
  {
    icon: Zap,
    title: 'Publication en 5 minutes, visibilité immédiate',
    subtitle: null,
  },
  {
    icon: Shield,
    title: 'Assurance dégâts et litiges incluse',
    subtitle: null,
  },
];

const STATS = [
  { value: '500+', label: 'Hôtes actifs' },
  { value: '4.8★', label: 'Note moyenne' },
  { value: '48h', label: 'Délai réponse' },
];

const FLOATING_ICONS = [
  { Icon: Wallet, position: 'top-12 left-8', delay: '0s' },
  { Icon: TrendingUp, position: 'top-1/4 left-1/4', delay: '0.5s' },
  { Icon: Shield, position: 'top-1/3 left-12', delay: '1s' },
  { Icon: Users, position: 'bottom-1/3 left-16', delay: '1.5s' },
];

export function OwnerCTASection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-[var(--radius-card)] bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 overflow-hidden">

          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Large circles */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -right-40 w-80 h-80 bg-forest-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-lime-400/10 rounded-full blur-2xl" />

            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: `linear-gradient(rgba(211, 242, 110, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(211, 242, 110, 0.3) 1px, transparent 1px)`,
              backgroundSize: '48px 48px'
            }} />

            {/* Floating icons */}
            {FLOATING_ICONS.map(({ Icon, position, delay }, index) => (
              <div
                key={index}
                className={`absolute ${position} w-12 h-12 rounded-xl bg-forest-700/30 border border-forest-600/50 flex items-center justify-center animate-float-slow`}
                style={{ animationDelay: delay }}
              >
                <Icon className="w-6 h-6 text-lime-400/40" />
              </div>
            ))}

            {/* Geometric shapes */}
            <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-lime-400/10 rounded-xl rotate-45 animate-spin-very-slow" />
            <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-lime-400/5 to-transparent rounded-full animate-pulse-slow" />
          </div>

          {/* Content Grid */}
          <div className="relative grid lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16">

            {/* Left side - Stats & Visual */}
            <div className="relative flex flex-col justify-center">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-pill)] bg-gold-400/20 border border-gold-400/40 mb-8 self-start">
                <svg className="w-3 h-3 text-gold-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="text-xs font-bold text-gold-400 uppercase tracking-wide">Propriétaires</span>
              </div>

              {/* Big number */}
              <div className="mb-8">
                <div className="text-7xl md:text-8xl font-display font-bold text-lime-400 leading-none mb-2">
                  +30%
                </div>
                <p className="text-lime-300/80 text-lg">
                  de revenus supplémentaires<br />
                  <span className="text-neutral-400 text-base">en moyenne pour nos hôtes</span>
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                {STATS.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-neutral-400 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Content */}
            <div className="flex flex-col justify-center">

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                Votre logement dort ?<br />
                <span className="text-lime-400">Faites-le travailler.</span>
              </h2>

              <p className="text-lg text-neutral-300 mb-8">
                Rejoignez des centaines de propriétaires qui rentabilisent leur bien avec Klef. Inscription gratuite, 0 commission à l'inscription.
              </p>

              {/* Benefits grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {BENEFITS.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-forest-800/40 border border-forest-700/50 hover:border-lime-400/30 transition-all duration-300 group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center group-hover:bg-lime-400/20 transition-colors">
                        <Icon className="w-4 h-4 text-lime-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-200 leading-tight">
                          {benefit.title}
                        </p>
                        {benefit.subtitle && (
                          <p className="text-xs text-lime-400 mt-0.5">
                            {benefit.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href="/devenir-hote"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-[var(--radius-pill)] bg-lime-400 text-forest-950 font-bold text-lg hover:bg-lime-300 transition-all duration-300 hover:shadow-xl hover:shadow-lime-400/30 hover:scale-105"
                >
                  Devenir hôte
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <svg className="w-4 h-4 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Gratuit · Sans engagement · En 5 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        @keyframes spin-very-slow {
          from { transform: rotate(45deg); }
          to { transform: rotate(405deg); }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 30s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
}
