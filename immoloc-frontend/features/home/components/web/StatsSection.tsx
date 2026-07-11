'use client';

const STATS = [
  { value: '500+', label: 'Logements vérifiés', sub: 'Partout au Sénégal' },
  { value: '12k', label: 'Utilisateurs actifs', sub: 'Communauté grandissante' },
  { value: '100%', label: 'Paiements sécurisés', sub: 'Séquestre garanti' },
  { value: '4.8/5', label: 'Note moyenne', sub: 'Satisfaction client' },
];

export function StatsSection() {
  return (
    <section className="py-24 bg-background border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {STATS.map((stat, i) => (
            <div key={i} className="text-center md:text-left group">
              <div className="text-5xl md:text-6xl font-black text-foreground mb-3 tracking-tighter group-hover:text-emerald-600 transition-colors duration-300">
                {stat.value}
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">{stat.label}</h4>
              <p className="text-foreground-muted text-xs font-medium">{stat.sub}</p>
              <div className="w-8 h-1 bg-emerald-600 mt-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
