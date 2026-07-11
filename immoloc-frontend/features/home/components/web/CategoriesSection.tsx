'use client';

import Link from 'next/link';
import { ArrowRight, User, Home } from 'lucide-react';
import { useRoleStore } from '@/stores/role.store';

function useHostHref() {
  const { nestToken, activeRole, estProprietaire, hasAnnonce } = useRoleStore();
  if (!nestToken) return '/register';
  if (activeRole === 'PROPRIETAIRE') return hasAnnonce ? '/dashboard' : '/dashboard/annonces/new';
  if (estProprietaire) return '/dashboard';
  return '/become-host';
}

export function CategoriesSection() {
  const hostHref = useHostHref();

  return (
    <section className="bg-background pt-8 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">

          {/* ── Bloc Locataires ── */}
          <Link
            href="/logements"
            className="group relative bg-emerald-900 p-10 sm:p-12 overflow-hidden transition-all duration-500 hover:scale-[1.01] rounded-[2rem] block"
          >
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-emerald-500/18 transition-colors duration-700" />
            <div
              className="absolute inset-0 opacity-[0.04] rounded-[2rem]"
              style={{
                backgroundImage: 'linear-gradient(rgba(77,150,255,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(77,150,255,1) 0.5px, transparent 0.5px)',
                backgroundSize: '30px 30px',
              }}
            />
            <span className="absolute -bottom-8 -right-4 text-[160px] font-black text-emerald-400/4 leading-none select-none">01</span>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-8">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Locataires</span>
              </div>
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-7 border border-emerald-400/20 group-hover:bg-emerald-500/20 transition-colors">
                <User className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-3 leading-tight">
                Je suis Locataire
              </h2>
              <p className="text-white/40 text-base font-medium mb-8 max-w-sm leading-relaxed">
                Trouvez le logement idéal pour votre prochain séjour au Sénégal. Réservation 100% sécurisée.
              </p>
              <span className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm group-hover:gap-4 transition-all duration-300">
                Explorer les annonces <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-emerald-500 group-hover:w-full transition-all duration-700 shadow-[0_0_12px_rgba(20,101,76,0.8)] rounded-b-[2rem]" />
          </Link>

          {/* ── Bloc Propriétaires ── */}
          <Link
            href={hostHref}
            className="group relative bg-emerald-900 p-10 sm:p-12 overflow-hidden transition-all duration-500 hover:scale-[1.01] rounded-[2rem] block"
          >
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent-500/8 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent-500/15 transition-colors duration-700" />
            <div
              className="absolute inset-0 opacity-[0.04] rounded-[2rem]"
              style={{
                backgroundImage: 'linear-gradient(rgba(232,168,32,1) 0.5px, transparent 0.5px), linear-gradient(90deg, rgba(232,168,32,1) 0.5px, transparent 0.5px)',
                backgroundSize: '30px 30px',
              }}
            />
            <span className="absolute -bottom-8 -right-4 text-[160px] font-black text-accent-500/4 leading-none select-none">02</span>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full mb-8">
                <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em]">Propriétaires</span>
              </div>
              <div className="w-14 h-14 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-7 border border-accent-500/20 group-hover:bg-accent-500/20 transition-colors">
                <Home className="w-7 h-7 text-accent-500" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-3 leading-tight">
                Je suis Propriétaire
              </h2>
              <p className="text-white/40 text-base font-medium mb-8 max-w-sm leading-relaxed">
                Optimisez vos revenus locatifs. Publiez vos biens et profitez d&apos;une gestion simplifiée et garantie.
              </p>
              <span className="flex items-center gap-2.5 text-accent-500 font-bold text-sm group-hover:gap-4 transition-all duration-300">
                Rentabiliser mon bien <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent-500 group-hover:w-full transition-all duration-700 shadow-[0_0_12px_rgba(199,91,35,0.8)] rounded-b-[2rem]" />
          </Link>

        </div>
      </div>
    </section>
  );
}
