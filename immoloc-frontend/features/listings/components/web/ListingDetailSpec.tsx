'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AirVent, Bath, BedDouble, ChevronDown, CheckCircle2, Coins, Droplets,
  Dumbbell, Flame, Home, Info, Maximize, MapPin, Moon, ParkingCircle, Refrigerator,
  ShieldAlert, ShieldCheck, Sparkles, Star, Trees, TrendingDown, Tv, Users,
  UtensilsCrossed, Waves, Wifi, WashingMachine, Wind, Zap,
} from 'lucide-react';
import type { Listing } from '@/lib/nestjs';
import { formatPrixPublic, getPrixPublic, getPrixDerniereMinute } from '@/lib/pricing';
import { useRecentlyViewed } from '@/lib/hooks/useRecentlyViewed';
import { ListingVideoSection } from './ListingVideoSection';
import { ListingLocationMap } from './ListingLocationMap';
import { ListingReviewsSection } from './ListingReviewsSection';

interface ListingDetailSpecProps {
  listing: Listing;
}

const fmtMoney = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtNote = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const AMENITIES_VISIBLE = 8;
const DESC_LIMIT = 320;

// ---------------------------------------------------------------------------
// Mappage d'icônes — élargi et adapté au contexte sénégalais.
// Le groupe électrogène, l'eau chaude et le gardiennage comptent davantage
// ici qu'une salle de sport : ils méritent leur propre pictogramme.
// ---------------------------------------------------------------------------

const ICON_RULES: Array<[RegExp, typeof Wifi]> = [
  [/wifi|internet|fibre|connexion/, Wifi],
  [/clim|air condition/, AirVent],
  [/ventilateur|brasseur/, Wind],
  [/t[ée]l[ée]|tv|canal/, Tv],
  [/piscine|pool/, Waves],
  [/parking|garage|stationnement/, ParkingCircle],
  [/groupe|g[ée]n[ée]rateur|onduleur|solaire|[ée]lectricit/, Zap],
  [/eau chaude|chauffe-eau|douche/, Droplets],
  [/cuisine|cuisini|four|micro-ondes/, UtensilsCrossed],
  [/frigo|r[ée]frig[ée]rateur|cong[ée]l/, Refrigerator],
  [/lave-linge|machine [àa] laver|buanderie/, WashingMachine],
  [/barbecue|braai|grillade/, Flame],
  [/jardin|terrasse|cour|balcon/, Trees],
  [/salle de sport|gym|fitness/, Dumbbell],
  [/gardien|s[ée]curit|vigile|surveillance/, ShieldCheck],
];

function getEquipementIcon(nom: string) {
  const n = nom.toLowerCase();
  return ICON_RULES.find(([re]) => re.test(n))?.[1] ?? CheckCircle2;
}

// ---------------------------------------------------------------------------

