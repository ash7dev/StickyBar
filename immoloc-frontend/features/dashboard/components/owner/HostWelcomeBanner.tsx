'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Plus, ShieldCheck, Wallet } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

interface Props {
  pendingConfirmations: number;
  activeListings: number;
  availableBalance: number;
  /** Vérification KYC réelle. Le badge était affiché sans condition. */
  isVerified?: boolean;
}

export function HostWelcomeBanner({
  pendingConfirmations,
  activeListings,
  availableBalance,
  isVerified = false,
}: Props) {
  const { data: user, isLoading } = useCurrentUser();
  const prenom = user?.prenom;

  /*
    Quatre situations, quatre messages.

    L'original n'en distinguait que deux : « des réservations en attente » ou
    « tout va bien ». Un hôte sans aucune annonce lisait donc « Votre activité
    est au vert avec 0 bien en ligne et un solde disponible de 0 FCFA » —
    la personne qui a le plus besoin d'être guidée recevait le message le
    moins utile.
  */
  const state =
    activeListings === 0 ? 'onboarding'
    : pendingConfirmations > 0 ? 'pending'
    : availableBalance > 0 ? 'payout'
    : 'idle';

  const COPY = {
    onboarding: {
      title: prenom ? `Bienvenue, ${prenom}` : 'Bienvenue',
      body: 'Votre espace est prêt. Il ne manque plus qu’un logement : la publication est gratuite, et un agent passe le vérifier avant la mise en ligne.',
      cta: { href: '/dashboard/annonces/nouvelle', label: 'Publier mon premier bien', icon: Plus },
      secondary: { href: '/ressources', label: 'Voir les conseils' },
    },
    pending: {
      title: prenom ? `Ravi de vous revoir, ${prenom}` : 'Ravi de vous revoir',
      body: `${pendingConfirmations} réservation${pendingConfirmations > 1 ? 's' : ''} attend${pendingConfirmations > 1 ? 'ent' : ''} votre réponse. Un voyageur qui patiente trop longtemps annule.`,
      cta: { href: '/dashboard/reservations?statut=PENDING', label: `Répondre (${pendingConfirmations})`, icon: ArrowRight },
      secondary: { href: '/dashboard/annonces', label: 'Mes biens' },
    },
    payout: {
      title: prenom ? `Ravi de vous revoir, ${prenom}` : 'Ravi de vous revoir',
      body: `Vous avez ${nf.format(availableBalance)} FCFA disponibles au retrait, sur ${activeListings} bien${activeListings > 1 ? 's' : ''} en ligne.`,
      cta: { href: '/dashboard/wallet', label: 'Retirer', icon: Wallet },
      secondary: { href: '/dashboard/annonces', label: 'Mes biens' },
    },
    idle: {
      title: prenom ? `Ravi de vous revoir, ${prenom}` : 'Ravi de vous revoir',
      body: `${activeListings} bien${activeListings > 1 ? 's' : ''} en ligne, aucune demande en attente. Complétez vos photos et vos tarifs dégressifs pour être mieux positionné.`,
      cta: { href: '/dashboard/annonces', label: 'Gérer mes biens', icon: ArrowRight },
      secondary: { href: '/dashboard/wallet', label: 'Wallet' },
    },
  }[state];

  const CtaIcon = COPY.cta.icon;

  return (
    // Le dégradé partait de forest-950 pour y revenir via #072A20, soit
    // forest-900 écrit en hexadécimal brut. Le halo radial du système le
    // remplace, et rend inutiles les deux orbes floutés en blur-3xl.
    <section className="klef-rise flex flex-col items-start justify-between gap-6 rounded-card bg-[radial-gradient(70%_55%_at_50%_0%,#0F503D_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,#072A20_0%,#041912_100%)] p-6 text-white md:flex-row md:items-center">

      <div className="max-w-2xl space-y-2.5">
        <span className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.06] px-3 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-forest-200">
            Espace propriétaire
          </span>
        </span>

        {/* useCurrentUser n'avait pas d'état de chargement : « Ravi de vous
            revoir, Hôte » s'affichait une fraction de seconde avant le vrai
            prénom. */}
        {isLoading ? (
          <div className="h-9 w-64 animate-pulse rounded-inner bg-white/10" aria-hidden="true" />
        ) : (
          <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-neutral-50 sm:text-3xl">
            {COPY.title}
          </h2>
        )}

        {/* Les chiffres étaient en <strong className="text-lime-400"> :
            l'accent portait du texte au milieu d'une phrase, deux fois. */}
        <p className="text-sm leading-relaxed text-forest-200">
          {COPY.body}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-forest-300">
          {/* Affiché sans condition auparavant : tout hôte se voyait
              « Compte Hôte Vérifié », vérifié ou non. */}
          {isVerified && (
            <span className="flex items-center gap-1.5 text-gold-300">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Identité vérifiée
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-forest-300" aria-hidden="true" />
            Paiements sous séquestre
          </span>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center gap-3 md:w-auto">
        {/* Un seul bouton lime, et il change selon la situation : publier,
            répondre, ou retirer. C'est l'action qui compte à cet instant. */}
        <Link
          href={COPY.cta.href}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill bg-lime-400 px-5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-lime-300 md:flex-initial"
        >
          <CtaIcon className="h-4 w-4" aria-hidden="true" />
          {COPY.cta.label}
        </Link>

        <Link
          href={COPY.secondary.href}
          // L'icône du bouton secondaire était en lime : deux limes côte à
          // côte, dont un sur une action de second rang.
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-pill border border-white/15 px-5 text-sm font-medium text-neutral-50 transition-colors duration-150 hover:bg-white/10 md:flex-initial"
        >
          {COPY.secondary.label}
        </Link>
      </div>
    </section>
  );
}