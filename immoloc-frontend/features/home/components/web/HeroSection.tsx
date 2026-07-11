'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Star, Home, MapPin, BedDouble, Users } from 'lucide-react';
import { listingsApi, type Listing } from '@/lib/nestjs';

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) * 1.07));
}

export function HeroSection() {
  const [featured, setFeatured] = useState<Listing | null>(null);

  useEffect(() => {
    listingsApi
      .search({ limit: 20 })
      .then((res) => {
        const published = res.data?.filter((l) => l.photos.length > 0);
        if (published?.length) {
          const random = published[Math.floor(Math.random() * published.length)];
          setFeatured(random);
        }
      })
      .catch(() => {});
  }, []);

  const heroPhoto = featured?.photos?.find((p) => p.estPrincipale) ?? featured?.photos?.[0];

  return (
    <section className="relative bg-emerald-900 pt-32 pb-44 overflow-hidden min-h-[90vh] flex items-center rounded-b-[3rem]">
      {/* Ambient Glow Vert Forêt */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-700/25 via-emerald-900 to-emerald-900" />
      <div className="absolute top-0 right-0 w-[55%] h-[55%] bg-emerald-500/6 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-emerald-800/10 blur-[80px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Texte ── */}
          <div className="max-w-2xl z-10">
            {/* Glassmorphism pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.22em]">Sénégal • Premium</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[1.02] mb-8 tracking-tighter">
              L&apos;immobilier <br />
              <span className="text-emerald-400">réinventé.</span>
            </h1>

            <p className="text-xl text-white/45 mb-10 max-w-xl leading-relaxed font-medium">
              Villas de luxe, appartements modernes et terrains d&apos;exception. Louez en toute confiance avec notre séquestre sécurisé.
            </p>

            {/* Trust badges — Glassmorphism */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-white/85">Séquestre 100% garanti</span>
              </div>
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <Star className="w-5 h-5 text-gold-400" />
                <span className="text-sm font-bold text-white/85">Propriétaires vérifiés</span>
              </div>
            </div>
          </div>

          {/* ── Visuel — Annonce du jour ── */}
          <div className="relative z-10 w-full h-[600px] hidden lg:block">
            {/* Ambient Glow derrière l'image */}
            <div className="absolute -inset-8 bg-emerald-500/12 rounded-[4rem] blur-3xl" />

            <div className="relative w-full h-full rounded-[3rem] overflow-hidden border border-white/8 shadow-[0_0_60px_rgba(0,0,0,0.6)] group">
              {/* Image de fond — annonce du jour */}
              {heroPhoto ? (
                <Image
                  src={heroPhoto.url}
                  alt={featured?.titre ?? 'Annonce du jour'}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(67,155,119,0.15)_0%,transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(31,127,92,0.10)_0%,transparent_50%)]" />
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  {/* Floating property icons */}
                  <div className="absolute top-12 right-12 w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center backdrop-blur-sm">
                    <Home className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="absolute top-32 right-32 w-10 h-10 rounded-xl bg-background-card/5 border border-white/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="absolute bottom-28 right-16 w-12 h-12 rounded-2xl bg-gold-400/15 border border-gold-400/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
                  </div>
                </>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Badge "Annonce du jour" */}
              <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                <Star className="w-3.5 h-3.5 fill-white" />
                Annonce du jour
              </div>

              {/* Float Card — Info annonce */}
              {featured ? (
                <Link
                  href={`/logements/${featured.id}`}
                  className="absolute bottom-0 inset-x-0 p-6 group/card"
                >
                  <div className="bg-black/60 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all group-hover/card:bg-black/70 group-hover/card:border-white/15">
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-lg truncate">{featured.titre}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <p className="text-emerald-400 text-sm font-bold tracking-wide truncate">
                            {featured.quartier ? `${featured.quartier}, ` : ''}{featured.ville}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          {featured.nombreChambres && (
                            <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
                              <BedDouble className="w-3.5 h-3.5" />
                              {featured.nombreChambres} ch.
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-white/50 text-xs font-medium">
                            <Users className="w-3.5 h-3.5" />
                            {featured.capaciteMax} pers.
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-black text-xl">{formatFCFA(featured.prixBase)}</p>
                        <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">FCFA / nuit</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="absolute bottom-7 left-7 bg-black/70 backdrop-blur-xl border border-white/15 p-5 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Chargement...</p>
                      <p className="text-emerald-400 text-xs font-bold tracking-wide">ImmoLoc</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