export function ListingDetailSpec({ listing }: ListingDetailSpecProps) {
  const [descOpen, setDescOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const { addRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (listing?.id) {
      const mainPhoto = listing.photos?.find((p) => p.estPrincipale) ?? listing.photos?.[0];
      addRecentlyViewed({
        id: listing.id,
        titre: listing.titre,
        type: listing.type,
        ville: listing.ville,
        quartier: listing.quartier,
        prixBase: listing.prixBase,
        photoUrl: mainPhoto?.url,
      });
    }
  }, [listing, addRecentlyViewed]);

  const location = [listing.quartier, listing.ville].filter(Boolean).join(', ');
  const categoryLabel = listing.sousType || listing.type;

  const description = listing.description ?? '';
  const isLongDesc = description.length > DESC_LIMIT;
  // La coupe brute à 300 caractères tombait au milieu d'un mot.
  const truncated = useMemo(() => {
    if (!isLongDesc) return description;
    const cut = description.slice(0, DESC_LIMIT);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
  }, [description, isLongDesc]);

  const equipements = listing.equipements ?? [];
  const visibleEquipements = amenitiesOpen ? equipements : equipements.slice(0, AMENITIES_VISIBLE);

  const proprietaire = listing.proprietaire;
  const hostName = proprietaire?.prenom && proprietaire?.nom
    ? `${proprietaire.prenom} ${proprietaire.nom}`
    : 'Hôte Klef';
  const hostInitials = proprietaire?.prenom && proprietaire?.nom
    ? `${proprietaire.prenom[0]}${proprietaire.nom[0]}`.toUpperCase()
    : 'K';
  // Sans date d'inscription, on n'invente pas l'année en cours.
  const hostYear = proprietaire?.creeLe ? new Date(proprietaire.creeLe).getFullYear() : null;
  const isKycVerified = proprietaire?.statutKyc === 'VERIFIE';
  const totalSejours = proprietaire?.totalSejours ?? 0;
  const totalAvis = proprietaire?.totalAvis ?? 0;

  // Le badge « Nouveau » était affiché en permanence, sans condition.
  const isNouveau = listing.createdAt
    ? Date.now() - new Date(listing.createdAt).getTime() < 30 * 24 * 3600 * 1000
    : false;

  const specs = [
    listing.surface ? { icon: Maximize, label: 'Surface', value: `${listing.surface} m²` } : null,
    listing.nombreChambres ? { icon: BedDouble, label: 'Chambres', value: `${listing.nombreChambres}` } : null,
    listing.nombreSallesBain ? { icon: Bath, label: "Salles de bain", value: `${listing.nombreSallesBain}` } : null,
    { icon: Users, label: 'Capacité', value: `${listing.capaciteMax} pers.` },
    listing.nuitesMinimum > 0 ? { icon: Moon, label: 'Séjour min.', value: `${listing.nuitesMinimum} nuit${listing.nuitesMinimum > 1 ? 's' : ''}` } : null,
    listing.ageMin ? { icon: ShieldAlert, label: 'Âge minimum', value: `${listing.ageMin} ans` } : null,
  ].filter(Boolean) as Array<{ icon: typeof Users; label: string; value: string }>;

  return (
    <div className="flex flex-col gap-10 text-foreground w-full max-w-full overflow-hidden">

      {/* -- En-tête ----------------------------------------------------- */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isNouveau && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-lime-50 px-3 py-1 text-xs font-semibold text-forest-800">
              <Sparkles className="h-3.5 w-3.5 text-lime-700" aria-hidden="true" />
              Nouveau
            </span>
          )}
          <span className="eyebrow">{categoryLabel}</span>
        </div>

        {/* font-extrabold valait 800 : le système plafonne Fraunces à 600,
            au-delà le serif s'empâte et les contreformes se ferment. */}
        <h1 className="font-display text-3xl font-semibold leading-[1.08] tracking-[-0.025em] text-forest-900 sm:text-[2.5rem]">
          {listing.titre}
        </h1>

        {/* La catégorie était répétée deux fois : en capitales au-dessus,
            puis en minuscules après le lieu. */}
        <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <MapPin className="h-4 w-4 shrink-0 text-foreground-faint" aria-hidden="true" />
          {location || 'Sénégal'}
        </p>

        <div className="mt-3 flex items-start gap-3.5 rounded-card border border-forest-200/70 bg-forest-50/80 p-4 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner bg-forest-700 text-on-inverse-marker shadow-xs">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="text-xs leading-relaxed text-forest-950">
            <strong className="font-bold text-forest-900 block mb-0.5 text-sm">
              Garantie Séquestre Klef
            </strong>
            <span className="text-forest-800">
              Votre paiement est bloqué jusqu’à la remise des clés. Si le logement ne correspond pas, vous êtes <strong className="font-semibold text-forest-900 underline decoration-lime-500 decoration-2 underline-offset-2">remboursé intégralement</strong>.
            </span>
          </div>
        </div>
      </header>

      {/* -- Caractéristiques du bien ("Couche Spec") ----------------------- */}
      <section className="rounded-card border border-border bg-background-card p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="marker">
              <Home className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
            </span>
            <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
              Caractéristiques du bien
            </h2>
          </div>
          <span className="text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-pill px-3 py-1">
            Fiche vérifiée
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 pt-1">
          {specs.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center gap-3 p-3.5 rounded-inner bg-background-alt border border-border/80 hover:border-forest-200 transition-colors">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-background-card text-forest-700 border border-border/80 shadow-2xs">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-muted font-medium">
                  {label}
                </span>
                <span className="block truncate text-sm font-bold text-forest-950">
                  {value}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* -- Visite Vidéo du Logement (60s) -------------------------------- */}
      {listing.videoUrl && (
        <ListingVideoSection videoUrl={listing.videoUrl} titre={listing.titre} />
      )}

      {/* -- Tarification ------------------------------------------------ */}
      <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="marker">
            <Coins className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <h2 className="font-display text-lg font-semibold tracking-[-0.015em] text-forest-900">
            Tarifs et conditions
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 rounded-inner bg-background-alt p-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
              Voyageurs inclus
            </p>
            <p className="text-sm font-semibold text-foreground">
              {listing.personnesBase != null
                ? `${listing.personnesBase} personne${listing.personnesBase > 1 ? 's' : ''}`
                : `Jusqu'à ${listing.capaciteMax} personnes`}
            </p>
            <p className="text-xs text-foreground-muted">
              Maximum autorisé&nbsp;: {listing.capaciteMax} voyageurs.
            </p>
          </div>

          {listing.tarifsNuits?.length ? (
            /* Une remise est une bonne nouvelle : le token sémantique
               success le dit mieux qu'un vert choisi au hasard. */
            <div className="space-y-1.5 rounded-inner bg-success-50 p-4">
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-success-700">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                Tarifs dégressifs
              </p>
              <ul className="space-y-1">
                {listing.tarifsNuits.map((t, i) => {
                  const pxPublic = getPrixPublic(t.prix);
                  const pxReduit = getPrixDerniereMinute(pxPublic);
                  const derniereMinute = Boolean((listing as { derniereMinuteActive?: boolean }).derniereMinuteActive);
                  return (
                    <li key={i} className="text-xs text-success-700">
                      Dès {t.nuitsMin} nuits&nbsp;:{' '}
                      {derniereMinute ? (
                        <>
                          <span className="line-through text-foreground-muted mr-1.5 tabular-nums">
                            {pxPublic.toLocaleString('fr-FR')} FCFA
                          </span>
                          <strong className="font-bold tabular-nums text-forest-950">
                            {pxReduit.toLocaleString('fr-FR')} FCFA
                          </strong>{' '}
                          <span className="inline-flex items-center gap-0.5 rounded-pill bg-action text-on-action px-1.5 py-0.2 text-[9px] font-black uppercase">
                            ⚡ -15%
                          </span>
                        </>
                      ) : (
                        <strong className="font-semibold tabular-nums">
                          {pxPublic.toLocaleString('fr-FR')} FCFA
                        </strong>
                      )}{' '}
                      / nuit
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="space-y-1 rounded-inner bg-background-alt p-4">
              <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">
                Séjour minimum
              </p>
              <p className="text-sm font-semibold text-foreground">
                {listing.nuitesMinimum} nuit{listing.nuitesMinimum > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {listing.tarifsPersonnes?.length ? (
          <div className="space-y-2 rounded-inner bg-gold-50 p-4">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-gold-700">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              Supplément par voyageur additionnel
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {listing.tarifsPersonnes.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-inner bg-neutral-0 px-3 py-2 text-xs text-gold-800"
                >
                  <span>{t.personnesMin} à {t.personnesMax} pers.</span>
                  <span className="font-semibold tabular-nums">
                    +{Number(t.supplement).toLocaleString('fr-FR')} FCFA
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="flex items-center gap-2 border-t border-border pt-4 text-xs text-foreground-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
          Votre paiement est bloqué par Klef et versé à l'hôte à la remise des clés.
        </p>
      </section>

      {/* -- Description ------------------------------------------------- */}
      {description && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
            Description
          </h2>
          <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-foreground-muted">
            {descOpen || !isLongDesc ? description : truncated}
          </p>
          {isLongDesc && (
            <button
              type="button"
              onClick={() => setDescOpen((v) => !v)}
              aria-expanded={descOpen}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline-offset-4 transition-colors hover:underline"
            >
              {descOpen ? 'Réduire' : 'Lire la suite'}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${descOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
        </section>
      )}

      {/* -- Équipements ------------------------------------------------- */}
      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
            Équipements
          </h2>
          {equipements.length > 0 && (
            <span className="text-sm tabular-nums text-foreground-faint">
              {equipements.length}
            </span>
          )}
        </div>

        {equipements.length > 0 ? (
          <>
            {/*
              Chaque équipement portait sa propre bordure, son ombre et un
              conteneur d'icône encadré. Avec quinze équipements, ça produit
              quinze boîtes qui se disputent l'attention pour une information
              de second plan.

              Ici : pas de bordure par ligne, l'icône sert de repère et la
              liste se parcourt du regard. Le poids visuel revient au titre
              de section et au contenu, pas au décor.
            */}
            <ul className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
              {visibleEquipements.map((eq) => {
                const Icon = getEquipementIcon(eq.nom);
                return (
                  <li key={eq.id || eq.nom} className="flex items-center gap-3 py-0.5">
                    <Icon className="h-[1.125rem] w-[1.125rem] shrink-0 text-forest-600" aria-hidden="true" />
                    <span className="text-[0.9375rem] text-foreground">{eq.nom}</span>
                  </li>
                );
              })}
            </ul>

            {equipements.length > AMENITIES_VISIBLE && (
              <button
                type="button"
                onClick={() => setAmenitiesOpen((v) => !v)}
                aria-expanded={amenitiesOpen}
                className="mt-2 inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
              >
                {amenitiesOpen
                  ? 'Réduire la liste'
                  : `Voir les ${equipements.length} équipements`}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${amenitiesOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
          </>
        ) : (
          /* « Les équipements essentiels sont fournis pour votre confort »
             promettait quelque chose que rien ne garantit. */
          <p className="text-sm text-foreground-muted">
            L'hôte n'a pas encore renseigné les équipements de ce logement.
          </p>
        )}
      </section>

      {/* -- Emplacement & Carte ---------------------------------------- */}
      <ListingLocationMap
        ville={listing.ville}
        quartier={listing.quartier}
        adresse={listing.adresse}
        latitude={listing.latitude}
        longitude={listing.longitude}
      />

      {/* -- Avis des Voyageurs ----------------------------------------- */}
      <ListingReviewsSection listing={listing} />

      {/* -- Hôte -------------------------------------------------------- */}
      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-forest-900">
          Votre hôte
        </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 w-full">
            <Link 
              href={`/hotes/${proprietaire?.id}`}
              className="flex items-center gap-4 group/host hover:opacity-90 transition-opacity"
            >
              {proprietaire?.avatarUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-pill border border-border group-hover/host:ring-2 group-hover/host:ring-forest-900 transition-all">
                  <Image src={proprietaire.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                </div>
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-pill bg-forest-100 text-lg font-semibold text-forest-700 group-hover/host:bg-forest-900 group-hover/host:text-on-inverse-marker transition-colors">
                  {hostInitials}
                </span>
              )}

              <div>
                <h3 className="font-display text-lg font-semibold leading-snug text-forest-900 group-hover/host:underline flex items-center gap-1">
                  <span>{hostName}</span>
                </h3>
                {hostYear && (
                  <p className="mt-0.5 text-xs text-foreground-muted">Hôte depuis {hostYear}</p>
                )}

                {isKycVerified && (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-700">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Identité vérifiée
                  </span>
                )}
              </div>
            </Link>

            <Link
              href={`/hotes/${proprietaire?.id}`}
              className="btn-primary w-full sm:w-auto"
            >
              Voir le profil de l'hôte →
            </Link>
          </div>
      </section>
    </div>
  );
}