/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  MapPin, ShieldCheck, BedDouble, Bath, Home,
  Maximize2, Users, Star, BookOpen, ScrollText,
  Moon, Banknote, ChevronRight, Info,
  CalendarDays, Navigation, Armchair, ChefHat, Wifi, Shield, Trees, Accessibility,
} from 'lucide-react';
import type { Listing, TarifNuit, TarifPersonne } from '@/lib/nestjs';

interface Props {
  listing: Listing;
}

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
  AUTRES: 'Autres',
};

const CATEGORIE_ICONS: Record<string, React.ElementType> = {
  CONFORT: Armchair,
  CUISINE: ChefHat,
  CONNECTIVITE: Wifi,
  SECURITE: Shield,
  EXTERIEUR: Trees,
  ACCESSIBILITE: Accessibility,
};

const CATEGORIE_LABELS: Record<string, string> = {
  CONFORT: 'Confort',
  CUISINE: 'Cuisine & Électroménager',
  CONNECTIVITE: 'Connectivité',
  SECURITE: 'Sécurité',
  EXTERIEUR: 'Extérieur & Loisirs',
  ACCESSIBILITE: 'Accessibilité',
};

const CATEGORIE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  CONFORT:       { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-500'  },
  CUISINE:       { bg: 'bg-gold-50',     border: 'border-gold-100',     text: 'text-gold-500'     },
  CONNECTIVITE:  { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-500'  },
  SECURITE:      { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-500'  },
  EXTERIEUR:     { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-600'    },
  ACCESSIBILITE: { bg: 'bg-accent-50',   border: 'border-accent-100',   text: 'text-accent-500'    },
};

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
      </div>
      <h2 className="text-xs md:text-sm font-black text-foreground uppercase tracking-wider">{label}</h2>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function fmt(n: number | string) {
  return Math.round(Number(n) * 1.07).toLocaleString('fr-FR');
}

/* ── Palier de nuits (progress bar) ───────────────────────────────────── */
function NightTierBar({ tier, isBase, maxPrix }: { tier: TarifNuit; isBase?: boolean; maxPrix: number }) {
  const label =
    tier.nuitsMax === null
      ? `${tier.nuitsMin}+ nuits`
      : tier.nuitsMin === tier.nuitsMax
        ? `${tier.nuitsMin} nuit${tier.nuitsMin > 1 ? 's' : ''}`
        : `${tier.nuitsMin} – ${tier.nuitsMax} nuits`;

  const pct = maxPrix > 0 ? Math.round((tier.prix / maxPrix) * 100) : 100;
  const saving = maxPrix > 0 && !isBase ? Math.round(((maxPrix - tier.prix) / maxPrix) * 100) : 0;

  const containerClass = isBase
    ? 'bg-gradient-to-r from-emerald-50 to-background-card border-emerald-200 shadow-[0_4px_20px_rgba(20,101,76,0.08)]'
    : 'bg-background-card border-border hover:border-border-hover hover:shadow-sm';

  const iconBgClass = isBase ? 'bg-emerald-100' : 'bg-background-alt';
  const iconColorClass = isBase ? 'text-emerald-500' : 'text-foreground-muted';
  const labelColorClass = isBase ? 'text-emerald-600' : 'text-foreground';
  const priceColorClass = isBase ? 'text-emerald-600' : 'text-foreground';
  const progressClass = isBase
    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
    : saving > 15
      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
      : 'bg-gradient-to-r from-emerald-300 to-emerald-400';

  return (
    <div className={`relative p-3.5 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300 overflow-hidden ${containerClass}`}>
      <div className="flex items-center justify-between mb-2.5 md:mb-3">
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            <Moon className={`w-4 h-4 md:w-4.5 md:h-4.5 ${iconColorClass}`} />
          </div>
          <div>
            <span className={`text-sm md:text-base font-bold ${labelColorClass}`}>{label}</span>
            {isBase && (
              <span className="ml-1.5 md:ml-2 text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">TARIF DE BASE</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div>
            <span className={`text-base md:text-lg font-black tabular-nums ${priceColorClass}`}>
              {fmt(tier.prix)}
            </span>
            <span className="text-xs md:text-sm font-bold text-foreground-muted ml-1"> FCFA</span>
          </div>
          <span className="text-[10px] md:text-xs font-medium text-foreground-muted">/ nuit</span>
          {saving > 0 && (
            <p className="text-[10px] md:text-xs font-black text-emerald-500 mt-0.5">-{saving}% d&apos;économie</p>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 md:h-2.5 bg-background-alt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${progressClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Palier de personnes (step visual) ───────────────────────────────── */
function PersonTierBar({ tier, personnesBase, maxSupplement }: { tier: TarifPersonne; personnesBase?: number; maxSupplement: number }) {
  const label =
    tier.personnesMin === tier.personnesMax
      ? `${tier.personnesMin} personne${tier.personnesMin > 1 ? 's' : ''}`
      : `${tier.personnesMin} – ${tier.personnesMax} personnes`;

  const isIncluded = tier.supplement === 0;
  const isBase = personnesBase !== undefined && tier.personnesMax <= personnesBase;
  const pct = maxSupplement > 0 && !isIncluded ? Math.round((tier.supplement / maxSupplement) * 100) : isBase || isIncluded ? 100 : 0;

  const containerClass = isBase
    ? 'bg-gradient-to-r from-emerald-50 to-background-card border-emerald-200 shadow-[0_4px_20px_rgba(20,101,76,0.08)]'
    : 'bg-background-card border-border hover:border-border-hover hover:shadow-sm';

  const iconBgClass = isBase ? 'bg-emerald-100' : 'bg-background-alt';
  const iconColorClass = isBase ? 'text-emerald-500' : 'text-foreground-muted';
  const labelColorClass = isBase ? 'text-emerald-600' : 'text-foreground';
  const progressClass = isBase || isIncluded
    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
    : 'bg-gradient-to-r from-accent-400 to-accent-500';

  return (
    <div className={`relative p-3.5 md:p-4 rounded-xl md:rounded-2xl border transition-all duration-300 overflow-hidden ${containerClass}`}>
      <div className="flex items-center justify-between mb-2.5 md:mb-3">
        <div className="flex items-center gap-2 md:gap-2.5">
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            <Users className={`w-4 h-4 md:w-4.5 md:h-4.5 ${iconColorClass}`} />
          </div>
          <div>
            <span className={`text-sm md:text-base font-bold ${labelColorClass}`}>{label}</span>
            {isBase && (
              <span className="ml-1.5 md:ml-2 text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">INCLUS</span>
            )}
          </div>
        </div>
        <div className="text-right">
          {isIncluded || isBase ? (
            <span className="text-sm md:text-base font-black text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" /> Inclus
            </span>
          ) : (
            <>
              <div>
                <span className="text-base md:text-lg font-black text-accent-600 tabular-nums">
                  +{fmt(tier.supplement)}
                </span>
                <span className="text-xs md:text-sm font-bold text-foreground-muted ml-1"> FCFA</span>
              </div>
              <span className="text-[10px] md:text-xs font-medium text-foreground-muted">/ nuit</span>
            </>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 md:h-2.5 bg-background-alt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${progressClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ListingInfo({ listing }: Props) {
  const hasTarifsNuits = (listing.tarifsNuits?.length ?? 0) > 0;
  const hasTarifsPersonnes = (listing.tarifsPersonnes?.length ?? 0) > 0;
  const hasRating = listing.note != null && listing.totalAvis != null && listing.totalAvis > 0;

  const maxPrix = Math.max(
    listing.prixBase,
    ...(listing.tarifsNuits?.map((t) => t.prix) ?? [])
  );

  const maxSupplement = Math.max(
    ...(listing.tarifsPersonnes?.map((t) => t.supplement) ?? [0])
  );

  const specs = [
    listing.nombreChambres   && { icon: BedDouble, label: `${listing.nombreChambres} chambre${listing.nombreChambres > 1 ? 's' : ''}`,               accent: 'emerald'  },
    listing.nombreSallesBain && { icon: Bath,      label: `${listing.nombreSallesBain} salle${listing.nombreSallesBain > 1 ? 's' : ''} de bain`,      accent: 'violet'   },
    listing.nombrePieces     && { icon: Home,      label: `${listing.nombrePieces} pièce${listing.nombrePieces > 1 ? 's' : ''}`,                       accent: 'emerald'  },
    listing.surface          && { icon: Maximize2, label: `${listing.surface} m²`,                                                                      accent: 'sky'      },
    { icon: Users, label: `${listing.capaciteMax} pers. max`, accent: 'accent' },
  ].filter(Boolean) as { icon: React.ElementType; label: string; accent: string }[];

  const accentMap: Record<string, { bg: string; border: string; text: string; iconBg: string; glow: string }> = {
    emerald: { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-600',  iconBg: 'bg-background-card border-white', glow: 'hover:shadow-[0_4px_20px_rgba(20,101,76,0.12)]'  },
    violet:  { bg: 'bg-emerald-50',   border: 'border-emerald-100',   text: 'text-emerald-600',   iconBg: 'bg-background-card border-white', glow: 'hover:shadow-[0_4px_20px_rgba(20,101,76,0.12)]'  },
    emerald: { bg: 'bg-emerald-50',  border: 'border-emerald-100',  text: 'text-emerald-600',  iconBg: 'bg-background-card border-white', glow: 'hover:shadow-[0_4px_20px_rgba(20,101,76,0.12)]'  },
    sky:     { bg: 'bg-emerald-50',      border: 'border-emerald-100',      text: 'text-emerald-600',      iconBg: 'bg-background-card border-white', glow: 'hover:shadow-[0_4px_20px_rgba(20,101,76,0.12)]'  },
    accent:  { bg: 'bg-gold-50',    border: 'border-gold-100',    text: 'text-gold-600',    iconBg: 'bg-background-card border-white', glow: 'hover:shadow-[0_4px_20px_rgba(201,162,75,0.12)]'  },
  };

  return (
    <div className="space-y-8 md:space-y-12">

      {/* ── En-tête ──────────────────────────────────────────────────── */}
      <div>
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <span className="px-3.5 py-1.5 bg-neutral-900 text-white text-[10px] font-black uppercase tracking-[0.18em] rounded-lg">
            {listing.sousType ?? TYPE_LABELS[listing.type] ?? listing.type}
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-700">
              {listing.quartier ? `${listing.quartier}, ` : ''}{listing.ville}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-700">Annonce vérifiée</span>
          </div>
          {hasRating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-amber-700">
                {Number(listing.note).toFixed(1)}
              </span>
              <span className="text-xs font-medium text-gold-600">
                ({listing.totalAvis} avis)
              </span>
            </div>
          )}
        </div>

        {/* Titre */}
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-[1.15] mb-5">
          {listing.titre}
        </h1>

        {/* Prix + contraintes */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600">{fmt(listing.prixBase)}</span>
            <span className="text-sm font-bold text-neutral-400">FCFA&nbsp;/ nuit</span>
          </div>
          {listing.nuitesMinimum > 1 && (
            <span className="text-xs font-semibold text-foreground-muted bg-background-alt px-2.5 py-1 rounded-lg">
              Min. {listing.nuitesMinimum} nuits
            </span>
          )}
          {listing.personnesBase && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
              {listing.personnesBase} pers. incluse{listing.personnesBase > 1 ? 's' : ''}
            </span>
          )}
          {listing.totalSejours != null && listing.totalSejours > 0 && (
            <span className="text-xs font-medium text-foreground-muted">
              · {listing.totalSejours} séjour{listing.totalSejours > 1 ? 's' : ''} réalisé{listing.totalSejours > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Description ──────────────────────────────────────────────── */}
      <div className="border-t border-border pt-6 md:pt-10">
        <SectionTitle icon={BookOpen} label="À propos de ce logement" />
        <div className="relative">
          <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent rounded-full" />
          <p className="pl-4 md:pl-5 text-sm md:text-[15px] font-medium text-foreground-muted leading-[1.7] md:leading-[1.8] whitespace-pre-line">
            {listing.description}
          </p>
        </div>
      </div>

      {/* ── Caractéristiques ─────────────────────────────────────────── */}
      {specs.length > 0 && (
        <div className="border-t border-border pt-6 md:pt-10">
          <SectionTitle icon={Home} label="Caractéristiques" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            {specs.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <div
                  key={i}
                  className="group relative flex items-center gap-2.5 md:gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-background-card to-emerald-50/50 border-2 border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 cursor-pointer"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25 group-hover:shadow-lg group-hover:shadow-emerald-500/35 transition-all duration-300">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="relative text-xs md:text-sm font-black text-foreground group-hover:text-emerald-500 transition-colors">{spec.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Conditions de séjour ─────────────────────────────────────── */}
      <div className="border-t border-border pt-6 md:pt-10">
        <SectionTitle icon={CalendarDays} label="Conditions de séjour" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Min nuits */}
          <div className="group relative flex items-center gap-3 md:gap-3.5 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-background-card to-emerald-50/50 border-2 border-emerald-500/30 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
              <Moon className="w-5 h-5 md:w-5.5 md:h-5.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-black text-foreground-muted uppercase tracking-wider mb-0.5">Séjour minimum</p>
              <p className="text-base md:text-lg font-black text-foreground">
                {listing.nuitesMinimum} nuit{listing.nuitesMinimum > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Capacité max */}
          <div className="group relative flex items-center gap-3 md:gap-3.5 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-background-card to-emerald-50/50 border-2 border-emerald-500/30 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
              <Users className="w-5 h-5 md:w-5.5 md:h-5.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] md:text-[11px] font-black text-foreground-muted uppercase tracking-wider mb-0.5">Capacité maximale</p>
              <p className="text-base md:text-lg font-black text-foreground">
                {listing.capaciteMax} voyageur{listing.capaciteMax > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Personnes incluses */}
          {listing.personnesBase && (
            <div className="group relative flex items-center gap-3 md:gap-3.5 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-background-card to-emerald-50/50 border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
                <ShieldCheck className="w-5 h-5 md:w-5.5 md:h-5.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] md:text-[11px] font-black text-foreground-muted uppercase tracking-wider mb-0.5">Inclus dans le tarif</p>
                <p className="text-base md:text-lg font-black text-foreground">
                  {listing.personnesBase} voyageur{listing.personnesBase > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Type de logement */}
          <div className="group relative flex items-center gap-3 md:gap-3.5 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-background-card to-emerald-50/50 border-2 border-emerald-500/30 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/15 transition-all duration-300">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/25">
              <Home className="w-5 h-5 md:w-5.5 md:h-5.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] md:text-[11px] font-black text-foreground-muted uppercase tracking-wider mb-0.5">Type de logement</p>
              <p className="text-sm md:text-base font-black text-foreground leading-tight">
                {listing.sousType
                  ? `${TYPE_LABELS[listing.type] ?? listing.type} · ${listing.sousType}`
                  : (TYPE_LABELS[listing.type] ?? listing.type)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Équipements par catégorie ────────────────────────────────── */}
      {listing.equipements.length > 0 && (() => {
        const grouped = listing.equipements.reduce<Record<string, typeof listing.equipements>>((acc, eq) => {
          const cat = eq.categorie || 'AUTRE';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(eq);
          return acc;
        }, {});

        return (
          <div className="border-t border-border pt-6 md:pt-10">
            <SectionTitle icon={Star} label="Ce que propose ce logement" />
            <div className="space-y-4">
              {Object.entries(grouped).map(([cat, items]) => {
                const CatIcon = CATEGORIE_ICONS[cat] ?? Star;
                const label = CATEGORIE_LABELS[cat] ?? cat;

                return (
                  <div key={cat} className="rounded-2xl border border-emerald-500/20 overflow-hidden bg-background-card hover:border-emerald-500/40 transition-all duration-200">
                    <div className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50">
                      <CatIcon className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">{label}</span>
                      <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-background-card/80 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {items.map((eq) => (
                        <div
                          key={eq.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-50/30 border border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all duration-200"
                        >
                          <span className="text-base flex-shrink-0 w-5 text-center text-emerald-500">✓</span>
                          <span className="text-[13px] font-medium text-foreground leading-snug">{eq.nom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Tarification ─────────────────────────────────────────────── */}
      {(hasTarifsNuits || hasTarifsPersonnes) && (
        <div className="border-t border-border pt-6 md:pt-10">
          <SectionTitle icon={Banknote} label="Tarification" />

          {/* Paliers de nuits */}
          {hasTarifsNuits && (
            <div className="mb-5 md:mb-6">
              <div className="flex items-center gap-2 mb-3 md:mb-3">
                <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                <p className="text-xs md:text-sm font-black text-emerald-600 uppercase tracking-wider">Tarif selon la durée</p>
              </div>
              <div className="flex flex-col gap-2">
                {listing.tarifsNuits!.map((tier, i) => (
                  <NightTierBar
                    key={i}
                    tier={tier}
                    isBase={i === 0}
                    maxPrix={maxPrix}
                  />
                ))}
              </div>
              <p className="text-[10px] md:text-[11px] font-medium text-neutral-400 mt-2 md:mt-2.5 flex items-center gap-1.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Le tarif applicable est celui du palier correspondant à votre durée totale.</span>
              </p>
            </div>
          )}

          {/* Paliers de personnes */}
          {hasTarifsPersonnes && (
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-3">
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent-500" />
                <p className="text-xs md:text-sm font-black text-accent-600 uppercase tracking-wider">
                  Supplément selon le nombre de voyageurs
                </p>
              </div>
              {listing.personnesBase && (
                <div className="flex items-start gap-2 mb-2.5 md:mb-3 px-2.5 md:px-3 py-2 md:py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] md:text-xs font-medium text-emerald-700">
                    <strong>{listing.personnesBase} voyageur{listing.personnesBase > 1 ? 's' : ''} inclus{listing.personnesBase > 1 ? '' : 'e'}</strong> dans le tarif de base — aucun supplément jusqu&apos;à ce seuil.
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {listing.tarifsPersonnes!.map((tier, i) => (
                  <PersonTierBar
                    key={i}
                    tier={tier}
                    personnesBase={listing.personnesBase}
                    maxSupplement={maxSupplement}
                  />
                ))}
              </div>
              <p className="text-[10px] md:text-[11px] font-medium text-neutral-400 mt-2 md:mt-2.5 flex items-center gap-1.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                <span>Le supplément s&apos;applique par nuit, selon le nombre de voyageurs sélectionné.</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Localisation ─────────────────────────────────────────────── */}
      {(listing.ville || listing.quartier || listing.adresse) && (
        <div className="border-t border-border pt-6 md:pt-10">
          <SectionTitle icon={Navigation} label="Localisation" />
          <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-2xl p-6 border border-emerald-100/80 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background-card border border-emerald-100 flex items-center justify-center shadow-sm flex-shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-base font-black text-foreground">
                    {listing.quartier ? `${listing.quartier}, ` : ''}{listing.ville}
                  </p>
                  {listing.adresse && (
                    <p className="text-sm font-medium text-foreground-muted mt-0.5">{listing.adresse}</p>
                  )}
                </div>
              </div>
              <p className="text-[11px] font-medium text-foreground-muted flex items-center gap-1.5 pl-[52px]">
                <Info className="w-3 h-3" />
                L&apos;adresse exacte sera communiquée après confirmation de la réservation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Règles de la maison ──────────────────────────────────────── */}
      {listing.reglesMaison && (
        <div className="border-t border-border pt-6 md:pt-10">
          <SectionTitle icon={ScrollText} label="Règles de la maison" />
          <div className="relative bg-gold-50/50 rounded-2xl p-6 border border-gold-100/80 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-100/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-gold-600" />
                </div>
                <p className="text-xs font-bold text-gold-700">À lire attentivement avant de réserver</p>
              </div>
              <p className="text-sm font-medium text-foreground-muted leading-relaxed whitespace-pre-line">
                {listing.reglesMaison}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
