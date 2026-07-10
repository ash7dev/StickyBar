'use client';

import { Building2, Users, ShieldCheck, Star, TrendingUp } from 'lucide-react';

const STATS = [
  { icon: Building2,   value: '500+',   label: 'Logements disponibles', sub: 'Sur tout le territoire' },
  { icon: Users,       value: '12k',    label: 'Locations réalisées',   sub: 'Et ça continue' },
  { icon: Star,        value: '4.8/5',  label: 'Note moyenne',          sub: 'Par nos locataires' },
  { icon: ShieldCheck, value: '100%',   label: 'Paiements sécurisés',   sub: 'Aucun compromis' },
];

export function ImmoLocChiffres() {
  return (
    <section className="bg-background py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-primary-900 overflow-hidden rounded-[3rem]">

          {/* Halos d'ambiance — forêt + or */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary-500/[0.08] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-gold-400/[0.06] rounded-full blur-[110px] pointer-events-none" />

          {/* Trame de points */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />

          {/* Filet or en haut — signature discrète */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

          <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 lg:py-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm mb-6">
                  <TrendingUp className="w-3.5 h-3.5 text-gold-400" />
                  <span className="text-[10px] font-bold text-gold-400 uppercase tracking-[0.25em]">Nos résultats</span>
                </div>
                <h2 className="font-display text-4xl lg:text-5xl font-semibold text-white leading-[1.05]">
                  ImmoLoc en <span className="text-gold-400">chiffres</span>
                </h2>
              </div>
              <p className="text-white/40 text-sm font-medium max-w-sm leading-relaxed lg:text-right">
                La confiance de toute une communauté, en quelques chiffres qui parlent d&apos;eux-mêmes.
              </p>
            </div>

            {/* Cartes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="group relative bg-white/[0.03] border border-white/[0.07] rounded-[1.75rem] p-7 overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/[0.12] hover:-translate-y-1"
                  >
                    {/* Halo or au survol */}
                    <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full blur-[60px] pointer-events-none transition-opacity duration-700 opacity-0 group-hover:opacity-100 bg-gold-400/[0.10]" />

                    <div className="relative z-10">
                      {/* Icône + index */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center group-hover:scale-110 group-hover:border-gold-400/30 transition-all duration-300">
                          <Icon className="w-5 h-5 text-gold-400" />
                        </div>
                        <span className="text-[10px] font-bold text-gold-400/40 uppercase tracking-wider tabular-nums">
                          0{i + 1}
                        </span>
                      </div>

                      {/* Valeur — Fraunces */}
                      <div className="font-display text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3 tabular-nums">
                        {stat.value}
                      </div>

                      {/* Libellés */}
                      <div className="text-sm font-bold text-white mb-1">{stat.label}</div>
                      <div className="text-xs text-white/40 font-medium">{stat.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}