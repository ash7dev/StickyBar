'use client';

import { Sparkles, Plus, Wallet, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';

interface Props {
  pendingConfirmations: number;
  activeListings: number;
  availableBalance: number;
}

export function HostWelcomeBanner({
  pendingConfirmations,
  activeListings,
  availableBalance,
}: Props) {
  const { data: user } = useCurrentUser();
  const prenom = user?.prenom || 'Hôte';

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <div className="klef-rise bg-gradient-to-r from-forest-950 via-[#072A20] to-forest-950 text-white rounded-card p-6 border border-forest-800/90 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

      {/* Halos d'ambiance */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-forest-600/20 blur-3xl" />

      {/* Gauche : Message de bienvenu et résumé */}
      <div className="relative z-10 space-y-2 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-forest-900/90 border border-lime-400/30 text-[10px] font-extrabold text-lime-300 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-lime-400" />
          <span>Espace Propriétaire Klef</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ravi de vous revoir, {prenom} 👋
        </h2>

        <p className="text-xs sm:text-sm text-forest-200 leading-relaxed">
          {pendingConfirmations > 0 ? (
            <>Vous avez <strong className="text-lime-400 font-extrabold">{pendingConfirmations} réservation{pendingConfirmations > 1 ? 's' : ''}</strong> en attente de confirmation et <strong className="text-white font-bold">{activeListings} bien{activeListings > 1 ? 's' : ''}</strong> publié{activeListings > 1 ? 's' : ''}.</>
          ) : (
            <>Votre activité est au vert avec <strong className="text-white font-bold">{activeListings} bien{activeListings > 1 ? 's' : ''}</strong> en ligne et un solde disponible de <strong className="text-lime-400 font-extrabold">{fmt(availableBalance)} FCFA</strong>.</>
          )}
        </p>

        <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-forest-300">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            Compte Hôte Vérifié
          </span>
          <span className="w-1 h-1 rounded-full bg-forest-700" />
          <span>Paiements sécurisés en séquestre</span>
        </div>
      </div>

      {/* Droite : Raccourcis rapides */}
      <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
        <Link
          href="/dashboard/annonces/nouvelle"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex-1 md:flex-initial"
        >
          <Plus className="w-4 h-4 text-forest-950" />
          <span>Publier un bien</span>
        </Link>

        <Link
          href="/dashboard/wallet"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-pill bg-forest-900 hover:bg-forest-800 border border-forest-800 text-white font-extrabold text-xs transition-all active:scale-95 flex-1 md:flex-initial"
        >
          <Wallet className="w-4 h-4 text-lime-400" />
          <span>Gérer le Wallet</span>
        </Link>
      </div>

    </div>
  );
}
