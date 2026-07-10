'use client';

import { Search, CalendarCheck2, ShieldCheck, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    id: '01',
    title: 'Chercher',
    desc: 'Explorez des centaines de logements vérifiés avec des photos réelles et des descriptions précises.',
    icon: Search,
    tag: 'Filtres intelligents',
    accent: 'primary',
  },
  {
    id: '02',
    title: 'Réserver',
    desc: 'Payez en toute sécurité via Wave, Orange Money ou Carte. Votre argent est en séquestre.',
    icon: CalendarCheck2,
    tag: 'Paiement sécurisé',
    accent: 'accent',
  },
  {
    id: '03',
    title: 'Séjourner',
    desc: 'Le propriétaire vous accueille. Profitez de votre séjour en toute sérénité avec notre support 24/7.',
    icon: ShieldCheck,
    tag: 'Support garanti',
    accent: 'emerald',
  },
];

const ACCENT_STYLES = {
  primary: {
    glow: 'bg-primary-500/8 group-hover:bg-primary-500/15',
    iconBg: 'bg-primary-500/10 border-primary-400/20 group-hover:border-primary-400/40',
    iconColor: 'text-primary-400',
    numBg: 'bg-primary-500',
    tagColor: 'text-primary-400',
    arrowHover: 'group-hover:bg-primary-500',
  },
  accent: {
    glow: 'bg-accent-500/6 group-hover:bg-accent-500/12',
    iconBg: 'bg-accent-500/10 border-accent-500/20 group-hover:border-accent-500/40',
    iconColor: 'text-accent-500',
    numBg: 'bg-accent-500',
    tagColor: 'text-accent-500',
    arrowHover: 'group-hover:bg-accent-500',
  },
  emerald: {
    glow: 'bg-success-500/6 group-hover:bg-success-500/12',
    iconBg: 'bg-success-500/10 border-success-500/20 group-hover:border-success-500/40',
    iconColor: 'text-success-500',
    numBg: 'bg-success-500',
    tagColor: 'text-success-500',
    arrowHover: 'group-hover:bg-success-500',
  },
};

export function HowItWorks() {
  return (
    <section className="bg-primary-900 py-32 px-6 overflow-hidden rounded-[3rem] mx-4 my-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-card/[0.03] border border-white/[0.06] backdrop-blur-sm mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.25em]">Le processus ImmoLoc</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Comment ça{' '}
            <span className="text-primary-400">marche</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-8">

          {/* Connector line — desktop only */}
          <div className="hidden md:block absolute top-32 left-[16.66%] right-[16.66%] h-px z-0">
            <div className="w-full h-full bg-gradient-to-r from-primary-500/40 via-accent-500/40 to-success-500/40" />
            <div className="absolute top-0 left-0 w-1/3 h-full bg-primary-500 shadow-[0_0_12px_rgba(20,101,76,0.6)]" />
          </div>

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const styles = ACCENT_STYLES[step.accent as keyof typeof ACCENT_STYLES];
            return (
              <div key={step.id} className="relative z-10 group">
                <div className="relative bg-background-card/[0.02] border border-white/[0.06] rounded-[2rem] p-8 sm:p-10 transition-all duration-500 hover:bg-background-card/[0.04] hover:border-white/[0.10] hover:-translate-y-1.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.3)] overflow-hidden">

                  {/* Ambient glow */}
                  <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[80px] pointer-events-none transition-colors duration-700 ${styles.glow}`} />

                  {/* Grid pattern subtle */}
                  <div className="absolute inset-0 opacity-[0.02] rounded-[2rem]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(255,255,255,1) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                  <div className="relative z-10">
                    {/* Step number floating badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className={`w-10 h-10 rounded-full ${styles.numBg} flex items-center justify-center shadow-lg`}>
                        <span className="text-xs font-black text-white">{step.id}</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-background-card/[0.04] border border-white/[0.06]">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles.tagColor}`}>{step.tag}</span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-8 transition-all duration-500 ${styles.iconBg}`}>
                      <Icon className={`w-7 h-7 ${styles.iconColor}`} />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-white/35 text-sm font-medium leading-relaxed mb-8">{step.desc}</p>

                    {/* CTA arrow */}
                    <div className={`w-10 h-10 rounded-full bg-background-card/[0.04] border border-white/[0.06] flex items-center justify-center transition-all duration-300 ${styles.arrowHover}`}>
                      <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Mobile connector */}
                {i < STEPS.length - 1 && (
                  <div className="md:hidden flex justify-center py-4">
                    <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

