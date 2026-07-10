'use client';

import { ShieldCheck, CreditCard, Headphones, Lock, Users, MapPin } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="bg-background-alt py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary-200 bg-primary-50 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-[10px] font-black text-primary-700 uppercase tracking-[0.2em]">Notre engagement</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
            Pourquoi nous faire{' '}
            <span className="text-primary-600">confiance ?</span>
          </h2>
        </div>

        {/* Bento grid — asymmetric modern layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]">

          {/* ── Card 1 : Logements vérifiés — LARGE (span 4) ── */}
          <div className="group relative md:col-span-4 md:row-span-1 rounded-[2rem] p-8 bg-primary-900 border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(20,101,76,0.12)] flex flex-col justify-between">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary-500/8 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary-500/15 transition-colors duration-700" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(67,155,119,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(67,155,119,1) 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h4 className="font-black text-xl text-white mb-1.5">Logements vérifiés</h4>
                <p className="text-sm font-medium text-white/35 max-w-sm leading-relaxed">Chaque annonce est inspectée et validée par notre équipe avant publication.</p>
              </div>
            </div>
          </div>

          {/* ── Card 2 : Paiement sécurisé — SMALL (span 2) ── */}
          <div className="group relative md:col-span-2 md:row-span-1 rounded-[2rem] p-8 bg-background-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between">
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-success-500/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-success-500/15 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-success-50 border border-success-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-foreground mb-1">Paiement sécurisé</h4>
                <p className="text-sm font-medium text-foreground-muted leading-relaxed">Wave, Orange Money ou Carte bancaire.</p>
              </div>
            </div>
          </div>

          {/* ── Card 3 : Support 24/7 — SMALL (span 2) ── */}
          <div className="group relative md:col-span-2 md:row-span-1 rounded-[2rem] p-8 bg-background-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-info-500/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-info-500/15 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-info-50 border border-info-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headphones className="w-5 h-5 text-info-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-foreground mb-1">Support 24/7</h4>
                <p className="text-sm font-medium text-foreground-muted leading-relaxed">WhatsApp et téléphone, à tout moment.</p>
              </div>
            </div>
          </div>

          {/* ── Card 4 : Séquestre garanti — LARGE (span 4) ── */}
          <div className="group relative md:col-span-4 md:row-span-1 rounded-[2rem] p-8 bg-primary-900 border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(199,91,35,0.12)] flex flex-col justify-between">
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-accent-500/8 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent-500/15 transition-colors duration-700" />
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(199,91,35,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(199,91,35,1) 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-accent-500" />
              </div>
              <div>
                <h4 className="font-black text-xl text-white mb-1.5">Séquestre garanti</h4>
                <p className="text-sm font-medium text-white/35 max-w-sm leading-relaxed">Votre argent est bloqué jusqu&apos;à la confirmation du séjour. Aucun risque.</p>
              </div>
            </div>
          </div>

          {/* ── Card 5 : Couverture nationale — TALL (span 3) ── */}
          <div className="group relative md:col-span-3 md:row-span-1 rounded-[2rem] p-8 bg-background-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between">
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-primary-500/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary-500/15 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-foreground mb-1">Couverture nationale</h4>
                <p className="text-sm font-medium text-foreground-muted leading-relaxed">Dakar, Saly, Saint-Louis et bien d&apos;autres villes.</p>
              </div>
            </div>
          </div>

          {/* ── Card 6 : Propriétaires vérifiés — TALL (span 3) ── */}
          <div className="group relative md:col-span-3 md:row-span-1 rounded-[2rem] p-8 bg-background-card border border-border overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-gold-400/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-gold-400/15 transition-colors duration-700" />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-gold-600" />
              </div>
              <div>
                <h4 className="font-black text-base text-foreground mb-1">Propriétaires vérifiés</h4>
                <p className="text-sm font-medium text-foreground-muted leading-relaxed">KYC obligatoire pour tous les bailleurs inscrits.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

