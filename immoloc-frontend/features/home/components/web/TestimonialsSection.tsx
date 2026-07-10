'use client';

import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    rating: 5,
    quote: 'Service incroyable ! J\'ai trouvé une villa vérifiée en 10 minutes. Le propriétaire était ponctuel et très professionnel.',
    name: 'Mamadou Diallo',
    city: 'Dakar',
    initials: 'MD',
    dark: true,
  },
  {
    rating: 5,
    quote: 'Première location, zéro stress. Le séquestre m\'a vraiment rassuré. Je recommande à 100%.',
    name: 'Aïssatou Ndiaye',
    city: 'Cité Keur Gorgui',
    initials: 'AN',
    dark: false,
  },
  {
    rating: 5,
    quote: 'J\'ai loué un appartement vue mer pour mon séjour à Dakar. Photos conformes, propriétaire réactif. Bravo ImmoLoc !',
    name: 'Ousmane Sow',
    city: 'Dakar Plateau',
    initials: 'OS',
    dark: true,
  },
  {
    rating: 5,
    quote: 'Très pratique pour mes déplacements pro. Large choix de logements et des propriétaires fiables partout au Sénégal.',
    name: 'Fatou Sarr',
    city: 'Saly Portudal',
    initials: 'FS',
    dark: false,
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const totalReviews = 148;

  return (
    <section className="bg-background py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-200 bg-gold-50 mb-5">
            <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
            <span className="text-[10px] font-black text-gold-700 uppercase tracking-[0.2em]">La communauté ImmoLoc</span>
          </div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">
            Ils nous font{' '}
            <span className="text-primary-600">confiance</span>
          </h2>
        </div>

        {/* Avatars + count */}
        <div className="flex items-center justify-center gap-3 mb-14">
          <div className="flex -space-x-2">
            {['MD', 'AN', 'OS', 'FS'].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center text-[9px] font-black text-white"
              >
                {i}
              </div>
            ))}
          </div>
          <span className="text-sm text-foreground-muted font-medium">
            <span className="font-black text-foreground">+{totalReviews} avis</span> certifiés au Sénégal
          </span>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`
                group relative rounded-[1.75rem] p-7 flex flex-col justify-between gap-6 transition-all duration-300 hover:-translate-y-1
                ${t.dark
                  ? 'bg-primary-900 border border-white/5 hover:border-primary-500/20 hover:shadow-[0_12px_40px_rgba(20,101,76,0.1)]'
                  : 'bg-background-card border border-border hover:border-primary-200 hover:shadow-[0_12px_40px_rgba(20,101,76,0.07)]'}
              `}
            >
              {/* Guillemet décoratif */}
              <span className={`absolute top-5 right-6 text-6xl font-black leading-none select-none ${t.dark ? 'text-white/5' : 'text-neutral-200'}`}>
                &ldquo;
              </span>

              <div className="relative z-10">
                <StarRow count={t.rating} />
                <p className={`text-sm font-medium leading-relaxed mt-4 ${t.dark ? 'text-white/55' : 'text-foreground-muted'}`}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className={`flex items-center gap-3 pt-5 border-t ${t.dark ? 'border-white/8' : 'border-border'}`}>
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-[10px] font-black text-white flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className={`text-sm font-bold ${t.dark ? 'text-white' : 'text-foreground'}`}>{t.name}</p>
                  <p className={`text-xs font-medium uppercase tracking-wide ${t.dark ? 'text-white/30' : 'text-foreground-muted'}`}>{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
