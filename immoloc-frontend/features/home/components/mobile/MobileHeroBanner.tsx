'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export function MobileHeroBanner({ showCta = true }: { showCta?: boolean }) {
  return (
    <section className="px-4 pt-4 pb-2">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-emerald-900"
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Primary glow top-right */}
        <div
          className="absolute -top-12 -right-12 w-52 h-52 rounded-full blur-[80px] pointer-events-none bg-emerald-500/6"
        />

        {/* Accent glow bottom-left */}
        <div
          className="absolute bottom-0 -left-8 w-36 h-36 rounded-full blur-[60px] pointer-events-none bg-accent-500/5"
        />

        <div className="relative z-10 px-5 pt-10 pb-10">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3 bg-emerald-500/10 border border-emerald-400/20">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            <span className="text-[8px] font-black uppercase tracking-[0.22em] text-emerald-400">
              Logements vérifiés
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[22px] font-black text-white leading-[1.15] tracking-tight mb-1.5">
            Réservez des{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, var(--emerald-300) 0%, var(--emerald-500) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Villas, Apparts
            </span>
            {' '}&amp; Chambres
          </h1>

          {/* Subline */}
          <p className="text-[11px] font-medium text-white/40 leading-relaxed mb-4">
            Pour votre séjour au Sénégal · Paiement sécurisé par séquestre
          </p>

          {/* CTA */}
          {showCta && (
            <Link
              href="/logements"
              className="flex items-center justify-center gap-2 w-full py-3.5 text-[12px] font-black text-white rounded-xl active:scale-[0.97] transition-transform duration-200"
              style={{
                background: 'linear-gradient(135deg, var(--emerald-700) 0%, var(--emerald-500) 100%)',
                boxShadow: '0 6px 24px rgba(20,101,76,0.28), 0 2px 6px rgba(20,101,76,0.18)',
              }}
            >
              Explorer les logements
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
