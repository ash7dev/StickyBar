'use client';

import { TrendingUp, Wallet, Users, LayoutDashboard, Headphones, ArrowRight, Check, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRoleStore } from '@/stores/role.store';

const BENEFITS = [
  { icon: Wallet, text: 'Paiements sécurisés par séquestre — zéro risque' },
  { icon: Users, text: 'Locataires vérifiés avec KYC obligatoire' },
  { icon: LayoutDashboard, text: 'Dashboard premium pour piloter vos revenus' },
  { icon: Headphones, text: 'Support dédié propriétaires 7j/7' },
  { icon: Zap, text: 'Publication en 5 minutes, visibilité immédiate' },
  { icon: Shield, text: 'Assurance dégâts et litiges incluse' },
];

export function BecomeHostCTA() {
  const { nestToken, activeRole, estProprietaire, hasAnnonce } = useRoleStore();

  let ctaHref = '/register';
  let ctaLabel = 'Devenir hôte';
  if (nestToken) {
    if (activeRole === 'PROPRIETAIRE') {
      ctaHref = hasAnnonce ? '/dashboard' : '/dashboard/annonces/new';
      ctaLabel = hasAnnonce ? 'Mon tableau de bord' : 'Publier mon premier bien';
    } else if (estProprietaire) {
      ctaHref = '/dashboard';
      ctaLabel = 'Accéder à mon espace';
    } else {
      ctaHref = '/become-host';
      ctaLabel = 'Devenir hôte';
    }
  }

  return (
    <section className="bg-background py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-emerald-900 overflow-hidden rounded-[3rem]">

          {/* Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[350px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 grid lg:grid-cols-5 min-h-[600px]">

            {/* ── Left Panel — Hero stat ── */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center py-16 px-8 sm:px-12 text-center border-b lg:border-b-0 lg:border-r border-white/[0.04]">

              {/* Orbiting icons */}
              <div className="relative w-48 h-48 mb-10">
                {/* Central ring */}
                <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-4 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
                    <TrendingUp className="w-9 h-9 text-emerald-400" />
                  </div>
                </div>
                {/* Floating mini-icons */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-xl bg-accent-500/15 border border-accent-500/20 flex items-center justify-center shadow-lg">
                  <Wallet className="w-4 h-4 text-accent-500" />
                </div>
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-9 h-9 rounded-xl bg-success-500/15 border border-success-500/20 flex items-center justify-center shadow-lg">
                  <Shield className="w-4 h-4 text-success-500" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 rounded-xl bg-info-500/15 border border-info-500/20 flex items-center justify-center shadow-lg">
                  <Users className="w-4 h-4 text-info-500" />
                </div>
                <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              {/* Big stat */}
              <div className="text-7xl lg:text-8xl font-black text-emerald-400 tracking-tighter leading-none mb-2">
                +30%
              </div>
              <p className="text-white/30 text-sm font-medium max-w-[200px]">
                de revenus supplémentaires en moyenne pour nos hôtes
              </p>

              {/* Mini stats row */}
              <div className="flex items-center gap-6 mt-10 pt-6 border-t border-white/[0.04]">
                <div className="text-center">
                  <div className="text-lg font-black text-white">500+</div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">Hôtes actifs</div>
                </div>
                <div className="w-px h-8 bg-background-card/[0.06]" />
                <div className="text-center">
                  <div className="text-lg font-black text-white">4.8★</div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">Note moy.</div>
                </div>
                <div className="w-px h-8 bg-background-card/[0.06]" />
                <div className="text-center">
                  <div className="text-lg font-black text-white">48h</div>
                  <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">1ère résa</div>
                </div>
              </div>
            </div>

            {/* ── Right Panel — Content ── */}
            <div className="lg:col-span-3 flex flex-col justify-center py-14 px-8 sm:px-12 lg:px-16 gap-8">

              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-background-card/[0.03] border border-white/[0.06]">
                <Zap className="w-3.5 h-3.5 text-accent-500" />
                <span className="text-[10px] font-black text-accent-500 uppercase tracking-[0.2em]">Propriétaires</span>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                  Votre logement dort ?<br />
                  <span className="text-emerald-400">Faites-le travailler.</span>
                </h2>
                <p className="text-white/30 text-sm font-medium mt-4 max-w-md leading-relaxed">
                  Rejoignez des centaines de propriétaires qui rentabilisent leur bien avec ImmoLoc. Inscription gratuite, 0 commission à l&apos;inscription.
                </p>
              </div>

              {/* Benefits grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {BENEFITS.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-background-card/[0.02] border border-white/[0.04] hover:bg-background-card/[0.04] hover:border-white/[0.08] transition-all duration-300">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-400/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-medium text-white/50 leading-relaxed">{b.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2.5 px-8 py-4 bg-emerald-600 text-white text-sm font-black rounded-full hover:bg-emerald-700 transition-all duration-300 shadow-[0_0_30px_rgba(20,101,76,0.25)] hover:shadow-[0_0_50px_rgba(20,101,76,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  {ctaLabel} <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-1.5 text-white/25 text-xs font-medium">
                  <Check className="w-3.5 h-3.5 text-success-500/60" />
                  Gratuit · Sans engagement · En 5 min
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

